// CAPA DE REPOSITORIOS — único lugar con SQL de casos.
//
// Cada historia implementa SOLO su método. Están separados para que los
// cambios de cada integrante no choquen al integrar en Git.
// Al implementar un método, borra su línea `throw new ErrorNoImplementado(...)`.

const { ErrorNoImplementado } = require('../domain/errores');

function crearCasosRepository(ejecutor) {
  return {
    // ---------------------------------------------------------------- HU-01
    /**
     * Inserta un caso y devuelve su id.
     * @param {{tipo, titulo, descripcion, prioridad, estado, usuario_id, categoria_id}} caso
     * @returns {Promise<number>} id generado
     */
    async crear(caso) {
      const [resultado] = await ejecutor.query(
        `INSERT INTO caso
           (tipo, titulo, descripcion, prioridad, estado, usuario_id, categoria_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          caso.tipo,
          caso.titulo,
          caso.descripcion,
          caso.prioridad,
          caso.estado,
          caso.usuario_id,
          caso.categoria_id,
        ]
      );
      return resultado.insertId;
    },

    // ---------------------------------------------------------- HU-02/HU-03
    /**
     * Lista casos con área, categoría, solicitante y agente.
     * @param {{usuarioId?: number, soloAbiertos?: boolean, orden: 'recientes'|'bandeja'}} criterios
     */
    async listar(criterios) {
      throw new ErrorNoImplementado('HU-02/HU-03 casosRepository.listar');
    },

    // ---------------------------------------------------------------- HU-05
    /** Un caso por id (con área, categoría, solicitante y agente), o null. */
    async buscarPorId(id, { bloquear = false } = {}) {
      // Al validar una transición, bloquea solo el caso dentro de la transacción.
      if (bloquear) {
        const [filas] = await ejecutor.query('SELECT * FROM caso WHERE id = ? FOR UPDATE', [id]);
        return filas[0] || null;
      }
      const [filas] = await ejecutor.query(
        `SELECT c.*, a.nombre AS area, cat.nombre AS categoria,
          solicitante.nombre AS solicitante, agente.nombre AS agente
         FROM caso c
         JOIN categoria cat ON cat.id = c.categoria_id
         JOIN area a ON a.id = cat.area_id
         JOIN usuario solicitante ON solicitante.id = c.usuario_id
         LEFT JOIN usuario agente ON agente.id = c.agente_id
         WHERE c.id = ?`, [id],
      );
      return filas[0] || null;
    },

    /**
     * Cambia el estado. Si `marcarInicioAtencion` es true y la fecha aún es
     * NULL, guarda fecha_inicio_atencion = NOW().
     */
    async actualizarEstado(id, nuevoEstado, { marcarInicioAtencion = false } = {}) {
      await ejecutor.query(
        `UPDATE caso SET estado = ?,
          fecha_inicio_atencion = CASE
            WHEN ? THEN COALESCE(fecha_inicio_atencion, CURRENT_TIMESTAMP)
            ELSE fecha_inicio_atencion
          END
         WHERE id = ?`,
        [nuevoEstado, marcarInicioAtencion, id],
      );
    },
  };
}

module.exports = { crearCasosRepository };
