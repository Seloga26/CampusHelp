// CAPA DE SERVICIOS — HU-08 Consultar el historial de un caso.
// Reglas y criterios: docs/historias/HU-08.md
//
// Dependencias:
//   repos.usuarios.buscarActivoPorId   → quién consulta y con qué rol
//   repos.casos.buscarPorId            → el caso existe y de quién es (usuario_id)
//   repos.historial.listarPorCaso      → eventos en orden cronológico
// Errores de dominio: ErrorValidacion (400), ErrorPermiso (403), ErrorNoEncontrado (404).
// Devuelve la lista de eventos. Es solo lectura: no usa transacción.

const { ROLES } = require('../../domain/catalogos');
const { ErrorValidacion, ErrorPermiso, ErrorNoEncontrado } = require('../../domain/errores');

function esIdValido(id) {
  return (typeof id === 'number' || typeof id === 'string')
    && /^[1-9]\d*$/.test(String(id))
    && Number.isSafeInteger(Number(id)) && Number(id) <= 2147483647;
}

function crearConsultarHistorial({ repos }) {
  return async function consultarHistorial({ id, usuario_id } = {}) {
    if (!esIdValido(id)) throw new ErrorValidacion('El ID del caso debe ser un entero positivo');
    if (!esIdValido(usuario_id)) throw new ErrorValidacion('usuario_id debe ser un entero positivo');

    const usuarioId = Number(usuario_id);
    const usuario = await repos.usuarios.buscarActivoPorId(usuarioId);
    if (!usuario) throw new ErrorPermiso('Solo un usuario activo puede consultar el historial');

    const caso = await repos.casos.buscarPorId(Number(id));
    if (!caso) throw new ErrorNoEncontrado('Caso no encontrado');

    // Regla 1: los roles internos ven cualquier caso; el solicitante, solo los suyos.
    if (usuario.rol === ROLES.SOLICITANTE && Number(caso.usuario_id) !== usuarioId) {
      throw new ErrorPermiso('Solo puedes consultar el historial de tus propios casos');
    }

    // Regla 2: orden cronológico (lo garantiza el repositorio).
    return repos.historial.listarPorCaso(Number(id));
  };
}

module.exports = { crearConsultarHistorial };
