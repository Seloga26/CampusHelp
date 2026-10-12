const test = require('node:test');
const assert = require('node:assert/strict');
const { crearValidarSolucion } = require('../../src/services/casos/validarSolucion');
const { crearListarAtenciones } = require('../../src/services/casos/listarAtenciones');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');

const MOTIVO = 'La impresora sigue sin imprimir';

function preparar({ estado = 'En validación', conAtencion = true } = {}) {
  const base = crearReposEnMemoria({
    casos: [{ id: 10, agente_id: 3, estado, fecha_cierre: null }],
  });
  if (conAtencion) {
    base.datos.atenciones.push({
      id: 1, caso_id: 10, diagnostico: 'Cola de impresión bloqueada',
      solucion: 'Se reinició el servicio de impresión', fecha: '2026-10-07 10:00:00', agente_id: 3,
    });
  }
  return {
    ...base,
    validarSolucion: crearValidarSolucion(base),
    listarAtenciones: crearListarAtenciones(base),
  };
}

test('CP-09: Elena aprueba y el caso queda Cerrada con fecha de cierre e historial', async () => {
  const { validarSolucion, datos } = preparar();
  const caso = await validarSolucion({ id: 10, decision: 'aprobar', usuario_id: 5 });
  assert.equal(caso.estado, 'Cerrada');
  assert.ok(caso.fecha_cierre);
  assert.equal(datos.casos[0].agente_id, 3);
  assert.deepEqual(datos.historial, [{
    id: 1, casoId: 10, evento: 'Solución aprobada',
    estadoAnterior: 'En validación', estadoNuevo: 'Cerrada', usuarioId: 5,
  }]);
});

test('CP-08: Elena devuelve con motivo; vuelve a En atención con el mismo agente', async () => {
  const { validarSolucion, datos } = preparar();
  const caso = await validarSolucion({ id: 10, decision: 'devolver', motivo: `  ${MOTIVO}  `, usuario_id: 5 });
  assert.equal(caso.estado, 'En atención');
  assert.equal(caso.agente_id, 3);
  assert.equal(caso.fecha_cierre, null);
  assert.deepEqual(datos.historial, [{
    id: 1, casoId: 10, evento: `Solución devuelta: ${MOTIVO}`,
    estadoAnterior: 'En validación', estadoNuevo: 'En atención', usuarioId: 5,
  }]);
});

test('CP-23: un Agente (u otro rol, o un usuario inactivo) recibe 403 y no cambia nada', async () => {
  for (const usuario_id of [1, 3, 6, 99]) {
    const { validarSolucion, datos } = preparar();
    await assert.rejects(validarSolucion({ id: 10, decision: 'aprobar', usuario_id }), { status: 403 });
    assert.equal(datos.casos[0].estado, 'En validación');
    assert.deepEqual(datos.historial, []);
  }
  const base = preparar();
  base.datos.usuarios.find((u) => u.id === 5).activo = false;
  await assert.rejects(base.validarSolucion({ id: 10, decision: 'aprobar', usuario_id: 5 }), { status: 403 });
});

test('CP-24: aprobar o devolver un caso que no está En validación responde 409', async () => {
  for (const estado of ['Pendiente', 'En análisis', 'En atención', 'Cerrada']) {
    for (const entrada of [{ decision: 'aprobar' }, { decision: 'devolver', motivo: MOTIVO }]) {
      const { validarSolucion, datos } = preparar({ estado });
      await assert.rejects(validarSolucion({ id: 10, usuario_id: 5, ...entrada }), { status: 409 });
      assert.equal(datos.casos[0].estado, estado);
      assert.deepEqual(datos.historial, []);
    }
  }
});

test('CP-25: devolver sin motivo, corto o demasiado largo responde 400 y el caso sigue En validación', async () => {
  for (const motivo of [undefined, null, '', '         ', 'corto', '123456789', 123456789012, ['x'], 'x'.repeat(101)]) {
    const { validarSolucion, datos } = preparar();
    await assert.rejects(validarSolucion({ id: 10, decision: 'devolver', motivo, usuario_id: 5 }), { status: 400 });
    assert.equal(datos.casos[0].estado, 'En validación');
    assert.deepEqual(datos.historial, []);
  }
});

