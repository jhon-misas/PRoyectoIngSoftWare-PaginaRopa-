const express = require('express');
const pool = require('../db');
const verificarToken = require('../middleware/auth');

const router = express.Router();

const ENVIO = 15000;
const METODOS = ['mercadopago', 'contraentrega'];
const MP_API = 'https://api.mercadopago.com';

// Qué significa cada estado de Mercado Pago en nuestras tablas: [estado del pago, estado del pedido]
const ESTADOS_MP = {
  approved: ['aprobado', 'confirmado'],
  authorized: ['pendiente', 'pendiente_pago'],
  pending: ['pendiente', 'pendiente_pago'],
  in_process: ['pendiente', 'pendiente_pago'],
  in_mediation: ['pendiente', 'pendiente_pago'],
  rejected: ['rechazado', 'pago_rechazado'],
  cancelled: ['anulado', 'pago_rechazado'],
  refunded: ['reembolsado', 'pago_rechazado'],
  charged_back: ['reembolsado', 'pago_rechazado'],
};

function esCorreo(texto) {
  return /^[^ @]+@[^ @]+[.][^ @]+$/.test(texto || '');
}

function mercadoPagoConfigurado() {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

// Llama a la API de Mercado Pago con el Access Token (que solo existe en el servidor).
async function llamarMercadoPago(ruta, metodo = 'GET', cuerpo) {
  const r = await fetch(MP_API + ruta, {
    method: metodo,
    headers: {
      Authorization: 'Bearer ' + process.env.MERCADOPAGO_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const datos = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, datos };
}

// Crea la "preferencia" de Checkout Pro: qué se cobra, cuánto, a dónde vuelve
// la persona y con qué referencia. Devuelve el enlace al que se redirige.
async function crearPreferencia({ idPedido, referencia, total, correo, origen }) {
  const urlRetorno = origen + '/pago/resultado';
  const preferencia = {
    items: [{
      id: String(idPedido),
      title: `Pedido ${idPedido} - WUT FORCE ARMOUR`,
      quantity: 1,
      unit_price: total,
      currency_id: 'COP',
    }],
    payer: { email: correo },
    external_reference: referencia,
    back_urls: { success: urlRetorno, failure: urlRetorno, pending: urlRetorno },
    statement_descriptor: 'WUT FORCE ARMOUR',
  };
  // El regreso automático solo se acepta con direcciones https (Render).
  // En localhost la persona vuelve con el botón "Volver al sitio".
  if (urlRetorno.startsWith('https://')) preferencia.auto_return = 'approved';

  const r = await llamarMercadoPago('/checkout/preferences', 'POST', preferencia);
  if (!r.ok) {
    console.error('Mercado Pago no creó la preferencia:', r.status, JSON.stringify(r.datos));
    throw new Error('MP');
  }
  const esTokenDePrueba = process.env.MERCADOPAGO_ACCESS_TOKEN.startsWith('TEST-');
  return (esTokenDePrueba && r.datos.sandbox_init_point) || r.datos.init_point;
}

// POST /api/pedidos
router.post('/', verificarToken, async (req, res) => {
  const { correo, direccion, metodoPago } = req.body;

  // 1. Validar los campos obligatorios (HU012)
  const errores = [];
  if (!esCorreo(correo)) errores.push('correo');
  if (!direccion || direccion.trim().length < 10) errores.push('dirección');
  if (!METODOS.includes(metodoPago)) errores.push('método de pago');

  if (errores.length > 0) {
    return res.status(400).json({ error: 'Datos inválidos: ' + errores.join(', ') });
  }

  const enLinea = metodoPago === 'mercadopago';
  if (enLinea && !mercadoPagoConfigurado()) {
    return res.status(503).json({ error: 'El pago en línea no está configurado en el servidor' });
  }

  // 2. Guardar todo junto: o se guarda todo, o no se guarda nada
  const cliente = await pool.connect();
  let idPedido, subtotal, total, referencia;
  try {
    await cliente.query('BEGIN');

    const carrito = await cliente.query('SELECT id_carrito FROM carritos WHERE id_usuario = $1', [req.usuario.id]);
    if (carrito.rows.length === 0) throw new Error('VACIO');
    const idCarrito = carrito.rows[0].id_carrito;

    const items = await cliente.query(
      `SELECT i.id_producto, i.id_talla, i.id_color, i.cantidad, p.nombre,
              p.precio::float AS precio, t.nombre AS talla, c.nombre AS color
       FROM items_carrito i
       JOIN productos p ON p.id_producto = i.id_producto
       LEFT JOIN tallas t ON t.id_talla = i.id_talla
       LEFT JOIN colores c ON c.id_color = i.id_color
       WHERE i.id_carrito = $1`,
      [idCarrito]
    );
    if (items.rows.length === 0) throw new Error('VACIO');

    // Stock: suma lo que se pide de cada producto y lo compara con lo que hay.
    // FOR UPDATE bloquea esas filas hasta el COMMIT, para que dos compras al mismo
    // tiempo no vendan la misma última unidad.
    const pedidoPorProducto = {};
    for (const it of items.rows) {
      pedidoPorProducto[it.id_producto] = (pedidoPorProducto[it.id_producto] || 0) + it.cantidad;
    }
    const stock = await cliente.query(
      'SELECT id_producto, nombre, cantidad, disponible FROM productos WHERE id_producto = ANY($1::int[]) FOR UPDATE',
      [Object.keys(pedidoPorProducto).map(Number)]
    );
    for (const prod of stock.rows) {
      const pedidas = pedidoPorProducto[prod.id_producto];
      if (!prod.disponible || prod.cantidad < pedidas) {
        const error = new Error('STOCK');
        error.detalle = prod.cantidad > 0 && prod.disponible
          ? `Solo quedan ${prod.cantidad} unidades de ${prod.nombre}`
          : `${prod.nombre} está agotado`;
        throw error;
      }
    }

    subtotal = items.rows.reduce((suma, it) => suma + it.precio * it.cantidad, 0);
    total = subtotal + ENVIO;

    // En línea el pedido queda esperando el pago. Contra entrega queda confirmado.
    const estadoPedido = enLinea ? 'pendiente_pago' : 'confirmado';

    const pedido = await cliente.query(
      'INSERT INTO pedidos (id_usuario, subtotal, costo_envio, total, estado) VALUES ($1, $2, $3, $4, $5) RETURNING id_pedido',
      [req.usuario.id, subtotal, ENVIO, total, estadoPedido]
    );
    idPedido = pedido.rows[0].id_pedido;

    for (const it of items.rows) {
      await cliente.query(
        `INSERT INTO items_pedido (id_pedido, id_producto, id_talla, id_color, nombre_producto, talla, color, cantidad, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [idPedido, it.id_producto, it.id_talla, it.id_color, it.nombre, it.talla, it.color, it.cantidad, it.precio * it.cantidad]
      );
    }

    // Referencia única del pago. Se guarda en pagos.datos_pago para encontrar el
    // pedido cuando Mercado Pago devuelva a la persona. Nunca se guardan datos de
    // tarjeta: la tarjeta se escribe en la página de Mercado Pago, no en la nuestra.
    referencia = enLinea ? `WUT-${idPedido}-${Date.now()}` : null;

    await cliente.query(
      'INSERT INTO pagos (id_pedido, metodo_pago, datos_pago, monto, estado) VALUES ($1, $2, $3, $4, $5)',
      [idPedido, metodoPago, referencia, total, 'pendiente']
    );

    await cliente.query(
      'INSERT INTO envios (id_pedido, direccion, costo) VALUES ($1, $2, $3)',
      [idPedido, direccion.trim(), ENVIO]
    );

    // Contra entrega: el carrito se vacía ya. En línea se vacía cuando el pago
    // queda aprobado, para que si el pago falla la persona no pierda su carrito.
    if (!enLinea) {
      await cliente.query('DELETE FROM items_carrito WHERE id_carrito = $1', [idCarrito]);
      // Contra entrega: el pedido queda confirmado, así que el stock se descuenta ya.
      for (const [idProd, unidades] of Object.entries(pedidoPorProducto)) {
        await cliente.query('UPDATE productos SET cantidad = cantidad - $1 WHERE id_producto = $2', [unidades, Number(idProd)]);
      }
    }

    await cliente.query('COMMIT');
  } catch (e) {
    await cliente.query('ROLLBACK');
    cliente.release();
    if (e.message === 'VACIO') return res.status(400).json({ error: 'Tu carrito está vacío' });
    if (e.message === 'STOCK') return res.status(400).json({ error: e.detalle });
    console.error(e);
    return res.status(500).json({ error: 'Error del servidor' });
  }
  cliente.release();

  const respuesta = { idPedido, subtotal, envio: ENVIO, total, estado: enLinea ? 'pendiente_pago' : 'confirmado' };

  if (enLinea) {
    try {
      const origen = (process.env.URL_PUBLICA || req.get('origin') || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
      respuesta.urlPago = await crearPreferencia({ idPedido, referencia, total, correo: correo.trim(), origen });
    } catch (e) {
      // El pedido queda guardado como pendiente_pago y el carrito intacto.
      return res.status(502).json({ error: 'No se pudo conectar con Mercado Pago. Intenta de nuevo.' });
    }
  }

  res.status(201).json(respuesta);
});

// GET /api/pedidos/mercadopago/confirmar?pago=<payment_id>
// Mercado Pago devuelve a la persona a /pago/resultado?payment_id=...; React
// llama a esta ruta. El estado NO se toma de la dirección: se le pregunta
// directamente a Mercado Pago con el Access Token.
router.get('/mercadopago/confirmar', verificarToken, async (req, res) => {
  const idPago = String(req.query.pago || '');
  if (!/^[0-9]{3,30}$/.test(idPago)) {
    return res.status(400).json({ error: 'Falta el número del pago' });
  }
  if (!mercadoPagoConfigurado()) {
    return res.status(503).json({ error: 'El pago en línea no está configurado en el servidor' });
  }

  let pago;
  try {
    const r = await llamarMercadoPago('/v1/payments/' + idPago);
    if (!r.ok) return res.status(404).json({ error: 'Mercado Pago no reconoce ese pago' });
    pago = r.datos;
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: 'No se pudo consultar el pago en Mercado Pago. Intenta de nuevo.' });
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const fila = await cliente.query(
      `SELECT pa.id_pago, pe.id_pedido, pe.total::float AS total, pe.estado AS estado_anterior
       FROM pagos pa
       JOIN pedidos pe ON pe.id_pedido = pa.id_pedido
       WHERE pa.datos_pago = $1 AND pe.id_usuario = $2
       FOR UPDATE`,
      [pago.external_reference, req.usuario.id]
    );
    if (fila.rows.length === 0) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ error: 'Ese pago no corresponde a ninguno de tus pedidos' });
    }
    const { id_pago: idFilaPago, id_pedido: idPedido, total, estado_anterior: estadoAnterior } = fila.rows[0];

    if (Math.round(Number(pago.transaction_amount)) !== Math.round(total) || pago.currency_id !== 'COP') {
      await cliente.query('ROLLBACK');
      return res.status(400).json({ error: 'El monto pagado no coincide con el pedido' });
    }

    const [estadoPago, estadoPedido] = ESTADOS_MP[pago.status] || ESTADOS_MP.pending;

    await cliente.query('UPDATE pagos SET estado = $1 WHERE id_pago = $2', [estadoPago, idFilaPago]);
    await cliente.query('UPDATE pedidos SET estado = $1 WHERE id_pedido = $2', [estadoPedido, idPedido]);

    // El stock se descuenta la primera vez que el pago queda aprobado. Si la persona
    // recarga la página de resultado, el pedido ya está 'confirmado' y no se descuenta otra vez.
    if (pago.status === 'approved' && estadoAnterior !== 'confirmado') {
      await cliente.query(
        `UPDATE productos p SET cantidad = GREATEST(p.cantidad - x.unidades, 0)
         FROM (SELECT id_producto, SUM(cantidad) AS unidades FROM items_pedido
               WHERE id_pedido = $1 AND id_producto IS NOT NULL GROUP BY id_producto) x
         WHERE p.id_producto = x.id_producto`,
        [idPedido]
      );
    }

    if (pago.status === 'approved') {
      await cliente.query(
        'DELETE FROM items_carrito WHERE id_carrito = (SELECT id_carrito FROM carritos WHERE id_usuario = $1)',
        [req.usuario.id]
      );
    }

    await cliente.query('COMMIT');
    res.json({
      idPedido,
      total,
      estado: estadoPedido,
      estadoMercadoPago: pago.status,
      medio: pago.payment_type_id || null,
    });
  } catch (e) {
    await cliente.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    cliente.release();
  }
});

module.exports = router;
