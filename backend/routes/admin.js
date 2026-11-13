const express = require('express');
const pool = require('../db');
const soloAdmin = require('../middleware/soloAdmin');

const router = express.Router();

// Todas las rutas de este archivo son solo para el administrador
router.use(soloAdmin);

router.get('/prueba', (req, res) => {
    res.json({
        ok: true,
        mensaje: 'Eres administrador'
    });
});

module.exports = router;