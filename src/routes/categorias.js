// GET /api/categorias — lista áreas y categorías activas.
// Sirve como prueba de que la conexión a la BD funciona.
// HU-11 (gestionar categorías) se implementa en el Sprint 3.
const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.nombre, c.descripcion, a.id AS area_id, a.nombre AS area
         FROM categoria c
         JOIN area a ON a.id = c.area_id
        WHERE c.activa = TRUE AND a.activa = TRUE
        ORDER BY a.nombre, c.nombre`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
