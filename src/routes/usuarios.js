// GET /api/usuarios — usuarios de prueba (no hay autenticación real, Taller sección 4).
// El frontend usa esta lista para "actuar como" solicitante, agente, validador o administrador.
const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const params = [];
    let sql = 'SELECT id, nombre, correo, rol FROM usuario WHERE activo = TRUE';
    if (req.query.rol) {
      sql += ' AND rol = ?';
      params.push(req.query.rol);
    }
    const [rows] = await pool.query(sql + ' ORDER BY rol, nombre', params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
