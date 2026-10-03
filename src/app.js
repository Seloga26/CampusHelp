const path = require('path');
const express = require('express');
const pool = require('./config/db');
const { noEncontrado, manejadorErrores } = require('./middleware/errores');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Verifica que la app y la base de datos responden.
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ app: 'ok', db: 'ok' });
  } catch (err) {
    res.status(503).json({ app: 'ok', db: 'error', detalle: err.code || err.message });
  }
});

app.use('/api/casos', require('./routes/casos'));
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/indicadores', require('./routes/indicadores'));

app.use('/api', noEncontrado);
app.use(manejadorErrores);

module.exports = app;
