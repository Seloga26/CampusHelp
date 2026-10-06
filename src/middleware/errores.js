// CAPA HTTP — traduce errores a respuestas JSON en un solo lugar.
const { ErrorDeAplicacion } = require('../domain/errores');

function noEncontrado(req, res) {
  res.status(404).json({ error: 'Recurso no encontrado' });
}

function manejadorErrores(err, req, res, next) {
  // Errores del negocio: traen su propio código (400, 403, 404, 409, 501).
  if (err instanceof ErrorDeAplicacion) {
    return res.status(err.status).json({ error: err.message });
  }
  // JSON mal formado en el cuerpo de la petición.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }
  // Cualquier otro error es inesperado: se registra y no se exponen detalles.
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = { noEncontrado, manejadorErrores };
