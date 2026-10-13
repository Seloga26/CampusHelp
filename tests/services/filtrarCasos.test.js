// Pruebas de HU-09 (CP-10, CP-29, CP-30, CP-31): filtros de GET /api/casos
// con repositorios en memoria (sin MySQL).
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');
const { crearListarCasos } = require('../../src/services/casos/listarCasos');

// Categorías del fake: 1 Computador (área 1 Hardware), 5 Instalación (área 2 Software),
// 8 Wi-Fi (área 3 Red y conectividad), 11 Contraseña (área 4 Cuentas y acceso).
function casosDePrueba() {
  const base = { descripcion: 'Descripción de prueba', agente_id: null, usuario_id: 1 };
  return [
    { ...base, id: 1, tipo: 'Incidente', titulo: 'Wi-Fi caído en biblioteca', prioridad: 'P1', estado: 'Pendiente', categoria_id: 8, fecha_creacion: '2026-10-05 08:00:00' },
    { ...base, id: 2, tipo: 'Incidente', titulo: 'Wi-Fi lento en aula', prioridad: 'P2', estado: 'Cerrada', categoria_id: 8, fecha_creacion: '2026-10-05 09:00:00' },
    { ...base, id: 3, tipo: 'Solicitud de servicio', titulo: 'Acceso a Wi-Fi invitados', prioridad: 'P1', estado: 'Cerrada', categoria_id: 8, fecha_creacion: '2026-10-05 10:00:00' },
    { ...base, id: 4, tipo: 'Incidente', titulo: 'Portátil no enciende', prioridad: 'P1', estado: 'Pendiente', categoria_id: 1, fecha_creacion: '2026-10-05 11:00:00' },
    { ...base, id: 5, tipo: 'Solicitud de servicio', titulo: 'Instalar Photoshop', prioridad: 'P3', estado: 'En análisis', categoria_id: 5, fecha_creacion: '2026-10-05 12:00:00' },
    { ...base, id: 6, tipo: 'Incidente', titulo: 'Contraseña bloqueada', prioridad: 'P2', estado: 'Cerrada', categoria_id: 11, fecha_creacion: '2026-10-04 12:00:00' },
  ];
}

function armar() {
  const { repos, datos } = crearReposEnMemoria({ casos: casosDePrueba() });
  return { listarCasos: crearListarCasos({ repos }), datos };
}

const ids = (casos) => casos.map((c) => c.id);

test('CP-10: filtro combinado por tipo, área y prioridad', async () => {
  const { listarCasos } = armar();
  const casos = await listarCasos({ tipo: 'Incidente', area_id: '3', prioridad: 'P1' });
  assert.deepEqual(ids(casos), [1]);
});

test('CP-29: estado Cerrada y categoría Wi-Fi, del más reciente al más antiguo', async () => {
  const { listarCasos } = armar();
  const casos = await listarCasos({ estado: 'Cerrada', categoria_id: '8' });
  assert.deepEqual(ids(casos), [3, 2]);
});

test('HU-09: cada filtro funciona solo', async () => {
  const { listarCasos } = armar();
  assert.deepEqual(ids(await listarCasos({ estado: 'Pendiente' })), [4, 1]);
  assert.deepEqual(ids(await listarCasos({ tipo: 'Solicitud de servicio' })), [5, 3]);
  assert.deepEqual(ids(await listarCasos({ prioridad: 'P3' })), [5]);
  assert.deepEqual(ids(await listarCasos({ area_id: '1' })), [4]);
  assert.deepEqual(ids(await listarCasos({ categoria_id: '11' })), [6]);
});

test('HU-09: sin filtros devuelve todos los casos, incluidos los cerrados', async () => {
  const { listarCasos } = armar();
  assert.deepEqual(ids(await listarCasos({})), [5, 4, 3, 2, 1, 6]);
});

test('CP-30: valores fuera del catálogo responden 400 con los valores permitidos', async () => {
  const { listarCasos } = armar();
  await assert.rejects(listarCasos({ prioridad: 'P9' }),
    (err) => err.status === 400 && /P1, P2, P3/.test(err.message));
  await assert.rejects(listarCasos({ estado: 'Abierto' }),
    (err) => err.status === 400 && /Pendiente/.test(err.message));
  await assert.rejects(listarCasos({ tipo: 'Queja' }),
    (err) => err.status === 400 && /Incidente/.test(err.message));
});

test('CP-30: ids inválidos, filtros vacíos y filtros repetidos responden 400', async () => {
  const { listarCasos } = armar();
  const invalidos = [
    { area_id: 'abc' }, { area_id: '0' }, { area_id: '-1' }, { area_id: '1.5' }, { area_id: '' },
    { area_id: '2147483648' }, { area_id: ['1', '2'] },
    { categoria_id: 'x' }, { categoria_id: '0' }, { categoria_id: ['8', '9'] },
    { prioridad: '' }, { prioridad: 'p1' }, { prioridad: ['P1', 'P2'] },
    { estado: ['Pendiente', 'Cerrada'] }, { tipo: '' },
  ];
  for (const parametros of invalidos) {
    await assert.rejects(listarCasos(parametros), { status: 400 }, JSON.stringify(parametros));
  }
});

test('CP-31: una combinación sin coincidencias devuelve una lista vacía', async () => {
  const { listarCasos } = armar();
  assert.deepEqual(await listarCasos({ prioridad: 'P3', area_id: '3' }), []);
  assert.deepEqual(await listarCasos({ categoria_id: '999' }), []);
});

test('HU-09: los filtros se combinan con usuario_id y con la vista bandeja', async () => {
  const { listarCasos, datos } = armar();
  datos.casos.find((c) => c.id === 4).usuario_id = 2;
  assert.deepEqual(ids(await listarCasos({ usuario_id: '2', prioridad: 'P1' })), [4]);
  assert.deepEqual(ids(await listarCasos({ usuario_id: '1', prioridad: 'P1' })), [3, 1]);
  // bandeja excluye cerrados y ordena por prioridad; el filtro de tipo se suma
  assert.deepEqual(ids(await listarCasos({ vista: 'bandeja', tipo: 'Incidente' })), [1, 4]);
});

test('HU-09: un valor con texto SQL se rechaza y no llega al repositorio', async () => {
  const { repos } = crearReposEnMemoria({ casos: casosDePrueba() });
  repos.casos.listar = async () => { assert.fail('No debe consultar el repositorio'); };
  const listarCasos = crearListarCasos({ repos });
  await assert.rejects(listarCasos({ prioridad: "P1' OR '1'='1" }), { status: 400 });
  await assert.rejects(listarCasos({ area_id: '1 OR 1=1' }), { status: 400 });
});