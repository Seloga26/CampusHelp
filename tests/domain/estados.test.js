// Pruebas unitarias de las transiciones de estado (base de CP-04, CP-05 y CP-08).
const test = require('node:test');
const assert = require('node:assert');
const { puedeTransicionar, siguientesEstados } = require('../../src/domain/estados');

test('flujo principal permitido: Pendiente → … → Cerrada', () => {
  assert.ok(puedeTransicionar('Pendiente', 'En análisis'));
  assert.ok(puedeTransicionar('En análisis', 'En atención'));
  assert.ok(puedeTransicionar('En atención', 'En validación'));
  assert.ok(puedeTransicionar('En validación', 'Cerrada'));
});

test('devolver desde validación vuelve a En atención', () => {
  assert.ok(puedeTransicionar('En validación', 'En atención'));
});

test('no se puede saltar estados', () => {
  assert.equal(puedeTransicionar('Pendiente', 'Cerrada'), false);
  assert.equal(puedeTransicionar('Pendiente', 'En atención'), false);
  assert.equal(puedeTransicionar('En análisis', 'En validación'), false);
});

test('un caso Cerrado no cambia de estado', () => {
  assert.deepEqual(siguientesEstados('Cerrada'), []);
  assert.equal(puedeTransicionar('Cerrada', 'En atención'), false);
});

test('estados inexistentes se rechazan', () => {
  assert.equal(puedeTransicionar('Abierto', 'Pendiente'), false);
  assert.deepEqual(siguientesEstados('Abierto'), []);
});
