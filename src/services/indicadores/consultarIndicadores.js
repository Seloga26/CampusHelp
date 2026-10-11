// CAPA DE SERVICIOS — HU-10 Indicadores del servicio.
// Reglas y criterios: docs/historias/HU-10.md
//
// Dependencias:
//   repos.usuarios.buscarActivoPorId      → solo Administrador (403)
//   repos.indicadores.contar()            → conteos agrupados por estado, tipo y prioridad
//   repos.indicadores.promediarTiempos()  → promedios en minutos y casos usados
// Completa con ceros los valores del catálogo que no aparezcan y convierte
// los minutos a horas con un decimal (null cuando no hay casos).
// Errores de dominio: ErrorValidacion (400), ErrorPermiso (403).
// Es solo lectura: no usa transacción.

const { TIPOS, PRIORIDADES, ROLES } = require('../../domain/catalogos');
const { ESTADOS } = require('../../domain/estados');
const { ErrorValidacion, ErrorPermiso } = require('../../domain/errores');

const ESTADO_CERRADO = 'Cerrada';

function esIdValido(id) {
  return (typeof id === 'number' || typeof id === 'string')
    && /^[1-9]\d*$/.test(String(id))
    && Number.isSafeInteger(Number(id)) && Number(id) <= 2147483647;
}

/** Regla 3: todos los valores del catálogo, en su orden, con 0 si no hay casos. */
function completarConCeros(catalogo, filas) {
  const conteo = Object.fromEntries(catalogo.map((valor) => [valor, 0]));
  for (const { valor, cantidad } of filas) {
    if (valor in conteo) conteo[valor] = Number(cantidad);
  }
  return conteo;
}

/** Regla 5: minutos → horas con un decimal; null cuando no hay casos para calcularlo. */
function aHoras({ promedio_minutos: minutos, casos }) {
  const sinDatos = !casos || minutos === null || minutos === undefined;
  return {
    promedio_horas: sinDatos ? null : Math.round((Number(minutos) / 60) * 10) / 10,
    casos: Number(casos) || 0,
  };
}

function crearConsultarIndicadores({ repos }) {
  return async function consultarIndicadores({ usuario_id } = {}) {
    if (!esIdValido(usuario_id)) throw new ErrorValidacion('usuario_id debe ser un entero positivo');

    // Regla 1: solo un Administrador activo.
    const usuario = await repos.usuarios.buscarActivoPorId(Number(usuario_id));
    if (!usuario || usuario.rol !== ROLES.ADMINISTRADOR) {
      throw new ErrorPermiso('Solo un administrador activo puede consultar los indicadores');
    }

    const [conteos, tiempos] = await Promise.all([
      repos.indicadores.contar(),
      repos.indicadores.promediarTiempos(),
    ]);

    // Reglas 2 y 3: conteos con todos los valores del catálogo.
    const porEstado = completarConCeros(ESTADOS, conteos.por_estado);
    const porTipo = completarConCeros(TIPOS, conteos.por_tipo);
    const porPrioridad = completarConCeros(PRIORIDADES, conteos.por_prioridad);

    // Regla 4: total, abiertos (todo lo que no está Cerrada) y cerrados.
    const total = Object.values(porEstado).reduce((suma, n) => suma + n, 0);
    const cerrados = porEstado[ESTADO_CERRADO];

    return {
      total,
      abiertos: total - cerrados,
      cerrados,
      por_estado: porEstado,
      por_tipo: porTipo,
      por_prioridad: porPrioridad,
      tiempos: {
        asignacion: aHoras(tiempos.asignacion),
        atencion: aHoras(tiempos.atencion),
        resolucion: aHoras(tiempos.resolucion),
      },
    };
  };
}

module.exports = { crearConsultarIndicadores };
