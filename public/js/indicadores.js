// Indicadores del servicio (HU-10): GET /api/indicadores?usuario_id=ID.
// Solo un Administrador los consulta; el permiso lo decide el servidor.
// Las barras se dibujan con HTML y CSS, sin librerías de gráficas.

let consultaActual = 0; // evita que una respuesta lenta pise a una más nueva
let usuarioSeleccionado = null;

const DESCRIPCION_TIEMPOS = {
  asignacion: ['Hasta la asignación', 'Desde que se registra hasta que un agente lo asume'],
  atencion: ['De atención', 'Desde que entra En atención hasta que se cierra'],
  resolucion: ['De resolución', 'Desde que se registra hasta que se cierra'],
};

function mostrarMensaje(texto, tipo) {
  const el = document.getElementById('mensaje');
  el.textContent = texto;
  el.className = tipo || '';
}

function crear(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto; // nunca se interpreta como HTML
  return el;
}

function tarjeta(titulo, valor, detalle) {
  const t = crear('div', 'tarjeta');
  t.append(crear('span', 'tarjeta-titulo', titulo), crear('strong', 'tarjeta-valor', valor));
  if (detalle) t.append(crear('span', 'tarjeta-detalle', detalle));
  return t;
}

function horas(valor) {
  // Regla 5: un decimal con coma decimal, como se escribe en español.
  return `${valor.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h`;
}

function mostrarTarjetas(datos) {
  document.getElementById('tarjetas').replaceChildren(
    tarjeta('Total de casos', String(datos.total)),
    tarjeta('Abiertos', String(datos.abiertos), 'Todo lo que no está Cerrada'),
    tarjeta('Cerrados', String(datos.cerrados)),
  );
  document.getElementById('tiempos').replaceChildren(...Object.entries(DESCRIPCION_TIEMPOS).map(([clave, [titulo, ayuda]]) => {
    const t = datos.tiempos[clave];
    const sinDatos = t.promedio_horas === null;
    const casos = `${t.casos} ${t.casos === 1 ? 'caso' : 'casos'}`;
    const el = tarjeta(titulo, sinDatos ? 'Sin datos' : horas(t.promedio_horas),
      sinDatos ? ayuda : `${ayuda} · ${casos}`);
    el.classList.toggle('sin-datos', sinDatos);
    return el;
  }));
}

function mostrarBarras(idLista, conteos, total, clasePorValor) {
  const lista = document.getElementById(idLista);
  lista.replaceChildren(...Object.entries(conteos).map(([valor, cantidad]) => {
    const porcentaje = total ? Math.round((cantidad / total) * 100) : 0;
    const item = crear('li');
    item.dataset.valor = valor;
    const etiqueta = crear('span', 'barra-etiqueta', valor);
    const numero = crear('span', 'barra-numero', `${cantidad} (${porcentaje} %)`);
    const pista = crear('span', 'barra-pista');
    const relleno = crear('span', `barra-relleno ${clasePorValor ? clasePorValor(valor) : ''}`.trim());
    relleno.style.width = `${porcentaje}%`;
    pista.append(relleno);
    pista.setAttribute('role', 'img');
    pista.setAttribute('aria-label', `${valor}: ${cantidad} de ${total}`);
    item.append(etiqueta, numero, pista);
    return item;
  }));
}

function ocultarResultado() {
  document.getElementById('resultado').hidden = true;
}

async function consultar() {
  const consulta = ++consultaActual;
  if (!usuarioSeleccionado) {
    ocultarResultado();
    mostrarMensaje('Selecciona un usuario en "Actuar como".', 'error');
    return;
  }
  mostrarMensaje('Calculando indicadores…');
  try {
    const datos = await api(`/api/indicadores?usuario_id=${encodeURIComponent(usuarioSeleccionado.id)}`);
    if (consulta !== consultaActual) return;
    mostrarMensaje('');
    mostrarTarjetas(datos);
    mostrarBarras('barras-estado', datos.por_estado, datos.total,
      (estado) => `estado-${estado.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')}`);
    mostrarBarras('barras-tipo', datos.por_tipo, datos.total);
    mostrarBarras('barras-prioridad', datos.por_prioridad, datos.total, (p) => `prioridad-barra-${p}`);
    document.getElementById('resultado').hidden = false;
  } catch (err) {
    if (consulta !== consultaActual) return;
    ocultarResultado();
    const textos = {
      403: 'Solo un administrador puede consultar los indicadores. Elige a un administrador en "Actuar como".',
    };
    mostrarMensaje(textos[err.status] || err.message || 'No se pudieron cargar los indicadores.', 'error');
  }
}

async function iniciar() {
  document.getElementById('actualizar').addEventListener('click', consultar);
  try {
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
