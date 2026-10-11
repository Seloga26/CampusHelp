// Control de HU-05 reutilizable en cada fila de la bandeja de HU-03.
// Respeta la regla de HU-04: solo el agente asignado avanza el caso.
(() => {
  const siguientes = Object.freeze({
    'Pendiente': 'En análisis',
    'En análisis': 'En atención',
    'En atención': 'En validación',
  });

  async function cambiarEstado(id, estado, usuarioId) {
    const respuesta = await fetch(`/api/casos/${encodeURIComponent(id)}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado, usuario_id: usuarioId }),
    });
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.error || 'No se pudo cambiar el estado');
    return datos;
  }

  function crearControlEstado({ caso, obtenerUsuario, alActualizar = () => {} }) {
    let actual = { ...caso };
    let guardando = false;
    const elemento = document.createElement('div');
    elemento.className = 'control-estado';
    const boton = document.createElement('button');
    boton.type = 'button';
    const mensaje = document.createElement('p');
    mensaje.setAttribute('role', 'status');
    mensaje.setAttribute('aria-live', 'polite');
    elemento.append(boton, mensaje);

    // HU-04: solo el agente asignado cambia el estado. Si la pantalla no conoce
    // el agente del caso (agente_id ausente), la regla la aplica el servidor.
    function motivoSinPermiso(usuario) {
      if (!usuario || usuario.rol !== 'Agente') return 'Selecciona un agente para cambiar el estado.';
      if (!('agente_id' in actual)) return '';
      if (actual.agente_id === null) return 'Asígnate el caso para cambiar su estado.';
      if (Number(actual.agente_id) !== usuario.id) {
        return `Asignado a ${actual.agente || 'otro agente'}: solo ese agente puede cambiar el estado.`;
      }
      return '';
    }

    function actualizarUsuario() {
      const usuario = obtenerUsuario();
      const siguiente = siguientes[actual.estado];
      const motivo = motivoSinPermiso(usuario);
      boton.hidden = !siguiente;
      boton.textContent = guardando ? 'Guardando…' : `Pasar a ${siguiente || ''}`;
      boton.disabled = guardando || Boolean(motivo);
      if (!siguiente) {
        mensaje.textContent = actual.estado === 'En validación'
          ? 'Pendiente de aprobación o devolución por el validador.'
          : actual.estado === 'Cerrada' ? 'Caso cerrado.' : 'Estado no reconocido.';
      } else {
        mensaje.textContent = motivo;
      }
      mensaje.className = '';
    }

    boton.addEventListener('click', async () => {
      const usuario = obtenerUsuario();
      const siguiente = siguientes[actual.estado];
      if (guardando || !siguiente || motivoSinPermiso(usuario)) return;
      guardando = true;
      actualizarUsuario();
      try {
        actual = { ...actual, ...await cambiarEstado(actual.id, siguiente, usuario.id) };
      } catch (err) {
        guardando = false;
        actualizarUsuario();
        mensaje.textContent = err.message;
        mensaje.className = 'error';
        return;
      }
      guardando = false;
      actualizarUsuario();
      mensaje.textContent = `Estado actualizado: ${actual.estado}. ${mensaje.textContent}`;
      mensaje.className = 'ok';
      try {
        await alActualizar(actual);
      } catch {
        mensaje.textContent += ' No se pudo refrescar la bandeja; vuelve a cargarla.';
      }
    });

    actualizarUsuario();
    return { elemento, actualizarUsuario };
  }

  window.CampusHelpEstados = { cambiarEstado, crearControlEstado };
})();
