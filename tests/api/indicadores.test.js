// HU-10 Indicadores — contrato HTTP de GET /api/indicadores y página indicadores.html.
const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { crearApp } = require('../../src/app');
const { crearServicios } = require('../../src/config/contenedor');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');

test('HU-10: contrato HTTP de los indicadores y página indicadores.html', async (t) => {
  const servicios = crearServicios(crearReposEnMemoria());
  await servicios.registrarCaso({
    tipo: 'Solicitud de servicio', titulo: 'Instalar Visual Studio', descripcion: 'Necesito Visual Studio en sala 3',
    prioridad: 'P3', categoria_id: 5, usuario_id: 1,
  });
  const servidor = crearApp({ servicios, verificarBaseDeDatos: async () => {} }).listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  t.after(() => new Promise((resolve) => {
    servidor.close(resolve);
    servidor.closeAllConnections?.();
  }));
  const url = `http://127.0.0.1:${servidor.address().port}`;
  const obtener = async (ruta) => {
    const r = await fetch(`${url}${ruta}`);
    return { status: r.status, body: await r.json() };
  };

  const ok = await obtener('/api/indicadores?usuario_id=6');
  assert.equal(ok.status, 200);
  assert.deepEqual(Object.keys(ok.body),
    ['total', 'abiertos', 'cerrados', 'por_estado', 'por_tipo', 'por_prioridad', 'tiempos']);
  assert.equal(ok.body.total, 1);
  assert.equal(ok.body.por_tipo['Solicitud de servicio'], 1);
  assert.equal(ok.body.por_prioridad.P3, 1);
  assert.deepEqual(ok.body.tiempos.resolucion, { promedio_horas: null, casos: 0 });

  for (const [ruta, esperado] of [
    ['/api/indicadores', 400],
    ['/api/indicadores?usuario_id=abc', 400],
    ['/api/indicadores?usuario_id=3', 403],
    ['/api/indicadores?usuario_id=77', 403],
  ]) {
    const r = await obtener(ruta);
    assert.equal(r.status, esperado, ruta);
    assert.ok(r.body.error, ruta);
  }

  const pagina = await fetch(`${url}/indicadores.html`);
  assert.equal(pagina.status, 200);
  const html = await pagina.text();
  for (const id of ['actuar-como', 'tarjetas', 'barras-estado', 'barras-tipo', 'barras-prioridad', 'tiempos']) {
    assert.match(html, new RegExp(`id="${id}"`), id);
  }
  assert.match(html, /js\/indicadores\.js/);
});
