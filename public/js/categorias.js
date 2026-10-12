// HU-11: administración de categorías; el permiso también se verifica en la API.
(() => {
  const formulario = document.getElementById('form-categoria');
  const selector = document.getElementById('actuar-como');
  const area = document.getElementById('area');
  const nombre = document.getElementById('nombre');
  const descripcion = document.getElementById('descripcion');
  const guardar = document.getElementById('guardar-categoria');
  const cancelar = document.getElementById('cancelar-edicion');
  const gestion = document.getElementById('gestion');
  let usuario;
  let editando = null;
  let guardando = false;
  let consulta = 0;
  let areas = [];

  function mensaje(texto, tipo = '') {
    const el = document.getElementById('mensaje');
    el.textContent = texto; el.className = tipo;
  }
  function crear(etiqueta, texto) {
    const el = document.createElement(etiqueta);
    if (texto !== undefined) el.textContent = texto;
    return el;
  }
  function habilitar() {
    const permitido = usuario?.rol === 'Administrador';
    selector.disabled = guardando;
    for (const control of gestion.querySelectorAll('button, input, textarea, select')) {
      control.disabled = guardando || !permitido;
    }
    area.disabled = guardando || !permitido || Boolean(editando) || !areas.length;
    guardar.disabled = guardando || !permitido || (!editando && !areas.length);
  }
  function limpiar() {
    editando = null;
    formulario.reset();
    document.getElementById('titulo-formulario').textContent = 'Nueva categoría';
    guardar.textContent = 'Crear categoría'; cancelar.hidden = true;
    habilitar();
  }
  function editar(categoria) {
    if (guardando) return;
    editando = categoria;
    area.value = String(categoria.area_id);
    nombre.value = categoria.nombre; descripcion.value = categoria.descripcion || '';
    document.getElementById('titulo-formulario').textContent = `Editar categoría: ${categoria.nombre}`;
    guardar.textContent = 'Guardar cambios'; cancelar.hidden = false;
    habilitar(); nombre.focus();
  }
  function mostrarCategorias(categorias) {
    const grupos = new Map(areas.map(a => [a.id, { nombre: a.nombre, categorias: [] }]));
    for (const categoria of categorias) {
      if (!grupos.has(categoria.area_id)) grupos.set(categoria.area_id, { nombre: categoria.area, categorias: [] });
      grupos.get(categoria.area_id).categorias.push(categoria);
    }
    const contenedor = document.getElementById('grupos-categorias');
    contenedor.replaceChildren(...[...grupos.entries()].map(([id, grupo]) => {
      const seccion = crear('section'); seccion.dataset.areaId = id;
      seccion.append(crear('h2', grupo.nombre));
      if (!grupo.categorias.length) { seccion.append(crear('p', 'Sin categorías en esta área.')); return seccion; }
      const tabla = crear('table'); tabla.className = 'tabla-categorias';
      const cabecera = crear('thead'); const encabezados = crear('tr');
      for (const texto of ['Nombre', 'Descripción', 'Estado', 'Casos', 'Acciones']) {
        const th = crear('th', texto); th.scope = 'col'; encabezados.append(th);
      }
      cabecera.append(encabezados); const cuerpo = crear('tbody');
      for (const categoria of grupo.categorias) {
        const fila = crear('tr'); fila.dataset.categoriaId = categoria.id;
        if (!categoria.activa) fila.className = 'categoria-inactiva';
        fila.append(crear('td', categoria.nombre), crear('td', categoria.descripcion || '—'));
        const estado = crear('td', categoria.activa ? 'Activa' : 'Inactiva'); estado.className = 'estado-categoria';
        fila.append(estado, crear('td', String(categoria.casos)));
        const acciones = crear('td');
        const editarBoton = crear('button', 'Editar'); editarBoton.type = 'button'; editarBoton.className = 'editar';
        editarBoton.addEventListener('click', () => editar(categoria));
        const activar = crear('button', categoria.activa ? 'Desactivar' : 'Activar');
        activar.type = 'button'; activar.className = 'activar-categoria';
        activar.addEventListener('click', () => cambiar(
          () => api(`/api/categorias/${categoria.id}`, { method: 'PATCH',
            body: JSON.stringify({ activa: !categoria.activa, usuario_id: usuario.id }) }),
          `Categoría ${categoria.activa ? 'desactivada' : 'reactivada'}.`, false));
        acciones.append(editarBoton, activar); fila.append(acciones); cuerpo.append(fila);
      }
      tabla.append(cabecera, cuerpo); const envoltura = crear('div'); envoltura.className = 'tabla-contenedor';
      envoltura.append(tabla); seccion.append(envoltura); return seccion;
    }));
    habilitar();
  }
  async function cargar(confirmacion = '') {
    const actual = ++consulta;
    if (usuario?.rol !== 'Administrador') {
      gestion.hidden = true;
      mensaje('Solo un administrador puede gestionar categorías. Elige a un administrador en "Actuar como".', 'error');
      habilitar(); return;
    }
    mensaje('Cargando categorías…');
    try {
      const [categorias, nuevasAreas] = await Promise.all([
        api(`/api/categorias/gestion?usuario_id=${usuario.id}`), api('/api/categorias/areas'),
      ]);
      if (actual !== consulta) return;
      areas = nuevasAreas;
      const seleccion = editando?.area_id ?? Number(area.value);
      area.replaceChildren(...areas.map(a => new Option(a.nombre, a.id)));
      if (areas.some(a => a.id === seleccion)) area.value = String(seleccion);
      // El área de una categoría existente se conserva aunque ya esté inactiva.
      if (editando && !areas.some(a => a.id === editando.area_id)) area.add(new Option(editando.area, editando.area_id));
      mostrarCategorias(categorias); gestion.hidden = false;
      mensaje(confirmacion, confirmacion ? 'ok' : '');
    } catch (err) {
      if (actual !== consulta) return;
      gestion.hidden = true;
      mensaje(confirmacion ? `${confirmacion} No se pudo actualizar el catálogo. Recarga la página.` : err.message, 'error');
    }
  }
  async function cambiar(operacion, confirmacion, restablecer) {
    if (guardando || usuario?.rol !== 'Administrador') return;
    guardando = true; habilitar(); mensaje('Guardando categoría…');
    try {
      await operacion();
      if (restablecer) limpiar();
      await cargar(confirmacion);
    } catch (err) { mensaje(err.message || 'No se pudo guardar la categoría.', 'error'); }
    finally { guardando = false; habilitar(); }
  }
  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (guardando || !formulario.reportValidity()) return;
    const texto = nombre.value.trim();
    if ([...texto].length < 3 || [...texto].length > 100) {
      mensaje('El nombre debe tener entre 3 y 100 caracteres.', 'error'); return;
    }
    const cuerpo = { nombre: texto, descripcion: descripcion.value.trim(), usuario_id: usuario?.id };
    if (!editando) cuerpo.area_id = Number(area.value);
    const ruta = editando ? `/api/categorias/${editando.id}` : '/api/categorias';
    const metodo = editando ? 'PATCH' : 'POST';
    cambiar(() => api(ruta, { method: metodo, body: JSON.stringify(cuerpo) }),
      editando ? 'Categoría actualizada.' : 'Categoría creada.', true);
  });
  cancelar.addEventListener('click', limpiar);
  document.getElementById('actualizar').addEventListener('click', () => { if (!guardando) cargar(); });
  habilitar();
  inicializarActuarComo(selector, { onChange: seleccionado => {
    usuario = seleccionado; limpiar(); cargar();
  } }).catch(err => mensaje(err.message, 'error'));
})();
