// CAPA DE SERVICIOS — HU-02 Consultar mis casos y HU-03 Bandeja.
// Reglas y criterios: docs/historias/HU-02.md y HU-03.md
//
// Recibe los parámetros de la consulta (`usuario_id`, `vista`) y los traduce
// a criterios para repos.casos.listar(...):
//   ?usuario_id=1   → { usuarioId: 1, orden: 'recientes' }
//   ?vista=bandeja  → { soloAbiertos: true, orden: 'bandeja' }
//   sin parámetros  → { orden: 'recientes' }
// Errores de dominio: ErrorValidacion (400) si los parámetros no son válidos.

const { ErrorValidacion } = require('../../domain/errores');

const VISTA_BANDEJA = 'bandeja';

function crearListarCasos({ repos }) {
  return async function listarCasos(parametros = {}) {
    const { usuario_id: usuarioIdCrudo, vista } = parametros;
    const criterios = { orden: 'recientes' };

    if (usuarioIdCrudo !== undefined) {
      // Solo enteros positivos: rechaza "abc", "", "1.5", "-3" y listas (?usuario_id=1&usuario_id=2).
      if (typeof usuarioIdCrudo !== 'string' || !/^[1-9]\d*$/.test(usuarioIdCrudo)) {
        throw new ErrorValidacion('usuario_id debe ser un número entero positivo');
      }
      criterios.usuarioId = Number(usuarioIdCrudo);
    }

    if (vista !== undefined) {
      if (vista !== VISTA_BANDEJA) {
        throw new ErrorValidacion(`Vista inválida. Valor permitido: ${VISTA_BANDEJA}`);
      }
      // Bandeja (HU-03): solo casos abiertos, por prioridad y antigüedad.
      criterios.soloAbiertos = true;
      criterios.orden = 'bandeja';
    }

    return repos.casos.listar(criterios);
  };
}

module.exports = { crearListarCasos };