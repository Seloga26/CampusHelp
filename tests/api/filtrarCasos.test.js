// Pruebas HTTP de los filtros de GET /api/casos (HU-09): rutas + servicio + middleware.
const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { crearApp } = require('../../src/app');
const { crearServicios } = require('../../src/config/contenedor');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');

test('HU-09: contrato HTTP de los filtros de casos', async (t) => {
  const base = { descripcion: 'Descripción de prueba', agente_id: null, usuario_id: 1 };
  const memoria = crearReposEnMemoria({ casos: [
    { ...base, id: 1, tipo: 'Incidente', titulo: 'Wi-Fi caído', prioridad: 'P1', estado: 'Pendiente', categoria_id: 8, fecha_creacion: '2026-10-05 08:00:00' },
    { ...base, id: 2, tipo: 'Incidente', titulo: 'Wi-Fi lento', prioridad: 'P2', estado: 'Cerrada', categoria_id: 8, fecha_creacion: '2026-10-05 09:00:00' },
    { ...base, id: 3, tipo: 'Solicitud de servicio', titulo: 'Instalar programa', prioridad: 'P3', estado: 'Pendiente', categoria_id: 5, fecha_creacion: '2026-10-05 10:00:00' },
  ] });
  const servidor = crearApp({
    servicios: crearServicios(memoria), verificarBaseDeDatos: async () => {},
  }).listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  t.after(() => new Promise((resolve) => {
    servidor.close(resolve);
    servidor.closeAllConnections?.();
  }));
  const url = `http://127.0.0.1:${servidor.address().port}`;
  const pedir = async (consulta) => {
    const r = await fetch(`${url}/api/casos?${consulta}`);
    return { status: r.status, body: await r.json() };
  };

  let r = await pedir('tipo=Incidente&area_id=3&prioridad=P1');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.map((c) => c.id), [1]);

  r = await pedir('estado=Cerrada&categoria_id=8');
  assert.deepEqual(r.body.map((c) => c.id), [2]);

  r = await pedir('prioridad=P3&area_id=3');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, []);

  for (const consulta of ['prioridad=P9', 'estado=Abierto', 'area_id=abc', 'prioridad=P1&prioridad=P2']) {
    r = await pedir(consulta);
    assert.equal(r.status, 400, consulta);
    assert.equal(typeof r.body.error, 'string');
  }
  assert.match((await pedir('prioridad=P9')).body.error, /P1, P2, P3/);
});