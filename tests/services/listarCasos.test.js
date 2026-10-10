// Pruebas de HU-02 (CP-12) y de la vista de bandeja de HU-03 con repositorios en memoria.
const test = require('node:test');
const assert = require('node:assert');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');
const { crearListarCasos } = require('../../src/services/casos/listarCasos');
const { ErrorValidacion } = require('../../src/domain/errores');
const { crearRegistrarCaso } = require('../../src/services/casos/registrarCaso');

// Mismos casos que database/seed.sql: Ana (1) tiene 3, Bruno (2) tiene 1.
function casosDePrueba() {
  const base = { descripcion: 'Descripción de prueba', categoria_id: 1, agente_id: null };
  return [
    { ...base, id: 1, tipo: 'Incidente', titulo: 'Pantalla azul', prioridad: 'P1', estado: 'Pendiente', usuario_id: 1, fecha_creacion: '2026-10-05 08:00:00' },
    { ...base, id: 2, tipo: 'Solicitud de servicio', titulo: 'Instalar Photoshop', prioridad: 'P2', estado: 'En análisis', usuario_id: 1, fecha_creacion: '2026-10-05 09:30:00' },
    { ...base, id: 3, tipo: 'Incidente', titulo: 'No conecta al Wi-Fi', prioridad: 'P1', estado: 'Pendiente', usuario_id: 2, fecha_creacion: '2026-10-05 08:15:00' },
    { ...base, id: 4, tipo: 'Solicitud de servicio', titulo: 'Cambio de teclado', prioridad: 'P3', estado: 'Cerrada', usuario_id: 1, fecha_creacion: '2026-10-04 15:00:00' },
  ];
}

function armar() {
  const { repos, datos } = crearReposEnMemoria({ casos: casosDePrueba() });
  return { listarCasos: crearListarCasos({ repos }), repos, datos };
}

// CP-12 — Ana solo ve sus casos, el más reciente primero
test('CP-12: un solicitante solo ve sus propios casos', async () => {
  const { listarCasos } = armar();

  const casos = await listarCasos({ usuario_id: '1' });

  assert.ok(casos.length > 0);
  assert.ok(casos.every((c) => c.usuario_id === 1));
  assert.ok(!casos.some((c) => c.titulo === 'No conecta al Wi-Fi'), 'no debe ver el caso de Bruno');
});

test('CP-12: ordena del más reciente al más antiguo', async () => {
  const { listarCasos } = armar();

  const casos = await listarCasos({ usuario_id: '1' });

  assert.deepEqual(casos.map((c) => c.id), [2, 1, 4]);
});

test('CP-12: incluye los casos en estado Cerrada', async () => {
  const { listarCasos } = armar();

  const casos = await listarCasos({ usuario_id: '1' });

  assert.ok(casos.some((c) => c.estado === 'Cerrada'));
});

test('CP-12: un solicitante sin casos recibe una lista vacía', async () => {
  const { listarCasos } = armar();

  const casos = await listarCasos({ usuario_id: '2' });
  const sinCasos = await listarCasos({ usuario_id: '99' });

  assert.equal(casos.length, 1); // Bruno tiene uno
  assert.deepEqual(sinCasos, []);
});

test('CP-12: el cambio de estado se ve al consultar de nuevo', async () => {
  const { listarCasos, repos } = armar();
  const antes = await listarCasos({ usuario_id: '1' });
  assert.equal(antes.find((c) => c.id === 1).estado, 'Pendiente');

  await repos.casos.actualizarEstado(1, 'En análisis');
  const despues = await listarCasos({ usuario_id: '1' });

  assert.equal(despues.find((c) => c.id === 1).estado, 'En análisis');
});

test('traduce usuario_id a criterios del repositorio (número, orden recientes)', async () => {
  let recibido;
  const listarCasos = crearListarCasos({
    repos: { casos: { listar: async (criterios) => { recibido = criterios; return []; } } },
  });

  await listarCasos({ usuario_id: '7' });

  assert.deepEqual(recibido, { usuarioId: 7, orden: 'recientes' });
});

test('usuario_id inválido lanza ErrorValidacion y no consulta el repositorio', async () => {
  let consultas = 0;
  const listarCasos = crearListarCasos({
    repos: { casos: { listar: async () => { consultas += 1; return []; } } },
  });

  for (const invalido of ['abc', '', '0', '-3', '1.5', '1 OR 1=1', ['1', '2']]) {
    await assert.rejects(
      () => listarCasos({ usuario_id: invalido }),
      (err) => err instanceof ErrorValidacion && err.status === 400,
      `debería rechazar ${JSON.stringify(invalido)}`
    );
  }
  assert.equal(consultas, 0);
});

