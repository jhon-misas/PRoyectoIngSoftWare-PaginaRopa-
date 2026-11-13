const express = require('express');
const pool = require('../db');
const soloAdmin = require('../middleware/soloAdmin');

const router = express.Router();

// Todas las rutas de este archivo son solo para el administrador
router.use(soloAdmin);

router.get('/prueba', (req, res) => {
  res.json({ ok: true, mensaje: 'Eres administrador' });
});

// Revisa y limpia lo que llega del formulario. Devuelve { error } o { datos }.
function validarProducto(b) {
  const nombre = String(b.nombre || '').trim();
  const precio = Number(b.precio);
  const cantidad = Number(b.cantidad);
  if (!nombre) return { error: 'El nombre es obligatorio' };
  if (!Number.isInteger(precio) || precio <= 0) {
    return { error: 'El precio debe ser un número entero mayor que 0' };
  }
  if (!Number.isInteger(cantidad) || cantidad < 0) {
    return { error: 'La cantidad debe ser un número entero de 0 o más' };
  }
  const texto = (v, largo) => String(v || '').trim().slice(0, largo) || null;
  const tallas = Array.isArray(b.tallas)
    ? [...new Set(b.tallas.map((t) => String(t).trim().slice(0, 10)).filter(Boolean))]
    : [];
  const colores = Array.isArray(b.colores)
    ? b.colores
        .filter((c) => c && String(c.nombre || '').trim())
        .map((c) => ({
          nombre: String(c.nombre).trim().slice(0, 50),
          hex: /^#[0-9a-fA-F]{6}$/.test(c.hex || '') ? c.hex : null
        }))
    : [];
  return {
    datos: {
      nombre: nombre.slice(0, 150),
      precio,
      cantidad,
      descripcion: texto(b.descripcion, 5000),
      foto: texto(b.foto, 255),
      material: texto(b.material, 150),
      genero: texto(b.genero, 30),
      disponible: b.disponible !== false,
      idCategoria: b.idCategoria ? Number(b.idCategoria) : null,
      tallas,
      colores
    }
  };
}

// Deja las tallas y colores del producto como dice el formulario.
// Una talla que se quita sale de los carritos, y en los pedidos viejos queda solo su nombre.
async function guardarTallasYColores(cliente, id, tallas, colores) {
  const actuales = await cliente.query(
    'SELECT id_talla, nombre FROM tallas WHERE id_producto = $1',
    [id]
  );
  for (const t of actuales.rows) {
    if (!tallas.includes(t.nombre)) {
      await cliente.query('DELETE FROM items_carrito WHERE id_talla = $1', [t.id_talla]);
      await cliente.query('UPDATE items_pedido SET id_talla = NULL WHERE id_talla = $1', [t.id_talla]);
      await cliente.query('DELETE FROM tallas WHERE id_talla = $1', [t.id_talla]);
    }
  }
  const nombresActuales = actuales.rows.map((t) => t.nombre);
  for (const nombre of tallas) {
    if (!nombresActuales.includes(nombre)) {
      await cliente.query('INSERT INTO tallas (nombre, id_producto) VALUES ($1, $2)', [nombre, id]);
    }
  }
  await cliente.query('DELETE FROM colores WHERE id_producto = $1', [id]);
  for (const c of colores) {
    await cliente.query(
      'INSERT INTO colores (nombre, codigo_hex, id_producto) VALUES ($1, $2, $3)',
      [c.nombre, c.hex, id]
    );
  }
}

