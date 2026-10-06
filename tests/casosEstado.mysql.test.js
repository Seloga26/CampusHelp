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

// Opt-in: necesita MySQL 8 y permisos para crear una BD temporal. Nunca usa
// db:init ni borra los datos de campushelp. Solo elimina su propia BD de prueba.
test('HU-05: persistencia, rollback y concurrencia en MySQL real', {
  skip: process.env.CAMPUSHELP_TEST_MYSQL !== '1',
}, async (t) => {
  const nombre = `campushelp_hu05_test_${randomBytes(8).toString('hex')}`;
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
  // El nombre se genera internamente y solo contiene letras, números y '_'.
  await admin.query(`CREATE DATABASE \`${nombre}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  creada = true;
  for (const archivo of ['schema.sql', 'seed.sql']) {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'database', archivo), 'utf8')
      .replace(/\bcampushelp\b/g, nombre);
    await admin.query(sql);
  }
  db = mysql.createPool({ ...config, database: nombre, connectionLimit: 4 });

  async function crearCaso(estado = 'Pendiente', fecha = null, tipo = 'Incidente') {
    const [resultado] = await db.execute(
      `INSERT INTO caso (tipo, titulo, descripcion, prioridad, estado, usuario_id,
        categoria_id, fecha_inicio_atencion)
       VALUES (?, 'Prueba HU-05', 'Sin conexión a la red institucional', 'P1', ?, 1, 8, ?)`,
      [tipo, estado, fecha],
    );
    return resultado.insertId;
  }
  async function leerCaso(id) {
    const [[caso]] = await db.execute('SELECT * FROM caso WHERE id = ?', [id]);
    return caso;
  }
  async function leerHistorial(id) {
    const [eventos] = await db.execute('SELECT * FROM historial WHERE caso_id = ? ORDER BY id', [id]);
    return eventos;
  }
  const avanzar = (id, estado, usuario_id = 3) =>
    crearContenedor(db).servicios.cambiarEstado({ id, estado, usuario_id });

  await t.test('CP-04: persiste cambio e historial con fecha y autor', async () => {
    const id = await crearCaso();
    await avanzar(id, 'En análisis');
    assert.equal((await leerCaso(id)).estado, 'En análisis');
    const eventos = await leerHistorial(id);
    assert.equal(eventos.length, 1);
    assert.equal(eventos[0].evento, 'Cambio de estado');
    assert.equal(eventos[0].estado_anterior, 'Pendiente');
    assert.equal(eventos[0].estado_nuevo, 'En análisis');
    assert.equal(eventos[0].usuario_id, 3);
    assert.ok(eventos[0].fecha);
  });

  await t.test('CP-05, CP-14 y CP-15: rechazos sin escrituras', async () => {
    for (const [inicial, destino, usuario, status] of [
      ['Pendiente', 'Cerrada', 3, 409],
      ['Pendiente', 'En atención', 3, 409],
      ['Cerrada', 'En análisis', 3, 409],
      ['Pendiente', 'En análisis', 1, 403],
      ['En validación', 'Cerrada', 3, 409],
      ['En validación', 'En atención', 3, 409],
    ]) {
      const id = await crearCaso(inicial, null, inicial === 'Cerrada' ? 'Incidente' : 'Solicitud de servicio');
      await assert.rejects(avanzar(id, destino, usuario), { status });
      assert.equal((await leerCaso(id)).estado, inicial);
      assert.deepEqual(await leerHistorial(id), []);
    }
  });

  await t.test('guarda fecha de primera atención y no la sobrescribe', async () => {
    const id = await crearCaso('En análisis');
    await avanzar(id, 'En atención');
    const fecha = (await leerCaso(id)).fecha_inicio_atencion;
    assert.ok(fecha);
    await avanzar(id, 'En validación');
    assert.equal((await leerCaso(id)).fecha_inicio_atencion, fecha);
    const anterior = '2026-10-04 09:00:00';
    const otro = await crearCaso('En análisis', anterior);
    await avanzar(otro, 'En atención');
    assert.equal((await leerCaso(otro)).fecha_inicio_atencion, anterior);
  });

  await t.test('dos peticiones simultáneas solo generan un cambio', async () => {
    const id = await crearCaso();
    const resultados = await Promise.allSettled([
      avanzar(id, 'En análisis', 3), avanzar(id, 'En análisis', 4),
    ]);
    assert.equal(resultados.filter((r) => r.status === 'fulfilled').length, 1);
    assert.equal(resultados.find((r) => r.status === 'rejected').reason.status, 409);
    assert.equal((await leerHistorial(id)).length, 1);
  });

  await t.test('un fallo real al insertar historial revierte estado y fecha', async () => {
    const id = await crearCaso('En análisis');
    await db.query(`CREATE TRIGGER hu05_fallar_historial BEFORE INSERT ON historial
      FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Fallo deliberado HU-05'`);
    try {
      await assert.rejects(avanzar(id, 'En atención'), /Fallo deliberado HU-05/);
      const caso = await leerCaso(id);
      assert.equal(caso.estado, 'En análisis');
      assert.equal(caso.fecha_inicio_atencion, null);
      assert.deepEqual(await leerHistorial(id), []);
    } finally {
      await db.query('DROP TRIGGER hu05_fallar_historial');
    }
  });

  await t.test('API HTTP real conserva el cambio al reiniciar servidor y conexiones', async (st) => {
    // Inyecta la BD temporal en el contenedor real de la aplicación.
    let server;
    async function iniciarServidor() {
      server = crearApp(crearContenedor(db)).listen(0, '127.0.0.1');
      await once(server, 'listening');
      return `http://127.0.0.1:${server.address().port}`;
    }
    async function cerrarServidor() {
      if (!server) return;
      await new Promise((resolve, reject) => {
        server.close((err) => err ? reject(err) : resolve());
        server.closeAllConnections?.();
      });
      server = null;
    }
    st.after(cerrarServidor);

    async function peticion(base, id, estado, usuario_id = 3) {
      const respuesta = await fetch(`${base}/api/casos/${id}/estado`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado, usuario_id }),
      });
      return { status: respuesta.status, body: await respuesta.json() };
    }

    const id = await crearCaso('Pendiente', null, 'Solicitud de servicio');
    let base = await iniciarServidor();
    const salud = await fetch(`${base}/api/health`).then((r) => r.json());
    assert.deepEqual(salud, { app: 'ok', db: 'ok' });
    const agentes = await fetch(`${base}/api/usuarios?rol=Agente`).then((r) => r.json());
    assert.ok(agentes.some((u) => u.id === 3 && u.rol === 'Agente'));
    assert.equal((await fetch(`${base}/cambiar-estado.html`)).status, 200);
    assert.equal((await peticion(base, id, 'Cerrada')).status, 409);
    assert.equal((await peticion(base, id, 'En atención')).status, 409);
    assert.equal((await peticion(base, id, 'En análisis', 1)).status, 403);
    assert.equal((await leerCaso(id)).estado, 'Pendiente');
    assert.deepEqual(await leerHistorial(id), []);
    const cerrado = await crearCaso('Cerrada');
    assert.equal((await peticion(base, cerrado, 'En análisis')).status, 409);
    assert.deepEqual(await leerHistorial(cerrado), []);
    assert.equal((await peticion(base, 2147483647, 'En análisis')).status, 404);
    assert.equal((await peticion(base, id, 'Abierto')).status, 400);
    const primera = await peticion(base, id, 'En análisis');
    assert.equal(primera.status, 200);
    assert.equal(primera.body.estado, 'En análisis');

    await cerrarServidor();
    await db.end();
    db = mysql.createPool({ ...config, database: nombre, connectionLimit: 4 });
    base = await iniciarServidor();
    assert.equal((await leerCaso(id)).estado, 'En análisis');
    assert.equal((await leerHistorial(id)).length, 1);

    const segunda = await peticion(base, id, 'En atención');
    assert.equal(segunda.status, 200);
    assert.ok(segunda.body.fecha_inicio_atencion);
    assert.equal((await leerHistorial(id)).length, 2);
    assert.equal((await peticion(base, id, 'En validación', 1)).status, 403);
    assert.equal((await leerCaso(id)).estado, 'En atención');
    assert.equal((await leerHistorial(id)).length, 2);
  });
});
