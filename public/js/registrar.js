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
  selectArea.innerHTML = areas
    .map(([id, nombre]) => `<option value="${id}">${nombre}</option>`)
    .join('');
  rellenarCategorias();
}

function rellenarCategorias() {
  const areaId = Number(document.getElementById('area').value);
  const selectCat = document.getElementById('categoria');
  const filtradas = categorias.filter((c) => c.area_id === areaId);
  selectCat.innerHTML = filtradas
    .map((c) => `<option value="${c.id}">${c.nombre}</option>`)
    .join('');
}

async function cargarCatalogos() {
  categorias = await api('/api/categorias');
  rellenarAreas();
}

async function enviarRegistro(evento) {
  evento.preventDefault();
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
