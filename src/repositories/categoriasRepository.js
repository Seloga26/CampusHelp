// CAPA DE REPOSITORIOS — único lugar con SQL de categorías.
//
// `ejecutor` es cualquier objeto con `query(sql, params)`: el pool de MySQL
// en operación normal, o una conexión cuando se trabaja dentro de una
// transacción (ver config/contenedor.js). El repositorio no sabe cuál recibe.
//
const { ErrorConflicto } = require('../domain/errores');

async function escribir(ejecutor, sql, params) {
  try { return await ejecutor.query(sql, params); }
  catch (err) {
    // El índice único también protege los intentos concurrentes.
    if (err.code === 'ER_DUP_ENTRY') throw new ErrorConflicto('Ya existe una categoría con ese nombre en el área');
    throw err;
  }
}

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
      const [filas] = await ejecutor.query(`SELECT c.id, c.nombre, c.descripcion, c.activa,
        c.area_id, a.nombre AS area, (SELECT COUNT(*) FROM caso WHERE categoria_id = c.id) AS casos
        FROM categoria c JOIN area a ON a.id = c.area_id ORDER BY a.nombre, c.nombre, c.id`);
      return filas.map(c => ({ ...c, activa: Boolean(c.activa), casos: Number(c.casos) }));
    },

    /** Una categoría por id, activa o no, con su área; o null. */
    async buscarPorId(id) {
      const [filas] = await ejecutor.query(`SELECT c.*, a.nombre AS area
        FROM categoria c JOIN area a ON a.id = c.area_id WHERE c.id = ?`, [id]);
      return filas[0] ? { ...filas[0], activa: Boolean(filas[0].activa) } : null;
    },

    /** Incluye áreas activas aunque todavía no tengan categorías. */
    async listarAreasActivas() {
      const [filas] = await ejecutor.query('SELECT id, nombre FROM area WHERE activa = TRUE ORDER BY nombre');
      return filas;
    },

    /** Un área activa por id ({id, nombre}), o null. */
    async buscarAreaActivaPorId(areaId) {
      const [filas] = await ejecutor.query('SELECT id, nombre FROM area WHERE id = ? AND activa = TRUE', [areaId]);
      return filas[0] || null;
    },

    /**
     * ¿Existe otra categoría con ese nombre en el área? (sin distinguir
     * mayúsculas ni tildes, como el índice uq_categoria_area_nombre).
     * @param {{excluirId?: number}} opciones para no compararse consigo misma al editar
     */
    async existeNombreEnArea(areaId, nombre, { excluirId } = {}) {
      const [filas] = await ejecutor.query(`SELECT id FROM categoria WHERE area_id = ? AND nombre = ?
        ${excluirId === undefined ? '' : 'AND id <> ?'} LIMIT 1`,
      excluirId === undefined ? [areaId, nombre] : [areaId, nombre, excluirId]);
      return filas.length > 0;
    },

    /** Inserta una categoría activa y devuelve su id. */
    async crear({ area_id, nombre, descripcion }) {
      const [resultado] = await escribir(ejecutor,
        'INSERT INTO categoria (area_id, nombre, descripcion) VALUES (?, ?, ?)',
        [area_id, nombre, descripcion ?? null]);
      return resultado.insertId;
    },

    /** Actualiza solo los campos presentes: nombre, descripcion y/o activa. */
    async actualizar(id, cambios) {
      const campos = ['nombre', 'descripcion', 'activa'].filter(campo => cambios[campo] !== undefined);
      if (!campos.length) return;
      await escribir(ejecutor, `UPDATE categoria SET ${campos.map(campo => `${campo} = ?`).join(', ')} WHERE id = ?`,
        [...campos.map(campo => cambios[campo]), id]);
    },
  };
}

module.exports = { crearCategoriasRepository };
