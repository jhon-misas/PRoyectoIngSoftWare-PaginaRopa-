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

// app.use('/api/auth', require('./routes/auth')); // Persona 1
// app.use('/api/productos', require('./routes/productos')); // Persona 2
// app.use('/api/carrito', require('./routes/carrito')); // Persona 3
// app.use('/api/pedidos', require('./routes/pedidos')); // Persona 3

// Las páginas de la carpeta frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});