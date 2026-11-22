const verificarToken = require('./auth');
const pool = require('../db');

async function revisarAdmin(req, res, next) {
    try {
        const r = await pool.query(
            'SELECT 1 FROM administradores WHERE id_usuario = $1',
            [req.usuario.id]
        );

        if (r.rows.length === 0) {
            return res.status(403).json({
                error: 'Solo el administrador puede hacer esto'
            });
        }

        next();

    } catch (e) {
        console.error(e);

        res.status(500).json({
            error: 'Error del servidor'
        });
    }
}

module.exports = [verificarToken, revisarAdmin];