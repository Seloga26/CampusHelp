// CAPA DE SERVICIOS — HU-01 Registrar incidente o solicitud.
// Reglas y criterios: docs/historias/HU-01.md
//
// Dependencias disponibles:
//   repos.usuarios, repos.categorias  → validar solicitante y categoría
//   enTransaccion(async (tx) => {...}) → tx.casos.crear + tx.historial.registrar
//                                        se guardan juntos o no se guarda nada
// Errores de dominio: ErrorValidacion (400), ErrorPermiso (403).
// Debe devolver el caso creado (mismos campos que GET /api/casos).

const { ErrorNoImplementado } = require('../../domain/errores');

function crearRegistrarCaso({ repos, enTransaccion }) {
  return async function registrarCaso(datos) {
    throw new ErrorNoImplementado('HU-01 Registrar caso');
  };
}

module.exports = { crearRegistrarCaso };
