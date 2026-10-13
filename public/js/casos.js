// Todos los casos (HU-09): lista GET /api/casos con filtros opcionales
// (estado, tipo, prioridad, área y categoría). Se aplican al cambiar cualquier
// filtro. La categoría depende del área elegida. El servidor valida los valores.

let categorias = [];
let consultaActual = 0; // evita que una respuesta lenta pise a una más nueva

const selectores = {
  estado: document.getElementById('filtro-estado'),
  tipo: document.getElementById('filtro-tipo'),
  prioridad: document.getElementById('filtro-prioridad'),
  area_id: document.getElementById('filtro-area'),
  categoria_id: document.getElementById('filtro-categoria'),
};

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
        <td><a href="detalle.html?id=${encodeURIComponent(c.id)}">Detalle</a>
          · <a href="historial.html?id=${encodeURIComponent(c.id)}">Historial</a></td>
      </tr>`)
    .join('');
  document.getElementById('tabla-casos').hidden = casos.length === 0;
}

// Área → categorías dependientes. Sin área elegida, se ofrecen todas las categorías.
function rellenarCategorias() {
  const areaId = Number(selectores.area_id.value);
  const anterior = selectores.categoria_id.value;
  const disponibles = areaId ? categorias.filter((c) => c.area_id === areaId) : categorias;
  // new Option() trata el nombre como texto, nunca como HTML.
  selectores.categoria_id.replaceChildren(
    new Option('Todas', ''),
    ...disponibles.map((c) => new Option(c.nombre, c.id)),
  );
  if (disponibles.some((c) => String(c.id) === anterior)) selectores.categoria_id.value = anterior;
}

function rellenarAreas() {
  const areas = [...new Map(categorias.map((c) => [c.area_id, c.area])).entries()];
  selectores.area_id.replaceChildren(
    new Option('Todas', ''),
    ...areas.map(([id, nombre]) => new Option(nombre, id)),
  );
  rellenarCategorias();
}

function consultaDeFiltros() {
  const parametros = new URLSearchParams();
  for (const [nombre, select] of Object.entries(selectores)) {
    if (select.value) parametros.set(nombre, select.value);
  }
  return parametros.toString();
}

async function cargarCasos() {
  const consulta = ++consultaActual;
  const contador = document.getElementById('contador');
  mostrarTabla([]);
  document.getElementById('vacio').hidden = true;
  contador.textContent = '';
  mostrarMensaje('Cargando casos…');

  try {
    const texto = consultaDeFiltros();
    const casos = await api(`/api/casos${texto ? `?${texto}` : ''}`);
    if (consulta !== consultaActual) return;
    mostrarMensaje('');
    contador.textContent = casos.length === 1 ? '1 caso encontrado' : `${casos.length} casos encontrados`;
    mostrarTabla(casos);
    document.getElementById('vacio').hidden = casos.length > 0;
  } catch (err) {
    if (consulta !== consultaActual) return;
    mostrarMensaje(err.message || 'No se pudieron cargar los casos. Intenta de nuevo.', 'error');
  }
}

selectores.area_id.addEventListener('change', () => {
  rellenarCategorias();
  cargarCasos();
});
for (const select of Object.values(selectores)) {
  if (select !== selectores.area_id) select.addEventListener('change', cargarCasos);
}
document.getElementById('limpiar').addEventListener('click', () => {
  for (const select of Object.values(selectores)) select.value = '';
  rellenarCategorias();
  cargarCasos();
});

async function iniciar() {
  try {
    categorias = await api('/api/categorias');
    rellenarAreas();
  } catch (err) {
    mostrarMensaje(err.message || 'No se pudieron cargar las áreas y categorías.', 'error');
  }
  cargarCasos();
}

iniciar();