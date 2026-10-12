// HU-07: el validador ve los casos En validación con su última solución
// y los aprueba o los devuelve con un motivo (10 a 100 caracteres).
// Usa GET /api/casos?vista=bandeja (filtrado aquí), GET /api/casos/:id/atenciones
// y POST /api/casos/:id/validacion.

let consultaActual = 0; // evita que una respuesta lenta pise a una más nueva
let usuarioSeleccionado = null;

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

function tarjetaCaso(caso, atencion) {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'caso-validacion';
  tarjeta.dataset.casoId = caso.id;
  tarjeta.innerHTML = `
    <h3>#${escapar(caso.id)} — ${escapar(caso.titulo)}</h3>
    <p class="meta">
      <span class="prioridad prioridad-${escapar(caso.prioridad)}">${escapar(caso.prioridad)}</span>
      · ${escapar(caso.tipo)} · ${escapar(caso.area)} / ${escapar(caso.categoria)}
      · Agente: ${escapar(caso.agente || 'Sin asignar')}
    </p>
    ${atencion ? `
    <dl>
      <dt>Diagnóstico</dt><dd>${escapar(atencion.diagnostico)}</dd>
      <dt>Solución</dt><dd>${escapar(atencion.solucion)}</dd>
      <dt>Registrada por</dt><dd>${escapar(atencion.agente)} · ${escapar(atencion.fecha)}</dd>
    </dl>` : '<p class="sin-solucion">Este caso no tiene una solución registrada.</p>'}
    <div class="acciones">
      <button type="button" class="aprobar">Aprobar</button>
      <button type="button" class="secundario devolver">Devolver…</button>
    </div>
    <div class="motivo" hidden>
      <label for="motivo-${escapar(caso.id)}">Motivo de la devolución</label>
      <textarea id="motivo-${escapar(caso.id)}" rows="3" maxlength="100"
        placeholder="Entre 10 y 100 caracteres"></textarea>
      <div class="acciones">
        <button type="button" class="secundario confirmar-devolver">Confirmar devolución</button>
        <button type="button" class="secundario cancelar">Cancelar</button>
      </div>
    </div>`;

  const botones = tarjeta.querySelectorAll('button');
  const zonaMotivo = tarjeta.querySelector('.motivo');
  const campoMotivo = tarjeta.querySelector('textarea');
  const bloquear = (valor) => botones.forEach((b) => { b.disabled = valor || !usuarioSeleccionado; });
  bloquear(false);

  async function enviar(cuerpo, textoOk) {
    bloquear(true);
    mostrarMensaje('Enviando decisión…');
    try {
      await api(`/api/casos/${encodeURIComponent(caso.id)}/validacion`, {
        method: 'POST',
        body: JSON.stringify({ ...cuerpo, usuario_id: usuarioSeleccionado.id }),
      });
      await cargar({ confirmacion: textoOk });
    } catch (err) {
      mostrarMensaje(err.message || 'No se pudo registrar la decisión.', 'error');
      bloquear(false);
      // 409: otro validador ya decidió; se recarga para mostrar el estado real.
      if (err.status === 409) {
        cargar({ confirmacion: '' }).then(() => mostrarMensaje(err.message, 'error')).catch(() => {});
      }
    }
  }

  tarjeta.querySelector('.aprobar').addEventListener('click', () => {
    if (!usuarioSeleccionado) return;
    enviar({ decision: 'aprobar' }, `Caso #${caso.id} aprobado y cerrado.`);
  });
  tarjeta.querySelector('.devolver').addEventListener('click', () => {
    zonaMotivo.hidden = false;
    campoMotivo.focus();
  });
  tarjeta.querySelector('.cancelar').addEventListener('click', () => {
    zonaMotivo.hidden = true;
    campoMotivo.value = '';
  });
  tarjeta.querySelector('.confirmar-devolver').addEventListener('click', () => {
    if (!usuarioSeleccionado) return;
    const motivo = campoMotivo.value.trim();
    if (motivo.length < 10 || motivo.length > 100) {
      mostrarMensaje('El motivo debe tener entre 10 y 100 caracteres.', 'error');
      campoMotivo.focus();
      return;
    }
    enviar({ decision: 'devolver', motivo }, `Caso #${caso.id} devuelto al agente.`);
  });
  return tarjeta;
}

async function cargar({ confirmacion = '' } = {}) {
  const consulta = ++consultaActual;
  const lista = document.getElementById('lista-validacion');
  document.getElementById('vacio').hidden = true;
  if (!usuarioSeleccionado) {
    lista.replaceChildren();
    mostrarMensaje('No hay validadores activos disponibles.', 'error');
    return;
  }
  mostrarMensaje('Cargando casos…');
  try {
    const casos = (await api('/api/casos?vista=bandeja')).filter((c) => c.estado === 'En validación');
    const atenciones = await Promise.all(casos.map((c) => api(`/api/casos/${encodeURIComponent(c.id)}/atenciones`)));
    if (consulta !== consultaActual) return;
    lista.replaceChildren(...casos.map((c, i) => tarjetaCaso(c, atenciones[i][0] || null)));
    mostrarMensaje(confirmacion, confirmacion ? 'ok' : '');
    document.getElementById('vacio').hidden = casos.length > 0;
  } catch (err) {
    if (consulta !== consultaActual) return;
    mostrarMensaje(err.message || 'No se pudieron cargar los casos. Intenta de nuevo.', 'error');
  }
}

async function iniciar() {
  try {
    await inicializarActuarComo('actuar-como', {
      rol: 'Validador',
      onChange: (usuario) => {
        usuarioSeleccionado = usuario;
        cargar();
      },
    });
  } catch (err) {
    mostrarMensaje(err.message || 'No se pudo cargar el selector de usuarios', 'error');
  }
}

iniciar();