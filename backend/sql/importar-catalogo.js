// Carga el catálogo real de WUT (carpeta catalogo/) en la base de datos del .env:
//   1. Crea las categorías del menú que falten.
//   2. Sube cada foto de catalogo/fotos a Cloudinary.
//   3. Crea cada producto, o lo actualiza si ya existe uno con el mismo nombre (tallas y colores incluidos).
// Se puede ejecutar varias veces: no duplica productos ni fotos.
//
// Uso (desde la carpeta principal del proyecto):
//   npm run importar-catalogo                     -> importa
//   npm run importar-catalogo -- --prueba         -> solo muestra qué haría, sin cambiar nada
//   npm run importar-catalogo -- --ocultar-otros  -> además marca como no disponibles los productos
//                                                    que NO están en el catálogo (los de ejemplo)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const pool = require('../db');

const CARPETA = path.join(__dirname, '..', '..', 'catalogo');
const prueba = process.argv.includes('--prueba');
const ocultarOtros = process.argv.includes('--ocultar-otros');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function idFoto(archivo) {
  return 'wut-force-armour/catalogo/' + path.parse(archivo).name;
}

async function subirFoto(archivo) {
  const r = await cloudinary.uploader.upload(path.join(CARPETA, 'fotos', archivo), {
    public_id: idFoto(archivo),
    overwrite: true,
    transformation: [{ width: 1200, crop: 'limit' }]
  });
  return r.secure_url;
}

// Igual que en routes/admin.js: deja tallas y colores como dice el catálogo
async function guardarTallasYColores(cliente, id, tallas, colores) {
  const actuales = await cliente.query('SELECT id_talla, nombre FROM tallas WHERE id_producto = $1', [id]);
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
    await cliente.query('INSERT INTO colores (nombre, codigo_hex, id_producto) VALUES ($1, $2, $3)', [c.nombre, c.hex, id]);
  }
}

async function main() {
  const { categorias, productos } = JSON.parse(fs.readFileSync(path.join(CARPETA, 'catalogo.json'), 'utf8'));

  // Revisiones antes de tocar la base de datos
  const nombresCategorias = categorias.map((c) => c.nombre);
  for (const p of productos) {
    if (!nombresCategorias.includes(p.categoria)) throw new Error(`"${p.nombre}" tiene una categoría que no está en la lista: ${p.categoria}`);
    if (!fs.existsSync(path.join(CARPETA, 'fotos', p.foto))) throw new Error(`No existe la foto catalogo/fotos/${p.foto} de "${p.nombre}"`);
    if (!Number.isInteger(p.precio) || p.precio <= 0) throw new Error(`Precio inválido en "${p.nombre}"`);
  }
  if (!prueba && !(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)) {
    throw new Error('Faltan CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY o CLOUDINARY_API_SECRET en el .env');
  }
  console.log(`Catálogo: ${categorias.length} categorías y ${productos.length} productos.${prueba ? ' (MODO PRUEBA: no se cambia nada)' : ''}`);

  // 1. Categorías
  let menu = await pool.query("SELECT id_menu FROM menus WHERE seccion = 'Colecciones'");
  if (menu.rows.length === 0 && !prueba) menu = await pool.query("INSERT INTO menus (seccion) VALUES ('Colecciones') RETURNING id_menu");
  const idMenu = menu.rows[0] ? menu.rows[0].id_menu : null;
  const idCategoria = {};
  for (const c of categorias) {
    const existe = await pool.query('SELECT id_categoria FROM categorias WHERE nombre ILIKE $1', [c.nombre]);
    if (existe.rows.length > 0) {
      idCategoria[c.nombre] = existe.rows[0].id_categoria;
    } else if (prueba) {
      console.log(`  + categoría nueva: ${c.nombre}`);
    } else {
      const r = await pool.query(
        'INSERT INTO categorias (nombre, genero, tipo, id_menu) VALUES ($1, $2, $3, $4) RETURNING id_categoria',
        [c.nombre, c.genero, c.tipo, idMenu]
      );
      idCategoria[c.nombre] = r.rows[0].id_categoria;
      console.log(`  + categoría creada: ${c.nombre}`);
    }
  }

  // 2 y 3. Fotos y productos
  let creados = 0;
  let actualizados = 0;
  for (const [i, p] of productos.entries()) {
    const existe = await pool.query('SELECT id_producto FROM productos WHERE nombre ILIKE $1 ORDER BY id_producto LIMIT 1', [p.nombre]);
    const accion = existe.rows.length > 0 ? 'actualizar' : 'crear';
    if (prueba) {
      console.log(`  ${String(i + 1).padStart(2)}. ${accion.padEnd(10)} ${p.nombre} · ${p.categoria} · $${p.precio} · tallas ${p.tallas.join(', ')} · ${p.colores.map((c) => c.nombre).join(', ')}`);
      continue;
    }
    const url = await subirFoto(p.foto);
    const datos = [p.nombre, p.descripcion || null, p.precio, url, p.material || null, p.genero || null, p.cantidad ?? 20, idCategoria[p.categoria]];
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      let id;
      if (existe.rows.length > 0) {
        id = existe.rows[0].id_producto;
        await cliente.query(
          `UPDATE productos SET nombre = $1, descripcion = $2, precio = $3, foto = $4, material = $5, genero = $6,
                  cantidad = $7, id_categoria = $8, disponible = TRUE
           WHERE id_producto = $9`,
          [...datos, id]
        );
        actualizados++;
      } else {
        const r = await cliente.query(
          `INSERT INTO productos (nombre, descripcion, precio, foto, material, genero, cantidad, id_categoria, disponible)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE) RETURNING id_producto`,
          datos
        );
        id = r.rows[0].id_producto;
        creados++;
      }
      await guardarTallasYColores(cliente, id, p.tallas, p.colores);
      await cliente.query('COMMIT');
      console.log(`  ${String(i + 1).padStart(2)}/${productos.length} ${accion === 'crear' ? 'creado     ' : 'actualizado'} ${p.nombre}`);
    } catch (e) {
      await cliente.query('ROLLBACK');
      throw new Error(`Falló "${p.nombre}": ${e.message}`);
    } finally {
      cliente.release();
    }
  }

  // Productos que no están en el catálogo (los de ejemplo del seed)
  const nombres = productos.map((p) => p.nombre.toLowerCase());
  const otros = await pool.query('SELECT id_producto, nombre FROM productos WHERE disponible = TRUE');
  const sobrantes = otros.rows.filter((p) => !nombres.includes(p.nombre.toLowerCase()));
  if (sobrantes.length > 0) {
    if (ocultarOtros && !prueba) {
      for (const p of sobrantes) {
        await pool.query('UPDATE productos SET disponible = FALSE, cantidad = 0 WHERE id_producto = $1', [p.id_producto]);
      }
      console.log(`Se marcaron como no disponibles ${sobrantes.length} productos que no están en el catálogo: ${sobrantes.map((p) => p.nombre).join(', ')}`);
    } else {
      console.log(`Hay ${sobrantes.length} productos disponibles que no están en el catálogo: ${sobrantes.map((p) => p.nombre).join(', ')}.`);
      console.log('Para ocultarlos: npm run importar-catalogo -- --ocultar-otros (o desde el panel de administrador).');
    }
  }

  if (!prueba) console.log(`Listo: ${creados} productos creados y ${actualizados} actualizados.`);
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
