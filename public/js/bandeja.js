// Bandeja de casos pendientes (HU-03).
// Se accede actuando como un usuario con rol Agente.
// Usa GET /api/casos?vista=bandeja (sin cerrados; P1 → P3 y, dentro de la
// misma prioridad, el más antiguo primero). El orden lo decide el servidor.

let consultaActual = 0; // evita que una respuesta lenta pise a una más nueva

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
      <tr>
        <td>${escapar(c.id)}</td>
        <td>${escapar(c.titulo)}</td>
        <td>${escapar(c.tipo)}</td>
        <td>${escapar(c.area)}</td>
        <td>${escapar(c.categoria)}</td>
        <td><span class="prioridad prioridad-${escapar(c.prioridad)}">${escapar(c.prioridad)}</span></td>
        <td>${escapar(c.estado)}</td>
        <td>${escapar(c.solicitante)}</td>
        <td>${c.agente ? escapar(c.agente) : 'Sin asignar'}</td>
        <td>${escapar(c.fecha_creacion)}</td>
      </tr>`)
    .join('');
  document.getElementById('tabla-casos').hidden = casos.length === 0;
}

async function cargarBandeja() {
  const consulta = ++consultaActual;

  mostrarTabla([]);
  document.getElementById('vacio').hidden = true;
  mostrarMensaje('Cargando casos…');

  try {
    const casos = await api('/api/casos?vista=bandeja');
    if (consulta !== consultaActual) return;
    mostrarMensaje('');
    if (casos.length === 0) {
      document.getElementById('vacio').hidden = false;
    } else {
      mostrarTabla(casos);
    }
  } catch (err) {
    if (consulta !== consultaActual) return;
    mostrarMensaje(err.message || 'No se pudo cargar la bandeja. Intenta de nuevo.', 'error');
  }
}

async function iniciar() {
  try {
    // La bandeja es para agentes: el selector solo lista usuarios con rol Agente.
    await inicializarActuarComo('actuar-como', { rol: 'Agente', onChange: cargarBandeja });
  } catch (err) {
    mostrarMensaje(err.message || 'No se pudo cargar el selector de usuarios', 'error');
  }
}

iniciar();