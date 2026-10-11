// HU-04 Asignarme un caso — pruebas del servicio sin MySQL.
// Criterios: docs/historias/HU-04.md (CP-06, CP-17, CP-18).
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearAsignarCaso } = require('../../src/services/casos/asignarCaso');
const { crearCambiarEstado } = require('../../src/services/casos/cambiarEstado');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');

function preparar(caso = {}) {
  const base = crearReposEnMemoria({
    casos: [{ id: 10, estado: 'Pendiente', agente_id: null, fecha_asignacion: null, ...caso }],
  });
  return { ...base, asignarCaso: crearAsignarCaso(base), cambiarEstado: crearCambiarEstado(base) };
}

test('CP-06: Carla se asigna un caso Pendiente; se guarda agente, fecha y evento', async () => {
  const { asignarCaso, datos } = preparar();
  const caso = await asignarCaso({ id: 10, usuario_id: 3 });
  assert.equal(caso.agente_id, 3);
  assert.ok(caso.fecha_asignacion);
  assert.equal(caso.estado, 'Pendiente', 'asignar no cambia el estado (regla 6)');
  assert.equal(datos.historial.length, 1);
  assert.deepEqual(datos.historial[0], {
    id: 1, casoId: 10, evento: 'Caso asignado', estadoAnterior: null, estadoNuevo: null, usuarioId: 3,
  });
});

test('CP-06: acepta el id y usuario_id como texto numérico (vienen del formulario/URL)', async () => {
  const { asignarCaso } = preparar();
  const caso = await asignarCaso({ id: '10', usuario_id: '3' });
  assert.equal(caso.agente_id, 3);
});

test('CP-17: un caso asignado a Carla no se reasigna a Diego (409)', async () => {
  const { asignarCaso, datos } = preparar({ agente_id: 3, fecha_asignacion: '2026-10-10 08:00:00' });
  await assert.rejects(asignarCaso({ id: 10, usuario_id: 4 }), { status: 409, message: /otro agente/ });
  assert.equal(datos.casos[0].agente_id, 3);
  assert.equal(datos.casos[0].fecha_asignacion, '2026-10-10 08:00:00');
  assert.equal(datos.historial.length, 0);
});

test('regla 4: si Carla ya es la asignada se rechaza con mensaje claro y sin historial', async () => {
  const { asignarCaso, datos } = preparar({ agente_id: 3 });
  await assert.rejects(asignarCaso({ id: 10, usuario_id: 3 }), { status: 409, message: /Ya eres/ });
  assert.equal(datos.historial.length, 0);
});

for (const [usuario, rol] of [[1, 'Solicitante'], [5, 'Validador'], [6, 'Administrador']]) {
  test(`CP-18: un ${rol} no puede asignarse un caso (403)`, async () => {
    const { asignarCaso, datos } = preparar();
    await assert.rejects(asignarCaso({ id: 10, usuario_id: usuario }), { status: 403 });
    assert.equal(datos.casos[0].agente_id, null);
    assert.equal(datos.historial.length, 0);
  });
}

test('CP-18: un agente inactivo o inexistente recibe 403', async () => {
  const { asignarCaso, datos } = preparar();
  datos.usuarios.find((u) => u.id === 4).activo = false;
  await assert.rejects(asignarCaso({ id: 10, usuario_id: 4 }), { status: 403 });
  await assert.rejects(asignarCaso({ id: 10, usuario_id: 999 }), { status: 403 });
  assert.equal(datos.casos[0].agente_id, null);
});

test('regla 2: un caso Cerrado no se puede asignar (409)', async () => {
  const { asignarCaso, datos } = preparar({ estado: 'Cerrada' });
  await assert.rejects(asignarCaso({ id: 10, usuario_id: 3 }), { status: 409, message: /cerrado/ });
  assert.equal(datos.casos[0].agente_id, null);
});

for (const estado of ['En análisis', 'En atención', 'En validación']) {
  test(`regla 2: se puede asignar un caso ${estado} que quedó sin agente`, async () => {
    const { asignarCaso } = preparar({ estado });
    const caso = await asignarCaso({ id: 10, usuario_id: 4 });
    assert.equal(caso.agente_id, 4);
    assert.equal(caso.estado, estado);
  });
}

test('caso inexistente responde 404', async () => {
  const { asignarCaso } = preparar();
  await assert.rejects(asignarCaso({ id: 77, usuario_id: 3 }), { status: 404 });
});

for (const [id, usuario_id] of [['abc', 3], [0, 3], [1.5, 3], [10, undefined], [10, [3]], [10, -1]]) {
  test(`datos inválidos (${JSON.stringify({ id, usuario_id })}) responden 400 sin escribir`, async () => {
    const { asignarCaso, datos } = preparar();
    await assert.rejects(asignarCaso({ id, usuario_id }), { status: 400 });
    assert.equal(datos.historial.length, 0);
  });
}

test('regla 5: si falla el historial se revierte la asignación', async () => {
  const base = preparar();
  base.repos.historial.registrar = async () => { throw new Error('Fallo de historial'); };
  await assert.rejects(base.asignarCaso({ id: 10, usuario_id: 3 }), /Fallo de historial/);
  assert.equal(base.datos.casos[0].agente_id, null);
  assert.equal(base.datos.casos[0].fecha_asignacion, null);
});

test('si otro agente gana la carrera, el UPDATE condicional evita la doble asignación (409)', async () => {
  const base = preparar();
  const original = base.repos.casos.buscarPorId;
  // Simula que el caso se leyó libre pero otro agente lo tomó justo antes del UPDATE.
  base.repos.casos.buscarPorId = async (id, opciones) => {
    const caso = await original(id, opciones);
    if (opciones?.bloquear) base.datos.casos[0].agente_id = 4;
    return caso;
  };
  await assert.rejects(base.asignarCaso({ id: 10, usuario_id: 3 }), { status: 409 });
  assert.equal(base.datos.historial.length, 0);
});

test('flujo HU-04 + HU-05: tras asignarse, Carla avanza el caso y Diego no (CP-19)', async () => {
  const { asignarCaso, cambiarEstado, datos } = preparar();
  await asignarCaso({ id: 10, usuario_id: 3 });
  await assert.rejects(cambiarEstado({ id: 10, estado: 'En análisis', usuario_id: 4 }), { status: 403 });
  const caso = await cambiarEstado({ id: 10, estado: 'En análisis', usuario_id: 3 });
  assert.equal(caso.estado, 'En análisis');
  assert.deepEqual(datos.historial.map((h) => h.evento), ['Caso asignado', 'Cambio de estado']);
});
