const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { crearReposEnMemoria } = require('../fakes/repositoriosEnMemoria');
const { crearServicios } = require('../../src/config/contenedor');
const { crearApp } = require('../../src/app');

test('HU-12: contrato HTTP 200/400/403/404 y página de detalle', async (t) => {
  const memoria = crearReposEnMemoria();
  const servicios = crearServicios(memoria);
  const { id } = await servicios.registrarCaso({ usuario_id: 1, categoria_id: 11, tipo: 'Solicitud de servicio',
    titulo: 'Acceso al correo', descripcion: 'Se requiere restablecer la contraseña', prioridad: 'P2' });
  const servidor = crearApp({ servicios, verificarBaseDeDatos: async () => {} }).listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  t.after(() => new Promise(ok => { servidor.close(ok); servidor.closeAllConnections?.(); }));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  for (const [ruta, status] of [
    [`/api/casos/${id}?usuario_id=1`, 200], [`/api/casos/${id}?usuario_id=3`, 200],
    [`/api/casos/${id}?usuario_id=2`, 403], [`/api/casos/${id}?usuario_id=999`, 403],
    [`/api/casos/${id}`, 400], [`/api/casos/${id}?usuario_id[]=1`, 400],
    ['/api/casos/abc?usuario_id=1', 400], ['/api/casos/1e1?usuario_id=1', 400],
    ['/api/casos/1.0?usuario_id=1', 400], ['/api/casos/2147483648?usuario_id=1', 400],
    ['/api/casos/999?usuario_id=1', 404],
  ]) {
    const respuesta = await fetch(base + ruta); const body = await respuesta.json();
    assert.equal(respuesta.status, status, ruta);
    if (status === 200) {
      assert.equal(body.tipo, 'Solicitud de servicio'); assert.equal(body.solicitante, 'Ana Solicitante');
      assert.equal(body.categoria, 'Contraseña'); assert.deepEqual(body.atenciones, []);
    } else {
      assert.equal(typeof body.error, 'string'); assert.equal(body.atenciones, undefined);
    }
  }
  const pagina = await fetch(base + '/detalle.html');
  assert.equal(pagina.status, 200); assert.match(await pagina.text(), /js\/detalle\.js/);
});
