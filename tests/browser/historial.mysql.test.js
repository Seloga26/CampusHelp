// HU-08 Consultar el historial — página historial.html en navegador con MySQL real.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { once } = require('node:events');
const mysql = require('mysql2/promise');
require('dotenv').config();
const { crearApp } = require('../../src/app');
const { crearContenedor } = require('../../src/config/contenedor');
const { abrirNavegador } = require('../helpers/navegador');

test('HU-08: historial en navegador con MySQL real', {
  skip: process.env.CAMPUSHELP_TEST_BROWSER !== '1',
}, async (t) => {
  const nombre = `campushelp_historial_test_${randomBytes(8).toString('hex')}`;
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
  const contenedor = crearContenedor(db);
  servidor = crearApp(contenedor).listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const navegador = await abrirNavegador(t);
  const { evaluar, esperar } = navegador;
  const actuarComo = (id) => evaluar(`{ const s = document.getElementById('actuar-como');
    s.value = '${id}'; s.dispatchEvent(new Event('change')); }`);
  const eventosEnPantalla = () => evaluar(`Array.from(document.querySelectorAll('#linea-tiempo li'),
    (li) => [li.querySelector('.evento').textContent, li.querySelector('.cambio-estado').textContent,
      li.querySelector('.autor').textContent])`);

  // Escenario 1 del Taller: caso de Ana registrado, asignado a Carla y en análisis.
  const s = contenedor.servicios;
  const { id } = await s.registrarCaso({
    tipo: 'Incidente', titulo: 'Sin red en sala de cómputo', descripcion: 'No hay red cableada en la sala 4',
    prioridad: 'P1', categoria_id: 10, usuario_id: 1,
  });
  await s.asignarCaso({ id, usuario_id: 3 });
  await s.cambiarEstado({ id, estado: 'En análisis', usuario_id: 3 });

  await t.test('CP-26: desde la bandeja, Diego abre el historial y ve los 3 eventos en orden', async () => {
    await navegador.navegar(`${base}/bandeja.html`);
    await esperar(`document.querySelector('[data-caso-id="${id}"] a.ver-historial')`);
    await actuarComo(4);
    await esperar(`document.querySelector('[data-caso-id="${id}"] a.ver-historial')`);
    assert.equal(await evaluar(`document.querySelector('[data-caso-id="${id}"] a.ver-historial').getAttribute('href')`),
      `historial.html?id=${id}`);
    await evaluar(`document.querySelector('[data-caso-id="${id}"] a.ver-historial').click()`);
    await esperar("document.querySelectorAll('#linea-tiempo li').length === 3");
    assert.equal(await evaluar("document.getElementById('caso-id').value"), String(id));
    assert.equal(await evaluar("document.getElementById('actuar-como').value"), '4');
    assert.equal(await evaluar("document.getElementById('titulo-historial').textContent"), `Historial del caso #${id}`);
    assert.deepEqual(await eventosEnPantalla(), [
      ['Caso registrado', 'Estado: Pendiente', 'Ana Solicitante (Solicitante)'],
      ['Caso asignado', '', 'Carla Agente (Agente)'],
      ['Cambio de estado', 'Pendiente → En análisis', 'Carla Agente (Agente)'],
    ]);
    assert.match(await evaluar("document.querySelector('#linea-tiempo time').textContent"),
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  await t.test('CP-27: Bruno ve el mensaje 403 y no se muestran eventos', async () => {
    await actuarComo(2);
    await esperar("document.getElementById('mensaje').className === 'error'");
    assert.match(await evaluar("document.getElementById('mensaje').textContent"), /tus propios casos/);
    assert.equal(await evaluar("document.getElementById('resultado').hidden"), true);
    assert.equal(await evaluar("document.querySelectorAll('#linea-tiempo li').length"), 0);
  });

  await t.test('CP-28: un caso inexistente muestra un mensaje claro', async () => {
    await actuarComo(5);
    await evaluar(`document.getElementById('caso-id').value = '2147483647';
      document.getElementById('consultar').click();`);
    await esperar("document.getElementById('mensaje').textContent.includes('No existe un caso')");
    assert.equal(await evaluar("document.getElementById('resultado').hidden"), true);
    assert.equal(await evaluar('location.search'), '?id=2147483647');
  });

  await t.test('Ana llega desde "Mis casos" al historial de su caso', async () => {
    await navegador.navegar(`${base}/mis-casos.html`);
    await actuarComo(1);
    await esperar(`document.querySelector('a[href="historial.html?id=${id}"]')`);
    await evaluar(`document.querySelector('a[href="historial.html?id=${id}"]').click()`);
    await esperar("document.querySelectorAll('#linea-tiempo li').length === 3");
    assert.equal(await evaluar("document.getElementById('actuar-como').value"), '1');
    assert.equal(await evaluar("document.getElementById('mensaje').textContent"), '');
  });

  await t.test('al recargar con un evento nuevo se ve el más reciente al final', async () => {
    await s.cambiarEstado({ id, estado: 'En atención', usuario_id: 3 });
    await navegador.navegar(`${base}/historial.html?id=${id}`);
    await esperar("document.querySelectorAll('#linea-tiempo li').length === 4");
    assert.deepEqual((await eventosEnPantalla()).at(-1),
      ['Cambio de estado', 'En análisis → En atención', 'Carla Agente (Agente)']);
  });
});
