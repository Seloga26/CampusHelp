// HU-07 Aprobar o devolver una solución — casos CP-08, CP-09, CP-23, CP-24 y CP-25
// por la API real contra MySQL. Usa una base temporal propia; nunca toca campushelp.
const test = require('node:test');
const assert = require('node:assert/strict');
const { abrirMysqlTemporal } = require('./helpers/mysqlTemporal');

test('HU-07: aprobar o devolver con MySQL real', {
  skip: process.env.CAMPUSHELP_TEST_MYSQL !== '1',
}, async (t) => {
  const { db, pedir } = await abrirMysqlTemporal(t, 'hu07');

  // Recorre el flujo real hasta el estado pedido: registrar → asignar → estados → atención.
  async function crearCaso({ tipo = 'Incidente', categoria_id = 8, hasta = 'En validación' } = {}) {
    const nuevo = await pedir('/api/casos', 'POST', { usuario_id: 1, categoria_id, tipo, prioridad: 'P1',
      titulo: `Validación HU-07: ${tipo}`, descripcion: 'El servicio falla y requiere una revisión técnica' });
    assert.equal(nuevo.status, 201);
    const ruta = `/api/casos/${nuevo.datos.id}`;
    assert.equal((await pedir(ruta + '/asignar', 'PATCH', { usuario_id: 3 })).status, 200);
    for (const estado of ['En análisis', 'En atención']) {
      assert.equal((await pedir(ruta + '/estado', 'PATCH', { usuario_id: 3, estado })).status, 200);
    }
    assert.equal((await pedir(ruta + '/atencion', 'POST', { usuario_id: 3,
      diagnostico: 'El punto de acceso estaba apagado', solucion: 'Se reinició y se comprobó la conexión' })).status, 201);
    if (hasta === 'En validación') {
      assert.equal((await pedir(ruta + '/estado', 'PATCH', { usuario_id: 3, estado: 'En validación' })).status, 200);
    }
    return nuevo.datos.id;
  }
  async function leer(id) {
    const [[caso]] = await db.execute('SELECT * FROM caso WHERE id = ?', [id]);
    const [historial] = await db.execute('SELECT * FROM historial WHERE caso_id = ? ORDER BY id', [id]);
    return { caso, historial };
  }
  const validar = (id, datos) => pedir(`/api/casos/${id}/validacion`, 'POST', datos);

  await t.test('CP-09: Elena aprueba; el caso queda Cerrada con fecha de cierre e historial', async () => {
    const id = await crearCaso();
    const respuesta = await validar(id, { usuario_id: 5, decision: 'aprobar' });
    assert.equal(respuesta.status, 200);
    const { caso, historial } = await leer(id);
    assert.equal(caso.estado, 'Cerrada');
    assert.ok(caso.fecha_cierre);
    const ultimo = historial.at(-1);
    assert.equal(ultimo.evento, 'Solución aprobada');
    assert.equal(ultimo.estado_anterior, 'En validación');
    assert.equal(ultimo.estado_nuevo, 'Cerrada');
    assert.equal(ultimo.usuario_id, 5);
  });

  await t.test('CP-08: Elena devuelve con motivo; vuelve a En atención con el mismo agente e historial', async () => {
    const id = await crearCaso();
    const respuesta = await validar(id, { usuario_id: 5, decision: 'devolver', motivo: 'La conexión sigue fallando en el aula' });
    assert.equal(respuesta.status, 200);
    const { caso, historial } = await leer(id);
    assert.equal(caso.estado, 'En atención');
    assert.equal(caso.agente_id, 3);
    assert.equal(caso.fecha_cierre, null);
    const ultimo = historial.at(-1);
    assert.equal(ultimo.evento, 'Solución devuelta: La conexión sigue fallando en el aula');
    assert.equal(ultimo.estado_anterior, 'En validación');
    assert.equal(ultimo.estado_nuevo, 'En atención');
    assert.equal(ultimo.usuario_id, 5);
    // El agente puede corregir y volver a enviarlo a validación.
    assert.equal((await pedir(`/api/casos/${id}/estado`, 'PATCH', { usuario_id: 3, estado: 'En validación' })).status, 200);
  });

  await t.test('CP-23: un Agente, un Solicitante o un usuario inexistente no pueden validar (403)', async () => {
    const id = await crearCaso({ tipo: 'Incidente', categoria_id: 8 });
    const antes = await leer(id);
    for (const usuario_id of [3, 1, 999]) {
      const respuesta = await validar(id, { usuario_id, decision: 'aprobar' });
      assert.equal(respuesta.status, 403, `usuario ${usuario_id}`);
    }
    assert.deepEqual(await leer(id), antes);
  });

  await t.test('CP-24: aprobar un caso En atención responde 409 y el estado no cambia', async () => {
    const id = await crearCaso({ tipo: 'Solicitud de servicio', categoria_id: 5, hasta: 'En atención' });
    const antes = await leer(id);
    for (const datos of [{ decision: 'aprobar' }, { decision: 'devolver', motivo: 'Falta revisar la licencia' }]) {
      const respuesta = await validar(id, { usuario_id: 5, ...datos });
      assert.equal(respuesta.status, 409);
    }
    assert.deepEqual(await leer(id), antes);
    assert.equal(antes.caso.estado, 'En atención');
  });

  await t.test('CP-25: devolver sin motivo o con menos de 10 caracteres responde 400; sigue En validación', async () => {
    const id = await crearCaso({ tipo: 'Incidente', categoria_id: 1 });
    const antes = await leer(id);
    for (const motivo of [undefined, '', '   ', 'corto', 'x'.repeat(101)]) {
      const respuesta = await validar(id, { usuario_id: 5, decision: 'devolver', motivo });
      assert.equal(respuesta.status, 400, JSON.stringify(motivo));
      assert.equal(typeof respuesta.datos.error, 'string');
    }
    assert.deepEqual(await leer(id), antes);
    assert.equal(antes.caso.estado, 'En validación');
  });
});
