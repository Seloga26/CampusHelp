// Repositorios falsos en memoria para probar servicios SIN MySQL.
// Cumplen el mismo contrato que los de src/repositories/ (sustitución de
// Liskov, la L de SOLID): el servicio no nota la diferencia.
//
// Uso en una prueba:
//   const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');
//   const { repos, enTransaccion, datos } = crearReposEnMemoria();
//   const registrarCaso = crearRegistrarCaso({ repos, enTransaccion });
//   ... y luego revisar datos.casos / datos.historial

function usuariosBase() {
  return [
    { id: 1, nombre: 'Ana Solicitante', correo: 'ana@campus.edu', rol: 'Solicitante', activo: true },
    { id: 2, nombre: 'Bruno Solicitante', correo: 'bruno@campus.edu', rol: 'Solicitante', activo: true },
    { id: 3, nombre: 'Carla Agente', correo: 'carla@campus.edu', rol: 'Agente', activo: true },
    { id: 4, nombre: 'Diego Agente', correo: 'diego@campus.edu', rol: 'Agente', activo: true },
    { id: 5, nombre: 'Elena Validadora', correo: 'elena@campus.edu', rol: 'Validador', activo: true },
    { id: 6, nombre: 'Fabio Administrador', correo: 'fabio@campus.edu', rol: 'Administrador', activo: true },
  ];
}

function categoriasBase() {
  return [
    { id: 1, nombre: 'Computador', area_id: 1, area: 'Hardware', activa: true },
    { id: 5, nombre: 'Instalación', area_id: 2, area: 'Software', activa: true },
    { id: 8, nombre: 'Wi-Fi', area_id: 3, area: 'Red y conectividad', activa: true },
    { id: 11, nombre: 'Contraseña', area_id: 4, area: 'Cuentas y acceso', activa: true },
    { id: 99, nombre: 'Categoría inactiva', area_id: 1, area: 'Hardware', activa: false },
  ];
}

const PESO_PRIORIDAD = { P1: 1, P2: 2, P3: 3 };

