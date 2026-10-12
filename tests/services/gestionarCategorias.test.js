const test = require('node:test');
const assert = require('node:assert/strict');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');
const { crearServicios } = require('../../src/config/contenedor');

function entorno(opciones) {
  const memoria = crearReposEnMemoria(opciones);
  return { ...memoria, servicios: crearServicios(memoria) };
}
const nueva = { usuario_id: 6, area_id: 3, nombre: 'VPN institucional', descripcion: 'Acceso remoto' };

test('CP-36: crea una categoría activa y aparece en el catálogo de registro', async () => {
  const { servicios, datos } = entorno();
  const creada = await servicios.agregarCategoria({ ...nueva, nombre: '  VPN institucional  ' });
  assert.equal(creada.nombre, nueva.nombre);
  assert.equal(creada.descripcion, nueva.descripcion);
  assert.equal(creada.activa, true);
  assert.equal(creada.area, 'Red y conectividad');
  assert.ok((await servicios.listarCategorias()).some(c => c.id === creada.id));
  assert.deepEqual(datos.historial, []);
});

test('CP-37: los nombres repetidos se rechazan sin distinguir mayúsculas ni tildes, incluso inactivos', async () => {
  const { servicios, datos } = entorno();
  const antes = structuredClone(datos.categorias);
  for (const nombre of ['wi-fi', 'WÍ-FI', '  Wi-Fi  ']) {
    await assert.rejects(servicios.agregarCategoria({ ...nueva, nombre }), { status: 409 });
  }
  await assert.rejects(servicios.agregarCategoria({ ...nueva, area_id: 1, nombre: 'categoría inactiva' }), { status: 409 });
  assert.deepEqual(datos.categorias, antes);
  const enOtraArea = await servicios.agregarCategoria({ ...nueva, area_id: 1, nombre: 'Wi-Fi' });
  assert.equal(enOtraArea.area_id, 1);
});

test('CP-38: desactiva y reactiva sin borrar la categoría ni modificar sus casos', async () => {
  const { servicios, datos } = entorno({ casos: [{ id: 1, categoria_id: 1, titulo: 'Caso existente' }] });
  const antes = structuredClone(datos.casos);
  const inactiva = await servicios.actualizarCategoria({ id: 1, usuario_id: 6, activa: false });
  assert.equal(inactiva.activa, false);
  assert.ok(!(await servicios.listarCategorias()).some(c => c.id === 1));
  assert.equal((await servicios.listarCategoriasGestion({ usuario_id: 6 })).find(c => c.id === 1).casos, 1);
  assert.deepEqual(datos.casos, antes);
  await servicios.actualizarCategoria({ id: 1, usuario_id: 6, activa: true });
  assert.ok((await servicios.listarCategorias()).some(c => c.id === 1));
  assert.deepEqual(datos.casos, antes);
});

test('CP-39: roles distintos de Administrador y usuarios inactivos no leen ni escriben la gestión', async () => {
  const { servicios, datos } = entorno();
  datos.usuarios.push({ id: 7, nombre: 'Administrador inactivo', rol: 'Administrador', activo: false });
  for (const usuario_id of [1, 3, 5, 7, 99]) {
    const antes = structuredClone(datos);
    await assert.rejects(servicios.listarCategoriasGestion({ usuario_id }), { status: 403 });
    await assert.rejects(servicios.agregarCategoria({ ...nueva, usuario_id }), { status: 403 });
    await assert.rejects(servicios.actualizarCategoria({ id: 1, activa: false, usuario_id }), { status: 403 });
    assert.deepEqual(datos, antes);
  }
});

