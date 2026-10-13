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

const { ROLES } = require('../../domain/catalogos');
const { ErrorValidacion, ErrorPermiso, ErrorNoEncontrado } = require('../../domain/errores');

function esIdValido(id) {
  return (typeof id === 'number' || typeof id === 'string') && /^[1-9]\d*$/.test(String(id))
    && Number.isSafeInteger(Number(id)) && Number(id) <= 2147483647;
}

function crearConsultarDetalle({ repos }) {
  return async function consultarDetalle(datos = {}) {
    if (!esIdValido(datos?.id)) throw new ErrorValidacion('El ID del caso debe ser un entero positivo');
    if (!esIdValido(datos?.usuario_id)) throw new ErrorValidacion('usuario_id debe ser un entero positivo');
    const id = Number(datos.id);
    const usuarioId = Number(datos.usuario_id);
    const usuario = await repos.usuarios.buscarActivoPorId(usuarioId);
    if (!usuario || !Object.values(ROLES).includes(usuario.rol)) {
      throw new ErrorPermiso('Solo un usuario activo puede consultar el detalle');
    }
    const caso = await repos.casos.buscarPorId(id);
    if (!caso) throw new ErrorNoEncontrado('Caso no encontrado');
    if (usuario.rol === ROLES.SOLICITANTE && Number(caso.usuario_id) !== usuarioId) {
      throw new ErrorPermiso('Solo puedes consultar el detalle de tus propios casos');
    }
    return { ...caso, atenciones: await repos.atenciones.listarPorCaso(id) };
  };
}

module.exports = { crearConsultarDetalle };
