// CAPA DE REPOSITORIOS — único lugar con SQL de la tabla `atencion`.
// HU-06 implementa crear() y contarPorCaso(). HU-07 implementa listarPorCaso().
// Al implementar un método, borra su línea `throw new ErrorNoImplementado(...)`.

const { ErrorNoImplementado } = require('../domain/errores');

function crearAtencionesRepository(ejecutor) {
  return {
    // ---------------------------------------------------------------- HU-06
    /**
     * Inserta una atención y devuelve la fila creada.
     * @param {{casoId: number, diagnostico: string, solucion: string, agenteId: number}} atencion
     * @returns {Promise<{id, caso_id, diagnostico, solucion, fecha, agente_id}>}
     */
    async crear(atencion) {
      const [resultado] = await ejecutor.query(
        `INSERT INTO atencion (caso_id, diagnostico, solucion, agente_id)
         VALUES (?, ?, ?, ?)`,
        [atencion.casoId, atencion.diagnostico, atencion.solucion, atencion.agenteId],
      );
      const [filas] = await ejecutor.query(
        'SELECT id, caso_id, diagnostico, solucion, fecha, agente_id FROM atencion WHERE id = ?',
        [resultado.insertId],
      );
      return filas[0];
    },

    /** Cantidad de atenciones registradas para un caso (regla: no validar sin solución). */
    async contarPorCaso(casoId) {
      const [filas] = await ejecutor.query(
        'SELECT COUNT(*) AS cantidad FROM atencion WHERE caso_id = ?', [casoId],
      );
      return Number(filas[0].cantidad);
    },

    // ---------------------------------------------------------------- HU-07
    /**
     * Atenciones de un caso, la más reciente primero, con el nombre del agente.
     * @returns {Promise<Array<{id, diagnostico, solucion, fecha, agente}>>}
     */
    async listarPorCaso(casoId) {
      throw new ErrorNoImplementado('HU-07 atencionesRepository.listarPorCaso');
    },
  };
}

module.exports = { crearAtencionesRepository };
