const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { once } = require('node:events');
const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();
const { crearApp } = require('../../src/app');
const { crearContenedor } = require('../../src/config/contenedor');
const { abrirNavegador } = require('../helpers/navegador');

test('HU-06: formulario, permisos y recuperación en navegador con MySQL real', {
  skip: process.env.CAMPUSHELP_TEST_BROWSER !== '1',
}, async (t) => {
  const nombre = `campushelp_hu06_browser_test_${randomBytes(8).toString('hex')}`;
  const config = { host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', dateStrings: true };
  const admin = await mysql.createConnection({ ...config, multipleStatements: true });
  let db;
  let servidor;
  let creada = false;
  t.after(async () => {
    if (servidor) await new Promise((ok) => { servidor.close(ok); servidor.closeAllConnections?.(); });
    if (db) await db.end();
    try { if (creada) await admin.query(`DROP DATABASE \`${nombre}\``); }
    finally { await admin.end(); }
  });
  await admin.query(`CREATE DATABASE \`${nombre}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  creada = true;
  for (const archivo of ['schema.sql', 'seed.sql']) {
    await admin.query(fs.readFileSync(path.join(__dirname, '../../database', archivo), 'utf8')
      .replace(/\bcampushelp\b/g, nombre));
  }
  db = mysql.createPool({ ...config, database: nombre });
  const [[version]] = await db.query('SELECT VERSION() AS version');
  t.diagnostic(`MySQL ${version.version}; base temporal ${nombre}`);
  // Solo prepara casos asignados en su propia BD: la asignación de HU-04 sigue pendiente.
  async function crearCaso(estado, tipo = 'Incidente', categoria = 8) {
    const [r] = await db.execute(`INSERT INTO caso
      (tipo, titulo, descripcion, prioridad, estado, usuario_id, categoria_id, agente_id)
      VALUES (?, 'Prueba navegador HU-06', 'Falla de conexión en el bloque B', 'P1', ?, 1, ?, 3)`, [tipo, estado, categoria]);
    return r.insertId;
  }
  const id = await crearCaso('En atención');
  const enAnalisis = await crearCaso('En análisis', 'Solicitud de servicio', 11);
  async function leer(casoId = id) {
    const [[caso]] = await db.execute('SELECT * FROM caso WHERE id = ?', [casoId]);
    const [atenciones] = await db.execute('SELECT * FROM atencion WHERE caso_id = ? ORDER BY id', [casoId]);
    const [historial] = await db.execute('SELECT * FROM historial WHERE caso_id = ? ORDER BY id', [casoId]);
    return { caso, atenciones, historial };
  }
  let envios = 0;
  const app = express();
  app.use(async (req, res, next) => {
    if (req.method === 'POST' && req.path.endsWith('/atencion')) {
      envios++;
      // Permite comprobar que el formulario queda bloqueado mientras guarda.
      await new Promise((ok) => setTimeout(ok, 150));
    }
    next();
  });
  app.use(crearApp(crearContenedor(db)));
  servidor = app.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const navegador = await abrirNavegador(t);
  const { evaluar, esperar } = navegador;
  const rellenar = (diagnostico, solucion) => evaluar(`
    document.getElementById('diagnostico').value = ${JSON.stringify(diagnostico)};
    document.getElementById('solucion').value = ${JSON.stringify(solucion)};`);
  const enviar = () => evaluar("document.getElementById('form-atencion').requestSubmit()");
  const esperarError = (texto) => esperar(`document.getElementById('mensaje').className === 'error'
    && document.getElementById('mensaje').textContent.includes(${JSON.stringify(texto)})`);
  const esperarExito = () => esperar("document.getElementById('mensaje').className === 'ok'");
  await navegador.navegar(`${base}/atender.html?id=${id}`);
  await esperar("document.getElementById('guardar-atencion').disabled === false");

  await t.test('ID desde la bandeja y mínimo de textos después de quitar espacios', async () => {
    assert.equal(await evaluar("document.getElementById('caso-id').value"), String(id));
    for (const [diagnostico, solucion] of [['          ', 'Solución válida para la red'],
      ['Diagnóstico válido de la red', '  corto   ']]) {
      await rellenar(diagnostico, solucion);
      await enviar();
      await esperarError('al menos 10 caracteres');
      assert.equal(await evaluar("document.getElementById('diagnostico').value"), diagnostico);
      assert.equal(await evaluar("document.getElementById('solucion').value"), solucion);
    }
    assert.equal(envios, 0);
    assert.equal((await leer()).atenciones.length, 0);
    assert.equal((await leer()).historial.length, 0);
  });

  const diagnostico = '  El punto de acceso estaba desconectado  ';
  const solucion = '  Se reconectó y verificó la conexión  ';
  await t.test('CP-20: otro agente ve 403 y conserva los textos para reintentar', async () => {
    await evaluar("{ const s = document.getElementById('actuar-como'); s.value = '4'; s.dispatchEvent(new Event('change')); }");
    await rellenar(diagnostico, solucion);
    await enviar();
    await esperarError('Solo el agente asignado');
    assert.equal(await evaluar("document.getElementById('diagnostico').value"), diagnostico);
    assert.equal(await evaluar("document.getElementById('solucion').value"), solucion);
    const datos = await leer();
    assert.equal(datos.caso.estado, 'En atención');
    assert.deepEqual(datos.atenciones, []);
    assert.deepEqual(datos.historial, []);
    assert.equal(await evaluar("document.getElementById('guardar-atencion').disabled"), false);
  });

  let primera;
  await t.test('CP-07: agente correcto, doble clic y un único registro persistido', async () => {
    await evaluar("{ const s = document.getElementById('actuar-como'); s.value = '3'; s.dispatchEvent(new Event('change')); }");
    const antes = envios;
    await evaluar("document.getElementById('guardar-atencion').click(); document.getElementById('form-atencion').requestSubmit();");
    assert.equal(await evaluar("Array.from(document.querySelectorAll('select, input, textarea, button')).every(e => e.disabled)"), true);
    await esperarExito();
    assert.equal(envios - antes, 1);
    const datos = await leer();
    assert.equal(datos.caso.estado, 'En atención');
    assert.equal(datos.atenciones.length, 1);
    primera = datos.atenciones[0];
    assert.equal(primera.diagnostico, diagnostico.trim());
    assert.equal(primera.solucion, solucion.trim());
    assert.equal(primera.agente_id, 3);
    assert.ok(primera.fecha);
    assert.equal(datos.historial.length, 1);
    assert.equal(datos.historial[0].evento, 'Atención registrada');
    assert.equal(datos.historial[0].usuario_id, 3);
    assert.ok(datos.historial[0].fecha);
    assert.equal(datos.historial[0].estado_anterior, null);
    assert.equal(datos.historial[0].estado_nuevo, null);
    assert.equal(await evaluar("document.getElementById('diagnostico').value"), '');
    assert.equal(await evaluar("document.getElementById('solucion').value"), '');
  });

  await t.test('fallo real del historial: rollback, textos conservados y reintento', async () => {
    const antes = await leer();
    await db.query(`CREATE TRIGGER hu06_browser_fallar BEFORE INSERT ON historial
      FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Fallo deliberado HU-06 navegador'`);
    await rellenar('Nueva revisión del equipo de red', 'Se reemplazó y verificó el equipo');
    try {
      // El error del servidor es deliberado; el cliente debe recibir el mensaje público.
      t.mock.method(console, 'error', () => {});
      await enviar();
      await esperarError('Error interno del servidor');
      assert.deepEqual(await leer(), antes);
      assert.equal(await evaluar("document.getElementById('diagnostico').value"), 'Nueva revisión del equipo de red');
      assert.equal(await evaluar("document.getElementById('solucion').value"), 'Se reemplazó y verificó el equipo');
    } finally { await db.query('DROP TRIGGER hu06_browser_fallar'); }
    await enviar();
    await esperarExito();
    const despues = await leer();
    assert.equal(despues.atenciones.length, 2);
    assert.deepEqual(despues.atenciones[0], primera);
    assert.equal(despues.historial.length, 2);
    assert.equal(despues.caso.estado, 'En atención');
  });

  await t.test('CP-21: estado incorrecto muestra error y no guarda atención', async () => {
    await evaluar(`document.getElementById('caso-id').value = '${enAnalisis}'`);
    await rellenar('Diagnóstico de prueba válido', 'Solución de prueba válida');
    await enviar();
    await esperarError('El caso debe estar En atención');
    const datos = await leer(enAnalisis);
    assert.equal(datos.caso.estado, 'En análisis');
    assert.deepEqual(datos.atenciones, []);
    assert.deepEqual(datos.historial, []);
    // La misma solicitud se puede atender después de corregir su estado.
    const cambio = await fetch(`${base}/api/casos/${enAnalisis}/estado`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'En atención', usuario_id: 3 }),
    });
    assert.equal(cambio.status, 200);
    await cambio.json();
    await enviar();
    await esperarExito();
    const despues = await leer(enAnalisis);
    assert.equal(despues.caso.tipo, 'Solicitud de servicio');
    assert.equal(despues.caso.estado, 'En atención');
    assert.equal(despues.atenciones.length, 1);
    assert.deepEqual(despues.historial.map(h => h.evento), ['Cambio de estado', 'Atención registrada']);
  });

  await t.test('bandeja permite enviar a validación y el formulario rechaza otra atención', async () => {
    await evaluar("document.querySelector('a[href=\"bandeja.html\"]').click()");
    await esperar(`document.querySelector('[data-caso-id="${id}"] button')?.textContent === 'Pasar a En validación'`);
    await evaluar(`document.querySelector('[data-caso-id="${id}"] button').click()`);
    await esperar(`document.querySelector('[data-caso-id="${id}"] .estado-caso')?.textContent === 'En validación'`);
    await esperarExito();
    const antes = await leer();
    assert.equal(antes.caso.estado, 'En validación');
    assert.deepEqual(antes.historial.map(h => h.evento), ['Atención registrada', 'Atención registrada', 'Cambio de estado']);
    await navegador.navegar(`${base}/atender.html?id=${id}`);
    await esperar("document.getElementById('guardar-atencion').disabled === false");
    await rellenar('Otro diagnóstico de prueba', 'Otra solución de prueba');
    await enviar();
    await esperarError('El caso debe estar En atención');
    assert.deepEqual(await leer(), antes);
  });

  await t.test('sin agentes e ID inválido, el formulario queda deshabilitado', async () => {
    await db.execute("UPDATE usuario SET activo = 0 WHERE rol = 'Agente'");
    await navegador.navegar(`${base}/atender.html?id=abc`);
    await esperar("document.getElementById('mensaje').textContent === 'No hay agentes activos disponibles.'");
    assert.equal(await evaluar("document.getElementById('caso-id').value"), '');
    assert.equal(await evaluar("Array.from(document.querySelectorAll('select, input, textarea, button')).every(e => e.disabled)"), true);
  });
});
