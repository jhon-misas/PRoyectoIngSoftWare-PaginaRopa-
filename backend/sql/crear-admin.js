// Crea un administrador, o convierte en administrador a un usuario que ya existe,
// y le pone la contraseña indicada (guardada cifrada con bcrypt).
//
// Uso (desde la carpeta principal del proyecto):
//   npm run crear-admin -- correo@ejemplo.com Contraseña123 "Nombre opcional"
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../db');

async function main() {
  const [correoEntrada, contrasena, nombre] = process.argv.slice(2);
  const correo = (correoEntrada || '').trim().toLowerCase();
  if (!correo || !contrasena) {
    console.log('Uso: npm run crear-admin -- correo@ejemplo.com Contraseña123 "Nombre opcional"');
    process.exitCode = 1;
    return;
  }
  if (contrasena.length < 8) {
    console.log('La contraseña debe tener mínimo 8 caracteres.');
    process.exitCode = 1;
    return;
  }

  const hash = await bcrypt.hash(contrasena, 10);
  const existe = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = $1', [correo]);
  let idUsuario;
  if (existe.rows.length > 0) {
    idUsuario = existe.rows[0].id_usuario;
    await pool.query('UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2', [hash, idUsuario]);
    console.log('El usuario ya existía: se le cambió la contraseña.');
  } else {
    const nuevo = await pool.query(
      'INSERT INTO usuarios (correo, contrasena, nombre) VALUES ($1, $2, $3) RETURNING id_usuario',
      [correo, hash, nombre || 'Administrador']
    );
    idUsuario = nuevo.rows[0].id_usuario;
    console.log('Usuario creado.');
  }

  await pool.query(
    'INSERT INTO administradores (id_usuario) VALUES ($1) ON CONFLICT (id_usuario) DO NOTHING',
    [idUsuario]
  );
  console.log('Listo: ' + correo + ' es administrador. Ya puede iniciar sesión en la tienda.');
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
