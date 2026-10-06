// Pruebas de HU-01 (CP-01, CP-02, CP-03, CP-11, CP-16) con repositorios en memoria.
const test = require('node:test');
const assert = require('node:assert');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');
const { crearRegistrarCaso } = require('../../src/services/casos/registrarCaso');
const { ErrorValidacion, ErrorPermiso } = require('../../src/domain/errores');

function armar() {
  const { repos, enTransaccion, datos } = crearReposEnMemoria();
  return { registrarCaso: crearRegistrarCaso({ repos, enTransaccion }), datos };
}

const incidenteValido = {
  tipo: 'Incidente',
  titulo: 'Sin Wi-Fi en bloque B',
  descripcion: 'No conecta desde las 8 am',
  prioridad: 'P1',
  categoria_id: 8,
  usuario_id: 1,
};

const solicitudValida = {
  tipo: 'Solicitud de servicio',
  titulo: 'Instalar software de diseño',
  descripcion: 'Necesito AutoCAD en el laboratorio 3',
  prioridad: 'P2',
  categoria_id: 5,
  usuario_id: 1,
};

// CP-01 — Registrar incidente Wi-Fi
test('CP-01: registra un incidente válido en estado Pendiente con id', async () => {
  const { registrarCaso, datos } = armar();

  const caso = await registrarCaso(incidenteValido);

  assert.ok(caso.id);
  assert.equal(caso.estado, 'Pendiente');
  assert.equal(caso.tipo, 'Incidente');
  assert.equal(caso.prioridad, 'P1');
  assert.equal(caso.area, 'Red y conectividad');
  assert.equal(caso.categoria, 'Wi-Fi');
  assert.equal(caso.solicitante, 'Ana Solicitante');
  assert.equal(caso.agente, null);
  assert.equal(datos.casos.length, 1);
  assert.equal(datos.casos[0].estado, 'Pendiente');
});

// CP-02 — Registrar solicitud de software
test('CP-02: registra una solicitud de servicio válida y la persiste', async () => {
  const { registrarCaso, datos } = armar();

  const caso = await registrarCaso(solicitudValida);

  assert.ok(caso.id);
  assert.equal(caso.tipo, 'Solicitud de servicio');
  assert.equal(caso.estado, 'Pendiente');
  assert.equal(caso.categoria, 'Instalación');
  assert.equal(datos.casos.length, 1);
  assert.equal(datos.casos[0].titulo, solicitudValida.titulo);
});

// CP-03 — Descripción insuficiente
test('CP-03: rechaza descripción vacía o menor a 10 caracteres y no guarda', async () => {
  const { registrarCaso, datos } = armar();

  await assert.rejects(
    () => registrarCaso({ ...incidenteValido, descripcion: 'corto' }),
    ErrorValidacion
  );
  await assert.rejects(
    () => registrarCaso({ ...incidenteValido, descripcion: '' }),
    ErrorValidacion
  );
  assert.equal(datos.casos.length, 0);
  assert.equal(datos.historial.length, 0);
});

// CP-11 — Categoría inexistente o inactiva
test('CP-11: rechaza categoría inexistente o inactiva y no guarda nada', async () => {
  const { registrarCaso, datos } = armar();

  await assert.rejects(
    () => registrarCaso({ ...incidenteValido, categoria_id: 999 }),
    ErrorValidacion
  );
  await assert.rejects(
    () => registrarCaso({ ...incidenteValido, categoria_id: 99 }),
    ErrorValidacion
  );
  assert.equal(datos.casos.length, 0);
  assert.equal(datos.historial.length, 0);
});

// CP-16 — Historial "Caso registrado"
test('CP-16: deja el evento Caso registrado con estado nuevo Pendiente', async () => {
  const { registrarCaso, datos } = armar();

  const caso = await registrarCaso(solicitudValida);

  assert.equal(datos.historial.length, 1);
  assert.deepEqual(datos.historial[0], {
    id: 1,
    casoId: caso.id,
    evento: 'Caso registrado',
    estadoAnterior: null,
    estadoNuevo: 'Pendiente',
    usuarioId: 1,
  });
});

test('rechaza a un usuario que no es Solicitante', async () => {
  const { registrarCaso, datos } = armar();

  await assert.rejects(
    () => registrarCaso({ ...incidenteValido, usuario_id: 3 }),
    ErrorPermiso
  );
  assert.equal(datos.casos.length, 0);
});

test('persistencia: el caso sigue en el almacén tras el registro (escenario 3)', async () => {
  const { registrarCaso, datos } = armar();

  const creado = await registrarCaso(incidenteValido);
  const guardado = datos.casos.find((c) => c.id === creado.id);

  assert.ok(guardado);
  assert.equal(guardado.titulo, incidenteValido.titulo);
  assert.equal(guardado.descripcion, incidenteValido.descripcion);
  assert.equal(guardado.estado, 'Pendiente');
});
