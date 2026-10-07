// CAPA DE SERVICIOS — HU-07 (apoyo): atenciones de un caso para que el
// validador vea el diagnóstico y la solución antes de decidir.
// Reglas y criterios: docs/historias/HU-07.md
//
// Dependencias disponibles:
//   repos.casos.buscarPorId          → 404 si el caso no existe
//   repos.atenciones.listarPorCaso   → la más reciente primero
// Errores de dominio: ErrorValidacion (400), ErrorNoEncontrado (404).

const { ErrorNoImplementado } = require('../../domain/errores');

function crearListarAtenciones({ repos }) {
  return async function listarAtenciones({ id } = {}) {
    throw new ErrorNoImplementado('HU-07 Listar atenciones');
  };
}

module.exports = { crearListarAtenciones };
