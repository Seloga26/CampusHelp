// CAPA DE SERVICIOS (casos de uso) — ejemplo completo de referencia.
//
// Patrón de todos los servicios:
//   crearX(dependencias) → devuelve la función del caso de uso.
// El servicio recibe los repositorios ya construidos (inversión de
// dependencias, la D de SOLID): no importa MySQL ni Express, por eso se
// prueba con repositorios falsos en memoria (ver tests/services/).

function crearListarCategorias({ repos }) {
  const { categorias } = repos;

  return async function listarCategorias() {
    return categorias.listarActivas();
  };
}

module.exports = { crearListarCategorias };
