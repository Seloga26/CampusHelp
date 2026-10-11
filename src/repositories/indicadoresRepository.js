// CAPA DE REPOSITORIOS — único lugar con SQL de indicadores (HU-10).
// Reglas y criterios: docs/historias/HU-10.md
// El mismo contrato está implementado en tests/fakes/repositoriosEnMemoria.js.
// Solo lectura: ninguna consulta modifica datos (regla 6).

// Columnas que se pueden agrupar. Lista cerrada: el nombre de columna no
// puede ir como parámetro (?) en MySQL, así que nunca se arma con datos externos.
const COLUMNAS_AGRUPABLES = Object.freeze(['estado', 'tipo', 'prioridad']);

function crearIndicadoresRepository(ejecutor) {
  async function agrupar(columna) {
    if (!COLUMNAS_AGRUPABLES.includes(columna)) throw new Error(`Columna no agrupable: ${columna}`);
    const [filas] = await ejecutor.query(
      `SELECT ${columna} AS valor, COUNT(*) AS cantidad
         FROM caso
        GROUP BY ${columna}`,
    );
    return filas.map((f) => ({ valor: f.valor, cantidad: Number(f.cantidad) }));
  }

  return {
    /**
     * Conteos agrupados (solo los valores que existen; el servicio pone los ceros).
     * @returns {Promise<{por_estado: Array<{valor, cantidad}>, por_tipo: Array<{valor, cantidad}>,
     *                    por_prioridad: Array<{valor, cantidad}>}>}
     */
    async contar() {
      const [porEstado, porTipo, porPrioridad] = await Promise.all(
        COLUMNAS_AGRUPABLES.map((columna) => agrupar(columna)),
      );
      return { por_estado: porEstado, por_tipo: porTipo, por_prioridad: porPrioridad };
    },

    /**
     * Promedios en minutos con TIMESTAMPDIFF(MINUTE, ...) y cantidad de casos usados.
     * asignacion: fecha_asignacion − fecha_creacion (casos asignados)
     * atencion:   fecha_cierre − fecha_inicio_atencion (cerrados con inicio de atención)
     * resolucion: fecha_cierre − fecha_creacion (cerrados)
     * AVG y COUNT ignoran los NULL: cada CASE deja fuera los casos que no aplican.
     * @returns {Promise<{asignacion: {promedio_minutos: number|null, casos: number},
     *                    atencion: {...}, resolucion: {...}}>}
     */
    async promediarTiempos() {
      const [[fila]] = await ejecutor.query(
        `SELECT
           AVG(CASE WHEN fecha_asignacion IS NOT NULL
                    THEN TIMESTAMPDIFF(MINUTE, fecha_creacion, fecha_asignacion) END) AS asignacion_promedio,
           COUNT(fecha_asignacion) AS asignacion_casos,
           AVG(CASE WHEN fecha_cierre IS NOT NULL AND fecha_inicio_atencion IS NOT NULL
                    THEN TIMESTAMPDIFF(MINUTE, fecha_inicio_atencion, fecha_cierre) END) AS atencion_promedio,
           COUNT(CASE WHEN fecha_cierre IS NOT NULL AND fecha_inicio_atencion IS NOT NULL
                      THEN 1 END) AS atencion_casos,
           AVG(CASE WHEN fecha_cierre IS NOT NULL
                    THEN TIMESTAMPDIFF(MINUTE, fecha_creacion, fecha_cierre) END) AS resolucion_promedio,
           COUNT(fecha_cierre) AS resolucion_casos
         FROM caso`,
      );
      // mysql2 devuelve AVG como texto (DECIMAL) y COUNT como número o texto según el driver.
      const tiempo = (promedio, casos) => ({
        promedio_minutos: promedio === null || promedio === undefined ? null : Number(promedio),
        casos: Number(casos),
      });
      return {
        asignacion: tiempo(fila.asignacion_promedio, fila.asignacion_casos),
        atencion: tiempo(fila.atencion_promedio, fila.atencion_casos),
        resolucion: tiempo(fila.resolucion_promedio, fila.resolucion_casos),
      };
    },
  };
}

module.exports = { crearIndicadoresRepository };
