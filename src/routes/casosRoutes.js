// CAPA HTTP — rutas de casos (API sugerida por el docente).
// Las rutas del Sprint 1 ya están conectadas a su servicio: cada historia
// implementa el servicio y el repositorio, no necesita tocar este archivo.
// Las de los sprints 2 y 3 responden 501 hasta que se implementen.
const express = require('express');
const { manejar } = require('../middleware/asincrono');
const { ErrorNoImplementado } = require('../domain/errores');

const pendiente = (historia) => manejar(async () => {
  throw new ErrorNoImplementado(historia);
});

function crearCasosRouter({ registrarCaso, listarCasos, cambiarEstado }) {
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

  // Sprints 2 y 3
  router.get('/:id', pendiente('HU-12 Detalle del caso'));
  router.patch('/:id/asignar', pendiente('HU-04 Asignar agente'));
  router.post('/:id/atencion', pendiente('HU-06 Registrar atención'));
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
