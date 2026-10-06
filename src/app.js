// CAPA HTTP — arma la aplicación Express a partir de un contenedor.
// No conoce MySQL: recibe los servicios ya construidos. Por eso las pruebas
// pueden levantar la API completa con un contenedor falso.
const path = require('path');
const express = require('express');
const { crearCasosRouter, crearIndicadoresRouter } = require('./routes/casosRoutes');
const { crearCategoriasRouter, crearUsuariosRouter } = require('./routes/catalogosRoutes');
const { noEncontrado, manejadorErrores } = require('./middleware/errores');

function crearApp({ servicios, verificarBaseDeDatos }) {
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Verifica que la app y la base de datos responden.
  app.get('/api/health', async (req, res) => {
    try {
      await verificarBaseDeDatos();
      res.json({ app: 'ok', db: 'ok' });
    } catch (err) {
      res.status(503).json({ app: 'ok', db: 'error', detalle: err.code || err.message });
    }
  });

  app.use('/api/casos', crearCasosRouter(servicios));
  app.use('/api/categorias', crearCategoriasRouter(servicios));
  app.use('/api/usuarios', crearUsuariosRouter(servicios));
  app.use('/api/indicadores', crearIndicadoresRouter(servicios));

  app.use('/api', noEncontrado);
  app.use(manejadorErrores);

  return app;
}

module.exports = { crearApp };
