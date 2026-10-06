// Express 4 no captura errores de funciones async. Este envoltorio los pasa
// a `next(err)` para que los maneje middleware/errores.js.
function manejar(controlador) {
  return (req, res, next) => Promise.resolve(controlador(req, res, next)).catch(next);
}

module.exports = { manejar };