test('edición parcial: conserva área, estado y campos omitidos; permite vaciar la descripción', async () => {
  const { servicios } = entorno();
  const creada = await servicios.agregarCategoria(nueva);
  const editada = await servicios.actualizarCategoria({ id: creada.id, usuario_id: 6, nombre: '  VPN  ' });
  assert.deepEqual(editada, { ...creada, nombre: 'VPN' });
  const vacia = await servicios.actualizarCategoria({ id: creada.id, usuario_id: 6, descripcion: null });
  assert.equal(vacia.descripcion, null);
  assert.equal(vacia.nombre, 'VPN');
  await assert.rejects(servicios.actualizarCategoria({ id: creada.id, usuario_id: 6, nombre: 'Wi-Fi' }), { status: 409 });
  const propia = await servicios.actualizarCategoria({ id: 8, usuario_id: 6, nombre: 'WÍ-FI' });
  assert.equal(propia.nombre, 'WÍ-FI');
});

test('área activa vacía: permite la primera categoría; área inactiva o inexistente responde 400', async () => {
  const { servicios, datos } = entorno();
  assert.ok((await servicios.listarAreas()).some(a => a.id === 5));
  const creada = await servicios.agregarCategoria({ ...nueva, area_id: 5 });
  assert.equal(creada.area, 'Plataformas académicas');
  datos.areas.find(a => a.id === 3).activa = false;
  for (const area_id of [3, 999]) await assert.rejects(servicios.agregarCategoria({ ...nueva, area_id }), { status: 400 });
  await assert.rejects(servicios.actualizarCategoria({ id: 8, usuario_id: 6, activa: false }), { status: 400 });
  assert.ok(!(await servicios.listarCategorias()).some(c => c.area_id === 3));
});

test('límites del nombre y descripción: acepta 3/100 y 255 caracteres y rechaza datos fuera del contrato', async () => {
  const { servicios, datos } = entorno();
  for (const nombre of ['VPN', 'n'.repeat(100)]) {
    const creada = await servicios.agregarCategoria({ ...nueva, nombre, descripcion: 'd'.repeat(255) });
    assert.equal(creada.nombre, nombre);
  }
  for (const cambios of [
    { nombre: '  ab  ' }, { nombre: ' ' }, { nombre: 123 }, { nombre: 'n'.repeat(101) },
    { descripcion: [] }, { descripcion: 'd'.repeat(256) }, { area_id: '3e0' },
    { area_id: 0 }, { usuario_id: [6] }, { usuario_id: '6.0' }, { usuario_id: 2147483648 },
  ]) {
    const antes = structuredClone(datos);
    await assert.rejects(servicios.agregarCategoria({ ...nueva, ...cambios }), { status: 400 });
    assert.deepEqual(datos, antes);
  }
  for (const cambios of [{}, { activa: 'false' }, { activa: 0 }, { activa: null }, { nombre: null }, { descripcion: false }]) {
    await assert.rejects(servicios.actualizarCategoria({ id: 8, usuario_id: 6, ...cambios }), { status: 400 });
  }
  await assert.rejects(servicios.actualizarCategoria({ id: 999, usuario_id: 6, activa: false }), { status: 404 });
  await assert.rejects(servicios.agregarCategoria(null), { status: 400 });
});

test('gestión lista activas e inactivas por área, con cero casos y conteos correctos', async () => {
  const { servicios } = entorno({ casos: [{ id: 1, categoria_id: 8 }, { id: 2, categoria_id: 8 }] });
  const lista = await servicios.listarCategoriasGestion({ usuario_id: '6' });
  assert.equal(lista.find(c => c.id === 8).casos, 2);
  assert.equal(lista.find(c => c.id === 99).activa, false);
  assert.equal(lista.find(c => c.id === 99).casos, 0);
  assert.deepEqual(lista.map(c => c.area), [...lista.map(c => c.area)].sort((a, b) => a.localeCompare(b)));
});

test('repositorio en memoria conserva la unicidad al crear simultáneamente, como MySQL', async () => {
  const { servicios, datos } = entorno();
  const resultados = await Promise.allSettled([servicios.agregarCategoria(nueva), servicios.agregarCategoria(nueva)]);
  assert.equal(resultados.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(resultados.find(r => r.status === 'rejected').reason.status, 409);
  assert.equal(datos.categorias.filter(c => c.nombre === nueva.nombre).length, 1);
});
