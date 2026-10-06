// CAPA DE DOMINIO — errores del negocio.
// Los servicios lanzan estos errores; el middleware HTTP los traduce a la
// respuesta. Así ninguna regla de negocio conoce los códigos HTTP de memoria:
// cada clase define el suyo en un solo lugar.

class ErrorDeAplicacion extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.name = this.constructor.name;
    this.status = status;
  }
}

/** Datos de entrada inválidos (400). Ej.: descripción de menos de 10 caracteres. */
class ErrorValidacion extends ErrorDeAplicacion {
  constructor(mensaje) {
    super(mensaje, 400);
  }
}

/** El usuario no tiene el rol o permiso necesario (403). */
class ErrorPermiso extends ErrorDeAplicacion {
  constructor(mensaje = 'No tienes permiso para realizar esta operación') {
    super(mensaje, 403);
  }
}

/** El recurso no existe (404). */
class ErrorNoEncontrado extends ErrorDeAplicacion {
  constructor(mensaje = 'Recurso no encontrado') {
    super(mensaje, 404);
  }
}

/** La operación choca con el estado actual (409). Ej.: transición no permitida. */
class ErrorConflicto extends ErrorDeAplicacion {
  constructor(mensaje) {
    super(mensaje, 409);
  }
}

/** Funcionalidad aún no construida (501). Se elimina al implementar la historia. */
class ErrorNoImplementado extends ErrorDeAplicacion {
  constructor(historia) {
    super(`No implementado todavía (${historia})`, 501);
  }
}

module.exports = {
  ErrorDeAplicacion,
  ErrorValidacion,
  ErrorPermiso,
  ErrorNoEncontrado,
  ErrorConflicto,
  ErrorNoImplementado,
};
