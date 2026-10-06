// CAPA DE SERVICIOS — HU-02 Consultar mis casos y HU-03 Bandeja.
// Reglas y criterios: docs/historias/HU-02.md y HU-03.md
//
// Recibe los parámetros de la consulta (`usuario_id`, `vista`) y los traduce
// a criterios para repos.casos.listar(...):
//   ?usuario_id=1   → { usuarioId: 1, orden: 'recientes' }
//   ?vista=bandeja  → { soloAbiertos: true, orden: 'bandeja' }
//   sin parámetros  → { orden: 'recientes' }
// Errores de dominio: ErrorValidacion (400) si los parámetros no son válidos.

const { ErrorNoImplementado } = require('../../domain/errores');

function crearListarCasos({ repos }) {
  return async function listarCasos(parametros) {
    throw new ErrorNoImplementado('HU-02/HU-03 Listar casos');
  };
}

module.exports = { crearListarCasos };
