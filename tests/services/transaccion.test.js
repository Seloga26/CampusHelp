// Verifica el doble de transacción en memoria que usarán las pruebas de
// HU-01 y HU-05: si el trabajo falla, no debe quedar nada guardado.
const test = require('node:test');
const assert = require('node:assert');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');

test('enTransaccion guarda todo cuando el trabajo termina bien', async () => {
  const { enTransaccion, datos } = crearReposEnMemoria();

  await enTransaccion(async (tx) => {
    const id = await tx.casos.crear({ titulo: 'A', estado: 'Pendiente', prioridad: 'P2', usuario_id: 1 });
    await tx.historial.registrar({ casoId: id, evento: 'Caso registrado', estadoNuevo: 'Pendiente', usuarioId: 1 });
  });

  assert.equal(datos.casos.length, 1);
  assert.equal(datos.historial.length, 1);
});

test('enTransaccion deshace todo cuando el trabajo falla a mitad', async () => {
  const { enTransaccion, datos } = crearReposEnMemoria();

  await assert.rejects(() => enTransaccion(async (tx) => {
    await tx.casos.crear({ titulo: 'A', estado: 'Pendiente', prioridad: 'P2', usuario_id: 1 });
    throw new Error('falla antes de registrar el historial');
  }));

  assert.equal(datos.casos.length, 0);
  assert.equal(datos.historial.length, 0);
});
