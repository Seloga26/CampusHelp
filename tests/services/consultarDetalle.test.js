const test = require('node:test');
const assert = require('node:assert/strict');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');
const { crearServicios } = require('../../src/config/contenedor');

function preparar(cambios = {}) {
  const memoria = crearReposEnMemoria({ casos: [{ id: 10, usuario_id: 1, categoria_id: 8, agente_id: 3,
    tipo: 'Incidente', titulo: 'Falla de Wi-Fi', descripcion: 'El servicio está interrumpido', prioridad: 'P1', estado: 'Cerrada',
    fecha_creacion: '2026-10-12 08:00:00', fecha_asignacion: '2026-10-12 09:00:00',
    fecha_inicio_atencion: '2026-10-12 09:30:00', fecha_cierre: '2026-10-12 10:00:00', ...cambios }] });
  return { ...memoria, servicios: crearServicios(memoria) };
}

test('CP-40: Ana ve los datos, fechas, agente, diagnóstico y solución de su caso', async () => {
  const { datos, servicios } = preparar();
  datos.atenciones.push({ id: 1, caso_id: 10, agente_id: 3, fecha: '2026-10-12 09:45:00',
    diagnostico: 'Punto de acceso sin energía', solucion: 'Se reconectó y verificó la red' });
  const antes = structuredClone(datos);
  const detalle = await servicios.consultarDetalle({ id: '10', usuario_id: '1' });
  for (const campo of ['tipo', 'titulo', 'descripcion', 'prioridad', 'estado', 'fecha_creacion',
    'fecha_asignacion', 'fecha_inicio_atencion', 'fecha_cierre']) assert.equal(detalle[campo], datos.casos[0][campo]);
  assert.equal(detalle.area, 'Red y conectividad'); assert.equal(detalle.categoria, 'Wi-Fi');
  assert.equal(detalle.solicitante, 'Ana Solicitante'); assert.equal(detalle.agente, 'Carla Agente');
  assert.equal(detalle.atenciones[0].diagnostico, datos.atenciones[0].diagnostico);
  assert.equal(detalle.atenciones[0].solucion, datos.atenciones[0].solucion);
  assert.equal(detalle.atenciones[0].agente, 'Carla Agente');
  assert.deepEqual(datos, antes);
});

test('CP-41: Bruno recibe 403 y no se consulta ni expone ninguna atención', async () => {
  const { repos, servicios } = preparar();
  repos.atenciones.listarPorCaso = () => assert.fail('No debe leer atenciones ajenas');
  await assert.rejects(servicios.consultarDetalle({ id: 10, usuario_id: 2 }), { status: 403, message: /propios casos/ });
});

test('CP-42: caso Pendiente sin agente ni atenciones devuelve sus datos y lista vacía', async () => {
  const { servicios } = preparar({ estado: 'Pendiente', agente_id: null, fecha_asignacion: null,
    fecha_inicio_atencion: null, fecha_cierre: null });
  const detalle = await servicios.consultarDetalle({ id: 10, usuario_id: 1 });
  assert.equal(detalle.agente, null); assert.equal(detalle.estado, 'Pendiente');
  assert.equal(detalle.fecha_cierre, null); assert.deepEqual(detalle.atenciones, []);
});

test('CP-43: tras devolver y registrar otra atención, la solución más reciente aparece primero', async () => {
  const { servicios, datos } = preparar({ estado: 'En atención', fecha_cierre: null });
  const primera = await servicios.registrarAtencion({ id: 10, usuario_id: 3,
    diagnostico: 'Primera revisión del equipo', solucion: 'Se reinició el punto de acceso' });
  await servicios.cambiarEstado({ id: 10, usuario_id: 3, estado: 'En validación' });
  await servicios.validarSolucion({ id: 10, usuario_id: 5, decision: 'devolver', motivo: 'La falla se reproduce todavía' });
  const segunda = await servicios.registrarAtencion({ id: 10, usuario_id: 3,
    diagnostico: 'El equipo requiere reemplazo', solucion: 'Se reemplazó y verificó el equipo' });
  const antes = structuredClone(datos);
  const detalle = await servicios.consultarDetalle({ id: 10, usuario_id: 1 });
  assert.deepEqual(detalle.atenciones.map(a => a.id), [segunda.id, primera.id]);
  assert.equal(detalle.atenciones[1].solucion, primera.solucion);
  assert.deepEqual(datos, antes);
});

test('roles internos ven cualquier caso; los usuarios inactivos o inexistentes reciben 403', async () => {
  const { servicios, datos } = preparar();
  for (const usuario_id of [3, 4, 5, 6]) {
    assert.equal((await servicios.consultarDetalle({ id: 10, usuario_id })).id, 10);
  }
  datos.usuarios.find(u => u.id === 1).activo = false;
  for (const usuario_id of [1, 999]) await assert.rejects(servicios.consultarDetalle({ id: 10, usuario_id }), { status: 403 });
});

test('IDs inválidos y caso inexistente responden 400/404 antes de leer las atenciones', async () => {
  const { servicios, repos } = preparar();
  repos.atenciones.listarPorCaso = () => assert.fail('No debe consultar atenciones');
  for (const valor of [undefined, null, 0, -1, 1.5, [], {}, true, '1e1', ' 10', '010', 2147483648]) {
    await assert.rejects(servicios.consultarDetalle({ id: valor, usuario_id: 1 }), { status: 400 });
    await assert.rejects(servicios.consultarDetalle({ id: 10, usuario_id: valor }), { status: 400 });
  }
  await assert.rejects(servicios.consultarDetalle(null), { status: 400 });
  await assert.rejects(servicios.consultarDetalle({ id: 999, usuario_id: 1 }), { status: 404 });
});

test('las atenciones se ordenan por fecha y luego por id y solo incluyen el caso consultado', async () => {
  const { servicios, datos } = preparar();
  datos.atenciones.push(...[
    { id: 1, fecha: '2026-10-12 09:00:00' }, { id: 2, fecha: '2026-10-12 08:00:00' },
    { id: 3, fecha: '2026-10-12 09:00:00' },
  ].map(a => ({ ...a, caso_id: 10, agente_id: 3, diagnostico: 'Diagnóstico de prueba', solucion: 'Solución de prueba' })));
  datos.atenciones.push({ id: 4, caso_id: 99, agente_id: 3, fecha: '2026-10-12 10:00:00' });
  assert.deepEqual((await servicios.consultarDetalle({ id: 10, usuario_id: 1 })).atenciones.map(a => a.id), [3, 1, 2]);
});
