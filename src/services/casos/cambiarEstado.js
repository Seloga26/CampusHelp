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

const { esEstadoValido, puedeTransicionar } = require('../../domain/estados');
const { ErrorValidacion, ErrorPermiso, ErrorNoEncontrado, ErrorConflicto } = require('../../domain/errores');

function esIdValido(id) {
  return (typeof id === 'number' || typeof id === 'string')
    && /^[1-9]\d*$/.test(String(id))
    && Number.isSafeInteger(Number(id)) && Number(id) <= 2147483647;
}

function crearCambiarEstado({ enTransaccion }) {
  return async function cambiarEstado({ id, estado, usuario_id } = {}) {
    if (!esIdValido(id)) throw new ErrorValidacion('El ID del caso debe ser un entero positivo');
    if (!esIdValido(usuario_id)) throw new ErrorValidacion('usuario_id debe ser un entero positivo');
    if (!esEstadoValido(estado)) throw new ErrorValidacion('El estado no es válido');

    const casoId = Number(id);
    const usuarioId = Number(usuario_id);
    return enTransaccion(async (tx) => {
      const usuario = await tx.usuarios.buscarActivoPorId(usuarioId);
      if (!usuario || usuario.rol !== 'Agente') {
        throw new ErrorPermiso('Solo un agente activo puede cambiar el estado');
      }
      const caso = await tx.casos.buscarPorId(casoId, { bloquear: true });
      if (!caso) throw new ErrorNoEncontrado('Caso no encontrado');
      if (caso.estado === 'Cerrada') throw new ErrorConflicto('Un caso cerrado no puede cambiar de estado');
      if (caso.estado === 'En validación') {
        throw new ErrorConflicto('La aprobación o devolución corresponde al validador (HU-07)');
      }
      if (!puedeTransicionar(caso.estado, estado)) {
        throw new ErrorConflicto(`No se permite pasar de ${caso.estado} a ${estado}`);
      }
      // HU-06: comprobar la atención mientras el caso sigue bloqueado.
      if (estado === 'En validación' && await tx.atenciones.contarPorCaso(casoId) < 1) {
        throw new ErrorConflicto('Registra diagnóstico y solución antes de enviar el caso a validación');
      }

      await tx.casos.actualizarEstado(casoId, estado, { marcarInicioAtencion: estado === 'En atención' });
      await tx.historial.registrar({
        casoId, evento: 'Cambio de estado', estadoAnterior: caso.estado,
        estadoNuevo: estado, usuarioId,
      });
      return tx.casos.buscarPorId(casoId);
    });
  };
}

module.exports = { crearCambiarEstado };
