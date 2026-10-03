// Rutas de casos (API sugerida por el docente).
// Cada endpoint se implementa en la historia indicada. Mientras no exista,
// responde 501 para que sea visible qué falta por construir.
const express = require('express');

const router = express.Router();

const pendiente = (hu) => (req, res) =>
  res.status(501).json({ error: `No implementado todavía (${hu})` });

router.post('/', pendiente('HU-01 Registrar caso'));
router.get('/', pendiente('HU-02/HU-03/HU-09 Listar y filtrar casos'));
router.get('/:id', pendiente('HU-12 Detalle del caso'));
router.patch('/:id/asignar', pendiente('HU-04 Asignar agente'));
router.patch('/:id/estado', pendiente('HU-05 Cambiar estado'));
router.post('/:id/atencion', pendiente('HU-06 Registrar atención'));
router.post('/:id/validacion', pendiente('HU-07 Aprobar/devolver'));
router.get('/:id/historial', pendiente('HU-08 Historial'));

module.exports = router;
