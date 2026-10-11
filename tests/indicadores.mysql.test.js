// HU-10 Indicadores — conteos y promedios calculados en MySQL real con fechas controladas.
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
test('HU-10: indicadores calculados en MySQL real', {
  skip: process.env.CAMPUSHELP_TEST_MYSQL !== '1',
}, async (t) => {
  const nombre = `campushelp_hu10_test_${randomBytes(8).toString('hex')}`;
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

  // Se reemplazan los casos de ejemplo por casos con fechas conocidas.
  await db.query('DELETE FROM historial');
  await db.query('DELETE FROM atencion');
  await db.query('DELETE FROM caso');
  const insertar = (tipo, prioridad, estado, asignacion, inicio, cierre) => db.execute(
    `INSERT INTO caso (tipo, titulo, descripcion, prioridad, estado, usuario_id, categoria_id, agente_id,
                       fecha_creacion, fecha_asignacion, fecha_inicio_atencion, fecha_cierre)
     VALUES (?, 'Caso de prueba', 'Descripción de prueba', ?, ?, 1, 8, ?, '2026-10-10 08:00:00', ?, ?, ?)`,
    [tipo, prioridad, estado, asignacion ? 3 : null, asignacion, inicio, cierre],
  );

  await t.test('CP-34: sin casos cerrados → atención y resolución en null', async () => {
    await insertar('Incidente', 'P1', 'Pendiente', null, null, null);
    await insertar('Incidente', 'P1', 'En análisis', '2026-10-10 08:30:00', null, null);
    await insertar('Incidente', 'P2', 'En validación', '2026-10-10 08:30:00', '2026-10-10 09:00:00', null);
    const r = await s.consultarIndicadores({ usuario_id: 6 });
    assert.equal(r.cerrados, 0);
    assert.deepEqual(r.tiempos.atencion, { promedio_horas: null, casos: 0 });
    assert.deepEqual(r.tiempos.resolucion, { promedio_horas: null, casos: 0 });
    assert.deepEqual(r.tiempos.asignacion, { promedio_horas: 0.5, casos: 2 });
  });

  await t.test('CP-32 y CP-33: conteos iguales a MySQL y resolución de 3,0 h sobre 2 casos', async () => {
    await insertar('Solicitud de servicio', 'P2', 'Cerrada',
      '2026-10-10 08:30:00', '2026-10-10 09:00:00', '2026-10-10 10:00:00'); // 2 h
    await insertar('Solicitud de servicio', 'P3', 'Cerrada',
      '2026-10-10 08:30:00', '2026-10-10 09:30:00', '2026-10-10 12:00:00'); // 4 h
    const r = await s.consultarIndicadores({ usuario_id: 6 });

    assert.deepEqual([r.total, r.abiertos, r.cerrados], [5, 3, 2]);
    assert.deepEqual(r.por_estado, {
      'Pendiente': 1, 'En análisis': 1, 'En atención': 0, 'En validación': 1, 'Cerrada': 2,
    });
    assert.deepEqual(r.por_tipo, { 'Incidente': 3, 'Solicitud de servicio': 2 });
    assert.deepEqual(r.por_prioridad, { P1: 2, P2: 2, P3: 1 });

    // Mismo resultado que un conteo directo en la base.
    const [filas] = await db.query('SELECT estado, COUNT(*) AS n FROM caso GROUP BY estado');
    for (const f of filas) assert.equal(r.por_estado[f.estado], Number(f.n), f.estado);

    assert.deepEqual(r.tiempos.resolucion, { promedio_horas: 3, casos: 2 });
    assert.deepEqual(r.tiempos.asignacion, { promedio_horas: 0.5, casos: 4 });
    assert.deepEqual(r.tiempos.atencion, { promedio_horas: 1.8, casos: 2 }); // (1 h + 2,5 h) / 2
  });

  await t.test('CP-35: un Agente recibe 403 y consultar no modifica la base', async () => {
    const [[antes]] = await db.query('SELECT COUNT(*) AS n, MAX(estado) AS e FROM caso');
    await assert.rejects(s.consultarIndicadores({ usuario_id: 3 }), { status: 403 });
    await s.consultarIndicadores({ usuario_id: 6 });
    const [[despues]] = await db.query('SELECT COUNT(*) AS n, MAX(estado) AS e FROM caso');
    assert.deepEqual(despues, antes);
  });
});
