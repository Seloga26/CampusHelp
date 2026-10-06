const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { crearContenedor } = require('../src/config/contenedor');
const { crearApp } = require('../src/app');
const pool = { async getConnection() { throw new Error('Configurar doble de MySQL'); } };
const app = crearApp(crearContenedor(pool));

// Doble transaccional de MySQL: permite comprobar HTTP, permisos y rollback
// sin requerir un servidor local. No reemplaza la prueba manual de persistencia.
function baseDePrueba({ estado = 'Pendiente', tipo = 'Incidente', rol = 'Agente', activo = true,
  existeUsuario = true, existeCaso = true, fecha = null, fallo = null } = {}) {
  let caso = existeCaso ? {
    id: 10, tipo, titulo: 'Caso de prueba HU-05', estado,
    fecha_inicio_atencion: fecha,
  } : null;
  let historial = [];
  let copia;
  const llamadas = [];
  const conn = {
    async beginTransaction() {
      llamadas.push('begin');
      if (fallo === 'begin') throw new Error('Fallo al iniciar');
      copia = { caso: structuredClone(caso), historial: structuredClone(historial) };
    },
    async query(sql, params) {
      llamadas.push({ sql, params });
      if (sql.includes('FROM usuario WHERE id = ?')) {
        return [existeUsuario && activo ? [{ id: params[0], rol }] : []];
      }
      if (sql.startsWith('SELECT') && /FROM caso/.test(sql)) return [caso ? [{ ...caso }] : []];
      if (sql.startsWith('UPDATE caso')) {
        if (fallo === 'update') throw new Error('Fallo al actualizar');
        caso.estado = params[0];
        if (params[1] && !caso.fecha_inicio_atencion) {
          caso.fecha_inicio_atencion = '2026-10-05 12:00:00';
        }
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('INSERT INTO historial')) {
        if (fallo === 'historial') throw new Error('Fallo de historial');
        historial.push({
          caso_id: params[0], evento: params[1], estado_anterior: params[2],
          estado_nuevo: params[3], usuario_id: params[4],
        });
        return [{ affectedRows: 1 }];
      }
      throw new Error(`SQL no esperado: ${sql}`);
    },
    async commit() {
      llamadas.push('commit');
      if (fallo === 'commit') throw new Error('Fallo al confirmar');
    },
    async rollback() {
      llamadas.push('rollback');
      caso = copia.caso;
      historial = copia.historial;
    },
    release() { llamadas.push('release'); },
  };
  return { conn, llamadas, caso: () => caso, historial: () => historial };
}

