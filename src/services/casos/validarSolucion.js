// CAPA DE SERVICIOS — HU-07 Aprobar o devolver una solución.
// Reglas y criterios: docs/historias/HU-07.md
//
// Dependencias:
//   tx.usuarios.buscarActivoPorId                 → validar que sea Validador
//   tx.casos.buscarPorId(id, { bloquear: true })  → el caso debe estar En validación
//   tx.atenciones.contarPorCaso                   → no cerrar sin solución
//   tx.casos.cerrar(id)                           → aprobar (Cerrada + fecha_cierre)
//   tx.casos.actualizarEstado(id, 'En atención')  → devolver
//   tx.historial.registrar                        → "Solución aprobada" / "Solución devuelta: <motivo>"
//   enTransaccion(async (tx) => {...})            → todo junto o nada
// Errores de dominio: ErrorValidacion (400), ErrorPermiso (403),
// ErrorNoEncontrado (404), ErrorConflicto (409).
// Devuelve el caso actualizado.

const { ErrorValidacion, ErrorPermiso, ErrorNoEncontrado, ErrorConflicto } = require('../../domain/errores');

const DECISIONES = ['aprobar', 'devolver'];
const MOTIVO_MINIMO = 10;
const MOTIVO_MAXIMO = 100; // el historial guarda "Solución devuelta: " + motivo en 120 caracteres

function esIdValido(id) {
  return (typeof id === 'number' || typeof id === 'string')
    && /^[1-9]\d*$/.test(String(id))
    && Number.isSafeInteger(Number(id)) && Number(id) <= 2147483647;
}

function crearValidarSolucion({ enTransaccion }) {
  return async function validarSolucion(datos = {}) {
    if (!esIdValido(datos?.id)) throw new ErrorValidacion('El ID del caso debe ser un entero positivo');
    if (!esIdValido(datos?.usuario_id)) throw new ErrorValidacion('usuario_id debe ser un entero positivo');
    if (!DECISIONES.includes(datos?.decision)) {
      throw new ErrorValidacion(`decision debe ser "aprobar" o "devolver"`);
    }
    const decision = datos.decision;
    let motivo = null;
    if (decision === 'devolver') {
      motivo = typeof datos.motivo === 'string' ? datos.motivo.trim() : '';
      if (motivo.length < MOTIVO_MINIMO || motivo.length > MOTIVO_MAXIMO) {
        throw new ErrorValidacion(`El motivo debe tener entre ${MOTIVO_MINIMO} y ${MOTIVO_MAXIMO} caracteres`);
      }
    }

    const casoId = Number(datos.id);
    const validadorId = Number(datos.usuario_id);
    return enTransaccion(async (tx) => {
      const usuario = await tx.usuarios.buscarActivoPorId(validadorId);
      if (!usuario || usuario.rol !== 'Validador') {
        throw new ErrorPermiso('Solo un validador activo puede aprobar o devolver una solución');
      }
      const caso = await tx.casos.buscarPorId(casoId, { bloquear: true });
      if (!caso) throw new ErrorNoEncontrado('Caso no encontrado');
      if (caso.estado !== 'En validación') {
        throw new ErrorConflicto('El caso debe estar En validación para aprobar o devolver la solución');
      }

      if (decision === 'aprobar') {
        if (await tx.atenciones.contarPorCaso(casoId) < 1) {
          throw new ErrorConflicto('El caso no tiene una solución registrada');
        }
        await tx.casos.cerrar(casoId);
        await tx.historial.registrar({
          casoId, evento: 'Solución aprobada', estadoAnterior: 'En validación',
          estadoNuevo: 'Cerrada', usuarioId: validadorId,
        });
      } else {
        await tx.casos.actualizarEstado(casoId, 'En atención');
        await tx.historial.registrar({
          casoId, evento: `Solución devuelta: ${motivo}`, estadoAnterior: 'En validación',
          estadoNuevo: 'En atención', usuarioId: validadorId,
        });
      }
      return tx.casos.buscarPorId(casoId);
    });
  };
}

module.exports = { crearValidarSolucion };