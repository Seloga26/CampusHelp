// CONFIGURACIÓN — conexión a MySQL (detalle de infraestructura).
// Solo config/contenedor.js usa este módulo; el resto del código recibe
// los repositorios ya construidos.
require('dotenv').config();
const mysql = require('mysql2/promise');

function crearPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campushelp',
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
  });
}

module.exports = { crearPool };
