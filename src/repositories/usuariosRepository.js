// CAPA DE REPOSITORIOS — único lugar con SQL de usuarios.

function crearUsuariosRepository(ejecutor) {
  return {
    /** Usuarios activos; si se indica `rol`, solo los de ese rol. */
    async listarActivos({ rol } = {}) {
      const params = [];
      let sql = 'SELECT id, nombre, correo, rol FROM usuario WHERE activo = TRUE';
      if (rol) {
        sql += ' AND rol = ?';
        params.push(rol);
      }
      const [filas] = await ejecutor.query(sql + ' ORDER BY rol, nombre', params);
      return filas;
    },

    /** Un usuario activo por id, o null. */
    async buscarActivoPorId(id) {
      const [filas] = await ejecutor.query(
        'SELECT id, nombre, correo, rol FROM usuario WHERE id = ? AND activo = TRUE',
        [id]
      );
      return filas[0] || null;
    },
  };
}

module.exports = { crearUsuariosRepository };