test('una vista desconocida lanza ErrorValidacion', async () => {
  const { listarCasos } = armar();

  await assert.rejects(() => listarCasos({ vista: 'otra' }), ErrorValidacion);
});

// HU-03 — la bandeja sigue funcionando
test('bandeja: excluye cerrados y ordena por prioridad y antigüedad', async () => {
  const { listarCasos } = armar();

  const casos = await listarCasos({ vista: 'bandeja' });

  assert.ok(!casos.some((c) => c.estado === 'Cerrada'));
  // P1 más antiguo (id 1, 08:00), P1 siguiente (id 3, 08:15), luego P2 (id 2)
  assert.deepEqual(casos.map((c) => c.id), [1, 3, 2]);
});

test('traduce vista=bandeja a criterios del repositorio', async () => {
  let recibido;
  const listarCasos = crearListarCasos({
    repos: { casos: { listar: async (criterios) => { recibido = criterios; return []; } } },
  });

  await listarCasos({ vista: 'bandeja' });

  assert.deepEqual(recibido, { soloAbiertos: true, orden: 'bandeja' });
});

test('sin parámetros lista todos del más reciente al más antiguo', async () => {
  const { listarCasos } = armar();

  const casos = await listarCasos({});

  assert.deepEqual(casos.map((c) => c.id), [2, 3, 1, 4]);
});

// CP-13 — bandeja con P1, P2, P3 y un Cerrada
test('CP-13: la bandeja no muestra Cerrada y ordena P1→P3, el más antiguo primero en igual prioridad', async () => {
  const base = { descripcion: 'Descripción de prueba', categoria_id: 1, agente_id: null, usuario_id: 1 };
  const { repos } = crearReposEnMemoria({
    casos: [
      { ...base, id: 1, tipo: 'Incidente', titulo: 'P3 antiguo', prioridad: 'P3', estado: 'Pendiente', fecha_creacion: '2026-10-01 08:00:00' },
      { ...base, id: 2, tipo: 'Incidente', titulo: 'P1 reciente', prioridad: 'P1', estado: 'En atención', fecha_creacion: '2026-10-05 08:00:00' },
      { ...base, id: 3, tipo: 'Incidente', titulo: 'P1 antiguo', prioridad: 'P1', estado: 'Pendiente', fecha_creacion: '2026-10-02 08:00:00' },
      { ...base, id: 4, tipo: 'Solicitud de servicio', titulo: 'P2 en validación', prioridad: 'P2', estado: 'En validación', fecha_creacion: '2026-10-03 08:00:00' },
      { ...base, id: 5, tipo: 'Solicitud de servicio', titulo: 'P1 cerrado', prioridad: 'P1', estado: 'Cerrada', fecha_creacion: '2026-10-01 07:00:00' },
    ],
  });
  const listarCasos = crearListarCasos({ repos });

  const casos = await listarCasos({ vista: 'bandeja' });

  assert.ok(!casos.some((c) => c.estado === 'Cerrada'));
  assert.deepEqual(casos.map((c) => c.id), [3, 2, 4, 1]);
});

// HU-03, escenario 3 — un caso recién registrado aparece Pendiente y sin asignar
test('bandeja: un caso recién registrado (HU-01) aparece Pendiente y sin agente', async () => {
  const { repos, enTransaccion } = crearReposEnMemoria();
  const registrarCaso = crearRegistrarCaso({ repos, enTransaccion });
  const listarCasos = crearListarCasos({ repos });

  const nuevo = await registrarCaso({
    tipo: 'Incidente',
    titulo: 'Sin Wi-Fi en bloque B',
    descripcion: 'No conecta desde las 8 am',
    prioridad: 'P1',
    categoria_id: 8,
    usuario_id: 1,
  });
  const bandeja = await listarCasos({ vista: 'bandeja' });

  const enBandeja = bandeja.find((c) => c.id === nuevo.id);
  assert.ok(enBandeja, 'el caso nuevo debe aparecer en la bandeja');
  assert.equal(enBandeja.estado, 'Pendiente');
  assert.equal(enBandeja.agente_id, null);
});