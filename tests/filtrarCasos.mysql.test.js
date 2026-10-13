// HU-09 Filtrar casos — casos CP-10, CP-29, CP-30 y CP-31 por GET /api/casos contra MySQL.
// Usa una base temporal propia; nunca toca campushelp.
const test = require('node:test');
const assert = require('node:assert/strict');
const { abrirMysqlTemporal } = require('./helpers/mysqlTemporal');

// Categorías del seed: 1 Computador (Hardware, área 1), 5 Instalación (Software, área 2),
// 8 Wi-Fi (Red y conectividad, área 3), 11 Contraseña (Cuentas, área 4), 15 Campus virtual (Plataformas, área 5).
const CASOS = [
  ['Incidente', 'Wi-Fi caído en biblioteca', 'P1', 'Pendiente', 8, '2026-10-05 08:00:00'],
  ['Incidente', 'Wi-Fi lento en aula', 'P2', 'Cerrada', 8, '2026-10-05 09:00:00'],
  ['Solicitud de servicio', 'Acceso a Wi-Fi invitados', 'P1', 'Cerrada', 8, '2026-10-05 10:00:00'],
  ['Incidente', 'Portátil no enciende', 'P1', 'Pendiente', 1, '2026-10-05 11:00:00'],
  ['Solicitud de servicio', 'Instalar Photoshop', 'P3', 'En análisis', 5, '2026-10-05 12:00:00'],
  ['Incidente', 'Contraseña bloqueada', 'P2', 'Cerrada', 11, '2026-10-04 12:00:00'],
  ['Incidente', 'Campus virtual no carga', 'P2', 'Pendiente', 15, '2026-10-05 13:00:00'],
];

test('HU-09: filtros de casos con MySQL real', {
  skip: process.env.CAMPUSHELP_TEST_MYSQL !== '1',
}, async (t) => {
  const { db, pedir } = await abrirMysqlTemporal(t, 'hu09');
  // Datos controlados: se reemplazan los casos de ejemplo del seed.
  await db.query('DELETE FROM historial'); await db.query('DELETE FROM atencion'); await db.query('DELETE FROM caso');
  const id = {};
  for (const [tipo, titulo, prioridad, estado, categoria, fecha] of CASOS) {
    const [r] = await db.execute(
      `INSERT INTO caso (tipo, titulo, descripcion, prioridad, estado, usuario_id, categoria_id, fecha_creacion)
       VALUES (?, ?, 'Caso de prueba de filtros', ?, ?, 1, ?, ?)`, [tipo, titulo, prioridad, estado, categoria, fecha]);
    id[titulo] = r.insertId;
  }
  const titulos = (lista) => lista.map((c) => c.titulo);
  async function listar(consulta) {
    const respuesta = await pedir(`/api/casos?${consulta}`);
    assert.equal(respuesta.status, 200, consulta);
    assert.ok(Array.isArray(respuesta.datos));
    return respuesta.datos;
  }

  await t.test('CP-10: filtro combinado por tipo, área y prioridad', async () => {
    const lista = await listar('tipo=Incidente&area_id=3&prioridad=P1');
    assert.deepEqual(titulos(lista), ['Wi-Fi caído en biblioteca']);
    assert.equal(lista[0].id, id['Wi-Fi caído en biblioteca']);
    assert.deepEqual(titulos(await listar('prioridad=P1&area_id=1')), ['Portátil no enciende']);
    assert.deepEqual(titulos(await listar(`tipo=${encodeURIComponent('Solicitud de servicio')}&area_id=2`)), ['Instalar Photoshop']);
  });

  await t.test('CP-29: estado Cerrada y categoría Wi-Fi, del más reciente al más antiguo', async () => {
    const lista = await listar('estado=Cerrada&categoria_id=8');
    assert.deepEqual(titulos(lista), ['Acceso a Wi-Fi invitados', 'Wi-Fi lento en aula']);
    for (const caso of lista) assert.equal(caso.estado, 'Cerrada');
  });

  await t.test('CP-30: valores fuera del catálogo responden 400 con los valores permitidos', async () => {
    for (const [consulta, permitido] of [['prioridad=P9', /P1, P2, P3/], ['estado=Abierto', /Pendiente/],
      ['tipo=Queja', /Incidente/]]) {
      const respuesta = await pedir(`/api/casos?${consulta}`);
      assert.equal(respuesta.status, 400, consulta);
      assert.match(respuesta.datos.error, permitido);
      assert.ok(!Array.isArray(respuesta.datos));
    }
    for (const consulta of ['area_id=abc', 'categoria_id=0', 'area_id=1&area_id=2', 'prioridad=',
      `estado=${encodeURIComponent("Cerrada' OR '1'='1")}`]) {
      assert.equal((await pedir(`/api/casos?${consulta}`)).status, 400, consulta);
    }
    const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM caso');
    assert.equal(total, CASOS.length);
  });

  await t.test('CP-31: una combinación sin coincidencias devuelve una lista vacía', async () => {
    assert.deepEqual(await listar('area_id=5&prioridad=P1'), []);
    assert.deepEqual(await listar('area_id=5&estado=Cerrada'), []);
    assert.deepEqual(await listar('categoria_id=999'), []);
    // Control: el área de Plataformas sí tiene casos con otros filtros.
    assert.deepEqual(titulos(await listar('area_id=5')), ['Campus virtual no carga']);
  });
});
