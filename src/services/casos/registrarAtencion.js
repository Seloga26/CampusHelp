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

const { ErrorValidacion, ErrorPermiso, ErrorNoEncontrado, ErrorConflicto } = require('../../domain/errores');

function esIdValido(id) {
  return (typeof id === 'number' || typeof id === 'string')
    && /^[1-9]\d*$/.test(String(id))
    && Number.isSafeInteger(Number(id)) && Number(id) <= 2147483647;
}

function crearRegistrarAtencion({ enTransaccion }) {
  return async function registrarAtencion(datos = {}) {
    if (!esIdValido(datos?.id)) throw new ErrorValidacion('El ID del caso debe ser un entero positivo');
    if (!esIdValido(datos?.usuario_id)) throw new ErrorValidacion('usuario_id debe ser un entero positivo');
    const diagnostico = typeof datos?.diagnostico === 'string' ? datos.diagnostico.trim() : '';
    const solucion = typeof datos?.solucion === 'string' ? datos.solucion.trim() : '';
    if (diagnostico.length < 10) throw new ErrorValidacion('El diagnóstico debe tener al menos 10 caracteres');
    if (solucion.length < 10) throw new ErrorValidacion('La solución debe tener al menos 10 caracteres');

    const casoId = Number(datos.id);
    const agenteId = Number(datos.usuario_id);
    return enTransaccion(async (tx) => {
      const usuario = await tx.usuarios.buscarActivoPorId(agenteId);
      if (!usuario || usuario.rol !== 'Agente') {
        throw new ErrorPermiso('Solo un agente activo puede registrar la atención');
      }
      const caso = await tx.casos.buscarPorId(casoId, { bloquear: true });
      if (!caso) throw new ErrorNoEncontrado('Caso no encontrado');
      if (Number(caso.agente_id) !== agenteId) {
        throw new ErrorPermiso('Solo el agente asignado puede registrar la atención');
      }
      if (caso.estado !== 'En atención') {
        throw new ErrorConflicto('El caso debe estar En atención para registrar diagnóstico y solución');
      }

      const atencion = await tx.atenciones.crear({ casoId, diagnostico, solucion, agenteId });
      await tx.historial.registrar({
        casoId, evento: 'Atención registrada', estadoAnterior: null,
        estadoNuevo: null, usuarioId: agenteId,
      });
      return atencion;
    });
  };
}

module.exports = { crearRegistrarAtencion };
