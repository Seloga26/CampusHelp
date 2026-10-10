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

test('HU-05: bandeja en navegador con MySQL real', {
  skip: process.env.CAMPUSHELP_TEST_BROWSER !== '1',
}, async (t) => {
  const nombre = `campushelp_bandeja_test_${randomBytes(8).toString('hex')}`;
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
  let fallarRecarga = false;
  let cambios = 0;
  const app = express();
  app.use(async (req, res, next) => {
    if (req.method === 'PATCH' && req.path.endsWith('/estado')) {
      cambios++;
      // Mantiene la petición abierta para comprobar la protección del doble clic.
      await new Promise((ok) => setTimeout(ok, 100));
    }
    if (req.method === 'GET' && req.path === '/api/casos' && fallarRecarga) {
      fallarRecarga = false;
      return res.status(503).json({ error: 'No se pudo cargar la bandeja de prueba' });
    }
    next();
  });
  app.use(crearApp(crearContenedor(db)));
  servidor = app.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const navegador = await abrirNavegador(t);
  const { evaluar, esperar } = navegador;
  const fila = (id) => `document.querySelector('[data-caso-id="${id}"]')`;
  const estado = (id, esperado) => `${fila(id)}?.querySelector('.estado-caso').textContent === ${JSON.stringify(esperado)}`;
  const eventos = async (id) => (await db.execute('SELECT * FROM historial WHERE caso_id = ? ORDER BY id', [id]))[0];

  await navegador.navegar(`${base}/bandeja.html`);
  await esperar("document.querySelectorAll('#cuerpo-casos tr').length === 3");
  await t.test('HU-03: conserva campos, prioridades, orden y exclusión de cerrados', async () => {
    assert.deepEqual(await evaluar("Array.from(document.querySelectorAll('#cuerpo-casos tr'), f => Number(f.dataset.casoId))"), [1, 3, 2]);
    assert.equal(await evaluar("document.querySelectorAll('#actuar-como option').length"), 2);
    assert.equal(await evaluar("document.querySelector('#cuerpo-casos tr').cells.length"), 11);
    assert.equal(await evaluar("document.querySelector('.prioridad-P1').textContent"), 'P1');
    assert.equal(await evaluar("document.querySelector('#cuerpo-casos tr').cells[8].textContent"), 'Sin asignar');
  });

  const registrado = await fetch(`${base}/api/casos`, { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      tipo: 'Incidente', titulo: '<img src=x onerror=window.inyectado=true>',
      descripcion: 'Fallo de conexión en la prueba de integración', prioridad: 'P3', categoria_id: 8, usuario_id: 1,
    }) }).then((r) => r.json());
  const id = registrado.id;
  assert.ok(id);
  // HU-04 aún no implementa la asignación: prepara únicamente el caso de esta BD temporal.
  await db.execute('UPDATE caso SET agente_id = 3 WHERE id = ?', [id]);
  await navegador.navegar(`${base}/bandeja.html`);
  await esperar(estado(id, 'Pendiente'));

  await t.test('CP-04: botón integrado, doble clic e historial único', async () => {
    assert.equal(await evaluar(`${fila(id)}.cells[1].textContent`), '<img src=x onerror=window.inyectado=true>');
    assert.equal(await evaluar('Boolean(window.inyectado)'), false);
    await evaluar(`{ const b = ${fila(id)}.querySelector('button'); b.click(); b.click(); }`);
    await esperar(estado(id, 'En análisis'));
    await esperar("document.getElementById('mensaje').className === 'ok'");
    assert.equal(cambios, 1);
    const historial = (await eventos(id)).filter((e) => e.evento === 'Cambio de estado');
    assert.equal(historial.length, 1);
    assert.equal(historial[0].usuario_id, 3);
    assert.equal(historial[0].estado_anterior, 'Pendiente');
    assert.equal(historial[0].estado_nuevo, 'En análisis');
  });

  await t.test('cambiar agente usa el usuario nuevo y recarga sin perder orden', async () => {
    await evaluar("{ const s = document.getElementById('actuar-como'); s.value = '4'; s.dispatchEvent(new Event('change')); }");
    await esperar(estado(id, 'En análisis'));
    await evaluar(`${fila(id)}.querySelector('button').click()`);
    await esperar(estado(id, 'En atención'));
    await esperar("document.getElementById('mensaje').className === 'ok'");
    assert.equal((await eventos(id)).at(-1).usuario_id, 4);
    const [[caso]] = await db.execute('SELECT fecha_inicio_atencion FROM caso WHERE id = ?', [id]);
    assert.ok(caso.fecha_inicio_atencion);
    assert.deepEqual(await evaluar("Array.from(document.querySelectorAll('#cuerpo-casos tr'), f => Number(f.dataset.casoId))"), [1, 3, 2, id]);
  });

  await t.test('HU-06: error visible sin solución, enlace al agente asignado y envío a validación', async () => {
    await evaluar(`${fila(id)}.querySelector('button').click()`);
    await esperar(`${fila(id)}?.querySelector('.error')?.textContent.includes('diagnóstico y solución')`);
    assert.ok(await evaluar(estado(id, 'En atención')));
    assert.equal((await eventos(id)).filter((e) => e.evento === 'Cambio de estado').length, 2);
    assert.equal(await evaluar(`${fila(id)}.querySelector('a') === null`), true);
    await evaluar("{ const s = document.getElementById('actuar-como'); s.value = '3'; s.dispatchEvent(new Event('change')); }");
    await esperar(`${fila(id)}?.querySelector('a')?.getAttribute('href') === 'atender.html?id=${id}'`);
    await evaluar(`${fila(id)}.querySelector('a').click()`);
    await esperar("document.getElementById('guardar-atencion')?.disabled === false");
    assert.equal(await evaluar("document.getElementById('caso-id').value"), String(id));
    await evaluar(`document.getElementById('diagnostico').value = 'Punto de acceso desconectado';
      document.getElementById('solucion').value = 'Se conectó y verificó la red';
      document.getElementById('guardar-atencion').click();`);
    await esperar("document.getElementById('mensaje').className === 'ok'");
    await evaluar("document.querySelector('a[href=\"bandeja.html\"]').click()");
    await esperar(estado(id, 'En atención'));
    await evaluar(`${fila(id)}.querySelector('button').click()`);
    await esperar(estado(id, 'En validación'));
    await esperar("document.getElementById('mensaje').className === 'ok'");
    assert.equal(await evaluar(`${fila(id)}.querySelector('button').hidden`), true);
    assert.match(await evaluar(`${fila(id)}.querySelector('.control-estado p').textContent`), /validador/);
    const historial = (await eventos(id)).filter((e) => e.evento === 'Cambio de estado');
    assert.equal(historial.length, 3);
    assert.equal(historial.at(-1).usuario_id, 3);
  });

  await t.test('un fallo de recarga conserva el estado guardado y permite continuar', async () => {
    fallarRecarga = true;
    await evaluar(`${fila(1)}.querySelector('button').click()`);
    await esperar(`${fila(1)}?.querySelector('.control-estado p')?.textContent.includes('No se pudo refrescar')`);
    assert.ok(await evaluar(estado(1, 'En análisis')));
    assert.equal(await evaluar(`${fila(1)}.querySelector('button').textContent`), 'Pasar a En atención');
    assert.equal((await eventos(1)).length, 1);
    await evaluar(`${fila(1)}.querySelector('button').click()`);
    await esperar(estado(1, 'En atención'));
    await esperar("document.getElementById('mensaje').className === 'ok'");
    assert.equal((await eventos(1)).length, 2);
  });

  await t.test('recargar conserva agente, estado, historial y restricciones de HU-05', async () => {
    await navegador.navegar(`${base}/bandeja.html`);
    await esperar(estado(id, 'En validación'));
    assert.equal(await evaluar("document.getElementById('actuar-como').value"), '3');
    assert.equal(await evaluar(`${fila(4)} === null`), true);
    for (const [casoId, destino, usuario, status] of [[3, 'Cerrada', 3, 409],
      [3, 'En atención', 3, 409], [4, 'En análisis', 3, 409], [3, 'En análisis', 1, 403]]) {
      const respuesta = await fetch(`${base}/api/casos/${casoId}/estado`, { method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: destino, usuario_id: usuario }) });
      assert.equal(respuesta.status, status);
      assert.equal((await eventos(casoId)).length, 0);
    }
  });

  await t.test('la última recarga vacía limpia filas y sin agentes no permite operar', async () => {
    // Todos los cambios de este escenario se hacen en la base temporal.
    await db.execute("UPDATE caso SET estado = 'Cerrada'");
    await evaluar('cargarBandeja({ conservarTabla: true })');
    assert.equal(await evaluar("document.getElementById('tabla-casos').hidden"), true);
    assert.equal(await evaluar("document.querySelectorAll('#cuerpo-casos tr').length"), 0);
    assert.equal(await evaluar("document.getElementById('vacio').hidden"), false);
    await db.execute("UPDATE usuario SET activo = 0 WHERE rol = 'Agente'");
    await navegador.navegar(`${base}/bandeja.html`);
    await esperar("document.getElementById('mensaje').textContent === 'No hay agentes activos disponibles.'");
    assert.equal(await evaluar("document.querySelectorAll('#actuar-como option').length"), 0);
    assert.equal(await evaluar("document.querySelectorAll('.control-estado button').length"), 0);
  });
});
