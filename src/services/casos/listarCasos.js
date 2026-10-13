// CAPA DE SERVICIOS — HU-02 Mis casos, HU-03 Bandeja y HU-09 Filtrar casos.
// Reglas y criterios: docs/historias/HU-02.md, HU-03.md y HU-09.md
//
// Recibe los parámetros de la consulta y los traduce a criterios para
// repos.casos.listar(...):
//   ?usuario_id=1   → { usuarioId: 1, orden: 'recientes' }
//   ?vista=bandeja  → { soloAbiertos: true, orden: 'bandeja' }
//   ?estado=Cerrada&tipo=Incidente&prioridad=P1&area_id=3&categoria_id=8
//                   → { estado, tipo, prioridad, areaId, categoriaId } (se combinan con Y)
//   sin parámetros  → { orden: 'recientes' }
// Errores de dominio: ErrorValidacion (400) si los parámetros no son válidos.

const { ErrorValidacion } = require('../../domain/errores');
const { ESTADOS } = require('../../domain/estados');
const { TIPOS, PRIORIDADES } = require('../../domain/catalogos');

const VISTA_BANDEJA = 'bandeja';
const ENTERO_MAXIMO = 2147483647; // INT de MySQL

// Filtros de catálogo: parámetro de la URL → criterio, con sus valores permitidos.
const FILTROS_DE_CATALOGO = [
  { parametro: 'estado', criterio: 'estado', permitidos: ESTADOS },
  { parametro: 'tipo', criterio: 'tipo', permitidos: TIPOS },
  { parametro: 'prioridad', criterio: 'prioridad', permitidos: PRIORIDADES },
];

// Filtros por id: deben ser enteros positivos.
const FILTROS_POR_ID = [
  { parametro: 'area_id', criterio: 'areaId' },
  { parametro: 'categoria_id', criterio: 'categoriaId' },
];

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

    // HU-09: un valor por filtro y solo valores del catálogo. Una lista
    // (?prioridad=P1&prioridad=P2) o un texto vacío no son strings válidos del catálogo.
    for (const { parametro, criterio, permitidos } of FILTROS_DE_CATALOGO) {
      const valor = parametros[parametro];
      if (valor === undefined) continue;
      if (typeof valor !== 'string' || !permitidos.includes(valor)) {
        throw new ErrorValidacion(`${parametro} inválido. Valores permitidos: ${permitidos.join(', ')}`);
      }
      criterios[criterio] = valor;
    }

    for (const { parametro, criterio } of FILTROS_POR_ID) {
      const valor = parametros[parametro];
      if (valor === undefined) continue;
      if (typeof valor !== 'string' || !/^[1-9]\d*$/.test(valor) || Number(valor) > ENTERO_MAXIMO) {
        throw new ErrorValidacion(`${parametro} debe ser un número entero positivo`);
      }
      criterios[criterio] = Number(valor);
    }

    return repos.casos.listar(criterios);
  };
}

module.exports = { crearListarCasos };