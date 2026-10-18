const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

function esCorreo(texto) {
  return /^[^ @]+@[^ @]+[.][^ @]+$/.test((texto || '').trim());
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

    const token = jwt.sign(
      { id: usuario.id_usuario, correo: usuario.correo },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id_usuario,
        correo: usuario.correo,
        nombre: usuario.nombre,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;