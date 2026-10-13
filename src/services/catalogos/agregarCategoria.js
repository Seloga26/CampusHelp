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

const { ErrorConflicto } = require('../../domain/errores');
const { validarObjeto, validarId, exigirAdministrador, validarNombre, validarDescripcion, exigirAreaActiva } = require('./validarCategoria');

function crearAgregarCategoria({ repos }) {
  return async function agregarCategoria(datos = {}) {
    validarObjeto(datos);
    await exigirAdministrador(repos, datos.usuario_id);
    const area_id = validarId(datos.area_id, 'area_id');
    const nombre = validarNombre(datos.nombre);
    const descripcion = validarDescripcion(datos.descripcion);
    await exigirAreaActiva(repos, area_id);
    if (await repos.categorias.existeNombreEnArea(area_id, nombre)) {
      throw new ErrorConflicto('Ya existe una categoría con ese nombre en el área');
    }
    const id = await repos.categorias.crear({ area_id, nombre, descripcion });
    return repos.categorias.buscarPorId(id);
  };
}

module.exports = { crearAgregarCategoria };
