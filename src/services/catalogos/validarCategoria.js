const { ErrorValidacion, ErrorPermiso } = require('../../domain/errores');

function validarObjeto(datos) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    throw new ErrorValidacion('Los datos de la categoría deben ser un objeto');
  }
}

function validarId(valor, campo) {
  if (!['number', 'string'].includes(typeof valor) || !/^[1-9]\d*$/.test(String(valor))
    || !Number.isSafeInteger(Number(valor)) || Number(valor) > 2147483647) {
    throw new ErrorValidacion(`${campo} debe ser un entero positivo`);
  }
  return Number(valor);
}

async function exigirAdministrador(repos, valor) {
  const id = validarId(valor, 'usuario_id');
  const usuario = await repos.usuarios.buscarActivoPorId(id);
  if (!usuario || usuario.rol !== 'Administrador') {
    throw new ErrorPermiso('Solo un administrador activo puede gestionar categorías');
  }
}

function validarNombre(valor) {
  const nombre = typeof valor === 'string' ? valor.trim() : '';
  if ([...nombre].length < 3 || [...nombre].length > 100) {
    throw new ErrorValidacion('El nombre debe tener entre 3 y 100 caracteres');
  }
  return nombre;
}

function validarDescripcion(valor) {
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== 'string' || [...valor.trim()].length > 255) {
    throw new ErrorValidacion('La descripción debe ser texto de hasta 255 caracteres');
  }
  return valor.trim() || null;
}

async function exigirAreaActiva(repos, id) {
  if (!await repos.categorias.buscarAreaActivaPorId(id)) {
    throw new ErrorValidacion('El área debe existir y estar activa');
  }
}

module.exports = { validarObjeto, validarId, exigirAdministrador, validarNombre, validarDescripcion, exigirAreaActiva };
