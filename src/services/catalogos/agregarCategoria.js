// CAPA DE SERVICIOS — HU-11 Crear categoría.
// Reglas y criterios: docs/historias/HU-11.md
//
// Dependencias:
//   repos.usuarios.buscarActivoPorId           → solo Administrador (403)
//   repos.categorias.buscarAreaActivaPorId(id) → el área existe y está activa (400)
//   repos.categorias.existeNombreEnArea(...)   → nombre repetido en el área (409)
//   repos.categorias.crear(...) / buscarPorId  → devolver la categoría creada
// Errores de dominio: ErrorValidacion (400), ErrorPermiso (403),
// ErrorNoEncontrado (404), ErrorConflicto (409).

const { ErrorNoImplementado } = require('../../domain/errores');

function crearAgregarCategoria({ repos }) {
  return async function agregarCategoria({ usuario_id, area_id, nombre, descripcion } = {}) {
    throw new ErrorNoImplementado('HU-11 Crear categoría');
  };
}

module.exports = { crearAgregarCategoria };
