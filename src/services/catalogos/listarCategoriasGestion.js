// CAPA DE SERVICIOS — HU-11 Listar categorías para gestión.
// Reglas y criterios: docs/historias/HU-11.md
//
// Dependencias:
//   repos.usuarios.buscarActivoPorId → solo Administrador (403)
//   repos.categorias.listarTodas()     → activas e inactivas, con área y cantidad de casos
// Errores de dominio: ErrorValidacion (400), ErrorPermiso (403),
// ErrorNoEncontrado (404), ErrorConflicto (409).

const { validarObjeto, exigirAdministrador } = require('./validarCategoria');

function crearListarCategoriasGestion({ repos }) {
  return async function listarCategoriasGestion(datos = {}) {
    validarObjeto(datos);
    await exigirAdministrador(repos, datos.usuario_id);
    return repos.categorias.listarTodas();
  };
}

module.exports = { crearListarCategoriasGestion };
