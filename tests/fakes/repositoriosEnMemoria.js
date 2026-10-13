// Repositorios falsos en memoria para probar servicios SIN MySQL.
// Cumplen el mismo contrato que los de src/repositories/ (sustitución de
// Liskov, la L de SOLID): el servicio no nota la diferencia.
//
// Uso en una prueba:
//   const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');
//   const { repos, enTransaccion, datos } = crearReposEnMemoria();
//   const registrarCaso = crearRegistrarCaso({ repos, enTransaccion });
//   ... y luego revisar datos.casos / datos.historial

const { ErrorConflicto } = require('../../src/domain/errores');

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

function areasBase() {
  return ['Hardware', 'Software', 'Red y conectividad', 'Cuentas y acceso', 'Plataformas académicas']
    .map((nombre, i) => ({ id: i + 1, nombre, activa: true }));
}

function crearReposEnMemoria({ usuarios = usuariosBase(), categorias = categoriasBase(), casos = [], areas = areasBase() } = {}) {
  const datos = { usuarios, categorias, casos, areas, historial: [], atenciones: [] };
  const fechasHistorial = new Map(); // fecha de cada evento, como la pone MySQL
  const sinActivo = ({ activo, ...resto }) => resto;
  const sinActiva = ({ activa, ...resto }) => resto;
  // Aproxima utf8mb4_unicode_ci para los nombres usados en estas pruebas.
  const normalizarNombre = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const existeNombre = (areaId, nombre, excluirId) => datos.categorias.some(c =>
    c.area_id === Number(areaId) && c.id !== Number(excluirId)
    && normalizarNombre(c.nombre) === normalizarNombre(nombre));

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
        return datos.categorias.filter((c) => c.activa && datos.areas.some(a => a.id === c.area_id && a.activa)).map(sinActiva);
      },
      async buscarActivaPorId(id) {
        const c = datos.categorias.find((x) => x.id === Number(id) && x.activa
          && datos.areas.some(a => a.id === x.area_id && a.activa));
        return c ? sinActiva(c) : null;
      },
      // HU-11: mismo formato que devolverá el repositorio real
      async listarTodas() {
        return [...datos.categorias]
          .sort((a, b) => a.area.localeCompare(b.area) || a.nombre.localeCompare(b.nombre))
          .map((c) => ({
            id: c.id, nombre: c.nombre, descripcion: c.descripcion ?? null, activa: c.activa,
            area_id: c.area_id, area: c.area,
            casos: datos.casos.filter((caso) => caso.categoria_id === c.id).length,
          }));
      },
      async buscarPorId(id) {
        const c = datos.categorias.find((x) => x.id === Number(id));
        return c ? { descripcion: null, ...c } : null;
      },
      async buscarAreaActivaPorId(areaId) {
        const area = datos.areas.find(a => a.id === Number(areaId) && a.activa);
        return area ? { id: area.id, nombre: area.nombre } : null;
      },
      async listarAreasActivas() {
        return datos.areas.filter(a => a.activa).map(({ id, nombre }) => ({ id, nombre }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
      },
      async existeNombreEnArea(areaId, nombre, { excluirId } = {}) {
        return existeNombre(areaId, nombre, excluirId);
      },
      async crear({ area_id, nombre, descripcion }) {
        if (existeNombre(area_id, nombre)) throw new ErrorConflicto('Ya existe una categoría con ese nombre en el área');
        const id = Math.max(0, ...datos.categorias.map((c) => c.id)) + 1;
        const area = (datos.areas.find(a => a.id === Number(area_id)) || {}).nombre;
        datos.categorias.push({ id, nombre, descripcion: descripcion ?? null, area_id: Number(area_id), area, activa: true });
        return id;
      },
      async actualizar(id, cambios) {
        const c = datos.categorias.find((x) => x.id === Number(id));
        if (!c) return;
        if (cambios.nombre !== undefined && existeNombre(c.area_id, cambios.nombre, id)) {
          throw new ErrorConflicto('Ya existe una categoría con ese nombre en el área');
        }
        for (const campo of ['nombre', 'descripcion', 'activa']) {
          if (cambios[campo] !== undefined) c[campo] = cambios[campo];
        }
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
      async listar({ usuarioId, soloAbiertos, orden = 'recientes',  
        estado, tipo, prioridad, areaId, categoriaId,
      } = {}) {
       const areaDe = (c) => (datos.categorias.find((x) => x.id === c.categoria_id) || {}).area_id;
        let lista = datos.casos.filter((c) =>
          (usuarioId === undefined || c.usuario_id === Number(usuarioId)) &&
          (!soloAbiertos || c.estado !== 'Cerrada') &&
          (estado === undefined || c.estado === estado) &&
          (tipo === undefined || c.tipo === tipo) &&
          (prioridad === undefined || c.prioridad === prioridad) &&
          (areaId === undefined || areaDe(c) === Number(areaId)) &&
          (categoriaId === undefined || c.categoria_id === Number(categoriaId)));
          
        lista = [...lista].sort(orden === 'bandeja'
          ? (a, b) => PESO_PRIORIDAD[a.prioridad] - PESO_PRIORIDAD[b.prioridad]
              || a.fecha_creacion.localeCompare(b.fecha_creacion)
          : (a, b) => b.fecha_creacion.localeCompare(a.fecha_creacion));
        return lista.map((c) => ({ ...c }));
      },
      async buscarPorId(id, { bloquear = false } = {}) {
        const c = datos.casos.find((x) => x.id === Number(id));
        if (!c) return null;
        if (bloquear) return { ...c };
        const categoria = datos.categorias.find(cat => cat.id === c.categoria_id);
        return { ...c,
          area: categoria?.area ?? c.area ?? null,
          categoria: categoria?.nombre ?? c.categoria ?? null,
          solicitante: datos.usuarios.find(u => u.id === c.usuario_id)?.nombre ?? c.solicitante ?? null,
          agente: datos.usuarios.find(u => u.id === c.agente_id)?.nombre ?? c.agente ?? null,
        };
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
        // Igual que el UPDATE real: solo asigna si el caso sigue sin agente.
        if (!c || (c.agente_id !== null && c.agente_id !== undefined)) return false;
        c.agente_id = Number(agenteId);
        c.fecha_asignacion = new Date().toISOString().slice(0, 19).replace('T', ' ');
        return true;
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
          .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id)
          .map((a) => ({
            id: a.id,
            diagnostico: a.diagnostico,
            solucion: a.solucion,
            fecha: a.fecha,
            agente: (datos.usuarios.find((u) => u.id === a.agente_id) || {}).nombre,
          }));
      },
    },

    // HU-10: mismo contrato que indicadoresRepository (conteos crudos y minutos)
    indicadores: {
      async contar() {
        const agrupar = (campo) => Object.entries(datos.casos.reduce((acc, c) => {
          acc[c[campo]] = (acc[c[campo]] || 0) + 1;
          return acc;
        }, {})).map(([valor, cantidad]) => ({ valor, cantidad }));
        return { por_estado: agrupar('estado'), por_tipo: agrupar('tipo'), por_prioridad: agrupar('prioridad') };
      },
      async promediarTiempos() {
        const minutos = (desde, hasta) => Math.floor((new Date(hasta.replace(' ', 'T')) - new Date(desde.replace(' ', 'T'))) / 60000);
        const promedio = (pares) => ({
          promedio_minutos: pares.length ? pares.reduce((t, [d, h]) => t + minutos(d, h), 0) / pares.length : null,
          casos: pares.length,
        });
        const cerrados = datos.casos.filter((c) => c.fecha_cierre);
        return {
          asignacion: promedio(datos.casos.filter((c) => c.fecha_asignacion).map((c) => [c.fecha_creacion, c.fecha_asignacion])),
          atencion: promedio(cerrados.filter((c) => c.fecha_inicio_atencion).map((c) => [c.fecha_inicio_atencion, c.fecha_cierre])),
          resolucion: promedio(cerrados.map((c) => [c.fecha_creacion, c.fecha_cierre])),
        };
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
