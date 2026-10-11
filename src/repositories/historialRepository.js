// CAPA DE REPOSITORIOS — único lugar con SQL del historial.
// Escriben eventos HU-01 ("Caso registrado"), HU-04 ("Caso asignado"),
// HU-05 ("Cambio de estado"), HU-06 ("Atención registrada") y HU-07.
// HU-08 agrega la consulta. El historial es solo lectura: no hay UPDATE ni DELETE.

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
    /**
     * Eventos de un caso en orden cronológico, con nombre y rol del usuario.
     * @returns {Promise<Array<{id, evento, estado_anterior, estado_nuevo, usuario, rol, fecha}>>}
     */
    async listarPorCaso(casoId) {
      // h.id desempata eventos del mismo segundo (DATETIME no guarda fracciones).
      const [filas] = await ejecutor.query(
        `SELECT h.id, h.evento, h.estado_anterior, h.estado_nuevo,
                u.nombre AS usuario, u.rol, h.fecha
           FROM historial h
           JOIN usuario u ON u.id = h.usuario_id
          WHERE h.caso_id = ?
          ORDER BY h.fecha ASC, h.id ASC`,
        [casoId],
      );
      return filas;
    },
  };
}

module.exports = { crearHistorialRepository };
