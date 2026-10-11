// HU-01 Registrar incidente o solicitud — formulario en navegador con MySQL real.
// Cierra los criterios que faltaban para Done: persistencia real (Escenario 3)
// y que el caso aparezca en la bandeja (Escenario 1).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { once } = require('node:events');
const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();
const { crearApp } = require('../../src/app');
const { crearContenedor } = require('../../src/config/contenedor');
const { abrirNavegador } = require('../helpers/navegador');

test('HU-01: registro en navegador con MySQL real', {
  skip: process.env.CAMPUSHELP_TEST_BROWSER !== '1',
}, async (t) => {
  const nombre = `campushelp_registro_test_${randomBytes(8).toString('hex')}`;
  const config = { host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', dateStrings: true };
  const admin = await mysql.createConnection({ ...config, multipleStatements: true });
  let db;
  let servidor;
  let creada = false;
  async function cerrarServidor() {
    if (!servidor) return;
    await new Promise((ok) => { servidor.close(ok); servidor.closeAllConnections?.(); });
    servidor = null;
  }
  t.after(async () => {
    await cerrarServidor();
    if (db) await db.end();
    try { if (creada) await admin.query(`DROP DATABASE \`${nombre}\``); }
    finally { await admin.end(); }
  });
  await admin.query(`CREATE DATABASE \`${nombre}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  creada = true;
  for (const archivo of ['schema.sql', 'seed.sql']) {
    await admin.query(fs.readFileSync(path.join(__dirname, '../../database', archivo), 'utf8')
      .replace(/\bcampushelp\b/g, nombre));
  }
  db = mysql.createPool({ ...config, database: nombre });
  const [[version]] = await db.query('SELECT VERSION() AS version');
  t.diagnostic(`MySQL ${version.version}; base temporal ${nombre}`);
  let registros = 0;
  let puerto = 0;
  async function iniciarServidor() {
    const app = express();
    app.use(async (req, res, next) => {
      if (req.method === 'POST' && req.path === '/api/casos') {
        registros++;
        // Mantiene la petición abierta para comprobar la protección del doble clic.
        await new Promise((ok) => setTimeout(ok, 150));
      }
      next();
    });
    app.use(crearApp(crearContenedor(db)));
    servidor = app.listen(puerto, '127.0.0.1');
    await once(servidor, 'listening');
    puerto = servidor.address().port; // el mismo puerto al reiniciar conserva localStorage
    return `http://127.0.0.1:${puerto}`;
  }
  let base = await iniciarServidor();
  const navegador = await abrirNavegador(t);
  const { evaluar, esperar } = navegador;
  const casosDe = async (titulo) => (await db.execute('SELECT * FROM caso WHERE titulo = ?', [titulo]))[0];

  async function llenarFormulario({ tipo, area, categoria, titulo, descripcion, prioridad }) {
    await evaluar(`(() => {
      const fijar = (id, valor) => { const el = document.getElementById(id); el.value = valor;
        el.dispatchEvent(new Event('change')); };
      fijar('tipo', ${JSON.stringify(tipo)});
      const area = [...document.getElementById('area').options].find((o) => o.text === ${JSON.stringify(area)});
      fijar('area', area.value);
      const cat = [...document.getElementById('categoria').options].find((o) => o.text === ${JSON.stringify(categoria)});
      fijar('categoria', cat.value);
      fijar('titulo', ${JSON.stringify(titulo)});
      fijar('descripcion', ${JSON.stringify(descripcion)});
      fijar('prioridad', ${JSON.stringify(prioridad)});
    })()`);
  }

  await navegador.navegar(`${base}/registrar.html`);
  await esperar("document.getElementById('categoria').options.length > 0");

  await t.test('CP-01: Ana registra un incidente de Wi-Fi; un doble clic crea un solo caso', async () => {
    assert.equal(await evaluar("document.getElementById('actuar-como').selectedOptions[0].text"), 'Ana Solicitante (Solicitante)');
    await llenarFormulario({ tipo: 'Incidente', area: 'Red y conectividad', categoria: 'Wi-Fi',
      titulo: 'Wi-Fi sin conexión en biblioteca', descripcion: 'No conecta a la red institucional en el piso 2',
      prioridad: 'P1' });
    await evaluar("{ const b = document.querySelector('#form-registro button'); b.click(); b.click(); }");
    await esperar("document.getElementById('mensaje').className === 'ok'");
    assert.match(await evaluar("document.getElementById('mensaje').textContent"), /^Caso #\d+ registrado en estado Pendiente\.$/);
    assert.equal(registros, 1);
    const [caso, ...repetidos] = await casosDe('Wi-Fi sin conexión en biblioteca');
    assert.equal(repetidos.length, 0);
    assert.equal(caso.estado, 'Pendiente');
    assert.equal(caso.tipo, 'Incidente');
    assert.equal(caso.prioridad, 'P1');
    assert.equal(caso.usuario_id, 1);
    assert.equal(caso.categoria_id, 8);
    assert.equal(caso.agente_id, null);
    assert.ok(caso.fecha_creacion);
    const [eventos] = await db.execute('SELECT * FROM historial WHERE caso_id = ?', [caso.id]);
    assert.equal(eventos.length, 1);
    assert.equal(eventos[0].evento, 'Caso registrado');
    assert.equal(eventos[0].estado_nuevo, 'Pendiente');
    assert.equal(await evaluar("document.getElementById('titulo').value"), '');
    assert.equal(await evaluar("document.querySelector('#form-registro button').disabled"), false);
  });

  await t.test('CP-02: registra una solicitud de instalación de software', async () => {
    await llenarFormulario({ tipo: 'Solicitud de servicio', area: 'Software', categoria: 'Instalación',
      titulo: 'Instalar MATLAB en sala 3', descripcion: 'Se necesita MATLAB para la clase de señales',
      prioridad: 'P3' });
    await evaluar("document.querySelector('#form-registro button').click()");
    await esperar("document.getElementById('mensaje').textContent.includes('Instalar') || document.getElementById('mensaje').className === 'ok'");
    await esperar(`document.getElementById('mensaje').textContent.startsWith('Caso #')
      && document.getElementById('titulo').value === ''`);
    const [caso] = await casosDe('Instalar MATLAB en sala 3');
    assert.equal(caso.tipo, 'Solicitud de servicio');
    assert.equal(caso.categoria_id, 5);
  });

  await t.test('CP-03: una descripción corta se rechaza con mensaje y sin guardar nada', async () => {
    const antes = registros;
    await llenarFormulario({ tipo: 'Incidente', area: 'Cuentas y acceso', categoria: 'Contraseña',
      titulo: 'Cuenta bloqueada', descripcion: 'corta', prioridad: 'P2' });
    await evaluar("document.querySelector('#form-registro button').click()");
    await esperar("document.getElementById('mensaje').className === 'error'");
    assert.match(await evaluar("document.getElementById('mensaje').textContent"), /10 caracteres/);
    assert.equal(registros, antes + 1);
    assert.deepEqual(await casosDe('Cuenta bloqueada'), []);
    assert.equal(await evaluar("document.getElementById('descripcion').value"), 'corta', 'conserva lo escrito');
    assert.equal(await evaluar("document.querySelector('#form-registro button').disabled"), false);
  });

  await t.test('Escenario 1: el caso registrado aparece en la bandeja y en "Mis casos"', async () => {
    const [caso] = await casosDe('Wi-Fi sin conexión en biblioteca');
    await navegador.navegar(`${base}/bandeja.html`);
    await esperar(`document.querySelector('[data-caso-id="${caso.id}"]')`);
    const fila = `document.querySelector('[data-caso-id="${caso.id}"]')`;
    assert.equal(await evaluar(`${fila}.cells[1].textContent`), 'Wi-Fi sin conexión en biblioteca');
    assert.equal(await evaluar(`${fila}.querySelector('.estado-caso').textContent`), 'Pendiente');
    assert.equal(await evaluar(`${fila}.cells[7].textContent`), 'Ana Solicitante');
    assert.equal(await evaluar(`${fila}.cells[8].textContent`), 'Sin asignar');
    // P1 va antes que los P2/P3 aunque sea el más reciente.
    const orden = await evaluar("Array.from(document.querySelectorAll('#cuerpo-casos tr'), (f) => f.querySelector('.prioridad').textContent)");
    assert.deepEqual(orden, [...orden].sort());
    await navegador.navegar(`${base}/mis-casos.html`);
    await esperar("document.querySelectorAll('#cuerpo-casos tr').length > 0");
    assert.equal(await evaluar("document.querySelector('#cuerpo-casos tr').cells[1].textContent"), 'Instalar MATLAB en sala 3');
  });

  await t.test('Escenario 3: los casos siguen disponibles tras reiniciar servidor y conexiones', async () => {
    await cerrarServidor();
    await db.end();
    db = mysql.createPool({ ...config, database: nombre });
    base = await iniciarServidor();
    await navegador.navegar(`${base}/mis-casos.html`);
    await esperar("document.querySelectorAll('#cuerpo-casos tr').length === 5");
    const titulos = await evaluar("Array.from(document.querySelectorAll('#cuerpo-casos tr'), (f) => f.cells[1].textContent)");
    assert.ok(titulos.includes('Wi-Fi sin conexión en biblioteca'));
    assert.ok(titulos.includes('Instalar MATLAB en sala 3'));
  });

  await t.test('los nombres de área y categoría se muestran como texto, no como HTML', async () => {
    await db.execute("UPDATE categoria SET nombre = '<img src=x onerror=window.inyectado=true>' WHERE id = 8");
    await navegador.navegar(`${base}/registrar.html`);
    await esperar("document.getElementById('categoria').options.length > 0");
    await evaluar(`{ const a = document.getElementById('area');
      a.value = [...a.options].find((o) => o.text === 'Red y conectividad').value;
      a.dispatchEvent(new Event('change')); }`);
    assert.equal(await evaluar("document.getElementById('categoria').options[0].text"),
      '<img src=x onerror=window.inyectado=true>');
    assert.equal(await evaluar('Boolean(window.inyectado)'), false);
    // Inicio y el selector "Actuar como" también muestran los nombres como texto.
    await db.execute("UPDATE usuario SET nombre = '<b id=inyeccion>Ana</b>' WHERE id = 1");
    await navegador.navegar(`${base}/index.html`);
    await esperar("document.querySelectorAll('#categorias li').length > 0");
    assert.match(await evaluar("document.getElementById('categorias').textContent"), /<img src=x/);
    await navegador.navegar(`${base}/registrar.html`);
    await esperar("document.getElementById('actuar-como').options.length > 0");
    assert.equal(await evaluar("document.getElementById('actuar-como').options[0].text"), '<b id=inyeccion>Ana</b> (Solicitante)');
    assert.equal(await evaluar("document.getElementById('inyeccion') === null && !window.inyectado"), true);
  });
});
