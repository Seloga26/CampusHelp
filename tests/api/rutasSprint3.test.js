// Sprint 3: las rutas de HU-10, HU-11 y HU-12 están conectadas a su servicio.
// Esta prueba solo comprueba que existen (no responden 404 de ruta). Cada
// historia agrega sus propias pruebas del comportamiento al implementarse.
const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { crearApp } = require('../../src/app');
const { crearServicios } = require('../../src/config/contenedor');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');

test('Sprint 3: rutas de indicadores, gestión de categorías y detalle conectadas', async (t) => {
  const servidor = crearApp({
    servicios: crearServicios(crearReposEnMemoria()), verificarBaseDeDatos: async () => {},
  }).listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  t.after(() => new Promise((resolve) => { servidor.close(resolve); servidor.closeAllConnections?.(); }));
  const url = `http://127.0.0.1:${servidor.address().port}`;

  for (const [metodo, ruta, cuerpo] of [
    ['GET', '/api/indicadores?usuario_id=6'],
    ['GET', '/api/categorias/gestion?usuario_id=6'],
    ['POST', '/api/categorias', { area_id: 3, nombre: 'VPN institucional', usuario_id: 6 }],
    ['PATCH', '/api/categorias/8', { activa: false, usuario_id: 6 }],
    ['GET', '/api/casos/1?usuario_id=1'],
  ]) {
    const respuesta = await fetch(`${url}${ruta}`, {
      method: metodo,
      headers: cuerpo ? { 'Content-Type': 'application/json' } : {},
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    const body = await respuesta.json();
    assert.notEqual(body.error, 'Recurso no encontrado', `${metodo} ${ruta}`);
    assert.notEqual(respuesta.status, 500, `${metodo} ${ruta}`);
  }

  // Las categorías activas del registro (HU-01) siguen igual.
  const activas = await fetch(`${url}/api/categorias`).then((r) => r.json());
  assert.ok(activas.every((c) => c.id !== 99));
});
