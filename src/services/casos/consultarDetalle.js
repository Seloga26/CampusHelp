// CAPA DE SERVICIOS — HU-12 Detalle del caso y solución.
// Reglas y criterios: docs/historias/HU-12.md
//
// Dependencias:
//   repos.usuarios.buscarActivoPorId      → quién consulta y con qué rol
//   repos.casos.buscarPorId(id)           → datos del caso con área, categoría, solicitante y agente
//   repos.atenciones.listarPorCaso(id)    → atenciones, la más reciente primero (compartido con HU-07)
// Permisos iguales a HU-08: roles internos ven cualquier caso; el solicitante, solo los suyos.
// Errores de dominio: ErrorValidacion (400), ErrorPermiso (403), ErrorNoEncontrado (404).
// Devuelve el caso con la lista `atenciones`.

const { ErrorNoImplementado } = require('../../domain/errores');

function crearConsultarDetalle({ repos }) {
  return async function consultarDetalle({ id, usuario_id } = {}) {
    throw new ErrorNoImplementado('HU-12 Detalle del caso');
  };
}

module.exports = { crearConsultarDetalle };
