// CAPA DE SERVICIOS — HU-10 Indicadores del servicio.
// Reglas y criterios: docs/historias/HU-10.md
//
// Dependencias:
//   repos.usuarios.buscarActivoPorId      → solo Administrador (403)
//   repos.indicadores.contar()            → conteos agrupados por estado, tipo y prioridad
//   repos.indicadores.promediarTiempos()  → promedios en minutos y casos usados
// Completa con ceros los valores del catálogo que no aparezcan y convierte
// los minutos a horas con un decimal (null cuando no hay casos).
// Errores de dominio: ErrorValidacion (400), ErrorPermiso (403).

const { ErrorNoImplementado } = require('../../domain/errores');

function crearConsultarIndicadores({ repos }) {
  return async function consultarIndicadores({ usuario_id } = {}) {
    throw new ErrorNoImplementado('HU-10 Indicadores');
  };
}

module.exports = { crearConsultarIndicadores };