function crearReposEnMemoria({ usuarios = usuariosBase(), categorias = categoriasBase(), casos = [] } = {}) {
  const datos = { usuarios, categorias, casos, historial: [], atenciones: [] };
  const fechasHistorial = new Map(); // fecha de cada evento, como la pone MySQL
  const sinActivo = ({ activo, ...resto }) => resto;
  const sinActiva = ({ activa, ...resto }) => resto;

  const repos = {
    usuarios: {
      async listarActivos({ rol } = {}) {
        return datos.usuarios.filter((u) => u.activo && (!rol || u.rol === rol)).map(sinActivo);
      },
      async buscarActivoPorId(id) {
        const u = datos.usuarios.find((x) => x.id === Number(id) && x.activo);
        return u ? sinActivo(u) : null;
      },
    },

    categorias: {
      async listarActivas() {
        return datos.categorias.filter((c) => c.activa).map(sinActiva);
      },
      async buscarActivaPorId(id) {
        const c = datos.categorias.find((x) => x.id === Number(id) && x.activa);
        return c ? sinActiva(c) : null;
      },
    },

    casos: {
      async crear(caso) {
        const id = datos.casos.length + 1;
        datos.casos.push({
          id,
          agente_id: null,
          fecha_creacion: new Date().toISOString().slice(0, 19).replace('T', ' '),
          fecha_asignacion: null,
          fecha_inicio_atencion: null,
          fecha_cierre: null,
          ...caso,
        });
        return id;
      },
      async listar({ usuarioId, soloAbiertos, orden = 'recientes' } = {}) {
        let lista = datos.casos.filter((c) =>
          (usuarioId === undefined || c.usuario_id === Number(usuarioId)) &&
          (!soloAbiertos || c.estado !== 'Cerrada'));
        lista = [...lista].sort(orden === 'bandeja'
          ? (a, b) => PESO_PRIORIDAD[a.prioridad] - PESO_PRIORIDAD[b.prioridad]
              || a.fecha_creacion.localeCompare(b.fecha_creacion)
          : (a, b) => b.fecha_creacion.localeCompare(a.fecha_creacion));
        return lista.map((c) => ({ ...c }));
      },
      async buscarPorId(id) {
        const c = datos.casos.find((x) => x.id === Number(id));
        return c ? { ...c } : null;
      },
      async actualizarEstado(id, nuevoEstado, { marcarInicioAtencion = false } = {}) {
        const c = datos.casos.find((x) => x.id === Number(id));
        if (!c) return;
        c.estado = nuevoEstado;
        if (marcarInicioAtencion && !c.fecha_inicio_atencion) {
          c.fecha_inicio_atencion = new Date().toISOString().slice(0, 19).replace('T', ' ');
        }
      },
      // HU-07
      async cerrar(id) {
        const c = datos.casos.find((x) => x.id === Number(id));
        if (!c) return;
        c.estado = 'Cerrada';
        c.fecha_cierre = new Date().toISOString().slice(0, 19).replace('T', ' ');
      },
      // HU-04
      async asignarAgente(id, agenteId) {
        const c = datos.casos.find((x) => x.id === Number(id));
        if (!c) return;
        c.agente_id = Number(agenteId);
        c.fecha_asignacion = new Date().toISOString().slice(0, 19).replace('T', ' ');
      },
    },

    // HU-06
    atenciones: {
      async crear({ casoId, diagnostico, solucion, agenteId }) {
        const fila = {
          id: datos.atenciones.length + 1,
          caso_id: Number(casoId),
          diagnostico,
          solucion,
          fecha: new Date().toISOString().slice(0, 19).replace('T', ' '),
          agente_id: Number(agenteId),
        };
        datos.atenciones.push(fila);
        return { ...fila };
      },
      async contarPorCaso(casoId) {
        return datos.atenciones.filter((a) => a.caso_id === Number(casoId)).length;
      },
      // HU-07: mismo formato que devolverá el repositorio real
      async listarPorCaso(casoId) {
        return datos.atenciones
          .filter((a) => a.caso_id === Number(casoId))
          .sort((a, b) => b.id - a.id)
          .map((a) => ({
            id: a.id,
            diagnostico: a.diagnostico,
            solucion: a.solucion,
            fecha: a.fecha,
            agente: (datos.usuarios.find((u) => u.id === a.agente_id) || {}).nombre,
          }));
      },
    },

    historial: {
      async registrar(evento) {
        const id = datos.historial.length + 1;
        datos.historial.push({ id, ...evento });
        fechasHistorial.set(id, new Date().toISOString().slice(0, 19).replace('T', ' '));
      },
      // HU-08: mismo formato que devolverá el repositorio real
      async listarPorCaso(casoId) {
        return datos.historial
          .filter((h) => h.casoId === Number(casoId))
          .map((h) => {
            const u = datos.usuarios.find((x) => x.id === h.usuarioId) || {};
            return {
              id: h.id,
              evento: h.evento,
              estado_anterior: h.estadoAnterior ?? null,
              estado_nuevo: h.estadoNuevo ?? null,
              usuario: u.nombre,
              rol: u.rol,
              fecha: fechasHistorial.get(h.id) || null,
            };
          });
      },
    },
  };

  // Versión en memoria de la transacción: ejecuta el trabajo con los mismos
  // repositorios. Si el trabajo falla, deja los datos como estaban.
  async function enTransaccion(trabajo) {
    const copia = JSON.parse(JSON.stringify({
      casos: datos.casos, historial: datos.historial, atenciones: datos.atenciones,
    }));
    try {
      return await trabajo(repos);
    } catch (err) {
      datos.casos.splice(0, datos.casos.length, ...copia.casos);
      datos.historial.splice(0, datos.historial.length, ...copia.historial);
      datos.atenciones.splice(0, datos.atenciones.length, ...copia.atenciones);
      throw err;
    }
  }

  return { repos, enTransaccion, datos };
}

module.exports = { crearReposEnMemoria };
