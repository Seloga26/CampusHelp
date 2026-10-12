const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { crearApp } = require('../../src/app');
const { crearServicios } = require('../../src/config/contenedor');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');

test('HU-07: contrato HTTP de validación y de atenciones', async (t) => {
  const base = crearReposEnMemoria({ casos: [
    { id: 10, agente_id: 3, estado: 'En validación', fecha_cierre: null },
    { id: 11, agente_id: 3, estado: 'En atención', fecha_cierre: null },
  ] });
  await base.repos.atenciones.crear({ casoId: 10, diagnostico: 'Cola bloqueada', solucion: 'Se reinició el servicio', agenteId: 3 });
  const servidor = crearApp({
    servicios: crearServicios(base), verificarBaseDeDatos: async () => {},
  }).listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  t.after(() => new Promise((resolve) => {
    servidor.close(resolve);
    servidor.closeAllConnections?.();
  }));
  const url = `http://127.0.0.1:${servidor.address().port}`;
  async function validar(id, datos) {
    const r = await fetch(`${url}/api/casos/${id}/validacion`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos),
    });
    return { status: r.status, body: await r.json() };
  }

  for (const [id, datos, esperado] of [
    [10, { decision: 'aprobar', usuario_id: 3 }, 403],
    [11, { decision: 'aprobar', usuario_id: 5 }, 409],
    [10, { decision: 'devolver', usuario_id: 5 }, 400],
    [10, { decision: 'devolver', motivo: 'corto', usuario_id: 5 }, 400],
    [10, { decision: 'otra', usuario_id: 5 }, 400],
    [999, { decision: 'aprobar', usuario_id: 5 }, 404],
  ]) {
    const r = await validar(id, datos);
    assert.equal(r.status, esperado);
    assert.equal(typeof r.body.error, 'string');
  }
  assert.equal(base.datos.casos[0].estado, 'En validación');
  assert.deepEqual(base.datos.historial, []);

  const lista = await (await fetch(`${url}/api/casos/10/atenciones`)).json();
  assert.equal(lista.length, 1);
  assert.equal(lista[0].agente, 'Carla Agente');
  assert.equal((await fetch(`${url}/api/casos/999/atenciones`)).status, 404);

  const devuelto = await validar(10, { decision: 'devolver', motivo: 'La impresora sigue sin imprimir', usuario_id: 5 });
  assert.equal(devuelto.status, 200);
  assert.equal(devuelto.body.estado, 'En atención');
  base.datos.casos[0].estado = 'En validación';
  const aprobado = await validar(10, { decision: 'aprobar', usuario_id: 5 });
  assert.equal(aprobado.status, 200);
  assert.equal(aprobado.body.estado, 'Cerrada');
  assert.ok(aprobado.body.fecha_cierre);
  assert.equal((await validar(10, { decision: 'aprobar', usuario_id: 5 })).status, 409);
});