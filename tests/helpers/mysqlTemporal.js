// Bases aisladas para las pruebas de integración; nunca inicializa campushelp.
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { once } = require('node:events');
const mysql = require('mysql2/promise');
require('dotenv').config();
const { crearApp } = require('../../src/app');
const { crearContenedor } = require('../../src/config/contenedor');

async function abrirMysqlTemporal(t, prefijo) {
  if (!/^[a-z0-9_]+$/.test(prefijo)) throw new Error('Prefijo de prueba inválido');
  const nombre = `campushelp_${prefijo}_test_${randomBytes(8).toString('hex')}`;
  const config = { host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', dateStrings: true };
  const admin = await mysql.createConnection({ ...config, multipleStatements: true });
  let db;
  let servidor;
  let creada = false;
  t.after(async () => {
    if (servidor) await new Promise(ok => { servidor.close(ok); servidor.closeAllConnections?.(); });
    if (db) await db.end();
    try { if (creada) await admin.query(`DROP DATABASE \`${nombre}\``); }
    finally { await admin.end(); }
  });
  await admin.query(`CREATE DATABASE \`${nombre}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  creada = true;
  for (const archivo of ['schema.sql', 'seed.sql']) {
    await admin.query(fs.readFileSync(path.join(__dirname, '../../database', archivo), 'utf8').replace(/\bcampushelp\b/g, nombre));
  }
  db = mysql.createPool({ ...config, database: nombre });
  const [[version]] = await db.query('SELECT VERSION() AS version');
  t.diagnostic(`MySQL ${version.version}; base temporal ${nombre}`);
  servidor = crearApp(crearContenedor(db)).listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  const base = `http://127.0.0.1:${servidor.address().port}`;
  async function pedir(ruta, method = 'GET', datos) {
    const respuesta = await fetch(base + ruta, { method,
      headers: datos === undefined ? {} : { 'Content-Type': 'application/json' },
      body: datos === undefined ? undefined : JSON.stringify(datos) });
    return { status: respuesta.status, datos: await respuesta.json() };
  }
  return { db, base, pedir };
}

module.exports = { abrirMysqlTemporal };
