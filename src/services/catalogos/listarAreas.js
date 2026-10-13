function crearListarAreas({ repos }) {
  return async function listarAreas() { return repos.categorias.listarAreasActivas(); };
}

module.exports = { crearListarAreas };
