// HU-08 Consultar el historial — contrato HTTP de GET /api/casos/:id/historial.
const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { crearApp } = require('../../src/app');
const { crearServicios } = require('../../src/config/contenedor');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');

test('HU-08: contrato HTTP del historial y página historial.html', async (t) => {
  const base = crearReposEnMemoria();
  const servicios = crearServicios(base);
  const { id } = await servicios.registrarCaso({
    tipo: 'Solicitud de servicio', titulo: 'Restablecer contraseña', descripcion: 'Olvidé la contraseña del correo',
    prioridad: 'P2', categoria_id: 11, usuario_id: 1,
  });
  await servicios.asignarCaso({ id, usuario_id: 3 });
  const servidor = crearApp({ servicios, verificarBaseDeDatos: async () => {} }).listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  t.after(() => new Promise((resolve) => {
    servidor.close(resolve);
    servidor.closeAllConnections?.();
  }));
  const url = `http://127.0.0.1:${servidor.address().port}`;
  const obtener = async (ruta) => {
    const r = await fetch(`${url}${ruta}`);
    return { status: r.status, body: await r.json() };
  };

  const ok = await obtener(`/api/casos/${id}/historial?usuario_id=3`);
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.body.map((e) => e.evento), ['Caso registrado', 'Caso asignado']);
  assert.equal(ok.body[1].usuario, 'Carla Agente');
  assert.equal(ok.body[1].rol, 'Agente');

  for (const [ruta, esperado] of [
    [`/api/casos/${id}/historial`, 400],
    [`/api/casos/${id}/historial?usuario_id=abc`, 400],
    [`/api/casos/abc/historial?usuario_id=3`, 400],
    [`/api/casos/${id}/historial?usuario_id=2`, 403],
    [`/api/casos/999/historial?usuario_id=3`, 404],
  ]) {
    const r = await obtener(ruta);
    assert.equal(r.status, esperado, ruta);
    assert.equal(typeof r.body.error, 'string');
  }

  const pagina = await fetch(`${url}/historial.html`);
  assert.equal(pagina.status, 200);
  assert.match(await pagina.text(), /js\/historial\.js/);
});
