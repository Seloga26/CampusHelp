// CAPA DE SERVICIOS — HU-04 Asignarme un caso.
// Reglas y criterios: docs/historias/HU-04.md
//
// Dependencias:
//   tx.usuarios.buscarActivoPorId                → validar que sea Agente
//   tx.casos.buscarPorId(id, { bloquear: true }) → leer y bloquear el caso
//   tx.casos.asignarAgente(id, agenteId)         → agente_id + fecha_asignacion
//   tx.historial.registrar                       → evento "Caso asignado"
//   enTransaccion(async (tx) => {...})           → todo junto o nada
// Errores de dominio: ErrorValidacion (400), ErrorPermiso (403),
// ErrorNoEncontrado (404), ErrorConflicto (409).
// Devuelve el caso actualizado (con el nombre del agente).

const { ROLES } = require('../../domain/catalogos');
const { ErrorValidacion, ErrorPermiso, ErrorNoEncontrado, ErrorConflicto } = require('../../domain/errores');

function esIdValido(id) {
  return (typeof id === 'number' || typeof id === 'string')
    && /^[1-9]\d*$/.test(String(id))
    && Number.isSafeInteger(Number(id)) && Number(id) <= 2147483647;
}

function crearAsignarCaso({ enTransaccion }) {
  return async function asignarCaso({ id, usuario_id } = {}) {
    if (!esIdValido(id)) throw new ErrorValidacion('El ID del caso debe ser un entero positivo');
    if (!esIdValido(usuario_id)) throw new ErrorValidacion('usuario_id debe ser un entero positivo');

    const casoId = Number(id);
    const agenteId = Number(usuario_id);
    return enTransaccion(async (tx) => {
      // Regla 1: solo un agente activo puede asignarse casos.
      const usuario = await tx.usuarios.buscarActivoPorId(agenteId);
      if (!usuario || usuario.rol !== ROLES.AGENTE) {
        throw new ErrorPermiso('Solo un agente activo puede asignarse un caso');
      }

      const caso = await tx.casos.buscarPorId(casoId, { bloquear: true });
      if (!caso) throw new ErrorNoEncontrado('Caso no encontrado');
      // Regla 2: cualquier estado excepto Cerrada.
      if (caso.estado === 'Cerrada') throw new ErrorConflicto('Un caso cerrado no se puede asignar');
      // Reglas 3 y 4: sin reasignación y sin duplicar historial.
      if (caso.agente_id !== null && caso.agente_id !== undefined) {
        throw new ErrorConflicto(Number(caso.agente_id) === agenteId
          ? 'Ya eres el agente asignado a este caso'
          : 'El caso ya está asignado a otro agente');
      }

      // Regla 5: asignación + historial en la misma transacción.
      // Regla 6: asignar no cambia el estado.
      const asignado = await tx.casos.asignarAgente(casoId, agenteId);
      if (!asignado) throw new ErrorConflicto('El caso ya está asignado a otro agente');
      await tx.historial.registrar({
        casoId, evento: 'Caso asignado', estadoAnterior: null,
        estadoNuevo: null, usuarioId: agenteId,
      });
      return tx.casos.buscarPorId(casoId);
    });
  };
}

module.exports = { crearAsignarCaso };
