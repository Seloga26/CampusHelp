// HU-08 Consultar el historial — consulta real en MySQL con los eventos de HU-01, HU-04, HU-05 y HU-06.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const mysql = require('mysql2/promise');
require('dotenv').config();
const { crearContenedor } = require('../src/config/contenedor');

// Opt-in: necesita MySQL 8 y permisos para crear una BD temporal. Nunca usa
// db:init ni borra los datos de campushelp. Solo elimina su propia BD de prueba.
test('HU-08: historial cronológico con usuario y rol en MySQL real', {
  skip: process.env.CAMPUSHELP_TEST_MYSQL !== '1',
}, async (t) => {
  const nombre = `campushelp_hu08_test_${randomBytes(8).toString('hex')}`;
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dateStrings: true,
  };
  const admin = await mysql.createConnection({ ...config, multipleStatements: true });
  let db;
  let creada = false;
  t.after(async () => {
    try {
      if (db) await db.end();
      if (creada) await admin.query(`DROP DATABASE \`${nombre}\``);
    } finally {
      await admin.end();
    }
  });
  await admin.query(`CREATE DATABASE \`${nombre}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  creada = true;
  for (const archivo of ['schema.sql', 'seed.sql']) {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'database', archivo), 'utf8')
      .replace(/\bcampushelp\b/g, nombre);
    await admin.query(sql);
  }
  db = mysql.createPool({ ...config, database: nombre, connectionLimit: 4 });
  const [[version]] = await db.query('SELECT VERSION() AS version');
  t.diagnostic(`MySQL ${version.version}; base temporal ${nombre}`);
  const s = crearContenedor(db).servicios;

  const { id } = await s.registrarCaso({
    tipo: 'Incidente', titulo: 'Sin Wi-Fi en la biblioteca', descripcion: 'El Wi-Fi no conecta en el piso 2',
    prioridad: 'P1', categoria_id: 8, usuario_id: 1,
  });

  await t.test('CP-26: registrado, asignado y en análisis → 3 eventos en orden', async () => {
    await s.asignarCaso({ id, usuario_id: 3 });
    await s.cambiarEstado({ id, estado: 'En análisis', usuario_id: 3 });
    const eventos = await s.consultarHistorial({ id, usuario_id: 4 });
    assert.deepEqual(eventos.map((e) => e.evento), ['Caso registrado', 'Caso asignado', 'Cambio de estado']);
    assert.deepEqual(eventos.map((e) => [e.estado_anterior, e.estado_nuevo]), [
      [null, 'Pendiente'], [null, null], ['Pendiente', 'En análisis'],
    ]);
    assert.deepEqual(eventos.map((e) => [e.usuario, e.rol]), [
      ['Ana Solicitante', 'Solicitante'], ['Carla Agente', 'Agente'], ['Carla Agente', 'Agente'],
    ]);
    for (const e of eventos) assert.match(e.fecha, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  await t.test('incluye la atención de HU-06 y desempata por id en el mismo segundo', async () => {
    await s.cambiarEstado({ id, estado: 'En atención', usuario_id: 3 });
    await s.registrarAtencion({ id, usuario_id: 3, diagnostico: 'Punto de acceso apagado', solucion: 'Se encendió y verificó' });
    // Fuerza la misma fecha en todos los eventos: el orden debe seguir siendo el de inserción.
    await db.execute("UPDATE historial SET fecha = '2026-10-11 10:00:00' WHERE caso_id = ?", [id]);
    const eventos = await s.consultarHistorial({ id, usuario_id: 1 });
    assert.deepEqual(eventos.map((e) => e.evento), [
      'Caso registrado', 'Caso asignado', 'Cambio de estado', 'Cambio de estado', 'Atención registrada',
    ]);
    const ids = eventos.map((e) => e.id);
    assert.deepEqual(ids, [...ids].sort((a, b) => a - b));
  });

  await t.test('CP-27 y CP-28 contra MySQL', async () => {
    await assert.rejects(s.consultarHistorial({ id, usuario_id: 2 }), { status: 403 });
    await assert.rejects(s.consultarHistorial({ id: 2147483647, usuario_id: 3 }), { status: 404 });
  });
});
