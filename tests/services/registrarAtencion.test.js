const test = require('node:test');
const assert = require('node:assert/strict');
const { crearRegistrarAtencion } = require('../../src/services/casos/registrarAtencion');
const { crearCambiarEstado } = require('../../src/services/casos/cambiarEstado');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');

const entrada = {
  id: 10, usuario_id: 3,
  diagnostico: 'El AP del bloque B estaba apagado',
  solucion: 'Se reinició el AP y se verificó la conexión',
};

function preparar(cambios = {}) {
  const base = crearReposEnMemoria({
    casos: [{ id: 10, agente_id: 3, estado: 'En atención', ...cambios }],
  });
  return {
    ...base,
    registrarAtencion: crearRegistrarAtencion(base),
    cambiarEstado: crearCambiarEstado(base),
  };
}

test('CP-07: registra diagnóstico, solución, agente y fecha sin cambiar el estado', async () => {
  const { registrarAtencion, datos } = preparar();
  const atencion = await registrarAtencion({ ...entrada, diagnostico: `  ${entrada.diagnostico}  ` });
  assert.equal(atencion.caso_id, 10);
  assert.equal(atencion.agente_id, 3);
  assert.equal(atencion.diagnostico, entrada.diagnostico);
  assert.equal(atencion.solucion, entrada.solucion);
  assert.ok(atencion.id);
  assert.ok(atencion.fecha);
  assert.deepEqual(datos.atenciones, [atencion]);
  assert.equal(datos.casos[0].estado, 'En atención');
  assert.deepEqual(datos.historial, [{
    id: 1, casoId: 10, evento: 'Atención registrada',
    estadoAnterior: null, estadoNuevo: null, usuarioId: 3,
  }]);
});

test('CP-20: otro agente no registra una atención; tampoco un caso sin asignar', async () => {
  for (const agente_id of [4, null]) {
    const { registrarAtencion, datos } = preparar({ agente_id });
    await assert.rejects(registrarAtencion(entrada), { status: 403 });
    assert.deepEqual(datos.atenciones, []);
    assert.deepEqual(datos.historial, []);
  }
});

test('CP-21: rechaza todos los estados distintos de En atención', async () => {
  for (const estado of ['Pendiente', 'En análisis', 'En validación', 'Cerrada']) {
    const { registrarAtencion, datos } = preparar({ estado });
    await assert.rejects(registrarAtencion(entrada), { status: 409 });
    assert.equal(datos.casos[0].estado, estado);
    assert.deepEqual(datos.atenciones, []);
    assert.deepEqual(datos.historial, []);
  }
});

test('HU-06: exige un agente activo y un caso existente', async () => {
  for (const usuario_id of [1, 5, 6, 99]) {
    const { registrarAtencion, datos } = preparar();
    await assert.rejects(registrarAtencion({ ...entrada, usuario_id }), { status: 403 });
    assert.deepEqual(datos.atenciones, []);
  }
  const base = preparar();
  base.datos.usuarios.find((u) => u.id === 3).activo = false;
  await assert.rejects(base.registrarAtencion(entrada), { status: 403 });
  await assert.rejects(preparar().registrarAtencion({ ...entrada, id: 99 }), { status: 404 });
});

test('HU-06: IDs y textos inválidos se rechazan antes de abrir una transacción', async () => {
  const registrarAtencion = crearRegistrarAtencion({
    enTransaccion: async () => { assert.fail('No debe abrir una transacción'); },
  });
  const invalidos = [undefined, null, {}, [], ...[
    { id: 'abc' }, { id: 0 }, { id: 1.2 }, { id: 2147483648 }, { id: [10] },
    { usuario_id: true }, { usuario_id: 0 }, { usuario_id: [3] },
    { diagnostico: null }, { diagnostico: 1234567890 }, { diagnostico: '         ' },
    { diagnostico: '123456789' }, { solucion: '123456789' },
    { solucion: '  corto  ' }, { solucion: {} },
  ].map((cambios) => ({ ...entrada, ...cambios }))];
  for (const datos of invalidos) {
    await assert.rejects(registrarAtencion(datos), { status: 400 });
  }
});

test('HU-06: acepta exactamente 10 caracteres y conserva atenciones anteriores', async () => {
  const { registrarAtencion, datos } = preparar();
  const primera = await registrarAtencion({ ...entrada, diagnostico: '1234567890', solucion: '1234567890' });
  const segunda = await registrarAtencion(entrada);
  assert.notEqual(primera.id, segunda.id);
  assert.equal(datos.atenciones.length, 2);
  assert.deepEqual(datos.atenciones[0], primera);
  assert.equal(datos.historial.length, 2);
});

test('HU-06: fallo del historial revierte la atención y conserva registros previos', async () => {
  const base = preparar();
  await base.registrarAtencion(entrada);
  const antes = structuredClone(base.datos);
  base.repos.historial.registrar = async () => { throw new Error('Historial no disponible'); };
  await assert.rejects(base.registrarAtencion(entrada), /Historial no disponible/);
  assert.deepEqual(base.datos, antes);
});

test('HU-06: fallo al guardar atención no crea un evento de historial', async () => {
  const base = preparar();
  base.repos.atenciones.crear = async () => { throw new Error('Atención no disponible'); };
  await assert.rejects(base.registrarAtencion(entrada), /Atención no disponible/);
  assert.deepEqual(base.datos.atenciones, []);
  assert.deepEqual(base.datos.historial, []);
});

test('CP-22: sin atención no se valida; con atención se avanza y no se pierde la fecha inicial', async () => {
  const base = preparar({ fecha_inicio_atencion: '2026-10-07 09:00:00' });
  await assert.rejects(base.cambiarEstado({ id: 10, estado: 'En validación', usuario_id: 3 }), { status: 409 });
  assert.equal(base.datos.casos[0].estado, 'En atención');
  assert.deepEqual(base.datos.historial, []);
  await base.registrarAtencion(entrada);
  const caso = await base.cambiarEstado({ id: 10, estado: 'En validación', usuario_id: 3 });
  assert.equal(caso.estado, 'En validación');
  assert.equal(caso.fecha_inicio_atencion, '2026-10-07 09:00:00');
  assert.deepEqual(base.datos.historial.map((h) => h.evento), ['Atención registrada', 'Cambio de estado']);
});
