// HU-04 Asignarme un caso — persistencia, transacción y concurrencia en MySQL real.
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
test('HU-04: asignación persistente y sin doble asignación en MySQL real', {
  skip: process.env.CAMPUSHELP_TEST_MYSQL !== '1',
}, async (t) => {
  const nombre = `campushelp_hu04_test_${randomBytes(8).toString('hex')}`;
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
  db = mysql.createPool({ ...config, database: nombre, connectionLimit: 6 });
  const [[version]] = await db.query('SELECT VERSION() AS version');
  t.diagnostic(`MySQL ${version.version}; base temporal ${nombre}`);
  const servicios = () => crearContenedor(db).servicios;

  async function crearCaso(estado = 'Pendiente') {
    const [r] = await db.execute(
      `INSERT INTO caso (tipo, titulo, descripcion, prioridad, estado, usuario_id, categoria_id)
       VALUES ('Incidente', 'Prueba HU-04', 'Sin conexión en el laboratorio', 'P2', ?, 1, 8)`, [estado],
    );
    return r.insertId;
  }
  const leerCaso = async (id) => (await db.execute('SELECT * FROM caso WHERE id = ?', [id]))[0][0];
  const leerHistorial = async (id) =>
    (await db.execute('SELECT * FROM historial WHERE caso_id = ? ORDER BY id', [id]))[0];

  await t.test('CP-06: guarda agente, fecha de asignación y evento sin cambiar el estado', async () => {
    const id = await crearCaso();
    const caso = await servicios().asignarCaso({ id, usuario_id: 3 });
    assert.equal(caso.agente_id, 3);
    assert.equal(caso.agente, 'Carla Agente');
    assert.equal(caso.estado, 'Pendiente');
    const fila = await leerCaso(id);
    assert.equal(fila.agente_id, 3);
    assert.match(fila.fecha_asignacion, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    const eventos = await leerHistorial(id);
    assert.equal(eventos.length, 1);
    assert.equal(eventos[0].evento, 'Caso asignado');
    assert.equal(eventos[0].usuario_id, 3);
    assert.equal(eventos[0].estado_anterior, null);
    assert.equal(eventos[0].estado_nuevo, null);
  });

  await t.test('CP-17 y CP-18: rechazos sin escrituras', async () => {
    const id = await crearCaso();
    await servicios().asignarCaso({ id, usuario_id: 3 });
    const antes = await leerCaso(id);
    await assert.rejects(servicios().asignarCaso({ id, usuario_id: 4 }), { status: 409 });
    await assert.rejects(servicios().asignarCaso({ id, usuario_id: 1 }), { status: 403 });
    assert.deepEqual(await leerCaso(id), antes);
    assert.equal((await leerHistorial(id)).length, 1);
    const cerrado = await crearCaso('Cerrada');
    await assert.rejects(servicios().asignarCaso({ id: cerrado, usuario_id: 3 }), { status: 409 });
    assert.equal((await leerCaso(cerrado)).agente_id, null);
  });

  await t.test('CP-19: solo el agente asignado cambia el estado en MySQL', async () => {
    const id = await crearCaso();
    await assert.rejects(servicios().cambiarEstado({ id, estado: 'En análisis', usuario_id: 3 }), { status: 403 });
    await servicios().asignarCaso({ id, usuario_id: 3 });
    await assert.rejects(servicios().cambiarEstado({ id, estado: 'En análisis', usuario_id: 4 }), { status: 403 });
    assert.equal((await leerCaso(id)).estado, 'Pendiente');
    const caso = await servicios().cambiarEstado({ id, estado: 'En análisis', usuario_id: 3 });
    assert.equal(caso.estado, 'En análisis');
    assert.deepEqual((await leerHistorial(id)).map((e) => e.evento), ['Caso asignado', 'Cambio de estado']);
  });

  await t.test('dos agentes al mismo tiempo: solo uno queda asignado y hay un solo evento', async () => {
    const id = await crearCaso();
    const resultados = await Promise.allSettled([
      servicios().asignarCaso({ id, usuario_id: 3 }),
      servicios().asignarCaso({ id, usuario_id: 4 }),
    ]);
    const ok = resultados.filter((r) => r.status === 'fulfilled');
    const rechazos = resultados.filter((r) => r.status === 'rejected');
    assert.equal(ok.length, 1);
    assert.equal(rechazos.length, 1);
    assert.equal(rechazos[0].reason.status, 409);
    const fila = await leerCaso(id);
    assert.equal(fila.agente_id, ok[0].value.agente_id);
    assert.equal((await leerHistorial(id)).length, 1);
  });

  await t.test('si falla el historial, MySQL revierte la asignación', async () => {
    const id = await crearCaso();
    // Rompe solo el INSERT del historial para forzar el ROLLBACK de la transacción real.
    await db.query('ALTER TABLE historial ADD COLUMN forzar_fallo INT NOT NULL');
    try {
      await assert.rejects(servicios().asignarCaso({ id, usuario_id: 3 }));
    } finally {
      await db.query('ALTER TABLE historial DROP COLUMN forzar_fallo');
    }
    const fila = await leerCaso(id);
    assert.equal(fila.agente_id, null);
    assert.equal(fila.fecha_asignacion, null);
    assert.deepEqual(await leerHistorial(id), []);
  });
});
