// CAPA DE SERVICIOS — HU-11 Actualizar categoría.
// Reglas y criterios: docs/historias/HU-11.md
//
// Dependencias:
//   repos.usuarios.buscarActivoPorId           → solo Administrador (403)
//   repos.categorias.buscarPorId(id)           → la categoría existe (404)
//   repos.categorias.existeNombreEnArea(...)   → nombre repetido en el área (409)
//   repos.categorias.actualizar(id, cambios)   → nombre, descripcion y/o activa
// Errores de dominio: ErrorValidacion (400), ErrorPermiso (403),
// ErrorNoEncontrado (404), ErrorConflicto (409).

const { ErrorNoImplementado } = require('../../domain/errores');

function crearActualizarCategoria({ repos }) {
  return async function actualizarCategoria({ id, usuario_id, nombre, descripcion, activa } = {}) {
    throw new ErrorNoImplementado('HU-11 Actualizar categoría');
  };
}

module.exports = { crearActualizarCategoria };
