// HU-06: cierra la validación pendiente con la asignación real de HU-04.
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

test('HU-06: registro → asignación real → atención → validación en navegador y MySQL', {
  skip: process.env.CAMPUSHELP_TEST_BROWSER !== '1',
}, async (t) => {
  const nombre = `campushelp_hu06_flujo_test_${randomBytes(8).toString('hex')}`;
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
  servidor = crearApp(crearContenedor(db)).listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const navegador = await abrirNavegador(t);
  const { evaluar, esperar } = navegador;
  async function leer(id) {
    const [[caso]] = await db.execute('SELECT * FROM caso WHERE id = ?', [id]);
    const [atenciones] = await db.execute('SELECT * FROM atencion WHERE caso_id = ? ORDER BY id', [id]);
    const [historial] = await db.execute('SELECT * FROM historial WHERE caso_id = ? ORDER BY id', [id]);
    return { caso, atenciones, historial };
  }
  const seleccionarAgente = (id) => evaluar(`{
    const selector = document.getElementById('actuar-como');
    selector.value = '${id}'; selector.dispatchEvent(new Event('change'));
  }`);
  const rellenarAtencion = () => evaluar(`
    document.getElementById('diagnostico').value = '  Se identificó la causa del problema  ';
    document.getElementById('solucion').value = '  Se corrigió y verificó el servicio  ';
  `);
  const enviarAtencion = () => evaluar("document.getElementById('form-atencion').requestSubmit()");
  const esperarError = (texto) => esperar(`document.getElementById('mensaje').className === 'error'
    && document.getElementById('mensaje').textContent.includes(${JSON.stringify(texto)})`);

  for (const datos of [
    { tipo: 'Incidente', area: 3, categoria: 8 },
    { tipo: 'Solicitud de servicio', area: 4, categoria: 11 },
  ]) {
    await t.test(`${datos.tipo}: recorrido completo y CP-19/CP-07/CP-20/CP-21/CP-22`, async () => {
      const titulo = `Flujo integrado HU-06: ${datos.tipo}`;
      await navegador.navegar(`${base}/registrar.html`);
      await esperar("document.getElementById('categoria').options.length > 0");
      await evaluar(`
        document.getElementById('tipo').value = ${JSON.stringify(datos.tipo)};
        const area = document.getElementById('area');
        area.value = '${datos.area}'; area.dispatchEvent(new Event('change'));
        document.getElementById('categoria').value = '${datos.categoria}';
        document.getElementById('titulo').value = ${JSON.stringify(titulo)};
        document.getElementById('descripcion').value = 'Caso nuevo para comprobar el flujo integrado de atención';
        document.getElementById('prioridad').value = 'P1';
        document.querySelector('#form-registro button').click();
      `);
      await esperar("document.getElementById('mensaje').className === 'ok'");
      const [registrados] = await db.execute('SELECT * FROM caso WHERE titulo = ?', [titulo]);
      assert.equal(registrados.length, 1);
      const id = registrados[0].id;
      assert.equal(registrados[0].estado, 'Pendiente');
      assert.equal(registrados[0].agente_id, null);
      assert.equal(registrados[0].usuario_id, 1);
      const fila = `document.querySelector('[data-caso-id="${id}"]')`;
      const control = `${fila}?.querySelector('.control-estado button')`;
      async function volverBandeja(estado) {
        await navegador.navegar(`${base}/bandeja.html`);
        await esperar(`${fila}?.querySelector('.estado-caso').textContent === ${JSON.stringify(estado)}`);
      }
      async function avanzar(estado) {
        await evaluar(`${control}.click()`);
        await esperar(`${fila}?.querySelector('.estado-caso').textContent === ${JSON.stringify(estado)}
          && document.getElementById('mensaje').className === 'ok'`);
      }

      // Asignación desde el botón real: este caso nunca se prepara asignado por SQL.
      await volverBandeja('Pendiente');
      assert.equal(await evaluar(`${control}.disabled`), true);
      await evaluar(`${fila}.querySelector('.asignarme').click()`);
      await esperar(`${fila}?.cells[8].textContent === 'Carla Agente'
        && document.getElementById('mensaje').className === 'ok'`);
      const asignado = await leer(id);
      assert.equal(asignado.caso.agente_id, 3);
      assert.ok(asignado.caso.fecha_asignacion);
      assert.equal(asignado.caso.estado, 'Pendiente');
      assert.deepEqual(asignado.historial.map(h => h.evento), ['Caso registrado', 'Caso asignado']);

      // CP-19 también se comprueba en la API para cubrir el intento fuera del botón.
      await seleccionarAgente(4);
      await esperar(`${control}?.disabled === true
        && ${fila}.querySelector('.control-estado p').textContent.includes('Asignado a Carla Agente')`);
      const rechazado = await fetch(`${base}/api/casos/${id}/estado`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'En análisis', usuario_id: 4 }),
      });
      assert.equal(rechazado.status, 403);
      assert.match((await rechazado.json()).error, /Solo el agente asignado/);
      assert.deepEqual(await leer(id), asignado);
      await seleccionarAgente(3);
      await esperar(`${control}?.disabled === false`);
      await avanzar('En análisis');

      // CP-21: la atención se rechaza antes de llegar al estado En atención.
      const enAnalisis = await leer(id);
      await navegador.navegar(`${base}/atender.html?id=${id}`);
      await esperar("document.getElementById('guardar-atencion').disabled === false");
      await rellenarAtencion();
      await enviarAtencion();
      await esperarError('El caso debe estar En atención');
      assert.deepEqual(await leer(id), enAnalisis);
      await volverBandeja('En análisis');
      await avanzar('En atención');
      const enAtencion = await leer(id);
      assert.ok(enAtencion.caso.fecha_inicio_atencion);

      // CP-22: las atenciones de otros casos de la base no permiten validar este.
      await evaluar(`${control}.click()`);
      await esperar(`${fila}.querySelector('.control-estado .error')?.textContent.includes('Registra diagnóstico y solución')`);
      assert.deepEqual(await leer(id), enAtencion);

      // Enlace real de la bandeja, con el ID y el agente seleccionado conservados.
      await evaluar(`${fila}.querySelector('a[href^="atender.html"]').click()`);
      await esperar("document.getElementById('guardar-atencion')?.disabled === false");
      assert.equal(await evaluar("document.getElementById('caso-id').value"), String(id));
      assert.equal(await evaluar("document.getElementById('actuar-como').value"), '3');
      await rellenarAtencion();
      await seleccionarAgente(4);
      await enviarAtencion();
      await esperarError('Solo el agente asignado');
      assert.deepEqual(await leer(id), enAtencion);
      assert.equal(await evaluar("document.getElementById('solucion').value"), '  Se corrigió y verificó el servicio  ');
      await seleccionarAgente(3);
      await enviarAtencion();
      await esperar("document.getElementById('mensaje').className === 'ok'");
      const atendido = await leer(id);
      assert.equal(atendido.caso.estado, 'En atención');
      assert.equal(atendido.atenciones.length, 1);
      assert.equal(atendido.atenciones[0].agente_id, 3);
      assert.equal(atendido.atenciones[0].diagnostico, 'Se identificó la causa del problema');
      assert.equal(atendido.atenciones[0].solucion, 'Se corrigió y verificó el servicio');
      assert.ok(atendido.atenciones[0].fecha);

      await evaluar("document.querySelector('a[href=\"bandeja.html\"]').click()");
      await esperar(`${fila}?.querySelector('.estado-caso').textContent === 'En atención'`);
      await avanzar('En validación');
      const validado = await leer(id);
      assert.equal(validado.caso.estado, 'En validación');
      assert.equal(validado.caso.fecha_cierre, null);
      assert.equal(validado.caso.agente_id, 3);
      assert.equal(validado.caso.fecha_asignacion, asignado.caso.fecha_asignacion);
      assert.equal(validado.caso.fecha_inicio_atencion, enAtencion.caso.fecha_inicio_atencion);
      assert.deepEqual(validado.atenciones, atendido.atenciones);
      assert.deepEqual(validado.historial.map(h => h.evento), [
        'Caso registrado', 'Caso asignado', 'Cambio de estado', 'Cambio de estado',
        'Atención registrada', 'Cambio de estado',
      ]);
      assert.deepEqual(validado.historial.map(h => h.usuario_id), [1, 3, 3, 3, 3, 3]);
      assert.deepEqual(validado.historial.map(h => [h.estado_anterior, h.estado_nuevo]), [
        [null, 'Pendiente'], [null, null], ['Pendiente', 'En análisis'],
        ['En análisis', 'En atención'], [null, null], ['En atención', 'En validación'],
      ]);
      assert.ok(validado.historial.every(h => h.fecha));
      assert.equal(await evaluar(`${control}.hidden`), true);
    });
  }
});
