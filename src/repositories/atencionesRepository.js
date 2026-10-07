// CAPA DE REPOSITORIOS — único lugar con SQL de la tabla `atencion`.
// HU-06 implementa crear() y contarPorCaso(). HU-12 usaría listarPorCaso().
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
      throw new ErrorNoImplementado('HU-06 atencionesRepository.crear');
    },

    /** Cantidad de atenciones registradas para un caso (regla: no validar sin solución). */
    async contarPorCaso(casoId) {
      throw new ErrorNoImplementado('HU-06 atencionesRepository.contarPorCaso');
    },
  };
}

module.exports = { crearAtencionesRepository };
