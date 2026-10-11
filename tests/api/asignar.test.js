// HU-04 Asignarme un caso — contrato HTTP de PATCH /api/casos/:id/asignar.
const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { crearApp } = require('../../src/app');
const { crearServicios } = require('../../src/config/contenedor');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');

test('HU-04: contrato HTTP de la asignación y regla de agente asignado', async (t) => {
  const base = crearReposEnMemoria({ casos: [
    { id: 10, estado: 'Pendiente', agente_id: null },
    { id: 11, estado: 'Cerrada', agente_id: null },
  ] });
  const servidor = crearApp({
    servicios: crearServicios(base), verificarBaseDeDatos: async () => {},
  }).listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  t.after(() => new Promise((resolve) => {
    servidor.close(resolve);
    servidor.closeAllConnections?.();
  }));
  const url = `http://127.0.0.1:${servidor.address().port}`;
  async function patch(id, accion, datos) {
    const respuesta = await fetch(`${url}/api/casos/${id}/${accion}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos),
    });
    return { status: respuesta.status, body: await respuesta.json() };
  }

  await t.test('rechazos con el código del contrato y sin escrituras', async () => {
    for (const [id, datos, esperado] of [
      ['abc', { usuario_id: 3 }, 400], [10, {}, 400], [10, { usuario_id: 'x' }, 400],
      [10, { usuario_id: 1 }, 403], [999, { usuario_id: 3 }, 404], [11, { usuario_id: 3 }, 409],
    ]) {
      const respuesta = await patch(id, 'asignar', datos);
      assert.equal(respuesta.status, esperado, `${id} ${JSON.stringify(datos)}`);
      assert.equal(typeof respuesta.body.error, 'string');
    }
    assert.equal(base.datos.casos[0].agente_id, null);
    assert.deepEqual(base.datos.historial, []);
  });

  await t.test('sin agente el caso no avanza; tras asignarse responde 200 con el agente', async () => {
    assert.equal((await patch(10, 'estado', { estado: 'En análisis', usuario_id: 3 })).status, 403);
    const respuesta = await patch(10, 'asignar', { usuario_id: 3 });
    assert.equal(respuesta.status, 200);
    assert.equal(respuesta.body.id, 10);
    assert.equal(respuesta.body.agente_id, 3);
    assert.equal(respuesta.body.estado, 'Pendiente');
    assert.ok(respuesta.body.fecha_asignacion);
  });

  await t.test('CP-17 y CP-19 por HTTP', async () => {
    assert.equal((await patch(10, 'asignar', { usuario_id: 4 })).status, 409);
    assert.equal((await patch(10, 'estado', { estado: 'En análisis', usuario_id: 4 })).status, 403);
    const avance = await patch(10, 'estado', { estado: 'En análisis', usuario_id: 3 });
    assert.equal(avance.status, 200);
    assert.deepEqual(base.datos.historial.map((h) => h.evento), ['Caso asignado', 'Cambio de estado']);
  });
});
