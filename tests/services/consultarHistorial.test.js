// HU-08 Consultar el historial — pruebas del servicio sin MySQL.
// Criterios: docs/historias/HU-08.md (CP-26, CP-27, CP-28).
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearServicios } = require('../../src/config/contenedor');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');

const incidente = {
  tipo: 'Incidente', titulo: 'Sin Wi-Fi en bloque B', descripcion: 'No conecta desde las 8 am',
  prioridad: 'P1', categoria_id: 8, usuario_id: 1,
};

// Un caso de Ana registrado, asignado a Carla y pasado a En análisis (Escenario 1).
async function preparar() {
  const base = crearReposEnMemoria();
  const s = crearServicios(base);
  const { id } = await s.registrarCaso(incidente);
  await s.asignarCaso({ id, usuario_id: 3 });
  await s.cambiarEstado({ id, estado: 'En análisis', usuario_id: 3 });
  return { ...base, s, id };
}

test('CP-26: un agente ve 3 eventos en orden con estados, usuario, rol y fecha', async () => {
  const { s, id } = await preparar();
  const eventos = await s.consultarHistorial({ id, usuario_id: 4 });
  assert.deepEqual(eventos.map((e) => e.evento), ['Caso registrado', 'Caso asignado', 'Cambio de estado']);
  assert.deepEqual(eventos.map((e) => [e.estado_anterior, e.estado_nuevo]), [
    [null, 'Pendiente'], [null, null], ['Pendiente', 'En análisis'],
  ]);
  assert.deepEqual(eventos.map((e) => `${e.usuario} (${e.rol})`), [
    'Ana Solicitante (Solicitante)', 'Carla Agente (Agente)', 'Carla Agente (Agente)',
  ]);
  for (const e of eventos) assert.match(e.fecha, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  assert.deepEqual(Object.keys(eventos[0]).sort(),
    ['estado_anterior', 'estado_nuevo', 'evento', 'fecha', 'id', 'rol', 'usuario']);
});

test('regla 1: Validador, Administrador y la solicitante dueña también lo consultan', async () => {
  const { s, id } = await preparar();
  for (const usuario_id of [5, 6, 1]) {
    assert.equal((await s.consultarHistorial({ id, usuario_id })).length, 3);
  }
});

test('CP-27: Bruno (Solicitante) no puede ver el historial de un caso de Ana (403)', async () => {
  const { s, id } = await preparar();
  await assert.rejects(s.consultarHistorial({ id, usuario_id: 2 }), { status: 403, message: /tus propios casos/ });
});

test('CP-28: un caso inexistente responde 404', async () => {
  const { s } = await preparar();
  await assert.rejects(s.consultarHistorial({ id: 999, usuario_id: 3 }), { status: 404 });
});

test('usuario inactivo o inexistente responde 403', async () => {
  const { s, id, datos } = await preparar();
  datos.usuarios.find((u) => u.id === 5).activo = false;
  await assert.rejects(s.consultarHistorial({ id, usuario_id: 5 }), { status: 403 });
  await assert.rejects(s.consultarHistorial({ id, usuario_id: 77 }), { status: 403 });
});

for (const [id, usuario_id] of [['abc', 3], [0, 3], [1, undefined], [1, ''], [1, '1.5'], [1, '-3']]) {
  test(`datos inválidos (${JSON.stringify({ id, usuario_id })}) responden 400`, async () => {
    const { s } = await preparar();
    await assert.rejects(s.consultarHistorial({ id, usuario_id }), { status: 400 });
  });
}

test('acepta usuario_id como texto porque llega por la URL (?usuario_id=3)', async () => {
  const { s, id } = await preparar();
  assert.equal((await s.consultarHistorial({ id, usuario_id: '3' })).length, 3);
});

test('solo devuelve los eventos del caso pedido', async () => {
  const { s, id } = await preparar();
  const otro = await s.registrarCaso({ ...incidente, usuario_id: 2 });
  assert.equal((await s.consultarHistorial({ id: otro.id, usuario_id: 2 })).length, 1);
  assert.equal((await s.consultarHistorial({ id, usuario_id: 3 })).length, 3);
});

test('regla 4: consultar no modifica el historial', async () => {
  const { s, id, datos } = await preparar();
  const antes = JSON.stringify(datos.historial);
  await s.consultarHistorial({ id, usuario_id: 3 });
  assert.equal(JSON.stringify(datos.historial), antes);
});
