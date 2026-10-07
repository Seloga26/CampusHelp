// CAPA DE SERVICIOS — HU-07 Aprobar o devolver una solución.
// Reglas y criterios: docs/historias/HU-07.md
//
// Dependencias disponibles:
//   tx.usuarios.buscarActivoPorId                 → validar que sea Validador
//   tx.casos.buscarPorId(id, { bloquear: true })  → el caso debe estar En validación
//   tx.atenciones.contarPorCaso                   → no cerrar sin solución
//   tx.casos.cerrar(id)                           → agregar a casosRepository (HU-07)
//   tx.casos.actualizarEstado(id, 'En atención')  → devolver
//   tx.historial.registrar                        → "Solución aprobada" / "Solución devuelta: <motivo>"
//   enTransaccion(async (tx) => {...})            → todo junto o nada
// Errores de dominio: ErrorValidacion (400), ErrorPermiso (403),
// ErrorNoEncontrado (404), ErrorConflicto (409).
// Debe devolver el caso actualizado.

const { ErrorNoImplementado } = require('../../domain/errores');

function crearValidarSolucion({ repos, enTransaccion }) {
  return async function validarSolucion({ id, decision, motivo, usuario_id } = {}) {
    throw new ErrorNoImplementado('HU-07 Aprobar/devolver');
  };
}

module.exports = { crearValidarSolucion };
