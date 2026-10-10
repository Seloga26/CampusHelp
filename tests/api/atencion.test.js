const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { crearApp } = require('../../src/app');
const { crearServicios } = require('../../src/config/contenedor');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');

test('HU-06: contrato HTTP, pantalla y flujo de atención a validación', async (t) => {
  const base = crearReposEnMemoria({ casos: [
    { id: 10, agente_id: 3, estado: 'En atención' },
    { id: 11, agente_id: 3, estado: 'En análisis' },
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
  const entrada = { diagnostico: 'AP desconectado de la red', solucion: 'Se reconectó y verificó el AP', usuario_id: 3 };
  async function enviar(id, datos, accion = 'atencion') {
    const respuesta = await fetch(`${url}/api/casos/${id}/${accion}`, {
      method: accion === 'estado' ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos),
    });
    return { status: respuesta.status, body: await respuesta.json() };
  }

  for (const [id, datos, esperado] of [
    ['abc', entrada, 400], [0, entrada, 400], [10, { ...entrada, diagnostico: 'corto' }, 400],
    [10, { ...entrada, usuario_id: 4 }, 403], [10, { ...entrada, usuario_id: 1 }, 403],
    [999, entrada, 404], [11, entrada, 409],
  ]) {
    const respuesta = await enviar(id, datos);
    assert.equal(respuesta.status, esperado);
    assert.equal(typeof respuesta.body.error, 'string');
    assert.deepEqual(base.datos.atenciones, []);
    assert.deepEqual(base.datos.historial, []);
  }
  assert.equal((await enviar(10, { estado: 'En validación', usuario_id: 3 }, 'estado')).status, 409);
  const respuesta = await enviar(10, entrada);
  assert.equal(respuesta.status, 201);
  assert.equal(respuesta.body.caso_id, 10);
  assert.equal(respuesta.body.agente_id, 3);
  assert.ok(respuesta.body.fecha);
  assert.equal(base.datos.casos[0].estado, 'En atención');
  assert.equal(base.datos.historial[0].evento, 'Atención registrada');
  assert.equal((await enviar(10, { estado: 'En validación', usuario_id: 3 }, 'estado')).status, 200);
  assert.equal((await enviar(10, entrada)).status, 409);
  assert.equal(base.datos.atenciones.length, 1);

  const pagina = await fetch(`${url}/atender.html?id=10`);
  assert.equal(pagina.status, 200);
  assert.match(await pagina.text(), /js\/atender.js/);
  assert.equal((await fetch(`${url}/js/atender.js`)).status, 200);

  base.datos.casos[0].estado = 'En atención';
  base.repos.historial.registrar = async () => { throw new Error('Fallo interno deliberado'); };
  t.mock.method(console, 'error', () => {});
  const fallo = await enviar(10, entrada);
  assert.equal(fallo.status, 500);
  assert.deepEqual(fallo.body, { error: 'Error interno del servidor' });
  assert.equal(base.datos.atenciones.length, 1);
  assert.equal(base.datos.historial.length, 2);
});