test('HU-07: el motivo acepta exactamente 10 y 100 caracteres', async () => {
  for (const motivo of ['1234567890', 'x'.repeat(100)]) {
    const { validarSolucion, datos } = preparar();
    await validarSolucion({ id: 10, decision: 'devolver', motivo, usuario_id: 5 });
    assert.equal(datos.casos[0].estado, 'En atención');
    assert.ok(datos.historial[0].evento.length <= 120);
  }
});

test('HU-07: no se cierra un caso sin solución registrada (409)', async () => {
  const { validarSolucion, datos } = preparar({ conAtencion: false });
  await assert.rejects(validarSolucion({ id: 10, decision: 'aprobar', usuario_id: 5 }), { status: 409 });
  assert.equal(datos.casos[0].estado, 'En validación');
  assert.equal(datos.casos[0].fecha_cierre, null);
  assert.deepEqual(datos.historial, []);
});

test('HU-07: caso inexistente 404; datos inválidos 400 sin abrir transacción', async () => {
  await assert.rejects(preparar().validarSolucion({ id: 99, decision: 'aprobar', usuario_id: 5 }), { status: 404 });
  const validarSolucion = crearValidarSolucion({
    enTransaccion: async () => { assert.fail('No debe abrir una transacción'); },
  });
  const base = { id: 10, decision: 'aprobar', usuario_id: 5 };
  const invalidos = [undefined, null, {}, [], ...[
    { id: 'abc' }, { id: 0 }, { id: 1.5 }, { id: 2147483648 }, { id: [10] },
    { usuario_id: undefined }, { usuario_id: 0 }, { usuario_id: true },
    { decision: undefined }, { decision: 'Aprobar' }, { decision: 'cerrar' }, { decision: ['aprobar'] },
  ].map((cambios) => ({ ...base, ...cambios }))];
  for (const datos of invalidos) {
    await assert.rejects(validarSolucion(datos), { status: 400 });
  }
});

test('HU-07: un fallo del historial revierte el cierre', async () => {
  const base = preparar();
  const antes = structuredClone(base.datos);
  base.repos.historial.registrar = async () => { throw new Error('Historial no disponible'); };
  await assert.rejects(base.validarSolucion({ id: 10, decision: 'aprobar', usuario_id: 5 }), /Historial no disponible/);
  assert.deepEqual(base.datos, antes);
});

test('HU-07: una devolución permite una nueva atención y una segunda validación', async () => {
  const { validarSolucion, repos, datos } = preparar();
  await validarSolucion({ id: 10, decision: 'devolver', motivo: MOTIVO, usuario_id: 5 });
  await repos.atenciones.crear({ casoId: 10, diagnostico: 'Controlador desactualizado', solucion: 'Se instaló el controlador', agenteId: 3 });
  await repos.casos.actualizarEstado(10, 'En validación');
  const caso = await validarSolucion({ id: 10, decision: 'aprobar', usuario_id: 5 });
  assert.equal(caso.estado, 'Cerrada');
  assert.deepEqual(datos.historial.map((h) => h.evento), [`Solución devuelta: ${MOTIVO}`, 'Solución aprobada']);
});

test('HU-07 listarAtenciones: la más reciente primero, con el nombre del agente', async () => {
  const { listarAtenciones, repos } = preparar();
  await repos.atenciones.crear({ casoId: 10, diagnostico: 'Segundo diagnóstico', solucion: 'Segunda solución', agenteId: 3 });
  const lista = await listarAtenciones({ id: 10 });
  assert.equal(lista.length, 2);
  assert.equal(lista[0].diagnostico, 'Segundo diagnóstico');
  assert.equal(lista[0].agente, 'Carla Agente');
  assert.deepEqual(Object.keys(lista[0]).sort(), ['agente', 'diagnostico', 'fecha', 'id', 'solucion']);
});

test('HU-07 listarAtenciones: 404 si el caso no existe y 400 si el id es inválido', async () => {
  const { listarAtenciones } = preparar();
  await assert.rejects(listarAtenciones({ id: 99 }), { status: 404 });
  for (const id of [undefined, 'abc', 0, -1, 1.5, [10]]) {
    await assert.rejects(listarAtenciones({ id }), { status: 400 });
  }
  assert.deepEqual(await preparar({ conAtencion: false }).listarAtenciones({ id: 10 }), []);
});