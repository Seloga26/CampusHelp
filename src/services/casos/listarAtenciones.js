// CAPA DE SERVICIOS — HU-07 (apoyo): atenciones de un caso para que el
// validador vea el diagnóstico y la solución antes de decidir.
// Reglas y criterios: docs/historias/HU-07.md
//
// Dependencias:
//   repos.casos.buscarPorId          → 404 si el caso no existe
//   repos.atenciones.listarPorCaso   → la más reciente primero
// Errores de dominio: ErrorValidacion (400), ErrorNoEncontrado (404).

const { ErrorValidacion, ErrorNoEncontrado } = require('../../domain/errores');

function esIdValido(id) {
  return (typeof id === 'number' || typeof id === 'string')
    && /^[1-9]\d*$/.test(String(id))
    && Number.isSafeInteger(Number(id)) && Number(id) <= 2147483647;
}

function crearListarAtenciones({ repos }) {
  return async function listarAtenciones({ id } = {}) {
    if (!esIdValido(id)) throw new ErrorValidacion('El ID del caso debe ser un entero positivo');
    const caso = await repos.casos.buscarPorId(Number(id));
    if (!caso) throw new ErrorNoEncontrado('Caso no encontrado');
    return repos.atenciones.listarPorCaso(Number(id));
  };
}

module.exports = { crearListarAtenciones };