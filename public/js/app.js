// Comprueba la API y muestra las categorías cargadas desde la BD.
async function cargar() {
  const estado = document.getElementById('estado');
  try {
    const salud = await fetch('/api/health').then((r) => r.json());
    const ok = salud.db === 'ok';
    estado.textContent = ok ? 'App y base de datos funcionando' : `Sin conexión a BD (${salud.detalle})`;
    estado.className = ok ? 'ok' : 'error';
    if (!ok) return;

    const categorias = await fetch('/api/categorias').then((r) => r.json());
    const porArea = {};
    categorias.forEach((c) => (porArea[c.area] ??= []).push(c.nombre));
    // Se arma con textContent: los nombres nunca se interpretan como HTML (DEF-03).
    document.getElementById('categorias').replaceChildren(...Object.entries(porArea).map(([area, cats]) => {
      const item = document.createElement('li');
      const titulo = document.createElement('strong');
      titulo.textContent = `${area}:`;
      item.append(titulo, ` ${cats.join(', ')}`);
      return item;
    }));
  } catch (err) {
    estado.textContent = 'No se pudo contactar la API';
    estado.className = 'error';
  }
}

cargar();
