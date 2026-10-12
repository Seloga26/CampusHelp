// CAPA HTTP — rutas de catálogos (categorías y usuarios de prueba).
// Patrón de todas las rutas: leer la petición → llamar al servicio →
// responder. Sin SQL ni reglas de negocio aquí.
const express = require('express');
const { manejar } = require('../middleware/asincrono');

function crearCategoriasRouter({
  listarCategorias, listarAreas, listarCategoriasGestion, agregarCategoria, actualizarCategoria,
}) {
  const router = express.Router();
  // HU-01: solo activas, para el formulario de registro
  router.get('/', manejar(async (req, res) => {
    res.json(await listarCategorias());
  }));

  // HU-11: gestión por el administrador
  router.get('/areas', manejar(async (req, res) => {
    res.json(await listarAreas());
  }));
  router.get('/gestion', manejar(async (req, res) => {
    res.json(await listarCategoriasGestion({ usuario_id: req.query.usuario_id }));
  }));
  router.post('/', manejar(async (req, res) => {
    res.status(201).json(await agregarCategoria(req.body));
  }));
  router.patch('/:id', manejar(async (req, res) => {
    res.json(await actualizarCategoria({ ...req.body, id: req.params.id }));
  }));
  return router;
}

function crearUsuariosRouter({ listarUsuarios }) {
  const router = express.Router();
  router.get('/', manejar(async (req, res) => {
    res.json(await listarUsuarios({ rol: req.query.rol }));
  }));
  return router;
}

module.exports = { crearCategoriasRouter, crearUsuariosRouter };
