const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const pool = require('../db');

const router = express.Router();
const clienteGoogle = new OAuth2Client();

function esCorreo(texto) {
  return /^[^ @]+@[^ @]+[.][^ @]+$/.test((texto || '').trim());
}

// Revisa si el usuario es administrador, firma el token (2 horas) y responde.
// La usan el login con correo y el login con Google, para que den la misma respuesta.
async function responderConSesion(res, usuario) {
  const admin = await pool.query(
    'SELECT 1 FROM administradores WHERE id_usuario = $1',
    [usuario.id_usuario]
  );
  const esAdmin = admin.rows.length > 0;

  const token = jwt.sign(
    { id: usuario.id_usuario, correo: usuario.correo, esAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  res.json({
    token,
    usuario: {
      id: usuario.id_usuario,
      correo: usuario.correo,
      nombre: usuario.nombre,
      esAdmin,
    },
  });
}

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  const { nombre, correo, contrasena } = req.body;

  if (!esCorreo(correo)) {
    return res.status(400).json({ error: 'Correo no válido' });
  }

  if (!contrasena || contrasena.length < 8) {
    return res.status(400).json({
      error: 'La contraseña debe tener mínimo 8 caracteres',
    });
  }

  try {
    const correoLimpio = correo.trim().toLowerCase();

    const existe = await pool.query(
      'SELECT 1 FROM usuarios WHERE correo = $1',
      [correoLimpio]
    );

    if (existe.rows.length > 0) {
      return res.status(409).json({ error: 'Correo ya registrado' });
    }

    const hash = await bcrypt.hash(contrasena, 10);

    const nuevo = await pool.query(
      `INSERT INTO usuarios (correo, contrasena, nombre)
       VALUES ($1, $2, $3)
       RETURNING id_usuario AS id, correo, nombre`,
      [correoLimpio, hash, nombre || null]
    );

    res.status(201).json({
      mensaje: 'Registro exitoso',
      usuario: nuevo.rows[0],
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    const r = await pool.query(
      `SELECT id_usuario, correo, contrasena, nombre
       FROM usuarios
       WHERE correo = $1`,
      [(correo || '').trim().toLowerCase()]
    );

    const usuario = r.rows[0];
    const coincide =
      usuario && (await bcrypt.compare(contrasena || '', usuario.contrasena));

    if (!coincide) {
      return res.status(401).json({ error: 'Datos incorrectos' });
    }

    await responderConSesion(res, usuario);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/auth/google/config
// Le da a React el Client ID de Google (es un dato público, no es secreto).
// Si no está configurado responde 503 y React esconde el botón de Google.
router.get('/google/config', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: 'El inicio de sesión con Google no está configurado' });
  }
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID });
});

// POST /api/auth/google   cuerpo: { credencial }
// "credencial" es el token que Google le entrega al navegador cuando la persona
// elige su cuenta. Aquí se verifica con Google (firma, vencimiento y que sea
// para NUESTRO Client ID). Nunca se confía en el correo que mande el navegador.
router.post('/google', async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: 'El inicio de sesión con Google no está configurado' });
  }

  const { credencial } = req.body || {};
  if (!credencial || typeof credencial !== 'string') {
    return res.status(400).json({ error: 'Falta la credencial de Google' });
  }

  let datosGoogle;
  try {
    const ticket = await clienteGoogle.verifyIdToken({
      idToken: credencial,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    datosGoogle = ticket.getPayload();
  } catch (e) {
    return res.status(401).json({ error: 'No se pudo verificar la cuenta de Google' });
  }

  if (!datosGoogle.email || !datosGoogle.email_verified) {
    return res.status(401).json({ error: 'La cuenta de Google no tiene un correo verificado' });
  }

  try {
    const correo = datosGoogle.email.toLowerCase();

    // Si el correo ya está registrado, entra a esa misma cuenta.
    let r = await pool.query(
      'SELECT id_usuario, correo, nombre FROM usuarios WHERE correo = $1',
      [correo]
    );
    let usuario = r.rows[0];

    // Si no existe, se crea. La tabla usuarios exige contraseña, así que se
    // guarda el hash de una clave aleatoria que nadie conoce: esa cuenta solo
    // puede entrar con Google.
    if (!usuario) {
      const hash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      r = await pool.query(
        `INSERT INTO usuarios (correo, contrasena, nombre)
         VALUES ($1, $2, $3)
         RETURNING id_usuario, correo, nombre`,
        [correo, hash, datosGoogle.name || null]
      );
      usuario = r.rows[0];
    }

    await responderConSesion(res, usuario);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
