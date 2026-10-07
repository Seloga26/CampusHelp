// CAPA DE SERVICIOS — HU-04 Asignarme un caso.
// Reglas y criterios: docs/historias/HU-04.md
//
// Dependencias disponibles:
//   tx.usuarios.buscarActivoPorId      → validar que sea Agente
//   tx.casos.buscarPorId(id, { bloquear: true }) → leer el caso (HU-05)
//   tx.casos.asignarAgente(id, agenteId)  → agregar a casosRepository (HU-04)
//   tx.historial.registrar              → evento "Caso asignado"
//   enTransaccion(async (tx) => {...})  → todo junto o nada
// Errores de dominio: ErrorValidacion (400), ErrorPermiso (403),
// ErrorNoEncontrado (404), ErrorConflicto (409).
// Debe devolver el caso actualizado.

const { ErrorNoImplementado } = require('../../domain/errores');

function crearAsignarCaso({ repos, enTransaccion }) {
  return async function asignarCaso({ id, usuario_id } = {}) {
    throw new ErrorNoImplementado('HU-04 Asignar caso');
  };
}

module.exports = { crearAsignarCaso };
