// Pruebas de servicios con repositorios en memoria (sin MySQL).
// Úsalas como plantilla para probar los servicios de cada historia.
const test = require('node:test');
const assert = require('node:assert');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');
const { crearListarUsuarios } = require('../../src/services/catalogos/listarUsuarios');
const { crearListarCategorias } = require('../../src/services/catalogos/listarCategorias');
const { ErrorValidacion } = require('../../src/domain/errores');

test('listarUsuarios sin rol devuelve todos los usuarios activos', async () => {
  const { repos } = crearReposEnMemoria();
  const listarUsuarios = crearListarUsuarios({ repos });

  const usuarios = await listarUsuarios();

  assert.equal(usuarios.length, 6);
});

test('listarUsuarios filtra por rol', async () => {
  const { repos } = crearReposEnMemoria();
  const listarUsuarios = crearListarUsuarios({ repos });

  const agentes = await listarUsuarios({ rol: 'Agente' });

  assert.deepEqual(agentes.map((u) => u.nombre), ['Carla Agente', 'Diego Agente']);
});

test('listarUsuarios rechaza un rol que no existe', async () => {
  const { repos } = crearReposEnMemoria();
  const listarUsuarios = crearListarUsuarios({ repos });

  await assert.rejects(() => listarUsuarios({ rol: 'Superusuario' }), ErrorValidacion);
});

test('listarCategorias no devuelve categorías inactivas', async () => {
  const { repos } = crearReposEnMemoria();
  const listarCategorias = crearListarCategorias({ repos });

  const categorias = await listarCategorias();

  assert.ok(categorias.every((c) => c.nombre !== 'Categoría inactiva'));
  assert.equal(categorias.length, 4);
});
