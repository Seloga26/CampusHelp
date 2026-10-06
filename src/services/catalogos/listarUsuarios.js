// CAPA DE SERVICIOS — usuarios de prueba para el selector "Actuar como".
// Ejemplo de referencia de un servicio que valida su entrada con el dominio
// y lanza un error de dominio (el middleware lo convierte en HTTP 400).

const { LISTA_ROLES } = require('../../domain/catalogos');
const { ErrorValidacion } = require('../../domain/errores');

function crearListarUsuarios({ repos }) {
  const { usuarios } = repos;

  return async function listarUsuarios({ rol } = {}) {
    if (rol !== undefined && !LISTA_ROLES.includes(rol)) {
      throw new ErrorValidacion(`Rol inválido. Valores permitidos: ${LISTA_ROLES.join(', ')}`);
    }
    return usuarios.listarActivos({ rol });
  };
}

module.exports = { crearListarUsuarios };