// GET /api/admin/categorias
router.get('/categorias', async (req, res) => {
  try {
    const r = await pool.query('SELECT id_categoria AS id, nombre FROM categorias ORDER BY nombre');
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/admin/productos (todos, también los no disponibles)
router.get('/productos', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT p.id_producto AS id, p.nombre, p.precio::float AS precio, p.foto,
              p.disponible, p.cantidad, c.nombre AS categoria
       FROM productos p
       LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
       ORDER BY p.id_producto DESC`
    );
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/admin/productos/:id
router.get('/productos/:id', async (req, res) => {
  if (!/^[0-9]+$/.test(req.params.id)) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  try {
    const r = await pool.query(
      `SELECT id_producto AS id, nombre, descripcion, precio::float AS precio, foto,
              material, genero, disponible, cantidad, id_categoria AS "idCategoria"
       FROM productos WHERE id_producto = $1`,
      [req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    const p = r.rows[0];
    const tallas = await pool.query(
      'SELECT id_talla AS id, nombre FROM tallas WHERE id_producto = $1 ORDER BY id_talla',
      [p.id]
    );
    const colores = await pool.query(
      'SELECT id_color AS id, nombre, codigo_hex AS hex FROM colores WHERE id_producto = $1 ORDER BY id_color',
      [p.id]
    );
    res.json({ ...p, tallas: tallas.rows, colores: colores.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/admin/productos
router.post('/productos', async (req, res) => {
  const { error, datos: d } = validarProducto(req.body || {});
  if (error) return res.status(400).json({ error });
  let cliente;
  try {
    cliente = await pool.connect();
    await cliente.query('BEGIN');
    const r = await cliente.query(
      `INSERT INTO productos (nombre, descripcion, precio, foto, material, genero, disponible, cantidad, id_categoria)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id_producto AS id`,
      [d.nombre, d.descripcion, d.precio, d.foto, d.material, d.genero, d.disponible, d.cantidad, d.idCategoria]
    );
    const id = r.rows[0].id;
    await guardarTallasYColores(cliente, id, d.tallas, d.colores);
    await cliente.query('COMMIT');
    res.status(201).json({ id, mensaje: 'Producto creado' });
  } catch (e) {
    if (cliente) await cliente.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    if (cliente) cliente.release();
  }
});

// PUT /api/admin/productos/:id
router.put('/productos/:id', async (req, res) => {
  if (!/^[0-9]+$/.test(req.params.id)) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  const { error, datos: d } = validarProducto(req.body || {});
  if (error) return res.status(400).json({ error });
  const id = Number(req.params.id);
  let cliente;
  try {
    cliente = await pool.connect();
    await cliente.query('BEGIN');
    const r = await cliente.query(
      `UPDATE productos SET nombre = $1, descripcion = $2, precio = $3, foto = $4, material = $5,
              genero = $6, disponible = $7, cantidad = $8, id_categoria = $9
       WHERE id_producto = $10`,
      [d.nombre, d.descripcion, d.precio, d.foto, d.material, d.genero, d.disponible, d.cantidad, d.idCategoria, id]
    );
    if (r.rowCount === 0) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    await guardarTallasYColores(cliente, id, d.tallas, d.colores);
    await cliente.query('COMMIT');
    res.json({ id, mensaje: 'Cambios guardados' });
  } catch (e) {
    if (cliente) await cliente.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    if (cliente) cliente.release();
  }
});

// DELETE /api/admin/productos/:id
// Si ya se vendió alguna vez, no se borra (los pedidos lo necesitan): queda no disponible y en 0.
router.delete('/productos/:id', async (req, res) => {
  if (!/^[0-9]+$/.test(req.params.id)) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  const id = Number(req.params.id);
  try {
    const vendido = await pool.query('SELECT 1 FROM items_pedido WHERE id_producto = $1 LIMIT 1', [id]);
    if (vendido.rows.length > 0) {
      await pool.query('UPDATE productos SET disponible = FALSE, cantidad = 0 WHERE id_producto = $1', [id]);
      return res.json({ mensaje: 'Este producto ya tiene pedidos, así que se marcó como no disponible en vez de borrarse' });
    }
    await pool.query('DELETE FROM items_carrito WHERE id_producto = $1', [id]);
    const r = await pool.query('DELETE FROM productos WHERE id_producto = $1', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto eliminado' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;