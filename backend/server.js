require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());

// Rutas de la API. Cada persona quita el // de SU línea cuando su archivo de
// rutas exista.
app.get('/api/salud', (req, res) =>
  res.json({ ok: true, mensaje: 'La API funciona' })
);

app.get('/api/salud/bd', async (req, res) => {
try {
const r = await require('./db').query('SELECT COUNT(*) FROM productos');
res.json({ ok: true, productos: Number(r.rows[0].count) });
} catch (e) {
res.status(500).json({ ok: false, error: e.message });
}
});


app.use('/api/auth', require('./routes/auth')); // Persona 1
// app.use('/api/productos', require('./routes/productos')); // Persona 2
 app.use('/api/carrito', require('./routes/carrito')); 
 app.use('/api/pedidos', require('./routes/pedidos')); 

// Las páginas de la carpeta frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});