// Punto de entrada: conecta las piezas reales y arranca el servidor.
require('dotenv').config();
const { crearPool } = require('./config/db');
const { crearContenedor } = require('./config/contenedor');
const { crearApp } = require('./app');

const PORT = Number(process.env.PORT) || 3000;

const app = crearApp(crearContenedor(crearPool()));

app.listen(PORT, () => {
  console.log(`CampusHelp escuchando en http://localhost:${PORT}`);
});
