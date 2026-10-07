// CAPA DE SERVICIOS — HU-08 Consultar el historial de un caso.
// Reglas y criterios: docs/historias/HU-08.md
//
// Dependencias disponibles:
//   repos.usuarios.buscarActivoPorId   → quién consulta y con qué rol
//   repos.casos.buscarPorId            → el caso existe y de quién es (usuario_id)
//   repos.historial.listarPorCaso      → eventos en orden cronológico (HU-08)
// Errores de dominio: ErrorValidacion (400), ErrorPermiso (403), ErrorNoEncontrado (404).
// Debe devolver la lista de eventos.

const { ErrorNoImplementado } = require('../../domain/errores');

function crearConsultarHistorial({ repos }) {
  return async function consultarHistorial({ id, usuario_id } = {}) {
    throw new ErrorNoImplementado('HU-08 Historial');
  };
}

module.exports = { crearConsultarHistorial };
