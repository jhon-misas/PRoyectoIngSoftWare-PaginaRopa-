const express = require('express');
const pool = require('../db');
const verificarToken = require('../middleware/auth');

const router = express.Router();

const ENVIO = 15000;

// Busca el carrito del usuario. Si no tiene, lo crea.
async function obtenerIdCarrito(idUsuario) {
  const r = await pool.query('SELECT id_carrito FROM carritos WHERE id_usuario = $1', [idUsuario]);
  if (r.rows.length > 0) return r.rows[0].id_carrito;
  const nuevo = await pool.query('INSERT INTO carritos (id_usuario) VALUES ($1) RETURNING id_carrito', [idUsuario]);
  return nuevo.rows[0].id_carrito;
}

// Arma la respuesta: items, subtotal, envío y total.
async function armarCarrito(idCarrito) {
  const r = await pool.query(
    `SELECT i.id_item, i.id_producto, p.nombre, p.foto, t.nombre AS talla,
            p.precio::float AS precio, i.cantidad
     FROM items_carrito i
     JOIN productos p ON p.id_producto = i.id_producto
     LEFT JOIN tallas t ON t.id_talla = i.id_talla
     WHERE i.id_carrito = $1
     ORDER BY i.id_item`,
    [idCarrito]
  );
  const items = r.rows.map((f) => ({
    idItem: f.id_item,
    idProducto: f.id_producto,
    nombre: f.nombre,
    foto: f.foto,
    talla: f.talla,
    precio: f.precio,
    cantidad: f.cantidad,
    subtotal: f.precio * f.cantidad
  }));
  const subtotal = items.reduce((suma, it) => suma + it.subtotal, 0);
  const envio = items.length > 0 ? ENVIO : 0;
  return { items, subtotal, envio, total: subtotal + envio };
}

// GET /api/carrito
router.get('/', verificarToken, async (req, res) => {
  try {
    const idCarrito = await obtenerIdCarrito(req.usuario.id);
    res.json(await armarCarrito(idCarrito));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/carrito/items
router.post('/items', verificarToken, async (req, res) => {
  const idProducto = parseInt(req.body.idProducto, 10);
  const idTalla = parseInt(req.body.idTalla, 10);
  const cantidad = parseInt(req.body.cantidad, 10) || 1;

  if (!idProducto || !idTalla || cantidad < 1) {
    return res.status(400).json({ error: 'Faltan datos: producto y talla' });
  }

  try {
    const prod = await pool.query('SELECT disponible FROM productos WHERE id_producto = $1', [idProducto]);
    if (prod.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    if (!prod.rows[0].disponible) return res.status(400).json({ error: 'Producto agotado' });

    // La talla debe pertenecer a ese producto
    const talla = await pool.query(
      'SELECT 1 FROM tallas WHERE id_talla = $1 AND id_producto = $2',
      [idTalla, idProducto]
    );
    if (talla.rows.length === 0) {
      return res.status(400).json({ error: 'Talla no válida para este producto' });
    }

    const idCarrito = await obtenerIdCarrito(req.usuario.id);

    // Si ya existe el mismo producto con la misma talla, solo sube la cantidad
    const existe = await pool.query(
      'SELECT id_item FROM items_carrito WHERE id_carrito = $1 AND id_producto = $2 AND id_talla = $3',
      [idCarrito, idProducto, idTalla]
    );
    if (existe.rows.length > 0) {
      await pool.query(
        'UPDATE items_carrito SET cantidad = cantidad + $1 WHERE id_item = $2',
        [cantidad, existe.rows[0].id_item]
      );
    } else {
      await pool.query(
        'INSERT INTO items_carrito (id_carrito, id_producto, id_talla, cantidad) VALUES ($1, $2, $3, $4)',
        [idCarrito, idProducto, idTalla, cantidad]
      );
    }
    res.status(201).json(await armarCarrito(idCarrito));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/carrito/items/:idItem (cambia la cantidad)
router.put('/items/:idItem', verificarToken, async (req, res) => {
  const idItem = parseInt(req.params.idItem, 10);
  const cantidad = parseInt(req.body.cantidad, 10);
  if (!idItem) return res.status(404).json({ error: 'Producto no encontrado en tu carrito' });
  if (!cantidad || cantidad < 1) return res.status(400).json({ error: 'La cantidad debe ser 1 o más' });

  try {
    const idCarrito = await obtenerIdCarrito(req.usuario.id);
    const r = await pool.query(
      'UPDATE items_carrito SET cantidad = $1 WHERE id_item = $2 AND id_carrito = $3',
      [cantidad, idItem, idCarrito]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado en tu carrito' });
    res.json(await armarCarrito(idCarrito));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/carrito/items/:idItem
router.delete('/items/:idItem', verificarToken, async (req, res) => {
  const idItem = parseInt(req.params.idItem, 10);
  if (!idItem) return res.status(404).json({ error: 'Producto no encontrado en tu carrito' });

  try {
    const idCarrito = await obtenerIdCarrito(req.usuario.id);
    await pool.query('DELETE FROM items_carrito WHERE id_item = $1 AND id_carrito = $2', [idItem, idCarrito]);
    res.json(await armarCarrito(idCarrito));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;