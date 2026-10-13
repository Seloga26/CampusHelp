const test = require('node:test');
const assert = require('node:assert/strict');
const { abrirMysqlTemporal } = require('./helpers/mysqlTemporal');
const { prepararDetalle } = require('./helpers/detalle');

test('HU-12: detalle y atenciones persistentes con MySQL real', {
  skip: process.env.CAMPUSHELP_TEST_MYSQL !== '1',
}, async (t) => {
  const { db, pedir } = await abrirMysqlTemporal(t, 'hu12');
  const { id, primera, segunda } = await prepararDetalle(pedir, 'Solicitud de servicio');
  await t.test('CP-40 y CP-43: detalle cerrado tras devolución, con solución vigente y anterior', async () => {
    const respuesta = await pedir(`/api/casos/${id}?usuario_id=1`);
    assert.equal(respuesta.status, 200);
    const detalle = respuesta.datos;
    assert.equal(detalle.estado, 'Cerrada'); assert.equal(detalle.tipo, 'Solicitud de servicio');
    assert.equal(detalle.solicitante, 'Ana Solicitante'); assert.equal(detalle.agente, 'Carla Agente');
    assert.equal(detalle.area, 'Red y conectividad'); assert.equal(detalle.categoria, 'Wi-Fi');
    for (const campo of ['fecha_creacion', 'fecha_asignacion', 'fecha_inicio_atencion', 'fecha_cierre']) assert.ok(detalle[campo]);
    assert.deepEqual(detalle.atenciones.map(a => a.id), [segunda.id, primera.id]);
    assert.equal(detalle.atenciones[0].diagnostico, segunda.diagnostico);
    assert.equal(detalle.atenciones[0].solucion, segunda.solucion);
    assert.equal(detalle.atenciones[1].solucion, primera.solucion);
    assert.equal(detalle.atenciones[0].agente, 'Carla Agente');
  });
  await t.test('CP-41: solicitante ajeno y usuario inactivo reciben 403 sin datos', async () => {
    for (const usuario_id of [2, 999]) {
      const respuesta = await pedir(`/api/casos/${id}?usuario_id=${usuario_id}`);
      assert.equal(respuesta.status, 403); assert.equal(respuesta.datos.atenciones, undefined);
    }
    await db.execute('UPDATE usuario SET activo = 0 WHERE id = 1');
    try {
      const inactivo = await pedir(`/api/casos/${id}?usuario_id=1`);
      assert.equal(inactivo.status, 403); assert.equal(inactivo.datos.atenciones, undefined);
    } finally { await db.execute('UPDATE usuario SET activo = 1 WHERE id = 1'); }
  });
  await t.test('CP-42: caso Pendiente sin agente ni atención; errores de IDs y caso inexistente', async () => {
    const detalle = await pedir('/api/casos/1?usuario_id=1');
    assert.equal(detalle.status, 200); assert.equal(detalle.datos.estado, 'Pendiente');
    assert.equal(detalle.datos.agente, null); assert.deepEqual(detalle.datos.atenciones, []);
    assert.equal((await pedir('/api/casos/999?usuario_id=1')).status, 404);
    assert.equal((await pedir('/api/casos/1e1?usuario_id=1')).status, 400);
  });
  await t.test('consulta de solo lectura conserva casos, atenciones e historial y permite todos los roles internos', async () => {
    async function leer() {
      return Promise.all(['caso', 'atencion', 'historial'].map(async tabla => (await db.query(`SELECT * FROM ${tabla} ORDER BY id`))[0]));
    }
    const antes = await leer();
    for (const usuario_id of [1, 3, 4, 5, 6]) assert.equal((await pedir(`/api/casos/${id}?usuario_id=${usuario_id}`)).status, 200);
    assert.deepEqual(await leer(), antes);
  });
});
