// Historial del caso (HU-08): GET /api/casos/:id/historial?usuario_id=ID.
// Se abre como historial.html?id=<caso> desde la bandeja y desde "Mis casos",
// o escribiendo el número de caso. El permiso lo decide el servidor.

let consultaActual = 0; // evita que una respuesta lenta pise a una más nueva
let usuarioSeleccionado = null;

function mostrarMensaje(texto, tipo) {
  const el = document.getElementById('mensaje');
  el.textContent = texto;
  el.className = tipo || '';
}

function casoIdValido(valor) {
  return /^[1-9]\d*$/.test(String(valor)) && Number(valor) <= 2147483647;
}

function describirEstado(evento) {
  if (evento.estado_anterior && evento.estado_nuevo) {
    return `${evento.estado_anterior} → ${evento.estado_nuevo}`;
  }
  if (evento.estado_nuevo) return `Estado: ${evento.estado_nuevo}`;
  return '';
}

function mostrarEventos(eventos) {
  const lista = document.getElementById('linea-tiempo');
  // Se construye con textContent: los datos nunca se interpretan como HTML.
  lista.replaceChildren(...eventos.map((evento) => {
    const item = document.createElement('li');
    item.dataset.eventoId = evento.id;
    const fecha = document.createElement('time');
    fecha.textContent = evento.fecha;
    fecha.dateTime = String(evento.fecha || '').replace(' ', 'T');
    const nombre = document.createElement('strong');
    nombre.className = 'evento';
    nombre.textContent = evento.evento;
    const estado = document.createElement('span');
    estado.className = 'cambio-estado';
    estado.textContent = describirEstado(evento);
    estado.hidden = !estado.textContent;
    const autor = document.createElement('span');
    autor.className = 'autor';
    autor.textContent = `${evento.usuario} (${evento.rol})`;
    item.append(fecha, nombre, estado, autor);
    return item;
  }));
  document.getElementById('vacio-historial').hidden = eventos.length > 0;
}

function ocultarResultado() {
  document.getElementById('resultado').hidden = true;
  document.getElementById('linea-tiempo').replaceChildren();
}

async function consultar() {
  const consulta = ++consultaActual;
  const valor = document.getElementById('caso-id').value.trim();
  ocultarResultado();
  if (!valor) {
    mostrarMensaje('');
    return;
  }
  if (!casoIdValido(valor)) {
    mostrarMensaje('Escribe un número de caso válido.', 'error');
    return;
  }
  if (!usuarioSeleccionado) {
    mostrarMensaje('Selecciona un usuario en "Actuar como".', 'error');
    return;
  }

  // La URL refleja el caso consultado para poder compartirla o recargarla.
  history.replaceState(null, '', `historial.html?id=${encodeURIComponent(valor)}`);
  mostrarMensaje('Cargando historial…');
  try {
    const eventos = await api(`/api/casos/${encodeURIComponent(valor)}/historial`
      + `?usuario_id=${encodeURIComponent(usuarioSeleccionado.id)}`);
    if (consulta !== consultaActual) return;
    mostrarMensaje('');
    document.getElementById('titulo-historial').textContent = `Historial del caso #${valor}`;
    mostrarEventos(eventos);
    document.getElementById('resultado').hidden = false;
  } catch (err) {
    if (consulta !== consultaActual) return;
    const textos = {
      404: `No existe un caso con el número ${valor}.`,
    };
    mostrarMensaje(textos[err.status] || err.message || 'No se pudo cargar el historial.', 'error');
  }
}

async function iniciar() {
  const id = new URLSearchParams(location.search).get('id');
  if (id) document.getElementById('caso-id').value = id;
  document.getElementById('form-historial').addEventListener('submit', (evento) => {
    evento.preventDefault();
    consultar();
  });
  try {
    // Todos los roles pueden consultar; el servidor limita al solicitante a sus casos.
    await inicializarActuarComo('actuar-como', {
      onChange: (usuario) => {
        usuarioSeleccionado = usuario;
        consultar();
      },
    });
  } catch (err) {
    mostrarMensaje(err.message || 'No se pudo cargar el selector de usuarios', 'error');
  }
}

iniciar();
