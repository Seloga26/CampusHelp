const test = require('node:test');
const assert = require('node:assert/strict');
const { abrirMysqlTemporal } = require('../helpers/mysqlTemporal');
const { prepararDetalle } = require('../helpers/detalle');
const { abrirNavegador } = require('../helpers/navegador');

test('HU-12: detalle, solución vigente y permisos en Chrome con MySQL real', {
  skip: process.env.CAMPUSHELP_TEST_BROWSER !== '1',
}, async (t) => {
  const { db, base, pedir } = await abrirMysqlTemporal(t, 'hu12_browser');
  const { id, primera, segunda } = await prepararDetalle(pedir);
  const navegador = await abrirNavegador(t);
  const { evaluar, esperar } = navegador;
  const seleccionar = usuario => evaluar(`{ const s = document.getElementById('actuar-como');
    s.value = '${usuario}'; s.dispatchEvent(new Event('change')); }`);
  const cargar = async caso => {
    await evaluar(`document.getElementById('caso-id').value = '${caso}';
      document.getElementById('form-detalle').requestSubmit();`);
  };
  const listo = caso => esperar(`document.getElementById('resultado')?.hidden === false
    && document.getElementById('titulo-detalle').textContent.startsWith('Caso #${caso}:')`);

  await t.test('CP-40: Ana abre desde Mis casos y ve todos los datos, fechas y solución del caso cerrado', async () => {
    await navegador.navegar(base + '/mis-casos.html');
    await esperar(`document.querySelector('a[href="detalle.html?id=${id}"]')`);
    await evaluar(`document.querySelector('a[href="detalle.html?id=${id}"]').click()`);
    await listo(id);
    assert.equal(await evaluar("document.getElementById('actuar-como').value"), '1');
    assert.equal(await evaluar("document.getElementById('caso-id').value"), String(id));
    const [[caso]] = await db.execute('SELECT * FROM caso WHERE id = ?', [id]);
    for (const campo of ['tipo', 'titulo', 'descripcion', 'prioridad', 'estado', 'fecha_creacion',
      'fecha_asignacion', 'fecha_inicio_atencion', 'fecha_cierre']) {
      assert.equal(await evaluar(`document.querySelector('[data-campo="${campo}"]').textContent`), caso[campo]);
    }
    assert.equal(await evaluar("document.querySelector('[data-campo=agente]').textContent"), 'Carla Agente');
    assert.equal(await evaluar("document.querySelector('[data-campo=area]').textContent"), 'Red y conectividad');
    assert.equal(await evaluar("document.querySelector('[data-campo=categoria]').textContent"), 'Wi-Fi');
    assert.equal(await evaluar("document.querySelector('#atenciones .vigente .diagnostico').textContent"), segunda.diagnostico);
    assert.equal(await evaluar("document.querySelector('#atenciones .vigente .solucion').textContent"), segunda.solucion);
  });

  await t.test('CP-43: solución más reciente primero, anterior conservada y enlace al historial', async () => {
    assert.deepEqual(await evaluar("[...document.querySelectorAll('#atenciones li')].map(el => Number(el.dataset.atencionId))"),
      [segunda.id, primera.id]);
    assert.equal(await evaluar("document.querySelector('#atenciones li:nth-child(2) .solucion').textContent"), primera.solucion);
    assert.equal(await evaluar("document.querySelector('#atenciones li:first-child h3').textContent"), 'Solución vigente');
    assert.equal(await evaluar("document.querySelector('#atenciones li:nth-child(2) h3').textContent"), 'Atención anterior');
    await evaluar("document.getElementById('ver-historial').click()");
    await esperar("document.querySelectorAll('#linea-tiempo li').length > 0");
    assert.equal(await evaluar("document.getElementById('caso-id').value"), String(id));
    assert.match(await evaluar("document.getElementById('linea-tiempo').textContent"), /Solución devuelta/);
    await navegador.navegar(`${base}/detalle.html?id=${id}`); await listo(id);
  });

  await t.test('CP-41: cambiar a Bruno muestra 403 y limpia los datos del caso y de las atenciones', async () => {
    await seleccionar(2);
    await esperar("document.getElementById('mensaje').textContent.includes('tus propios casos')");
    assert.equal(await evaluar("document.getElementById('resultado').hidden"), true);
    assert.equal(await evaluar("document.querySelectorAll('#atenciones li').length"), 0);
    assert.equal(await evaluar("document.getElementById('datos-caso').textContent"), '');
    await seleccionar(5); await listo(id);
    assert.equal(await evaluar("document.querySelector('[data-campo=estado]').textContent"), 'Cerrada');
    await seleccionar(1); await listo(id);
  });

  await t.test('una respuesta lenta de Ana no vuelve a mostrar el caso después de cambiar a Bruno', async () => {
    await evaluar(`window.fetchDetalleOriginal = window.fetch; window.respuestaPendiente = false;
      window.fetch = async (...args) => {
        const r = await window.fetchDetalleOriginal(...args);
        if (String(args[0]).startsWith('/api/casos/') && String(args[0]).endsWith('usuario_id=1')) {
          window.respuestaPendiente = true; await new Promise(ok => setTimeout(ok, 250));
        }
        return r;
      };`);
    try {
      await cargar(id); await esperar('window.respuestaPendiente === true');
      await seleccionar(2);
      await esperar("document.getElementById('mensaje').textContent.includes('tus propios casos')");
      await evaluar('new Promise(ok => setTimeout(ok, 350))');
      assert.equal(await evaluar("document.getElementById('resultado').hidden"), true);
      assert.equal(await evaluar("document.querySelectorAll('#atenciones li').length"), 0);
    } finally { await evaluar('window.fetch = window.fetchDetalleOriginal'); }
    await seleccionar(1); await listo(id);
  });

  await t.test('CP-42: Pendiente sin agente muestra Sin asignar y Aún no hay una solución registrada', async () => {
    await cargar(1); await listo(1);
    assert.equal(await evaluar("document.querySelector('[data-campo=agente]').textContent"), 'Sin asignar');
    assert.equal(await evaluar("document.querySelector('[data-campo=fecha_cierre]').textContent"), 'Sin registrar');
    assert.equal(await evaluar("document.getElementById('sin-solucion').hidden"), false);
    assert.equal(await evaluar("document.getElementById('sin-solucion').textContent"), 'Aún no hay una solución registrada');
    assert.equal(await evaluar("document.querySelectorAll('#atenciones li').length"), 0);
  });

  await t.test('agente abre desde bandeja; errores 404 e ID inválido limpian el resultado', async () => {
    await navegador.navegar(base + '/bandeja.html');
    await esperar("document.querySelector('a[href=\"detalle.html?id=1\"]')");
    await evaluar("document.querySelector('a[href=\"detalle.html?id=1\"]').click()");
    await listo(1);
    assert.equal(await evaluar("document.getElementById('actuar-como').value"), '3');
    await cargar(999);
    await esperar("document.getElementById('mensaje').textContent.includes('No existe un caso')");
    assert.equal(await evaluar("document.getElementById('resultado').hidden"), true);
    await cargar('abc');
    await esperar("document.getElementById('mensaje').textContent === 'Escribe un número de caso válido.'");
    assert.equal(await evaluar("document.querySelectorAll('#atenciones li').length"), 0);
  });

  await t.test('solo lectura y textos con HTML se muestran literalmente sin ejecutarse', async () => {
    const titulo = '<img src=x onerror=window.inyectado=true>';
    const solucion = '<b id=inyectado>Solución literal</b>';
    await db.execute('UPDATE caso SET titulo = ? WHERE id = ?', [titulo, id]);
    await db.execute('UPDATE atencion SET solucion = ? WHERE id = ?', [solucion, segunda.id]);
    async function leer() {
      return Promise.all(['caso', 'atencion', 'historial'].map(async tabla => (await db.query(`SELECT * FROM ${tabla} ORDER BY id`))[0]));
    }
    const antes = await leer();
    await cargar(id); await listo(id);
    assert.equal(await evaluar("document.querySelector('[data-campo=titulo]').textContent"), titulo);
    assert.equal(await evaluar("document.querySelector('#atenciones .vigente .solucion').textContent"), solucion);
    assert.equal(await evaluar("Boolean(window.inyectado) || Boolean(document.getElementById('inyectado'))"), false);
    await seleccionar(6); await listo(id);
    assert.deepEqual(await leer(), antes);
  });
});
