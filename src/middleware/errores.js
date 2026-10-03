// Manejo centralizado de errores: toda ruta llama next(err).
function noEncontrado(req, res) {
  res.status(404).json({ error: 'Recurso no encontrado' });
}

// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.publicMessage || err.message || 'Error interno' });
}

module.exports = { noEncontrado, manejadorErrores };
