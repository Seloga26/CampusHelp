// CAPA DE REPOSITORIOS — único lugar con SQL de categorías.
//
// `ejecutor` es cualquier objeto con `query(sql, params)`: el pool de MySQL
// en operación normal, o una conexión cuando se trabaja dentro de una
// transacción (ver config/contenedor.js). El repositorio no sabe cuál recibe.

function crearCategoriasRepository(ejecutor) {
  return {
    /** Categorías activas de áreas activas, con el nombre del área. */
    async listarActivas() {
      const [filas] = await ejecutor.query(
        `SELECT c.id, c.nombre, c.descripcion, a.id AS area_id, a.nombre AS area
           FROM categoria c
           JOIN area a ON a.id = c.area_id
          WHERE c.activa = TRUE AND a.activa = TRUE
          ORDER BY a.nombre, c.nombre`
      );
      return filas;
    },

    /** Una categoría activa (y de un área activa) por id, o null. */
    async buscarActivaPorId(id) {
      const [filas] = await ejecutor.query(
        `SELECT c.id, c.nombre, a.id AS area_id, a.nombre AS area
           FROM categoria c
           JOIN area a ON a.id = c.area_id
          WHERE c.id = ? AND c.activa = TRUE AND a.activa = TRUE`,
        [id]
      );
      return filas[0] || null;
    },
  };
}

module.exports = { crearCategoriasRepository };
