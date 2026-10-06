// CAPA DE REPOSITORIOS — único lugar con SQL del historial.
// Lo usan HU-01 (evento "Caso registrado") y HU-05 (evento "Cambio de estado").
// Se implementa primero en HU-01 para no bloquear a HU-05.

const { ErrorNoImplementado } = require('../domain/errores');

function crearHistorialRepository(ejecutor) {
  return {
    // ---------------------------------------------------------------- HU-01
    /**
     * Registra un evento del caso.
     * @param {{casoId: number, evento: string, estadoAnterior: string|null,
     *          estadoNuevo: string|null, usuarioId: number}} evento
     */
    async registrar(evento) {
      throw new ErrorNoImplementado('HU-01 historialRepository.registrar');
    },

    // ---------------------------------------------------------------- HU-08
    // async listarPorCaso(casoId) { ... }
  };
}

module.exports = { crearHistorialRepository };
