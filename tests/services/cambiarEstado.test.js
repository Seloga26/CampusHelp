const test = require('node:test');
const assert = require('node:assert/strict');
const { crearCambiarEstado } = require('../../src/services/casos/cambiarEstado');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');

// Desde HU-04 solo el agente asignado cambia el estado: el caso base es de Carla (3).
function preparar(estado = 'Pendiente', agente_id = 3) {
  const base = crearReposEnMemoria({ casos: [{ id: 10, estado, agente_id, fecha_inicio_atencion: null }] });
  return { ...base, cambiarEstado: crearCambiarEstado(base) };
}

test('HU-05 en memoria: cambio e historial se guardan juntos', async () => {
  const { cambiarEstado, datos } = preparar();
  const caso = await cambiarEstado({ id: 10, estado: 'En análisis', usuario_id: 3 });
  assert.equal(caso.estado, 'En análisis');
  assert.equal(datos.historial.length, 1);
  assert.equal(datos.historial[0].estadoAnterior, 'Pendiente');
  assert.equal(datos.historial[0].usuarioId, 3);
});

for (const inicial of ['Pendiente', 'Cerrada', 'En validación']) {
  test(`HU-05 en memoria: rechaza ${inicial} → En atención`, async () => {
    const { cambiarEstado, datos } = preparar(inicial);
    await assert.rejects(cambiarEstado({ id: 10, estado: 'En atención', usuario_id: 3 }), { status: 409 });
    assert.equal(datos.casos[0].estado, inicial);
    assert.equal(datos.historial.length, 0);
  });
}

test('HU-05 en memoria: solo un agente puede cambiar estado', async () => {
  const { cambiarEstado, datos } = preparar();
  await assert.rejects(cambiarEstado({ id: 10, estado: 'En análisis', usuario_id: 1 }), { status: 403 });
  assert.equal(datos.casos[0].estado, 'Pendiente');
});

test('HU-05 en memoria: fallo del historial revierte estado y fecha', async () => {
  const base = preparar('En análisis');
  base.repos.historial.registrar = async () => { throw new Error('Fallo de historial'); };
  await assert.rejects(base.cambiarEstado({ id: 10, estado: 'En atención', usuario_id: 3 }), /Fallo de historial/);
  assert.equal(base.datos.casos[0].estado, 'En análisis');
  assert.equal(base.datos.casos[0].fecha_inicio_atencion, null);
});

test('HU-05 en memoria: fecha inicial se mantiene hasta validación', async () => {
  const { cambiarEstado, repos } = preparar('En análisis');
  const enAtencion = await cambiarEstado({ id: 10, estado: 'En atención', usuario_id: 3 });
  assert.ok(enAtencion.fecha_inicio_atencion);
  await repos.atenciones.crear({ casoId: 10, agenteId: 3, diagnostico: 'Diagnóstico de prueba', solucion: 'Solución de prueba' });
  const enValidacion = await cambiarEstado({ id: 10, estado: 'En validación', usuario_id: 3 });
  assert.equal(enValidacion.fecha_inicio_atencion, enAtencion.fecha_inicio_atencion);
});

// ---------------------------------------------------------------- HU-04 regla 7
test('CP-19: un agente que no es el asignado no puede cambiar el estado (403)', async () => {
  const { cambiarEstado, datos } = preparar('Pendiente', 3);
  await assert.rejects(cambiarEstado({ id: 10, estado: 'En análisis', usuario_id: 4 }), {
    status: 403, message: /agente asignado/,
  });
  assert.equal(datos.casos[0].estado, 'Pendiente');
  assert.equal(datos.historial.length, 0);
});

test('HU-04: un caso sin agente no sale de Pendiente hasta que alguien se lo asigne', async () => {
  const { cambiarEstado, datos } = preparar('Pendiente', null);
  await assert.rejects(cambiarEstado({ id: 10, estado: 'En análisis', usuario_id: 3 }), {
    status: 403, message: /Asígnate el caso/,
  });
  assert.equal(datos.casos[0].estado, 'Pendiente');
  assert.equal(datos.historial.length, 0);
});

test('HU-04: un caso cerrado sigue respondiendo 409 aunque el agente no sea el asignado', async () => {
  const { cambiarEstado } = preparar('Cerrada', 3);
  await assert.rejects(cambiarEstado({ id: 10, estado: 'En análisis', usuario_id: 4 }), { status: 409 });
});
