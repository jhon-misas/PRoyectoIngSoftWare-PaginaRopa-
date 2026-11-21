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

module.exports = pool;
