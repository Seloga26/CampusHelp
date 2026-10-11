// CAPA DE SERVICIOS — HU-11 Listar categorías para gestión.
// Reglas y criterios: docs/historias/HU-11.md
//
// Dependencias:
//   repos.usuarios.buscarActivoPorId → solo Administrador (403)
//   repos.categorias.listarTodas()     → activas e inactivas, con área y cantidad de casos
// Errores de dominio: ErrorValidacion (400), ErrorPermiso (403),
// ErrorNoEncontrado (404), ErrorConflicto (409).

const { ErrorNoImplementado } = require('../../domain/errores');

function crearListarCategoriasGestion({ repos }) {
  return async function listarCategoriasGestion({ usuario_id } = {}) {
    throw new ErrorNoImplementado('HU-11 Listar categorías para gestión');
  };
}

module.exports = { crearListarCategoriasGestion };
