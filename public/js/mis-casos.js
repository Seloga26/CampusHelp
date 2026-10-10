// Mis casos (HU-02): lista los casos del solicitante elegido en "Actuar como".
// Usa GET /api/casos?usuario_id=ID (más reciente primero, incluye cerrados).

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

function mostrarEstadoVacio(visible) {
  document.getElementById('vacio').hidden = !visible;
}

function mostrarTabla(casos) {
  const tabla = document.getElementById('tabla-casos');
  document.getElementById('cuerpo-casos').innerHTML = casos
    .map((c) => `
      <tr>
        <td>${escapar(c.id)}</td>
        <td>${escapar(c.titulo)}</td>
        <td>${escapar(c.tipo)}</td>
        <td>${escapar(c.area)}</td>
        <td>${escapar(c.categoria)}</td>
        <td>${escapar(c.prioridad)}</td>
        <td>${escapar(c.estado)}</td>
        <td>${escapar(c.fecha_creacion)}</td>
      </tr>`)
    .join('');
  tabla.hidden = casos.length === 0;
}

async function cargarCasos() {
  const consulta = ++consultaActual;
  const usuarioId = usuarioActualId();

  mostrarTabla([]);
  mostrarEstadoVacio(false);

  if (!usuarioId) {
    mostrarMensaje('Selecciona un solicitante en "Actuar como".', 'error');
    return;
  }

  mostrarMensaje('Cargando casos…');
  try {
    const casos = await api(`/api/casos?usuario_id=${encodeURIComponent(usuarioId)}`);
    if (consulta !== consultaActual) return;
    mostrarMensaje('');
    if (casos.length === 0) {
      mostrarEstadoVacio(true);
    } else {
      mostrarTabla(casos);
    }
  } catch (err) {
    if (consulta !== consultaActual) return;
    mostrarMensaje(err.message || 'No se pudieron cargar tus casos. Intenta de nuevo.', 'error');
  }
}

async function iniciar() {
  try {
    // El selector llama a onChange al iniciar y cada vez que se cambia de usuario.
    await inicializarActuarComo('actuar-como', { rol: 'Solicitante', onChange: cargarCasos });
  } catch (err) {
    mostrarMensaje(err.message || 'No se pudo cargar el selector de usuarios', 'error');
  }
}

iniciar();