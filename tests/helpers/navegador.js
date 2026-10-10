// Chrome/Edge mediante CDP, sin agregar dependencias al proyecto.
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');

async function abrirNavegador(t) {
  if (typeof WebSocket !== 'function') throw new Error('La prueba de navegador requiere Node.js 22 o posterior.');
  const candidatos = [process.env.CAMPUSHELP_BROWSER,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
  let ejecutable;
  for (const candidato of candidatos.filter(Boolean)) {
    try { await fs.access(candidato); ejecutable = candidato; break; } catch {}
  }
  if (!ejecutable) throw new Error('Configura CAMPUSHELP_BROWSER con la ruta de Chrome o Edge.');
  const perfil = await fs.mkdtemp(path.join(os.tmpdir(), 'campushelp-bandeja-'));
  const proceso = spawn(ejecutable, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--disable-background-networking', '--remote-debugging-port=0',
    `--user-data-dir=${perfil}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  let socket;
  t.after(async () => {
    socket?.close();
    proceso.kill();
    // Solo se elimina el perfil temporal generado por esta prueba.
    if (!path.resolve(perfil).startsWith(path.resolve(os.tmpdir()) + path.sep)) {
      throw new Error('Perfil fuera del directorio temporal');
    }
    await fs.rm(perfil, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  });
  let puerto;
  const limite = Date.now() + 15000;
  while (!puerto && Date.now() < limite) {
    try { puerto = (await fs.readFile(path.join(perfil, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; }
    catch { await new Promise((ok) => setTimeout(ok, 100)); }
  }
  if (!puerto) throw new Error('El navegador no abrió el puerto de depuración');
  const paginas = await fetch(`http://127.0.0.1:${puerto}/json/list`).then((r) => r.json());
  socket = new WebSocket(paginas.find((p) => p.type === 'page').webSocketDebuggerUrl);
  await once(socket, 'open');
  let secuencia = 0;
  const pendientes = new Map();
  let documentoListo;
  socket.addEventListener('message', ({ data }) => {
    const respuesta = JSON.parse(data);
    if (respuesta.method === 'Page.domContentEventFired') documentoListo?.();
    const pendiente = pendientes.get(respuesta.id);
    if (!pendiente) return;
    pendientes.delete(respuesta.id);
    clearTimeout(pendiente.timeout);
    if (respuesta.error) pendiente.reject(new Error(respuesta.error.message));
    else pendiente.resolve(respuesta.result);
  });
  function enviar(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++secuencia;
      const timeout = setTimeout(() => {
        pendientes.delete(id);
        reject(new Error(`Tiempo agotado: ${method}`));
      }, 15000);
      pendientes.set(id, { resolve, reject, timeout });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluar(expression) {
    const respuesta = await enviar('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (respuesta.exceptionDetails) {
      throw new Error(respuesta.exceptionDetails.exception?.description || respuesta.exceptionDetails.text);
    }
    return respuesta.result.value;
  }
  await enviar('Page.enable');
  await enviar('Network.enable');
  // La prueba de interacción no depende de la disponibilidad de Google Fonts.
  await enviar('Network.setBlockedURLs', { urls: ['https://fonts.googleapis.com/*', 'https://fonts.gstatic.com/*'] });
  return {
    evaluar,
    navegar: async (url) => {
      let timeout;
      const cargada = new Promise((resolve, reject) => {
        documentoListo = resolve;
        timeout = setTimeout(() => reject(new Error('La página no terminó de cargar')), 15000);
      });
      try { await enviar('Page.navigate', { url }); await cargada; }
      finally { clearTimeout(timeout); documentoListo = null; }
    },
    esperar: (expression) => evaluar(`(async () => {
      const limite = Date.now() + 10000;
      while (Date.now() < limite) {
        if (${expression}) return true;
        await new Promise(ok => setTimeout(ok, 25));
      }
      throw new Error('Tiempo agotado esperando la página');
    })()`),
  };
}

module.exports = { abrirNavegador };
