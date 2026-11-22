require('dotenv').config();
const { Pool } = require('pg');

// Neon (y casi cualquier base de datos en la nube) exige SSL.
// Una base de datos PostgreSQL instalada en el mismo computador (localhost) normalmente no lo usa.
const url = process.env.DATABASE_URL || '';
const esLocal = /@(localhost|127\.0\.0\.1)(:|\/)/.test(url);

const pool = new Pool({
  connectionString: url,
  ssl: esLocal ? false : { rejectUnauthorized: false }
});

// Neon cierra las conexiones que quedan inactivas. Sin este manejador,
// ese aviso apaga todo el servidor. Con él, solo se registra y el pool
// abre una conexión nueva en la siguiente consulta.
pool.on('error', (err) => {
  console.error('La base de datos cerró una conexión inactiva:', err.message);
});

module.exports = pool;
