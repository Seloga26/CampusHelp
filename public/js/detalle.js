// HU-12: consulta de solo lectura; el servidor valida el acceso a cada caso.
(() => {
  let usuario;
  let consulta = 0;
  const casoId = document.getElementById('caso-id');
  const resultado = document.getElementById('resultado');
  const datosCaso = document.getElementById('datos-caso');
  const atenciones = document.getElementById('atenciones');

  function crear(etiqueta, texto) {
    const el = document.createElement(etiqueta);
    if (texto !== undefined) el.textContent = texto;
    return el;
  }
  function mensaje(texto, tipo = '') {
    const el = document.getElementById('mensaje'); el.textContent = texto; el.className = tipo;
  }
  function limpiar() {
    resultado.hidden = true;
    datosCaso.replaceChildren(); atenciones.replaceChildren();
    document.getElementById('titulo-detalle').textContent = 'Detalle';
    document.getElementById('ver-historial').removeAttribute('href');
  }
  function mostrar(caso) {
    document.getElementById('titulo-detalle').textContent = `Caso #${caso.id}: ${caso.titulo}`;
    const campos = [
      ['tipo', 'Tipo'], ['titulo', 'Título'], ['descripcion', 'Descripción'],
      ['area', 'Área'], ['categoria', 'Categoría'], ['prioridad', 'Prioridad'], ['estado', 'Estado'],
      ['solicitante', 'Solicitante'], ['agente', 'Agente asignado'], ['fecha_creacion', 'Fecha de creación'],
      ['fecha_asignacion', 'Fecha de asignación'], ['fecha_inicio_atencion', 'Inicio de atención'], ['fecha_cierre', 'Fecha de cierre'],
    ];
    for (const [campo, etiqueta] of campos) {
      const valor = crear('dd', caso[campo] ?? (campo === 'agente' ? 'Sin asignar' : 'Sin registrar'));
      valor.dataset.campo = campo;
      datosCaso.append(crear('dt', etiqueta), valor);
    }
    document.getElementById('ver-historial').href = `historial.html?id=${encodeURIComponent(caso.id)}`;
    atenciones.replaceChildren(...caso.atenciones.map((atencion, i) => {
      const item = crear('li'); item.dataset.atencionId = atencion.id;
      if (i === 0) item.className = 'vigente';
      item.append(crear('h3', i === 0 ? 'Solución vigente' : 'Atención anterior'));
      const autor = crear('p', `${atencion.agente} · ${atencion.fecha}`); autor.className = 'atencion-autor';
      const diagnostico = crear('p', atencion.diagnostico || 'Sin diagnóstico'); diagnostico.className = 'diagnostico';
      const solucion = crear('p', atencion.solucion || 'Sin solución'); solucion.className = 'solucion';
      item.append(autor, crear('strong', 'Diagnóstico'), diagnostico, crear('strong', 'Solución'), solucion);
      return item;
    }));
    document.getElementById('sin-solucion').hidden = caso.atenciones.length > 0;
    resultado.hidden = false;
  }
  async function consultar() {
    const actual = ++consulta;
    limpiar();
    const id = casoId.value.trim();
    if (!id) { mensaje(''); return; }
    if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) {
      mensaje('Escribe un número de caso válido.', 'error'); return;
    }
    if (!usuario) { mensaje('Selecciona un usuario en "Actuar como".', 'error'); return; }
    history.replaceState(null, '', `detalle.html?id=${encodeURIComponent(id)}`);
    mensaje('Cargando detalle…');
    try {
      const caso = await api(`/api/casos/${encodeURIComponent(id)}?usuario_id=${usuario.id}`);
      if (actual !== consulta) return;
      mostrar(caso); mensaje('');
    } catch (err) {
      if (actual !== consulta) return;
      const texto = err.status === 404 ? `No existe un caso con el número ${id}.` : err.message;
      mensaje(texto || 'No se pudo cargar el detalle. Intenta de nuevo.', 'error');
    }
  }
  casoId.value = new URLSearchParams(location.search).get('id') || '';
  document.getElementById('form-detalle').addEventListener('submit', evento => {
    evento.preventDefault(); consultar();
  });
  inicializarActuarComo('actuar-como', { onChange: seleccionado => {
    usuario = seleccionado; consultar();
  } }).catch(err => mensaje(err.message, 'error'));
})();
