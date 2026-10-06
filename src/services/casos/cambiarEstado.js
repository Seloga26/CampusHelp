// CAPA DE SERVICIOS — HU-05 Cambiar estado del caso.
// Reglas y criterios: docs/historias/HU-05.md
//
// Dependencias disponibles:
//   repos.usuarios, repos.casos         → validar agente y leer el caso
//   puedeTransicionar() (domain/estados) → regla de transición
//   enTransaccion(async (tx) => {...})  → tx.casos.actualizarEstado +
//                                         tx.historial.registrar juntos
// Errores de dominio: ErrorNoEncontrado (404), ErrorPermiso (403),
// ErrorConflicto (409), ErrorValidacion (400).
// Debe devolver el caso actualizado.

const { ErrorNoImplementado } = require('../../domain/errores');

function crearCambiarEstado({ repos, enTransaccion }) {
  return async function cambiarEstado({ id, estado, usuario_id }) {
    throw new ErrorNoImplementado('HU-05 Cambiar estado');
  };
}

module.exports = { crearCambiarEstado };
