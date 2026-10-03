// Reglas de negocio de estados (Taller, sección 7).
// Pendiente → En análisis → En atención → En validación → Cerrada
// En validación → En atención cuando la solución es devuelta.
// Una solicitud Cerrada no puede cambiarse desde la operación normal.

const ESTADOS = Object.freeze([
  'Pendiente',
  'En análisis',
  'En atención',
  'En validación',
  'Cerrada',
]);

const TRANSICIONES = Object.freeze({
  'Pendiente': ['En análisis'],
  'En análisis': ['En atención'],
  'En atención': ['En validación'],
  'En validación': ['Cerrada', 'En atención'],
  'Cerrada': [],
});

const TIPOS = Object.freeze(['Incidente', 'Solicitud de servicio']);
const PRIORIDADES = Object.freeze(['P1', 'P2', 'P3']);

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
  TRANSICIONES,
  TIPOS,
  PRIORIDADES,
  esEstadoValido,
  puedeTransicionar,
  siguientesEstados,
};
