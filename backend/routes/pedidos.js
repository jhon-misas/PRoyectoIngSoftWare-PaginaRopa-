const express = require('express');
const pool = require('../db');
const verificarToken = require('../middleware/auth');

const router = express.Router();

const ENVIO = 15000;

function esCorreo(texto) {
  return /^[^ @]+@[^ @]+[.][^ @]+$/.test(texto || '');
}

// POST /api/pedidos
router.post('/', verificarToken, async (req, res) => {
  const { correo, direccion, metodoPago, datosPago = {} } = req.body;

  // 1. Validar los campos obligatorios (HU012)
  const errores = [];
  if (!esCorreo(correo)) errores.push('correo');
  if (!direccion || direccion.trim().length < 10) errores.push('dirección');
  if (!['tarjeta', 'pse', 'contraentrega'].includes(metodoPago)) errores.push('método de pago');

  if (metodoPago === 'tarjeta') {
    const numero = String(datosPago.numero || '').replace(/ /g, '');
    if (!/^[0-9]{16}$/.test(numero)) errores.push('número de tarjeta');
    if (!/^(0[1-9]|1[0-2])[/][0-9]{2}$/.test(datosPago.vencimiento || '')) errores.push('vencimiento');
    if (!/^[0-9]{3,4}$/.test(datosPago.cvv || '')) errores.push('CVV');
  }

  if (errores.length > 0) {
    return res.status(400).json({ error: 'Datos inválidos: ' + errores.join(', ') });
  }

  // 2. Guardar todo junto: o se guarda todo, o no se guarda nada
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const carrito = await cliente.query('SELECT id_carrito FROM carritos WHERE id_usuario = $1', [req.usuario.id]);
    if (carrito.rows.length === 0) throw new Error('VACIO');
    const idCarrito = carrito.rows[0].id_carrito;

    const items = await cliente.query(
      `SELECT i.id_producto, i.id_talla, i.cantidad, p.nombre,
              p.precio::float AS precio, t.nombre AS talla
       FROM items_carrito i
       JOIN productos p ON p.id_producto = i.id_producto
       LEFT JOIN tallas t ON t.id_talla = i.id_talla
       WHERE i.id_carrito = $1`,
      [idCarrito]
    );
    if (items.rows.length === 0) throw new Error('VACIO');

    const subtotal = items.rows.reduce((suma, it) => suma + it.precio * it.cantidad, 0);
    const total = subtotal + ENVIO;

    const pedido = await cliente.query(
      'INSERT INTO pedidos (id_usuario, subtotal, costo_envio, total, estado) VALUES ($1, $2, $3, $4, $5) RETURNING id_pedido',
      [req.usuario.id, subtotal, ENVIO, total, 'confirmado']
    );
    const idPedido = pedido.rows[0].id_pedido;

    for (const it of items.rows) {
      await cliente.query(
        `INSERT INTO items_pedido (id_pedido, id_producto, id_talla, nombre_producto, talla, cantidad, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [idPedido, it.id_producto, it.id_talla, it.nombre, it.talla, it.cantidad, it.precio * it.cantidad]
      );
    }

    // Solo se guarda el método y el monto. Nunca el número de tarjeta.
    await cliente.query(
      'INSERT INTO pagos (id_pedido, metodo_pago, monto, estado) VALUES ($1, $2, $3, $4)',
      [idPedido, metodoPago, total, 'aprobado']
    );

    await cliente.query(
      'INSERT INTO envios (id_pedido, direccion, costo) VALUES ($1, $2, $3)',
      [idPedido, direccion.trim(), ENVIO]
    );

    await cliente.query('DELETE FROM items_carrito WHERE id_carrito = $1', [idCarrito]);

    await cliente.query('COMMIT');
    res.status(201).json({ idPedido, subtotal, envio: ENVIO, total, estado: 'confirmado' });
  } catch (e) {
    await cliente.query('ROLLBACK');
    if (e.message === 'VACIO') return res.status(400).json({ error: 'Tu carrito está vacío' });
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    cliente.release();
  }
});

module.exports = router;