(() => {
  const selector = document.getElementById('usuario');
  const mensaje = document.getElementById('mensaje');
  let usuarios = [];
  let control;

  const obtenerUsuario = () => usuarios.find((u) => String(u.id) === selector.value);

  selector.addEventListener('change', () => control?.actualizarUsuario());
  document.getElementById('preparar-cambio').addEventListener('submit', (evento) => {
    evento.preventDefault();
    const caso = {
      id: Number(document.getElementById('caso-id').value),
      estado: document.getElementById('estado-actual').value,
    };
    mensaje.textContent = '';
    document.getElementById('titulo-caso').textContent = `Caso #${caso.id}`;
    document.getElementById('resumen-caso').textContent = `Estado indicado: ${caso.estado}`;
    control = CampusHelpEstados.crearControlEstado({
      caso,
      obtenerUsuario,
      alActualizar(actualizado) {
        document.getElementById('titulo-caso').textContent = `Caso #${actualizado.id}: ${actualizado.titulo}`;
        document.getElementById('resumen-caso').textContent = `Estado confirmado: ${actualizado.estado}`;
        document.getElementById('estado-actual').value = actualizado.estado;
      },
    });
    document.getElementById('accion-estado').replaceChildren(control.elemento);
    document.getElementById('caso-seleccionado').hidden = false;
  });

  async function cargarAgentes() {
    try {
      const respuesta = await fetch('/api/usuarios?rol=Agente');
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error || 'No se pudieron cargar los agentes');
      usuarios = datos;
      selector.replaceChildren(new Option('Selecciona un agente', ''));
      for (const usuario of usuarios) selector.add(new Option(usuario.nombre, String(usuario.id)));
      selector.disabled = !usuarios.length;
      document.getElementById('preparar').disabled = !usuarios.length;
      if (!usuarios.length) mensaje.textContent = 'No hay agentes activos disponibles.';
    } catch (err) {
      selector.replaceChildren(new Option('Agentes no disponibles', ''));
      mensaje.textContent = `No se pudieron cargar los agentes: ${err.message}`;
      mensaje.className = 'error';
    }
  }

  cargarAgentes();
})();
