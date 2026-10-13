const assert = require('node:assert/strict');

// Construye un caso por la API real, incluida la devolución del validador.
async function prepararDetalle(pedir, tipo = 'Incidente') {
  const nuevo = await pedir('/api/casos', 'POST', { usuario_id: 1, categoria_id: 8, tipo,
    titulo: `Detalle HU-12: ${tipo}`, descripcion: 'El servicio falla y requiere una revisión técnica', prioridad: 'P1' });
  assert.equal(nuevo.status, 201);
  const id = nuevo.datos.id;
  const ruta = `/api/casos/${id}`;
  assert.equal((await pedir(ruta + '/asignar', 'PATCH', { usuario_id: 3 })).status, 200);
  for (const estado of ['En análisis', 'En atención']) {
    assert.equal((await pedir(ruta + '/estado', 'PATCH', { usuario_id: 3, estado })).status, 200);
  }
  const primera = await pedir(ruta + '/atencion', 'POST', { usuario_id: 3,
    diagnostico: 'Primera revisión del equipo', solucion: 'Se reinició el punto de acceso' });
  assert.equal(primera.status, 201);
  assert.equal((await pedir(ruta + '/estado', 'PATCH', { usuario_id: 3, estado: 'En validación' })).status, 200);
  assert.equal((await pedir(ruta + '/validacion', 'POST', { usuario_id: 5, decision: 'devolver',
    motivo: 'La falla se reproduce todavía' })).status, 200);
  const segunda = await pedir(ruta + '/atencion', 'POST', { usuario_id: 3,
    diagnostico: 'El equipo requiere reemplazo', solucion: 'Se reemplazó y verificó el equipo' });
  assert.equal(segunda.status, 201);
  assert.equal((await pedir(ruta + '/estado', 'PATCH', { usuario_id: 3, estado: 'En validación' })).status, 200);
  assert.equal((await pedir(ruta + '/validacion', 'POST', { usuario_id: 5, decision: 'aprobar' })).status, 200);
  return { id, primera: primera.datos, segunda: segunda.datos };
}

module.exports = { prepararDetalle };
