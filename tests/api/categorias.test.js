const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { crearApp } = require('../../src/app');
const { crearServicios } = require('../../src/config/contenedor');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');

test('HU-11: contrato HTTP de categorías, permisos, validación y página', async (t) => {
  const memoria = crearReposEnMemoria();
  const servidor = crearApp({ servicios: crearServicios(memoria), verificarBaseDeDatos: async () => {} }).listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  t.after(() => new Promise(ok => { servidor.close(ok); servidor.closeAllConnections?.(); }));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  async function pedir(ruta, method = 'GET', datos) {
    const respuesta = await fetch(base + ruta, { method,
      headers: datos === undefined ? {} : { 'Content-Type': 'application/json' },
      body: datos === undefined ? undefined : JSON.stringify(datos) });
    return { status: respuesta.status, datos: await respuesta.json() };
  }
  const nueva = { usuario_id: 6, area_id: 3, nombre: 'VPN institucional' };
  const creada = await pedir('/api/categorias', 'POST', nueva);
  assert.equal(creada.status, 201);
  assert.equal(creada.datos.activa, true);
  const id = creada.datos.id;
  assert.equal((await pedir('/api/categorias', 'POST', nueva)).status, 409);
  assert.equal((await pedir(`/api/categorias/${id}`, 'PATCH', { usuario_id: 6, activa: false })).status, 200);
  assert.equal((await pedir('/api/categorias/gestion?usuario_id=6')).datos.find(c => c.id === id).activa, false);
  assert.ok(!(await pedir('/api/categorias')).datos.some(c => c.id === id));
  assert.equal((await pedir('/api/categorias/gestion?usuario_id=3')).status, 403);
  assert.equal((await pedir('/api/categorias', 'POST', { ...nueva, usuario_id: 3 })).status, 403);
  assert.equal((await pedir(`/api/categorias/${id}`, 'PATCH', { usuario_id: 3, activa: true })).status, 403);
  for (const valor of ['abc', '1e1', '0', '1.5', '2147483648']) {
    assert.equal((await pedir(`/api/categorias/${valor}`, 'PATCH', { usuario_id: 6, activa: true })).status, 400);
  }
  assert.equal((await pedir('/api/categorias/999', 'PATCH', { usuario_id: 6, activa: true })).status, 404);
  assert.equal((await pedir(`/api/categorias/${id}`, 'PATCH', { usuario_id: 6, activa: 'false' })).status, 400);
  assert.equal((await pedir('/api/categorias', 'POST', null)).status, 400);
  assert.equal((await pedir('/api/categorias/gestion')).status, 400);
  assert.equal((await pedir('/api/categorias/areas')).datos.length, 5);
  const pagina = await fetch(base + '/categorias.html');
  assert.equal(pagina.status, 200);
  assert.match(await pagina.text(), /form-categoria/);
});
