// CAPA DE REPOSITORIOS — único lugar con SQL del historial.
// Lo usan HU-01 (evento "Caso registrado") y HU-05 (evento "Cambio de estado").
// Se implementa primero en HU-01 para no bloquear a HU-05.

function crearHistorialRepository(ejecutor) {
  return {
    // ---------------------------------------------------------------- HU-01
    /**
     * Registra un evento del caso.
     * @param {{casoId: number, evento: string, estadoAnterior: string|null,
     *          estadoNuevo: string|null, usuarioId: number}} evento
     */
    async registrar(evento) {
      await ejecutor.query(
        `INSERT INTO historial (caso_id, evento, estado_anterior, estado_nuevo, usuario_id)
         VALUES (?, ?, ?, ?, ?)`,
        [
          evento.casoId,
          evento.evento,
          evento.estadoAnterior ?? null,
          evento.estadoNuevo ?? null,
          evento.usuarioId,
        ]
      );
    },

    // ---------------------------------------------------------------- HU-08
    // async listarPorCaso(casoId) { ... }
  };
}

module.exports = { crearHistorialRepository };
