const test = require('node:test');
const assert = require('node:assert/strict');
const { abrirMysqlTemporal } = require('./helpers/mysqlTemporal');
const { crearCategoriasRepository } = require('../src/repositories/categoriasRepository');

test('HU-11: categorías persistentes, índice único y concurrencia en MySQL', {
  skip: process.env.CAMPUSHELP_TEST_MYSQL !== '1',
}, async (t) => {
  const { db, pedir } = await abrirMysqlTemporal(t, 'hu11');
  const nueva = { usuario_id: 6, area_id: 3, nombre: 'VPN institucional', descripcion: 'Acceso remoto' };
  await t.test('CP-36/CP-37: creación, mayúsculas y tildes con el índice real', async () => {
    const creada = await pedir('/api/categorias', 'POST', nueva);
    assert.equal(creada.status, 201);
    assert.ok((await pedir('/api/categorias')).datos.some(c => c.id === creada.datos.id));
    for (const nombre of ['vpn institucional', 'VPN institucionál']) {
      assert.equal((await pedir('/api/categorias', 'POST', { ...nueva, nombre })).status, 409);
    }
    // Fuerza el índice directamente: el repositorio traduce ER_DUP_ENTRY a 409.
    await assert.rejects(crearCategoriasRepository(db).crear(nueva), { status: 409 });
    assert.equal((await pedir('/api/categorias', 'POST', { ...nueva, area_id: 1 })).status, 201);
  });
  await t.test('CP-38: desactivar Impresora conserva el caso y su clasificación; reactivar la devuelve al registro', async () => {
    const registrado = await pedir('/api/casos', 'POST', { usuario_id: 1, categoria_id: 4, tipo: 'Incidente',
      titulo: 'Impresora del laboratorio', descripcion: 'La impresora no imprime documentos', prioridad: 'P2' });
    assert.equal(registrado.status, 201);
    const [antes] = await db.query('SELECT * FROM caso');
    assert.equal((await pedir('/api/categorias/4', 'PATCH', { usuario_id: 6, activa: false })).status, 200);
    assert.ok(!(await pedir('/api/categorias')).datos.some(c => c.id === 4));
    const rechazado = await pedir('/api/casos', 'POST', { usuario_id: 1, categoria_id: 4, tipo: 'Incidente',
      titulo: 'Registro con categoría desactivada', descripcion: 'Debe rechazarse sin crear otro caso', prioridad: 'P2' });
    assert.equal(rechazado.status, 400);
    const gestion = (await pedir('/api/categorias/gestion?usuario_id=6')).datos.find(c => c.id === 4);
    assert.equal(gestion.activa, false); assert.equal(gestion.casos, 1);
    const listado = (await pedir('/api/casos?usuario_id=1')).datos.find(c => c.id === registrado.datos.id);
    assert.equal(listado.categoria, 'Impresora');
    assert.deepEqual((await db.query('SELECT * FROM caso'))[0], antes);
    assert.equal((await pedir('/api/categorias/4', 'PATCH', { usuario_id: 6, activa: true })).status, 200);
    assert.ok((await pedir('/api/categorias')).datos.some(c => c.id === 4));
  });
  await t.test('creaciones y ediciones simultáneas devuelven 201/200 y 409 sin duplicados', async () => {
    const crear = () => pedir('/api/categorias', 'POST', { ...nueva, nombre: 'Categoría concurrente' });
    assert.deepEqual((await Promise.all([crear(), crear()])).map(r => r.status).sort(), [201, 409]);
    const primera = await pedir('/api/categorias', 'POST', { ...nueva, nombre: 'Edición uno' });
    const segunda = await pedir('/api/categorias', 'POST', { ...nueva, nombre: 'Edición dos' });
    const editar = id => pedir(`/api/categorias/${id}`, 'PATCH', { usuario_id: 6, nombre: 'Edición simultánea' });
    assert.deepEqual((await Promise.all([editar(primera.datos.id), editar(segunda.datos.id)])).map(r => r.status).sort(), [200, 409]);
    assert.equal((await db.execute("SELECT * FROM categoria WHERE nombre = 'Edición simultánea'"))[0].length, 1);
  });
  await t.test('CP-39 y área inactiva: rechazos sin escrituras; edición parcial conserva los campos', async () => {
    const [antes] = await db.query('SELECT * FROM categoria ORDER BY id');
    for (const usuario_id of [1, 3, 5, 999]) {
      assert.equal((await pedir('/api/categorias', 'POST', { ...nueva, usuario_id })).status, 403);
      assert.equal((await pedir('/api/categorias/8', 'PATCH', { usuario_id, activa: false })).status, 403);
    }
    assert.deepEqual((await db.query('SELECT * FROM categoria ORDER BY id'))[0], antes);
    const editada = await pedir('/api/categorias/8', 'PATCH', { usuario_id: 6, descripcion: 'Red inalámbrica' });
    assert.equal(editada.status, 200); assert.equal(editada.datos.nombre, 'Wi-Fi');
    assert.equal(editada.datos.area_id, 3); assert.equal(editada.datos.activa, true);
    await db.execute('UPDATE area SET activa = 0 WHERE id = 5');
    assert.equal((await pedir('/api/categorias', 'POST', { ...nueva, area_id: 5 })).status, 400);
    assert.ok(!(await pedir('/api/categorias/areas')).datos.some(a => a.id === 5));
  });
});
