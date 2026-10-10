// Pruebas HTTP de GET /api/casos (HU-02, CP-12): rutas + servicio + middleware,
// con repositorios en memoria (sin MySQL).
const test = require('node:test');
const assert = require('node:assert');
const { crearApp } = require('../../src/app');
const { crearServicios } = require('../../src/config/contenedor');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');

function casosDePrueba() {
  const base = { descripcion: 'Descripción de prueba', categoria_id: 1, agente_id: null };
  return [
    { ...base, id: 1, tipo: 'Incidente', titulo: 'Pantalla azul', prioridad: 'P1', estado: 'Pendiente', usuario_id: 1, fecha_creacion: '2026-10-05 08:00:00' },
    { ...base, id: 2, tipo: 'Solicitud de servicio', titulo: 'Instalar Photoshop', prioridad: 'P2', estado: 'En análisis', usuario_id: 1, fecha_creacion: '2026-10-05 09:30:00' },
    { ...base, id: 3, tipo: 'Incidente', titulo: 'No conecta al Wi-Fi', prioridad: 'P1', estado: 'Pendiente', usuario_id: 2, fecha_creacion: '2026-10-05 08:15:00' },
    { ...base, id: 4, tipo: 'Solicitud de servicio', titulo: 'Cambio de teclado', prioridad: 'P3', estado: 'Cerrada', usuario_id: 1, fecha_creacion: '2026-10-04 15:00:00' },
  ];
}

async function levantar() {
  const { repos, enTransaccion } = crearReposEnMemoria({ casos: casosDePrueba() });
  const app = crearApp({
    servicios: crearServicios({ repos, enTransaccion }),
    verificarBaseDeDatos: async () => {},
  });
  const servidor = await new Promise((ok) => {
    const s = app.listen(0, () => ok(s));
  });
  return {
    url: `http://127.0.0.1:${servidor.address().port}`,
    repos,
    cerrar: () => new Promise((ok) => servidor.close(ok)),
  };
}

test('CP-12: GET /api/casos?usuario_id=1 devuelve solo los casos de Ana, el más reciente primero', async (t) => {
  const { url, cerrar } = await levantar();
  t.after(cerrar);

  const r = await fetch(`${url}/api/casos?usuario_id=1`);
  const casos = await r.json();

  assert.equal(r.status, 200);
  assert.deepEqual(casos.map((c) => c.id), [2, 1, 4]);
  assert.ok(casos.some((c) => c.estado === 'Cerrada'));
});

test('CP-12: un solicitante sin casos recibe 200 y una lista vacía', async (t) => {
  const { url, cerrar } = await levantar();
  t.after(cerrar);

  const r = await fetch(`${url}/api/casos?usuario_id=99`);

  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), []);
});

test('CP-12: un usuario_id inválido responde 400 con mensaje', async (t) => {
  const { url, cerrar } = await levantar();
  t.after(cerrar);

  const r = await fetch(`${url}/api/casos?usuario_id=abc`);

  assert.equal(r.status, 400);
  assert.match((await r.json()).error, /usuario_id/);
});

test('CP-12: el cambio de estado aparece al consultar de nuevo la API', async (t) => {
  const { url, repos, cerrar } = await levantar();
  t.after(cerrar);
  const antes = await (await fetch(`${url}/api/casos?usuario_id=1`)).json();
  assert.equal(antes.find((c) => c.id === 1).estado, 'Pendiente');

  await repos.casos.actualizarEstado(1, 'En análisis'); // lo que haría un agente

  const despues = await (await fetch(`${url}/api/casos?usuario_id=1`)).json();
  assert.equal(despues.find((c) => c.id === 1).estado, 'En análisis');
});

test('HU-03: GET /api/casos?vista=bandeja sigue excluyendo cerrados y ordenando por prioridad', async (t) => {
  const { url, cerrar } = await levantar();
  t.after(cerrar);

  const r = await fetch(`${url}/api/casos?vista=bandeja`);
  const casos = await r.json();

  assert.equal(r.status, 200);
  assert.deepEqual(casos.map((c) => c.id), [1, 3, 2]);
});