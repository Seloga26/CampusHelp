// CAPA HTTP — rutas de casos (API sugerida por el docente).
// Las rutas de los sprints 1 y 2 ya están conectadas a su servicio: cada
// historia implementa el servicio y el repositorio, no necesita tocar este
// archivo. Las del Sprint 3 responden 501 hasta que se implementen.
const express = require('express');
const { manejar } = require('../middleware/asincrono');
const { ErrorNoImplementado } = require('../domain/errores');

const pendiente = (historia) => manejar(async () => {
  throw new ErrorNoImplementado(historia);
});

function crearCasosRouter({
  registrarCaso, listarCasos, cambiarEstado, asignarCaso, registrarAtencion,
}) {
  const router = express.Router();

  // HU-01
  router.post('/', manejar(async (req, res) => {
    res.status(201).json(await registrarCaso(req.body));
  }));

  // HU-02 / HU-03 (HU-09 agregará filtros)
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

  // Sprint 3 (HU-12 recortada por contingencia)
  router.get('/:id', pendiente('HU-12 Detalle del caso'));
  router.post('/:id/validacion', pendiente('HU-07 Aprobar/devolver'));
  router.get('/:id/historial', pendiente('HU-08 Historial'));

  return router;
}

function crearIndicadoresRouter() {
  const router = express.Router();
  router.get('/', pendiente('HU-10 Indicadores'));
  return router;
}

module.exports = { crearCasosRouter, crearIndicadoresRouter };
