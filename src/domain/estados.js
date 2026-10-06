// CAPA DE DOMINIO — reglas puras, sin Express ni MySQL.
// Estados y transiciones del caso (Taller, sección 7):
// Pendiente → En análisis → En atención → En validación → Cerrada
// En validación → En atención cuando la solución es devuelta.
// Un caso Cerrada no puede cambiarse desde la operación normal.
//
// Principio abierto/cerrado (O): para cambiar el flujo se edita la tabla
// TRANSICIONES; las funciones de abajo no cambian.

const ESTADOS = Object.freeze([
  'Pendiente',
  'En análisis',
  'En atención',
  'En validación',
  'Cerrada',
]);

const ESTADO_INICIAL = 'Pendiente';

const TRANSICIONES = Object.freeze({
  'Pendiente': Object.freeze(['En análisis']),
  'En análisis': Object.freeze(['En atención']),
  'En atención': Object.freeze(['En validación']),
  'En validación': Object.freeze(['Cerrada', 'En atención']),
  'Cerrada': Object.freeze([]),
});

function esEstadoValido(estado) {
  return ESTADOS.includes(estado);
}

function puedeTransicionar(actual, nuevo) {
  if (!esEstadoValido(actual) || !esEstadoValido(nuevo)) return false;
  return TRANSICIONES[actual].includes(nuevo);
}

function siguientesEstados(actual) {
  return esEstadoValido(actual) ? [...TRANSICIONES[actual]] : [];
}

module.exports = {
  ESTADOS,
  ESTADO_INICIAL,
  TRANSICIONES,
  esEstadoValido,
  puedeTransicionar,
  siguientesEstados,
};
