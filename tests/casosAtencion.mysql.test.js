const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { once } = require('node:events');
const mysql = require('mysql2/promise');
require('dotenv').config();
const { crearContenedor } = require('../src/config/contenedor');
const { crearApp } = require('../src/app');

// Solo usa una base temporal propia; nunca ejecuta db:init sobre campushelp.
test('HU-06: atención, historial, rollback y persistencia con MySQL real', {
  skip: process.env.CAMPUSHELP_TEST_MYSQL !== '1',
}, async (t) => {
  const nombre = `campushelp_hu06_test_${randomBytes(8).toString('hex')}`;
  const config = {
    host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', dateStrings: true,
  };
  const admin = await mysql.createConnection({ ...config, multipleStatements: true });
  let db;
  let creada = false;
  t.after(async () => {
    try {
      if (db) await db.end();
      if (creada) await admin.query(`DROP DATABASE \`${nombre}\``);
    } finally { await admin.end(); }
  });
  await admin.query(`CREATE DATABASE \`${nombre}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  creada = true;
  for (const archivo of ['schema.sql', 'seed.sql']) {
    await admin.query(fs.readFileSync(path.join(__dirname, '..', 'database', archivo), 'utf8')
      .replace(/\bcampushelp\b/g, nombre));
  }
  db = mysql.createPool({ ...config, database: nombre, connectionLimit: 4 });
  async function crearCaso(estado = 'En atención', agente = 3) {
    const [resultado] = await db.execute(
      `INSERT INTO caso (tipo, titulo, descripcion, prioridad, estado, usuario_id, categoria_id, agente_id)
       VALUES ('Incidente', 'Prueba HU-06', 'Sin conexión al AP institucional', 'P1', ?, 1, 8, ?)`,
      [estado, agente],
    );
    return resultado.insertId;
  }
  async function leer(id) {
    const [[caso]] = await db.execute('SELECT * FROM caso WHERE id = ?', [id]);
    const [atenciones] = await db.execute('SELECT * FROM atencion WHERE caso_id = ? ORDER BY id', [id]);
    const [historial] = await db.execute('SELECT * FROM historial WHERE caso_id = ? ORDER BY id', [id]);
    return { caso, atenciones, historial };
  }
  const entrada = { usuario_id: 3, diagnostico: "El AP 'Bloque B' estaba apagado", solucion: 'Se reinició el AP y se comprobó la conexión' };
  const registrar = (id, datos = {}) => crearContenedor(db).servicios.registrarAtencion({ ...entrada, ...datos, id });
  const validar = (id) => crearContenedor(db).servicios.cambiarEstado({ id, estado: 'En validación', usuario_id: 3 });

  await t.test('CP-07: persiste la atención con fecha, autor e historial y admite otra atención', async () => {
    const id = await crearCaso();
    const primera = await registrar(id);
    assert.equal(primera.caso_id, id);
    assert.equal(primera.agente_id, 3);
    assert.ok(primera.fecha);
    await registrar(id, { solucion: 'Se reemplazó el AP y se verificó la conexión' });
    const datos = await leer(id);
    assert.equal(datos.caso.estado, 'En atención');
    assert.equal(datos.atenciones.length, 2);
    assert.deepEqual(datos.atenciones[0], primera);
    assert.equal(datos.historial.length, 2);
    assert.equal(datos.historial[0].evento, 'Atención registrada');
    assert.equal(datos.historial[0].usuario_id, 3);
    assert.equal(datos.historial[0].estado_anterior, null);
    assert.equal(datos.historial[0].estado_nuevo, null);
    assert.ok(datos.historial[0].fecha);
  });

  await t.test('CP-20 y CP-21: permisos y estados incorrectos no dejan escrituras', async () => {
    for (const [estado, agente, usuario_id, status] of [
      ['En atención', 3, 4, 403], ['En atención', null, 3, 403], ['En atención', 3, 1, 403],
      ['En análisis', 3, 3, 409], ['En validación', 3, 3, 409], ['Cerrada', 3, 3, 409],
    ]) {
      const id = await crearCaso(estado, agente);
      await assert.rejects(registrar(id, { usuario_id }), { status });
      const datos = await leer(id);
      assert.equal(datos.caso.estado, estado);
      assert.deepEqual(datos.atenciones, []);
      assert.deepEqual(datos.historial, []);
    }
  });

  await t.test('CP-22: solo la atención del propio caso permite pasar a validación', async () => {
    const otro = await crearCaso();
    await registrar(otro);
    const id = await crearCaso();
    await assert.rejects(validar(id), { status: 409 });
    const antes = await leer(id);
    assert.equal(antes.caso.estado, 'En atención');
    assert.deepEqual(antes.historial, []);
    await registrar(id);
    await validar(id);
    const datos = await leer(id);
    assert.equal(datos.caso.estado, 'En validación');
    assert.deepEqual(datos.historial.map((h) => h.evento), ['Atención registrada', 'Cambio de estado']);
  });

  await t.test('un fallo real del historial revierte la atención y conserva las anteriores', async () => {
    const id = await crearCaso();
    await registrar(id);
    const antes = await leer(id);
    await db.query(`CREATE TRIGGER hu06_fallar_historial BEFORE INSERT ON historial
      FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Fallo deliberado HU-06'`);
    try {
      await assert.rejects(registrar(id), /Fallo deliberado HU-06/);
      assert.deepEqual(await leer(id), antes);
    } finally { await db.query('DROP TRIGGER hu06_fallar_historial'); }
  });

  await t.test('registro y cambio simultáneos respetan el bloqueo y nunca validan sin solución', async () => {
    const id = await crearCaso();
    const [atencion, cambio] = await Promise.allSettled([registrar(id), validar(id)]);
    assert.equal(atencion.status, 'fulfilled');
    if (cambio.status === 'rejected') assert.equal(cambio.reason.status, 409);
    const datos = await leer(id);
    assert.equal(datos.atenciones.length, 1);
    assert.equal(datos.caso.estado, cambio.status === 'fulfilled' ? 'En validación' : 'En atención');
    assert.deepEqual(datos.historial.map((h) => h.evento), cambio.status === 'fulfilled'
      ? ['Atención registrada', 'Cambio de estado'] : ['Atención registrada']);
  });

  await t.test('API HTTP conserva atención e historial al reiniciar servidor y conexiones', async (st) => {
    let server;
    async function iniciar() {
      server = crearApp(crearContenedor(db)).listen(0, '127.0.0.1');
      await once(server, 'listening');
      return `http://127.0.0.1:${server.address().port}`;
    }
    async function cerrar() {
      if (!server) return;
      await new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections?.();
      });
      server = null;
    }
    st.after(cerrar);
    const id = await crearCaso();
    let url = await iniciar();
    for (const [casoId, datos, esperado] of [
      [id, { ...entrada, solucion: 'corto' }, 400], [id, { ...entrada, usuario_id: 4 }, 403],
      [2147483647, entrada, 404],
    ]) {
      const respuesta = await fetch(`${url}/api/casos/${casoId}/atencion`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos),
      });
      assert.equal(respuesta.status, esperado);
      await respuesta.json();
    }
    const respuesta = await fetch(`${url}/api/casos/${id}/atencion`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entrada),
    });
    assert.equal(respuesta.status, 201);
    const atencion = await respuesta.json();
    const antes = await leer(id);
    assert.equal(atencion.id, antes.atenciones[0].id);
    await cerrar();
    await db.end();
    db = mysql.createPool({ ...config, database: nombre, connectionLimit: 4 });
    url = await iniciar();
    assert.deepEqual(await leer(id), antes);
    assert.equal((await fetch(`${url}/atender.html?id=${id}`)).status, 200);
    const cambio = await fetch(`${url}/api/casos/${id}/estado`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'En validación', usuario_id: 3 }),
    });
    assert.equal(cambio.status, 200);
    await cambio.json();
  });
});
