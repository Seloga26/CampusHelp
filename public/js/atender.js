// HU-06: formulario independiente; la bandeja puede enlazar atender.html?id=<caso>.
(() => {
  const formulario = document.getElementById('form-atencion');
  const selector = document.getElementById('actuar-como');
  const casoId = document.getElementById('caso-id');
  const diagnostico = document.getElementById('diagnostico');
  const solucion = document.getElementById('solucion');
  const boton = document.getElementById('guardar-atencion');
  const mensaje = document.getElementById('mensaje');
  let usuario = null;
  let guardando = false;

  function mostrarMensaje(texto, tipo = '') {
    mensaje.textContent = texto;
    mensaje.className = tipo;
  }

  function actualizarControles() {
    boton.disabled = guardando || !usuario || usuario.rol !== 'Agente';
    boton.textContent = guardando ? 'Guardando…' : 'Registrar atención';
    for (const control of [selector, casoId, diagnostico, solucion]) {
      control.disabled = guardando || !usuario;
    }
  }

  const idEnlace = new URLSearchParams(window.location.search).get('id');
  if (idEnlace && /^[1-9]\d*$/.test(idEnlace) && Number(idEnlace) <= 2147483647) {
    casoId.value = idEnlace;
  }

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (guardando || !usuario || usuario.rol !== 'Agente') return;
    if (!formulario.reportValidity()) return;
    const cuerpo = {
      diagnostico: diagnostico.value.trim(),
      solucion: solucion.value.trim(),
      usuario_id: usuario.id,
    };
    if (cuerpo.diagnostico.length < 10 || cuerpo.solucion.length < 10) {
      mostrarMensaje('Diagnóstico y solución deben tener al menos 10 caracteres, sin contar espacios al inicio o al final.', 'error');
      return;
    }
    const id = casoId.value;
    guardando = true;
    actualizarControles();
    mostrarMensaje('Guardando atención…');
    try {
      const atencion = await api(`/api/casos/${encodeURIComponent(id)}/atencion`, {
        method: 'POST', body: JSON.stringify(cuerpo),
      });
      diagnostico.value = '';
      solucion.value = '';
      mostrarMensaje(`Atención #${atencion.id} registrada para el caso #${atencion.caso_id}. El caso continúa En atención.`, 'ok');
    } catch (err) {
      mostrarMensaje(err.message || 'No se pudo registrar la atención.', 'error');
    } finally {
      guardando = false;
      actualizarControles();
    }
  });

  actualizarControles();
  inicializarActuarComo(selector, {
    rol: 'Agente',
    onChange: (seleccionado) => {
      usuario = seleccionado;
      actualizarControles();
      mostrarMensaje(usuario ? '' : 'No hay agentes activos disponibles.', usuario ? '' : 'error');
    },
  }).catch((err) => mostrarMensaje(err.message || 'No se pudieron cargar los agentes.', 'error'));
})();
