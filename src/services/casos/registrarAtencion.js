// CAPA DE SERVICIOS — HU-06 Registrar diagnóstico y solución.
// Reglas y criterios: docs/historias/HU-06.md
//
// Dependencias disponibles:
//   tx.casos.buscarPorId(id, { bloquear: true }) → el caso debe estar En atención
//                                                  y asignado a este agente
//   tx.atenciones.crear(...)            → guardar la atención
//   tx.historial.registrar              → evento "Atención registrada"
//   enTransaccion(async (tx) => {...})  → todo junto o nada
// Errores de dominio: ErrorValidacion (400), ErrorPermiso (403),
// ErrorNoEncontrado (404), ErrorConflicto (409).
// Debe devolver la atención creada.

const { ErrorNoImplementado } = require('../../domain/errores');

function crearRegistrarAtencion({ repos, enTransaccion }) {
  return async function registrarAtencion({ id, diagnostico, solucion, usuario_id } = {}) {
    throw new ErrorNoImplementado('HU-06 Registrar atención');
  };
}

module.exports = { crearRegistrarAtencion };