test('HU-05: contrato HTTP y transacción caso + historial', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections?.();
  }));
  const url = `http://127.0.0.1:${server.address().port}/api/casos`;

  async function enviar(id = 10, body = { estado: 'En análisis', usuario_id: 3 }) {
    const respuesta = await fetch(`${url}/${id}/estado`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: respuesta.status, body: await respuesta.json() };
  }

  function preparar(st, opciones) {
    const db = baseDePrueba(opciones);
    st.mock.method(pool, 'getConnection', async () => db.conn);
    return db;
  }

  await t.test('CP-04: transiciona y registra autor, estados y evento', async (st) => {
    const db = preparar(st);
    const respuesta = await enviar();
    assert.equal(respuesta.status, 200);
    assert.equal(respuesta.body.estado, 'En análisis');
    assert.equal(respuesta.body.fecha_inicio_atencion, null);
    assert.deepEqual(db.historial(), [{
      caso_id: 10, evento: 'Cambio de estado', estado_anterior: 'Pendiente',
      estado_nuevo: 'En análisis', usuario_id: 3,
    }]);
    assert.ok(db.llamadas.some((l) => l.sql?.endsWith('FOR UPDATE')));
    assert.deepEqual(db.llamadas.filter((l) => typeof l === 'string'), ['begin', 'commit', 'release']);
  });

  for (const estado of ['Cerrada', 'En atención', 'Pendiente']) {
    await t.test(`CP-05: rechaza Pendiente → ${estado} sin escribir`, async (st) => {
      const db = preparar(st, { tipo: 'Solicitud de servicio' });
      assert.equal((await enviar(10, { estado, usuario_id: 3 })).status, 409);
      assert.equal(db.caso().estado, 'Pendiente');
      assert.deepEqual(db.historial(), []);
      assert.ok(!db.llamadas.some((l) => l.sql?.startsWith('UPDATE')));
      assert.deepEqual(db.llamadas.filter((l) => typeof l === 'string'), ['begin', 'rollback', 'release']);
    });
  }

  await t.test('CP-14: un caso cerrado no cambia', async (st) => {
    const db = preparar(st, { estado: 'Cerrada' });
    assert.equal((await enviar()).status, 409);
    assert.equal(db.caso().estado, 'Cerrada');
    assert.deepEqual(db.historial(), []);
  });

  for (const rol of ['Solicitante', 'Validador', 'Administrador']) {
    await t.test(`CP-15: el rol ${rol} no puede avanzar un caso`, async (st) => {
      const db = preparar(st, { rol, tipo: 'Solicitud de servicio' });
      assert.equal((await enviar()).status, 403);
      assert.equal(db.caso().estado, 'Pendiente');
      assert.deepEqual(db.historial(), []);
    });
  }

  for (const opciones of [{ activo: false }, { existeUsuario: false }]) {
    await t.test(`rechaza agente ${opciones.activo === false ? 'inactivo' : 'inexistente'}`, async (st) => {
      const db = preparar(st, opciones);
      assert.equal((await enviar()).status, 403);
      assert.deepEqual(db.historial(), []);
    });
  }

  await t.test('caso inexistente responde 404', async (st) => {
    const db = preparar(st, { existeCaso: false });
    assert.equal((await enviar()).status, 404);
    assert.deepEqual(db.historial(), []);
  });

  for (const estado of ['Cerrada', 'En atención']) {
    await t.test(`reserva En validación → ${estado} para HU-07`, async (st) => {
      const db = preparar(st, { estado: 'En validación' });
      assert.equal((await enviar(10, { estado, usuario_id: 3 })).status, 409);
      assert.equal(db.caso().estado, 'En validación');
      assert.deepEqual(db.historial(), []);
    });
  }

  await t.test('primera entrada a atención guarda fecha', async (st) => {
    const db = preparar(st, { estado: 'En análisis' });
    const respuesta = await enviar(10, { estado: 'En atención', usuario_id: 4 });
    assert.equal(respuesta.status, 200);
    assert.ok(respuesta.body.fecha_inicio_atencion);
    const update = db.llamadas.find((l) => l.sql?.startsWith('UPDATE'));
    assert.match(update.sql, /COALESCE\(fecha_inicio_atencion, CURRENT_TIMESTAMP\)/);
  });

  await t.test('conserva la fecha de inicio al avanzar a validación', async (st) => {
    const fecha = '2026-10-04 09:00:00';
    preparar(st, { estado: 'En atención', fecha });
    const respuesta = await enviar(10, { estado: 'En validación', usuario_id: 3 });
    assert.equal(respuesta.status, 200);
    assert.equal(respuesta.body.fecha_inicio_atencion, fecha);
  });

  await t.test('no sobrescribe una fecha de inicio existente al entrar en atención', async (st) => {
    const fecha = '2026-10-04 09:00:00';
    preparar(st, { estado: 'En análisis', fecha });
    const respuesta = await enviar(10, { estado: 'En atención', usuario_id: 3 });
    assert.equal(respuesta.status, 200);
    assert.equal(respuesta.body.fecha_inicio_atencion, fecha);
  });

  for (const [id, body] of [
    ['abc', { estado: 'En análisis', usuario_id: 3 }],
    ['0', { estado: 'En análisis', usuario_id: 3 }],
    ['1.2', { estado: 'En análisis', usuario_id: 3 }],
    ['2147483648', { estado: 'En análisis', usuario_id: 3 }],
    [10, {}], [10, null], [10, { estado: 'En análisis' }],
    [10, { estado: 'En análisis', usuario_id: 0 }],
    [10, { estado: 'En análisis', usuario_id: [3] }],
    [10, { estado: 'Abierto', usuario_id: 3 }],
  ]) {
    await t.test(`datos inválidos: ${JSON.stringify({ id, body })}`, async (st) => {
      const mock = st.mock.method(pool, 'getConnection', async () => {
        throw new Error('No debería abrir una conexión');
      });
      // express.json rechaza null antes de llegar a la ruta.
      assert.equal((await enviar(id, body)).status, 400);
      assert.equal(mock.mock.callCount(), 0);
    });
  }

  for (const fallo of ['update', 'historial', 'commit']) {
    await t.test(`rollback y liberación si falla ${fallo}`, async (st) => {
      const db = preparar(st, { estado: 'En análisis', fallo });
      st.mock.method(console, 'error', () => {});
      assert.equal((await enviar(10, { estado: 'En atención', usuario_id: 3 })).status, 500);
      assert.equal(db.caso().estado, 'En análisis');
      assert.equal(db.caso().fecha_inicio_atencion, null);
      assert.deepEqual(db.historial(), []);
      assert.ok(db.llamadas.includes('rollback'));
      assert.equal(db.llamadas.at(-1), 'release');
    });
  }

  await t.test('libera conexión si no puede iniciar la transacción', async (st) => {
    const db = preparar(st, { fallo: 'begin' });
    st.mock.method(console, 'error', () => {});
    assert.equal((await enviar()).status, 500);
    assert.deepEqual(db.llamadas, ['begin', 'release']);
  });

  await t.test('segunda petición con el mismo destino se rechaza sin duplicar historial', async (st) => {
    const db = preparar(st);
    assert.equal((await enviar()).status, 200);
    assert.equal((await enviar()).status, 409);
    assert.equal(db.historial().length, 1);
    assert.equal(db.caso().estado, 'En análisis');
  });
});
