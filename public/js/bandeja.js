// Bandeja de casos pendientes (HU-03).
// Se accede actuando como un usuario con rol Agente.
// Usa GET /api/casos?vista=bandeja (sin cerrados; P1 → P3 y, dentro de la
// misma prioridad, el más antiguo primero). El orden lo decide el servidor.

let consultaActual = 0; // evita que una respuesta lenta pise a una más nueva
let usuarioSeleccionado = null;
let controlesEstado = [];

function escapar(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function mostrarMensaje(texto, tipo) {
  const el = document.getElementById('mensaje');
  el.textContent = texto;
  el.className = tipo || '';
}

function mostrarTabla(casos) {
  document.getElementById('cuerpo-casos').innerHTML = casos
    .map((c) => `
      <tr data-caso-id="${escapar(c.id)}">
        <td>${escapar(c.id)}</td>
        <td>${escapar(c.titulo)}</td>
        <td>${escapar(c.tipo)}</td>
        <td>${escapar(c.area)}</td>
        <td>${escapar(c.categoria)}</td>
        <td><span class="prioridad prioridad-${escapar(c.prioridad)}">${escapar(c.prioridad)}</span></td>
        <td class="estado-caso">${escapar(c.estado)}</td>
        <td>${escapar(c.solicitante)}</td>
        <td>${c.agente ? escapar(c.agente) : 'Sin asignar'}</td>
        <td>${escapar(c.fecha_creacion)}</td>
        <td class="acciones-caso"></td>
      </tr>`)
    .join('');
  controlesEstado = casos.map((caso, indice) => {
    const fila = document.getElementById('cuerpo-casos').rows[indice];
    const celda = fila.querySelector('.acciones-caso');
    const control = CampusHelpEstados.crearControlEstado({
      caso,
      obtenerUsuario: () => usuarioSeleccionado,
      alActualizar: (actualizado) => {
        fila.querySelector('.estado-caso').textContent = actualizado.estado;
        return cargarBandeja({
          conservarTabla: true,
          confirmacion: `Caso #${actualizado.id}: estado actualizado a ${actualizado.estado}.`,
        });
      },
    });
    celda.append(control.elemento);
    // HU-06 exige registrar una solución antes de enviar a validación.
    if (caso.estado === 'En atención' && caso.agente_id === usuarioSeleccionado?.id) {
      const enlace = document.createElement('a');
      enlace.href = `atender.html?id=${encodeURIComponent(caso.id)}`;
      enlace.textContent = 'Registrar atención';
      celda.append(enlace);
    }
    return control;
  });
  document.getElementById('tabla-casos').hidden = casos.length === 0;
}

async function cargarBandeja({ conservarTabla = false, confirmacion = '' } = {}) {
  const consulta = ++consultaActual;

  if (!conservarTabla) mostrarTabla([]);
  document.getElementById('vacio').hidden = true;
  if (!usuarioSeleccionado) {
    mostrarMensaje('No hay agentes activos disponibles.', 'error');
    return;
  }
  mostrarMensaje('Cargando casos…');

  try {
    const casos = await api('/api/casos?vista=bandeja');
    if (consulta !== consultaActual) return;
    mostrarMensaje(confirmacion, confirmacion ? 'ok' : '');
    mostrarTabla(casos);
    if (casos.length === 0) {
      document.getElementById('vacio').hidden = false;
    }
  } catch (err) {
    if (consulta !== consultaActual) return;
    mostrarMensaje(err.message || 'No se pudo cargar la bandeja. Intenta de nuevo.', 'error');
    if (conservarTabla) throw err;
  }
}

async function iniciar() {
  try {
    // La bandeja es para agentes: el selector solo lista usuarios con rol Agente.
    await inicializarActuarComo('actuar-como', {
      rol: 'Agente',
      onChange: (usuario) => {
        usuarioSeleccionado = usuario;
        controlesEstado.forEach((control) => control.actualizarUsuario());
        cargarBandeja();
      },
    });
  } catch (err) {
    mostrarMensaje(err.message || 'No se pudo cargar el selector de usuarios', 'error');
  }
}

iniciar();
