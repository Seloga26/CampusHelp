// Utilidades compartidas: selector "Actuar como" y llamadas a la API.
// Lo usan todas las páginas del Sprint 1 (no hay autenticación real).

const CLAVE_USUARIO = 'campushelp.usuarioId';

async function api(ruta, opciones = {}) {
  const headers = { ...(opciones.headers || {}) };
  if (opciones.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const respuesta = await fetch(ruta, { ...opciones, headers });
  const texto = await respuesta.text();
  let datos = null;
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = { error: texto };
    }
  }
  if (!respuesta.ok) {
    const error = new Error((datos && datos.error) || `Error ${respuesta.status}`);
    error.status = respuesta.status;
    error.datos = datos;
    throw error;
  }
  return datos;
}

function usuarioActualId() {
  const id = Number(localStorage.getItem(CLAVE_USUARIO));
  return Number.isInteger(id) && id > 0 ? id : null;
}

function guardarUsuarioActual(id) {
  if (id) localStorage.setItem(CLAVE_USUARIO, String(id));
  else localStorage.removeItem(CLAVE_USUARIO);
}

/**
 * Rellena un <select> con usuarios de prueba y persiste la elección.
 * @param {string|HTMLSelectElement} selectOrId
 * @param {{rol?: string, onChange?: (usuario) => void}} [opciones]
 */
async function inicializarActuarComo(selectOrId, opciones = {}) {
  const select = typeof selectOrId === 'string'
    ? document.getElementById(selectOrId)
    : selectOrId;
  if (!select) return null;

  const query = opciones.rol ? `?rol=${encodeURIComponent(opciones.rol)}` : '';
  const usuarios = await api(`/api/usuarios${query}`);
  select.innerHTML = usuarios
    .map((u) => `<option value="${u.id}">${u.nombre} (${u.rol})</option>`)
    .join('');

  const guardado = usuarioActualId();
  if (guardado && usuarios.some((u) => u.id === guardado)) {
    select.value = String(guardado);
  } else if (usuarios[0]) {
    select.value = String(usuarios[0].id);
    guardarUsuarioActual(usuarios[0].id);
  }

  const emitir = () => {
    const usuario = usuarios.find((u) => u.id === Number(select.value)) || null;
    guardarUsuarioActual(usuario ? usuario.id : null);
    if (typeof opciones.onChange === 'function') opciones.onChange(usuario);
  };

  select.addEventListener('change', emitir);
  emitir();
  return select;
}
