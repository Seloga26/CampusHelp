// npm run db:init — crea la base de datos, las tablas y los datos de prueba.
// ¡Borra las tablas existentes! Úsalo solo en tu entorno local.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
  for (const archivo of ['schema.sql', 'seed.sql']) {
    const sql = fs.readFileSync(path.join(__dirname, archivo), 'utf8');
    await conn.query(sql);
    console.log(`✔ ${archivo} ejecutado`);
  }
  await conn.end();
  console.log('Base de datos lista.');
}

main().catch((err) => {
  console.error('Error inicializando la BD:', err.message);
  process.exit(1);
});
