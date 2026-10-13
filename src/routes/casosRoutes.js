// CAPA HTTP — rutas de casos (API sugerida por el docente).
// Las rutas de los sprints 1 y 2 ya están conectadas a su servicio: cada
// historia implementa el servicio y el repositorio, no necesita tocar este
// archivo. Las del Sprint 3 también están conectadas: su servicio responde
// 501 hasta que la historia lo implemente.
const express = require('express');
const { manejar } = require('../middleware/asincrono');
function crearCasosRouter({
  registrarCaso, listarCasos, cambiarEstado, asignarCaso, registrarAtencion,
  validarSolucion, listarAtenciones, consultarHistorial, consultarDetalle,
}) {
  const router = express.Router();

  // HU-01
  router.post('/', manejar(async (req, res) => {
    res.status(201).json(await registrarCaso(req.body));
  }));

  // HU-02 / HU-03 / HU-09 (filtros por estado, tipo, área, categoría y prioridad)
  router.get('/', manejar(async (req, res) => {
    res.json(await listarCasos(req.query));
  }));

  // HU-05
  router.patch('/:id/estado', manejar(async (req, res) => {
    res.json(await cambiarEstado({ ...req.body, id: Number(req.params.id) }));
  }));

  // HU-04
  router.patch('/:id/asignar', manejar(async (req, res) => {
    res.json(await asignarCaso({ ...req.body, id: Number(req.params.id) }));
  }));

  // HU-06
  router.post('/:id/atencion', manejar(async (req, res) => {
    res.status(201).json(await registrarAtencion({ ...req.body, id: Number(req.params.id) }));
  }));

  // HU-07
  router.post('/:id/validacion', manejar(async (req, res) => {
    res.json(await validarSolucion({ ...req.body, id: Number(req.params.id) }));
  }));

  router.get('/:id/atenciones', manejar(async (req, res) => {
    res.json(await listarAtenciones({ id: Number(req.params.id) }));
  }));

  // HU-08
  router.get('/:id/historial', manejar(async (req, res) => {
    res.json(await consultarHistorial({ usuario_id: req.query.usuario_id, id: Number(req.params.id) }));
  }));

  // HU-12 (va al final: las rutas más específicas de arriba tienen prioridad)
  router.get('/:id', manejar(async (req, res) => {
    res.json(await consultarDetalle({ usuario_id: req.query.usuario_id, id: req.params.id }));
  }));

  return router;
}

// HU-10
function crearIndicadoresRouter({ consultarIndicadores }) {
  const router = express.Router();
  router.get('/', manejar(async (req, res) => {
    res.json(await consultarIndicadores({ usuario_id: req.query.usuario_id }));
  }));
  return router;
}

module.exports = { crearCasosRouter, crearIndicadoresRouter };
