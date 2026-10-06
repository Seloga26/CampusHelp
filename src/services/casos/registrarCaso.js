// CAPA DE SERVICIOS — HU-01 Registrar incidente o solicitud.
// Reglas y criterios: docs/historias/HU-01.md
//
// Dependencias disponibles:
//   repos.usuarios, repos.categorias  → validar solicitante y categoría
//   enTransaccion(async (tx) => {...}) → tx.casos.crear + tx.historial.registrar
//                                        se guardan juntos o no se guarda nada
// Errores de dominio: ErrorValidacion (400), ErrorPermiso (403).
// Debe devolver el caso creado (mismos campos que GET /api/casos).

const {
  TIPOS, PRIORIDADES, ROLES, DESCRIPCION_MINIMA, TITULO_MAXIMO,
} = require('../../domain/catalogos');
const { ESTADO_INICIAL } = require('../../domain/estados');
const { ErrorValidacion, ErrorPermiso } = require('../../domain/errores');

function formatearFecha(fecha = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())} `
    + `${p(fecha.getHours())}:${p(fecha.getMinutes())}:${p(fecha.getSeconds())}`;
}

function crearRegistrarCaso({ repos, enTransaccion }) {
  return async function registrarCaso(datos) {
    const tipo = datos?.tipo;
    const titulo = typeof datos?.titulo === 'string' ? datos.titulo.trim() : '';
    const descripcion = typeof datos?.descripcion === 'string' ? datos.descripcion.trim() : '';
    const prioridad = datos?.prioridad;
    const categoriaId = Number(datos?.categoria_id);
    const usuarioId = Number(datos?.usuario_id);

    if (!TIPOS.includes(tipo)) {
      throw new ErrorValidacion('Tipo inválido: debe ser Incidente o Solicitud de servicio');
    }
    if (!titulo) {
      throw new ErrorValidacion('El título es obligatorio');
    }
    if (titulo.length > TITULO_MAXIMO) {
      throw new ErrorValidacion(`El título no puede superar ${TITULO_MAXIMO} caracteres`);
    }
    if (!descripcion || descripcion.length < DESCRIPCION_MINIMA) {
      throw new ErrorValidacion(
        `La descripción debe tener al menos ${DESCRIPCION_MINIMA} caracteres`
      );
    }
    if (!PRIORIDADES.includes(prioridad)) {
      throw new ErrorValidacion('Prioridad inválida: debe ser P1, P2 o P3');
    }
    if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
      throw new ErrorValidacion('categoria_id es obligatorio');
    }
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new ErrorValidacion('usuario_id es obligatorio');
    }

    const usuario = await repos.usuarios.buscarActivoPorId(usuarioId);
    if (!usuario) {
      throw new ErrorPermiso('El usuario no existe o está inactivo');
    }
    if (usuario.rol !== ROLES.SOLICITANTE) {
      throw new ErrorPermiso('Solo un Solicitante puede registrar un caso');
    }

    const categoria = await repos.categorias.buscarActivaPorId(categoriaId);
    if (!categoria) {
      throw new ErrorValidacion('La categoría no existe o está inactiva');
    }

    const id = await enTransaccion(async (tx) => {
      const casoId = await tx.casos.crear({
        tipo,
        titulo,
        descripcion,
        prioridad,
        estado: ESTADO_INICIAL,
        usuario_id: usuarioId,
        categoria_id: categoriaId,
      });
      await tx.historial.registrar({
        casoId,
        evento: 'Caso registrado',
        estadoAnterior: null,
        estadoNuevo: ESTADO_INICIAL,
        usuarioId,
      });
      return casoId;
    });

    return {
      id,
      tipo,
      titulo,
      prioridad,
      estado: ESTADO_INICIAL,
      area: categoria.area,
      categoria: categoria.nombre,
      solicitante: usuario.nombre,
      agente: null,
      fecha_creacion: formatearFecha(),
    };
  };
}

module.exports = { crearRegistrarCaso };
