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

const { ErrorValidacion, ErrorNoEncontrado, ErrorConflicto } = require('../../domain/errores');
const { validarObjeto, validarId, exigirAdministrador, validarNombre, validarDescripcion, exigirAreaActiva } = require('./validarCategoria');

function crearActualizarCategoria({ repos }) {
  return async function actualizarCategoria(datos = {}) {
    validarObjeto(datos);
    await exigirAdministrador(repos, datos.usuario_id);
    const id = validarId(datos.id, 'id');
    const cambios = {};
    if (datos.nombre !== undefined) cambios.nombre = validarNombre(datos.nombre);
    if (datos.descripcion !== undefined) cambios.descripcion = validarDescripcion(datos.descripcion);
    if (datos.activa !== undefined) {
      if (typeof datos.activa !== 'boolean') throw new ErrorValidacion('activa debe ser true o false');
      cambios.activa = datos.activa;
    }
    if (!Object.keys(cambios).length) throw new ErrorValidacion('Indica nombre, descripción o activa para actualizar');
    const categoria = await repos.categorias.buscarPorId(id);
    if (!categoria) throw new ErrorNoEncontrado('Categoría no encontrada');
    await exigirAreaActiva(repos, categoria.area_id);
    if (cambios.nombre !== undefined && await repos.categorias.existeNombreEnArea(categoria.area_id, cambios.nombre, { excluirId: id })) {
      throw new ErrorConflicto('Ya existe una categoría con ese nombre en el área');
    }
    await repos.categorias.actualizar(id, cambios);
    return repos.categorias.buscarPorId(id);
  };
}

module.exports = { crearActualizarCategoria };
