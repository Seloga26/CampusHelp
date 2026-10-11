// HU-10 Indicadores del servicio — pruebas del servicio sin MySQL.
// Criterios: docs/historias/HU-10.md (CP-32, CP-33, CP-34, CP-35).
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearServicios } = require('../../src/config/contenedor');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');

// Caso con fechas controladas: `horas` desplaza cada fecha desde la creación.
function caso(id, tipo, prioridad, estado, { asignado, inicio, cierre } = {}) {
  const base = new Date('2026-10-10T08:00:00Z');
  const fecha = (horas) => (horas === undefined ? null
    : new Date(base.getTime() + horas * 3600000).toISOString().slice(0, 19).replace('T', ' '));
  return {
    id, tipo, prioridad, estado, titulo: `Caso ${id}`, descripcion: 'Descripción de prueba',
    usuario_id: 1, categoria_id: 8, agente_id: asignado === undefined ? null : 3,
    fecha_creacion: fecha(0), fecha_asignacion: fecha(asignado),
    fecha_inicio_atencion: fecha(inicio), fecha_cierre: fecha(cierre),
  };
}

// Escenario 1: 3 incidentes y 2 solicitudes en distintos estados y prioridades.
function cincoCasos() {
  return [
    caso(1, 'Incidente', 'P1', 'Pendiente'),
    caso(2, 'Incidente', 'P1', 'En análisis', { asignado: 0.5 }),
    caso(3, 'Incidente', 'P2', 'En validación', { asignado: 0.5, inicio: 1 }),
    caso(4, 'Solicitud de servicio', 'P2', 'Cerrada', { asignado: 0.5, inicio: 1, cierre: 2 }),
    caso(5, 'Solicitud de servicio', 'P3', 'Cerrada', { asignado: 0.5, inicio: 1.5, cierre: 4 }),
  ];
}

function servicios(casos) {
  return crearServicios(crearReposEnMemoria({ casos }));
}

test('CP-32: los conteos por estado, tipo y prioridad coinciden con los datos, incluidos los ceros', async () => {
  const r = await servicios(cincoCasos()).consultarIndicadores({ usuario_id: 6 });
  assert.equal(r.total, 5);
  assert.equal(r.abiertos, 3);
  assert.equal(r.cerrados, 2);
  assert.deepEqual(r.por_estado, {
    'Pendiente': 1, 'En análisis': 1, 'En atención': 0, 'En validación': 1, 'Cerrada': 2,
  });
  assert.deepEqual(r.por_tipo, { 'Incidente': 3, 'Solicitud de servicio': 2 });
  assert.deepEqual(r.por_prioridad, { P1: 2, P2: 2, P3: 1 });
  // Regla 3: las claves salen en el orden del catálogo (así se pintan las barras).
  assert.deepEqual(Object.keys(r.por_estado),
    ['Pendiente', 'En análisis', 'En atención', 'En validación', 'Cerrada']);
});

test('CP-33: casos cerrados en 2 h y 4 h → resolución promedio 3,0 h sobre 2 casos', async () => {
  const { tiempos } = await servicios(cincoCasos()).consultarIndicadores({ usuario_id: 6 });
  assert.deepEqual(tiempos.resolucion, { promedio_horas: 3, casos: 2 });
  // Asignación: 4 casos asignados a los 30 min → 0,5 h.
  assert.deepEqual(tiempos.asignacion, { promedio_horas: 0.5, casos: 4 });
  // Atención: cerrados con inicio → (2−1) y (4−1,5) = 1 h y 2,5 h → 1,75 → 1,8 h.
  assert.deepEqual(tiempos.atencion, { promedio_horas: 1.8, casos: 2 });
});

test('CP-34: sin casos cerrados, atención y resolución quedan en null ("Sin datos")', async () => {
  const sinCerrar = cincoCasos().filter((c) => c.estado !== 'Cerrada');
  const r = await servicios(sinCerrar).consultarIndicadores({ usuario_id: 6 });
  assert.equal(r.cerrados, 0);
  assert.deepEqual(r.tiempos.atencion, { promedio_horas: null, casos: 0 });
  assert.deepEqual(r.tiempos.resolucion, { promedio_horas: null, casos: 0 });
  assert.deepEqual(r.tiempos.asignacion, { promedio_horas: 0.5, casos: 2 });
});

test('sin ningún caso: todo en cero y los tres tiempos en null', async () => {
  const r = await servicios([]).consultarIndicadores({ usuario_id: 6 });
  assert.deepEqual([r.total, r.abiertos, r.cerrados], [0, 0, 0]);
  assert.ok(Object.values(r.por_estado).every((n) => n === 0));
  assert.ok(Object.values(r.tiempos).every((t) => t.promedio_horas === null && t.casos === 0));
});

test('CP-35: Agente, Validador y Solicitante reciben 403', async () => {
  const s = servicios(cincoCasos());
  for (const usuario_id of [3, 5, 1]) {
    await assert.rejects(s.consultarIndicadores({ usuario_id }), { status: 403, message: /administrador/ });
  }
});

test('administrador inactivo o inexistente recibe 403; usuario_id inválido, 400', async () => {
  const base = crearReposEnMemoria({ casos: cincoCasos() });
  const s = crearServicios(base);
  base.datos.usuarios.find((u) => u.id === 6).activo = false;
  await assert.rejects(s.consultarIndicadores({ usuario_id: 6 }), { status: 403 });
  await assert.rejects(s.consultarIndicadores({ usuario_id: 77 }), { status: 403 });
  for (const usuario_id of [undefined, '', 'abc', 0, -1, '1.5']) {
    await assert.rejects(s.consultarIndicadores({ usuario_id }), { status: 400 });
  }
});

test('regla 6: consultar no modifica los casos', async () => {
  const base = crearReposEnMemoria({ casos: cincoCasos() });
  const antes = JSON.stringify(base.datos.casos);
  await crearServicios(base).consultarIndicadores({ usuario_id: 6 });
  assert.equal(JSON.stringify(base.datos.casos), antes);
});

test('el flujo real de los servicios alimenta los indicadores', async () => {
  const s = crearServicios(crearReposEnMemoria());
  const { id } = await s.registrarCaso({
    tipo: 'Incidente', titulo: 'Sin Wi-Fi en bloque B', descripcion: 'No conecta desde las 8 am',
    prioridad: 'P1', categoria_id: 8, usuario_id: 1,
  });
  await s.asignarCaso({ id, usuario_id: 3 });
  const r = await s.consultarIndicadores({ usuario_id: '6' });
  assert.equal(r.total, 1);
  assert.equal(r.por_estado.Pendiente, 1);
  assert.equal(r.tiempos.asignacion.casos, 1);
  assert.equal(r.tiempos.asignacion.promedio_horas, 0);
});
