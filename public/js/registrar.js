// Formulario de registro de casos (HU-01).
// Área → categorías dependientes; el solicitante sale de "Actuar como".

let categorias = [];

function mostrarMensaje(texto, tipo) {
  const el = document.getElementById('mensaje');
  el.textContent = texto;
  el.className = tipo || '';
}

function rellenarAreas() {
  const selectArea = document.getElementById('area');
  const areas = [...new Map(categorias.map((c) => [c.area_id, c.area])).entries()];
  // new Option() trata el nombre como texto (DEF-03: nunca se interpreta como HTML).
  selectArea.replaceChildren(...areas.map(([id, nombre]) => new Option(nombre, id)));
  rellenarCategorias();
}

function rellenarCategorias() {
  const areaId = Number(document.getElementById('area').value);
  const selectCat = document.getElementById('categoria');
  const filtradas = categorias.filter((c) => c.area_id === areaId);
  selectCat.replaceChildren(...filtradas.map((c) => new Option(c.nombre, c.id)));
}

async function cargarCatalogos() {
  categorias = await api('/api/categorias');
  rellenarAreas();
}

let enviando = false;

async function enviarRegistro(evento) {
  evento.preventDefault();
  // DEF-02: un doble clic no debe registrar el caso dos veces.
  if (enviando) return;
  const usuarioId = usuarioActualId();
  if (!usuarioId) {
    mostrarMensaje('Selecciona un solicitante en "Actuar como".', 'error');
    return;
  }

  const cuerpo = {
    tipo: document.getElementById('tipo').value,
    titulo: document.getElementById('titulo').value,
    descripcion: document.getElementById('descripcion').value,
    prioridad: document.getElementById('prioridad').value,
    categoria_id: Number(document.getElementById('categoria').value),
    usuario_id: usuarioId,
  };

  const boton = evento.target.querySelector('button[type="submit"]');
  enviando = true;
  boton.disabled = true;
  boton.textContent = 'Registrando…';
  try {
    const caso = await api('/api/casos', {
      method: 'POST',
      body: JSON.stringify(cuerpo),
    });
    mostrarMensaje(
      `Caso #${caso.id} registrado en estado ${caso.estado}.`,
      'ok'
    );
    evento.target.reset();
    document.getElementById('prioridad').value = 'P2';
    rellenarCategorias();
  } catch (err) {
    mostrarMensaje(err.message || 'No se pudo registrar el caso', 'error');
  } finally {
    enviando = false;
    boton.disabled = false;
    boton.textContent = 'Registrar caso';
  }
}

async function iniciar() {
  try {
    await inicializarActuarComo('actuar-como', { rol: 'Solicitante' });
    await cargarCatalogos();
    document.getElementById('area').addEventListener('change', rellenarCategorias);
    document.getElementById('form-registro').addEventListener('submit', enviarRegistro);
  } catch (err) {
    mostrarMensaje(err.message || 'No se pudo cargar el formulario', 'error');
  }
}

iniciar();
