// CAPA DE REPOSITORIOS — único lugar con SQL de categorías.
//
// `ejecutor` es cualquier objeto con `query(sql, params)`: el pool de MySQL
// en operación normal, o una conexión cuando se trabaja dentro de una
// transacción (ver config/contenedor.js). El repositorio no sabe cuál recibe.
//
// HU-11 implementa los métodos marcados abajo; su contrato ya está en
// tests/fakes/repositoriosEnMemoria.js. Al implementar cada uno, borra su
// línea `throw new ErrorNoImplementado(...)`.

const { ErrorNoImplementado } = require('../domain/errores');

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

    // ---------------------------------------------------------------- HU-11
    /**
     * Todas las categorías (activas e inactivas) con su área y cantidad de casos.
     * @returns {Promise<Array<{id, nombre, descripcion, activa, area_id, area, casos}>>}
     */
    async listarTodas() {
      throw new ErrorNoImplementado('HU-11 categoriasRepository.listarTodas');
    },

    /** Una categoría por id, activa o no, con su área; o null. */
    async buscarPorId(id) {
      throw new ErrorNoImplementado('HU-11 categoriasRepository.buscarPorId');
    },

    /** Un área activa por id ({id, nombre}), o null. */
    async buscarAreaActivaPorId(areaId) {
      throw new ErrorNoImplementado('HU-11 categoriasRepository.buscarAreaActivaPorId');
    },

    /**
     * ¿Existe otra categoría con ese nombre en el área? (sin distinguir
     * mayúsculas ni tildes, como el índice uq_categoria_area_nombre).
     * @param {{excluirId?: number}} opciones para no compararse consigo misma al editar
     */
    async existeNombreEnArea(areaId, nombre, { excluirId } = {}) {
      throw new ErrorNoImplementado('HU-11 categoriasRepository.existeNombreEnArea');
    },

    /** Inserta una categoría activa y devuelve su id. */
    async crear({ area_id, nombre, descripcion }) {
      throw new ErrorNoImplementado('HU-11 categoriasRepository.crear');
    },

    /** Actualiza solo los campos presentes: nombre, descripcion y/o activa. */
    async actualizar(id, cambios) {
      throw new ErrorNoImplementado('HU-11 categoriasRepository.actualizar');
    },
  };
}

module.exports = { crearCategoriasRepository };
