const test = require('node:test');
const assert = require('node:assert/strict');
const { abrirMysqlTemporal } = require('../helpers/mysqlTemporal');
const { abrirNavegador } = require('../helpers/navegador');

test('HU-11: gestión de categorías en Chrome con MySQL real', {
  skip: process.env.CAMPUSHELP_TEST_BROWSER !== '1',
}, async (t) => {
  const { db, base, pedir } = await abrirMysqlTemporal(t, 'hu11_browser');
  // Área sin categorías: sigue disponible para crear su primera categoría.
  await db.execute('DELETE FROM categoria WHERE area_id = 5');
  const caso = await pedir('/api/casos', 'POST', { usuario_id: 1, categoria_id: 4, tipo: 'Incidente',
    titulo: 'Impresora sin papel', descripcion: 'La impresora necesita suministros para imprimir', prioridad: 'P2' });
  assert.equal(caso.status, 201);
  const navegador = await abrirNavegador(t);
  const { evaluar, esperar } = navegador;
  const fila = id => `document.querySelector('[data-categoria-id="${id}"]')`;
  const seleccionar = id => evaluar(`{ const s = document.getElementById('actuar-como');
    s.value = '${id}'; s.dispatchEvent(new Event('change')); }`);
  const rellenar = (area, nombre, descripcion = '') => evaluar(`
    document.getElementById('area').value = '${area}';
    document.getElementById('nombre').value = ${JSON.stringify(nombre)};
    document.getElementById('descripcion').value = ${JSON.stringify(descripcion)};
  `);
  const guardar = () => evaluar("document.getElementById('form-categoria').requestSubmit()");
  const exito = texto => esperar(`document.getElementById('mensaje').className === 'ok'
    && document.getElementById('mensaje').textContent === ${JSON.stringify(texto)}`);
  const abrirGestion = async () => {
    await navegador.navegar(base + '/categorias.html');
    await esperar("document.getElementById('actuar-como').options.length > 0");
    await seleccionar(6);
    await esperar("document.getElementById('gestion').hidden === false");
  };

  await t.test('CP-39: agente no ve controles de gestión ni puede escribir por HTTP', async () => {
    await navegador.navegar(base + '/categorias.html');
    await esperar("document.getElementById('actuar-como').options.length > 0");
    await seleccionar(3);
    await esperar("document.getElementById('mensaje').textContent.includes('Solo un administrador')");
    assert.equal(await evaluar("document.getElementById('gestion').hidden"), true);
    assert.equal(await evaluar("document.getElementById('guardar-categoria').disabled"), true);
    const antes = (await db.query('SELECT * FROM categoria ORDER BY id'))[0];
    assert.equal((await pedir('/api/categorias', 'POST', { usuario_id: 3, area_id: 3, nombre: 'Prohibida' })).status, 403);
    assert.equal((await pedir('/api/categorias/4', 'PATCH', { usuario_id: 3, activa: false })).status, 403);
    assert.deepEqual((await db.query('SELECT * FROM categoria ORDER BY id'))[0], antes);
  });

  let vpnId;
  await t.test('CP-36: crear, doble envío y primera categoría de un área vacía', async () => {
    await abrirGestion();
    assert.equal(await evaluar("document.getElementById('area').options.length"), 5);
    await evaluar(`window.creaciones = 0; const fetchOriginal = window.fetch;
      window.fetch = (...args) => { if (args[0] === '/api/categorias' && args[1]?.method === 'POST') window.creaciones++;
        return fetchOriginal(...args); };`);
    await rellenar(3, '  VPN institucional  ', 'Acceso remoto');
    await evaluar("document.getElementById('guardar-categoria').click(); document.getElementById('form-categoria').requestSubmit()");
    await exito('Categoría creada.');
    assert.equal(await evaluar('window.creaciones'), 1);
    const [filas] = await db.execute("SELECT * FROM categoria WHERE nombre = 'VPN institucional'");
    assert.equal(filas.length, 1); vpnId = filas[0].id;
    assert.equal(filas[0].activa, 1); assert.equal(filas[0].descripcion, 'Acceso remoto');
    assert.equal(await evaluar(`${fila(vpnId)}.cells[3].textContent`), '0');
    assert.ok((await pedir('/api/categorias')).datos.some(c => c.id === vpnId));
    await rellenar(5, 'Portal académico');
    await guardar(); await exito('Categoría creada.');
    assert.equal((await db.execute('SELECT * FROM categoria WHERE area_id = 5'))[0].length, 1);
    await navegador.navegar(base + '/registrar.html');
    await esperar("document.getElementById('categoria').options.length > 0");
    await evaluar("{ const area = document.getElementById('area'); area.value = '3'; area.dispatchEvent(new Event('change')); }");
    assert.ok(await evaluar("[...document.getElementById('categoria').options].some(o => o.text === 'VPN institucional')"));
    await abrirGestion();
  });

  await t.test('CP-37: repetido y nombre corto conservan los textos sin crear categorías', async () => {
    const antes = (await db.query('SELECT * FROM categoria ORDER BY id'))[0];
    await rellenar(3, 'wí-fi', 'Descripción que se conserva');
    await guardar();
    await esperar("document.getElementById('mensaje').className === 'error'");
    assert.match(await evaluar("document.getElementById('mensaje').textContent"), /Ya existe/);
    assert.equal(await evaluar("document.getElementById('nombre').value"), 'wí-fi');
    assert.equal(await evaluar("document.getElementById('descripcion').value"), 'Descripción que se conserva');
    await rellenar(3, '  ab  '); await guardar();
    await esperar("document.getElementById('mensaje').textContent.includes('entre 3 y 100')");
    assert.deepEqual((await db.query('SELECT * FROM categoria ORDER BY id'))[0], antes);
  });

  await t.test('editar y cancelar conservan área, estado y datos confirmados', async () => {
    await evaluar(`${fila(vpnId)}.querySelector('.editar').click()`);
    assert.equal(await evaluar("document.getElementById('area').disabled"), true);
    assert.equal(await evaluar("document.getElementById('descripcion').value"), 'Acceso remoto');
    await rellenar(3, 'VPN segura', 'Acceso verificado');
    await guardar(); await exito('Categoría actualizada.');
    assert.equal(await evaluar(`${fila(vpnId)}.cells[0].textContent`), 'VPN segura');
    const [[categoria]] = await db.execute('SELECT * FROM categoria WHERE id = ?', [vpnId]);
    assert.equal(categoria.area_id, 3); assert.equal(categoria.activa, 1);
    await evaluar(`${fila(vpnId)}.querySelector('.editar').click(); document.getElementById('nombre').value = 'Cambio cancelado';
      document.getElementById('cancelar-edicion').click();`);
    assert.equal(await evaluar("document.getElementById('nombre').value"), '');
    assert.equal((await db.execute('SELECT nombre FROM categoria WHERE id = ?', [vpnId]))[0][0].nombre, 'VPN segura');
  });

  await t.test('CP-38: desactivar y reactivar conserva la clasificación de los casos existentes', async () => {
    const [antes] = await db.query('SELECT * FROM caso ORDER BY id');
    assert.equal(await evaluar(`${fila(4)}.cells[3].textContent`), '1');
    await evaluar(`${fila(4)}.querySelector('.activar-categoria').click()`);
    await exito('Categoría desactivada.');
    assert.equal(await evaluar(`${fila(4)}.querySelector('.estado-categoria').textContent`), 'Inactiva');
    await navegador.navegar(base + '/registrar.html');
    await esperar("document.getElementById('categoria').options.length > 0");
    await evaluar("{ const area = document.getElementById('area'); area.value = '1'; area.dispatchEvent(new Event('change')); }");
    assert.equal(await evaluar("[...document.getElementById('categoria').options].some(o => o.text === 'Impresora')"), false);
    await navegador.navegar(base + '/mis-casos.html');
    await esperar("document.querySelectorAll('#cuerpo-casos tr').length > 0");
    assert.match(await evaluar("document.getElementById('cuerpo-casos').textContent"), /Impresora/);
    assert.deepEqual((await db.query('SELECT * FROM caso ORDER BY id'))[0], antes);
    await abrirGestion();
    await evaluar(`${fila(4)}.querySelector('.activar-categoria').click()`);
    await exito('Categoría reactivada.');
    assert.ok((await pedir('/api/categorias')).datos.some(c => c.id === 4));
    await navegador.navegar(base + '/registrar.html');
    await esperar("document.getElementById('categoria').options.length > 0");
    await evaluar("{ const area = document.getElementById('area'); area.value = '1'; area.dispatchEvent(new Event('change')); }");
    assert.ok(await evaluar("[...document.getElementById('categoria').options].some(o => o.text === 'Impresora')"));
    await abrirGestion();
  });

  await t.test('errores del servidor conservan el formulario; nombres y descripciones se muestran como texto', async () => {
    await db.query(`CREATE TRIGGER hu11_fallar BEFORE INSERT ON categoria
      FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Fallo deliberado de prueba HU-11'`);
    t.mock.method(console, 'error', () => {});
    const texto = '<img src=x onerror=window.inyectado=true>';
    await rellenar(3, texto, '<b>Texto literal</b>');
    try {
      await guardar();
      await esperar("document.getElementById('mensaje').textContent.includes('Error interno del servidor')");
      assert.equal(await evaluar("document.getElementById('nombre').value"), texto);
      assert.equal(await evaluar("document.getElementById('guardar-categoria').disabled"), false);
      assert.equal((await db.execute('SELECT * FROM categoria WHERE nombre = ?', [texto]))[0].length, 0);
    } finally { await db.query('DROP TRIGGER hu11_fallar'); }
    await guardar(); await exito('Categoría creada.');
    assert.match(await evaluar("document.getElementById('grupos-categorias').textContent"), /<img src=x/);
    assert.equal(await evaluar("Boolean(window.inyectado) || Boolean(document.querySelector('#grupos-categorias img'))"), false);
  });
});
