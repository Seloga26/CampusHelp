// Pruebas de la API completa (rutas + servicios + middleware) con un
// contenedor falso: se levanta Express de verdad, pero sin MySQL.
const test = require('node:test');
const assert = require('node:assert');
const { crearApp } = require('../../src/app');
const { crearServicios } = require('../../src/config/contenedor');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');

/** Levanta la app en un puerto libre y devuelve la URL base y cómo cerrarla. */
async function levantar({ servicios, verificarBaseDeDatos = async () => {} } = {}) {
  const { repos, enTransaccion } = crearReposEnMemoria();
  const app = crearApp({
    servicios: servicios || crearServicios({ repos, enTransaccion }),
    verificarBaseDeDatos,
  });
  const servidor = await new Promise((ok) => {
    const s = app.listen(0, () => ok(s));
  });
  const url = `http://127.0.0.1:${servidor.address().port}`;
  return { url, cerrar: () => new Promise((ok) => servidor.close(ok)) };
}

test('GET /api/health responde ok cuando la BD responde', async (t) => {
  const { url, cerrar } = await levantar();
  t.after(cerrar);

  const r = await fetch(`${url}/api/health`);

  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { app: 'ok', db: 'ok' });
});

test('GET /api/health responde 503 cuando la BD no responde', async (t) => {
  const { url, cerrar } = await levantar({
    verificarBaseDeDatos: async () => { throw Object.assign(new Error('sin BD'), { code: 'ECONNREFUSED' }); },
  });
  t.after(cerrar);

  const r = await fetch(`${url}/api/health`);

  assert.equal(r.status, 503);
  assert.equal((await r.json()).detalle, 'ECONNREFUSED');
});

test('GET /api/categorias devuelve las categorías activas', async (t) => {
  const { url, cerrar } = await levantar();
  t.after(cerrar);

  const r = await fetch(`${url}/api/categorias`);

  assert.equal(r.status, 200);
  assert.equal((await r.json()).length, 4);
});

test('GET /api/usuarios?rol=Agente filtra por rol', async (t) => {
  const { url, cerrar } = await levantar();
  t.after(cerrar);

  const r = await fetch(`${url}/api/usuarios?rol=Agente`);

  assert.equal(r.status, 200);
  assert.ok((await r.json()).every((u) => u.rol === 'Agente'));
});

test('un ErrorValidacion del servicio se convierte en 400 con mensaje', async (t) => {
  const { url, cerrar } = await levantar();
  t.after(cerrar);

  const r = await fetch(`${url}/api/usuarios?rol=Superusuario`);

  assert.equal(r.status, 400);
  assert.match((await r.json()).error, /Rol inválido/);
});

test('un JSON mal formado responde 400', async (t) => {
  const { url, cerrar } = await levantar();
  t.after(cerrar);

  const r = await fetch(`${url}/api/casos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ esto no es json',
  });

  assert.equal(r.status, 400);
});

test('un error inesperado responde 500 sin exponer detalles', async (t) => {
  const { repos, enTransaccion } = crearReposEnMemoria();
  const servicios = {
    ...crearServicios({ repos, enTransaccion }),
    listarCategorias: async () => { throw new Error('detalle interno secreto'); },
  };
  const { url, cerrar } = await levantar({ servicios });
  t.after(cerrar);
  t.mock.method(console, 'error', () => {});

  const r = await fetch(`${url}/api/categorias`);

  assert.equal(r.status, 500);
  assert.deepEqual(await r.json(), { error: 'Error interno del servidor' });
});

test('una ruta de API inexistente responde 404', async (t) => {
  const { url, cerrar } = await levantar();
  t.after(cerrar);

  const r = await fetch(`${url}/api/no-existe`);

  assert.equal(r.status, 404);
});
