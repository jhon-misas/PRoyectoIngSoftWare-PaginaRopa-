// Crea todas las tablas y carga los datos de ejemplo en la base de datos del .env (DATABASE_URL).
// OJO: BORRA las tablas que ya existan. Úsalo solo con una base de datos nueva o de pruebas.
//
// Uso (desde la carpeta principal del proyecto):
//   npm run crear-bd -- --si
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function main() {
  if (!process.argv.includes('--si')) {
    console.log('Este comando BORRA todas las tablas de la base de datos del .env y las vuelve a crear.');
    console.log('Si estás seguro, escribe:  npm run crear-bd -- --si');
    process.exit(1);
  }
  const esquema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const datos = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
  console.log('Creando tablas (schema.sql)...');
  await pool.query(esquema);
  console.log('Cargando datos de ejemplo (seed.sql)...');
  await pool.query(datos);
  const r = await pool.query('SELECT COUNT(*) FROM productos');
  console.log('Listo. Productos en la base de datos:', r.rows[0].count);
  console.log('Administrador inicial: admin@wutforce.com / Admin12345 (cámbiala con npm run crear-admin).');
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
