const express = require('express');
const pool = require('../db');
const router = express.Router();

// GET /api/productos  (opcional: ?categoria=Conjuntos)
router.get('/', async (req, res) => {
  try {
    const categoria = req.query.categoria || null;
    const productos = await pool.query(
      `SELECT p.id_producto AS id, p.nombre, p.precio::float AS precio, p.foto, p.disponible
       FROM productos p
       LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
       WHERE ($1::text IS NULL OR c.nombre ILIKE $1)
       ORDER BY p.id_producto`,
      [categoria]
    );
    const tallas = await pool.query('SELECT id_talla AS id, nombre, id_producto FROM tallas ORDER BY id_talla');
    const colores = await pool.query('SELECT id_color AS id, nombre, codigo_hex AS hex, id_producto FROM colores ORDER BY id_color');

    const lista = productos.rows.map((p) => ({
      ...p,
      tallas: tallas.rows.filter((t) => t.id_producto === p.id).map((t) => ({ id: t.id, nombre: t.nombre })),
      colores: colores.rows.filter((c) => c.id_producto === p.id).map((c) => ({ id: c.id, nombre: c.nombre, hex: c.hex }))
    }));
    res.json(lista);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/productos/:id
router.get('/:id', async (req, res) => {
  if (!/^[0-9]+$/.test(req.params.id)) return res.status(404).json({ error: 'Producto no encontrado' });
  try {
    const r = await pool.query(
      `SELECT id_producto AS id, nombre, descripcion, precio::float AS precio, foto, material, genero, disponible, cantidad
       FROM productos WHERE id_producto = $1`,
      [req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    const p = r.rows[0];
    const tallas = await pool.query('SELECT id_talla AS id, nombre FROM tallas WHERE id_producto = $1 ORDER BY id_talla', [p.id]);
    const colores = await pool.query('SELECT id_color AS id, nombre, codigo_hex AS hex FROM colores WHERE id_producto = $1 ORDER BY id_color', [p.id]);
    res.json({ ...p, tallas: tallas.rows, colores: colores.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;