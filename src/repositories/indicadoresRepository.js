// CAPA DE REPOSITORIOS — único lugar con SQL de indicadores (HU-10).
// Reglas y criterios: docs/historias/HU-10.md
// El contrato está implementado en tests/fakes/repositoriosEnMemoria.js.
// Al implementar cada método, borra su línea `throw new ErrorNoImplementado(...)`.

const { ErrorNoImplementado } = require('../domain/errores');

function crearIndicadoresRepository(ejecutor) {
  return {
    /**
     * Conteos agrupados (solo los valores que existen; el servicio pone los ceros).
     * @returns {Promise<{por_estado: Array<{valor, cantidad}>, por_tipo: Array<{valor, cantidad}>,
     *                    por_prioridad: Array<{valor, cantidad}>}>}
     */
    async contar() {
      throw new ErrorNoImplementado('HU-10 indicadoresRepository.contar');
    },

    /**
     * Promedios en minutos con TIMESTAMPDIFF(MINUTE, ...) y cantidad de casos usados.
     * asignacion: fecha_asignacion − fecha_creacion (casos asignados)
     * atencion:   fecha_cierre − fecha_inicio_atencion (cerrados con inicio de atención)
     * resolucion: fecha_cierre − fecha_creacion (cerrados)
     * @returns {Promise<{asignacion: {promedio_minutos: number|null, casos: number},
     *                    atencion: {...}, resolucion: {...}}>}
     */
    async promediarTiempos() {
      throw new ErrorNoImplementado('HU-10 indicadoresRepository.promediarTiempos');
    },
  };
}

module.exports = { crearIndicadoresRepository };
