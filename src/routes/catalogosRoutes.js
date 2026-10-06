// CAPA HTTP — rutas de catálogos (categorías y usuarios de prueba).
// Patrón de todas las rutas: leer la petición → llamar al servicio →
// responder. Sin SQL ni reglas de negocio aquí.
const express = require('express');
const { manejar } = require('../middleware/asincrono');

function crearCategoriasRouter({ listarCategorias }) {
  const router = express.Router();
  router.get('/', manejar(async (req, res) => {
    res.json(await listarCategorias());
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
