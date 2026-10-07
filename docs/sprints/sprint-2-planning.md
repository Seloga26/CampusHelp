# Sprint 2 — Planning

**Fechas del sprint:** miércoles 7 – viernes 9 de octubre de 2026
**Sprint Planning:** miércoles 7 de octubre de 2026 (tarde)
**Equipo:** Sebastian (@Seloga26), Keyla (@Keyla-Cartagena), Miguel (@miguelfsociety)

## Regla del equipo para este sprint

Las historias de cada sprint **no se mezclan**. Las del Sprint 1 que no se terminaron (HU-01, HU-02, HU-03 y HU-05) siguen siendo trabajo del **Sprint 1**, con los **mismos responsables**, y se cierran como tal. El Sprint 2 contiene solo sus historias planeadas.

## Sprint Goal

> Completar asignación, atención, validación e historial: un agente se asigna un caso y registra diagnóstico y solución, un validador aprueba o devuelve, y cualquier usuario autorizado consulta lo ocurrido.

Demo al cierre: **Asignarse → registrar solución → validar (aprobar o devolver) → consultar el historial**, sobre casos persistidos en MySQL.

## Historias seleccionadas

| Historia | SP | Responsable | Ficha | Issue |
|---|---|---|---|---|
| HU-04 Asignarme un caso | 3 | Sebastian | [HU-04](../historias/HU-04.md) | #4 |
| HU-06 Registrar diagnóstico y solución | 5 | Miguel | [HU-06](../historias/HU-06.md) | #6 |
| HU-07 Aprobar o devolver una solución | 5 | _por asignar_ | [HU-07](../historias/HU-07.md) | #7 |
| HU-08 Consultar el historial | 5 | _por asignar_ | [HU-08](../historias/HU-08.md) | #8 |
| **Total** | **18** | | | |

**Capacidad:** el Sprint 1 cerró con Throughput 0, así que no hay velocidad de referencia. Los tres integrantes, además, deben cerrar sus historias del Sprint 1 en paralelo. El orden de pull de abajo define qué se deja para el final si no alcanza.

## Orden de pull y dependencias

```
HU-05 (Sprint 1) ──► HU-04 ──► HU-06 ──► HU-07
        │
        └──────────► HU-08
HU-03 (Sprint 1) ──► botones en la bandeja de HU-04, HU-06 y HU-07
```

1. **HU-04** y **HU-08**: su backend solo necesita HU-05 en `main`. Se pueden empezar con los repositorios en memoria mientras tanto.
2. **HU-06**: necesita que el caso tenga agente asignado (HU-04).
3. **HU-07**: necesita casos con solución registrada (HU-06).

Las historias del Sprint 2 dependen de dos historias abiertas del Sprint 1: **HU-05** (backend) y **HU-03** (bandeja para los botones). Cerrarlas pronto, con sus responsables actuales, es lo que más acelera este sprint.

## Reglas nuevas que cambian HU-05

Se acordaron en el refinamiento y se implementan dentro de las historias del Sprint 2, en `services/casos/cambiarEstado.js`, después de que HU-05 esté en `main`:

| Regla | La implementa |
|---|---|
| Solo el agente **asignado** cambia el estado (un caso sin asignar no sale de Pendiente) | HU-04 |
| No se pasa a En validación sin al menos una atención registrada | HU-06 |

## Contrato de API

**`PATCH /api/casos/:id/asignar`** (HU-04)
```json
{ "usuario_id": 3 }
// 200 → caso actualizado | 400 | 403 no es Agente | 404 | 409 cerrado o ya asignado
```

**`POST /api/casos/:id/atencion`** (HU-06)
```json
{ "diagnostico": "...", "solucion": "...", "usuario_id": 3 }
// 201 → atención creada | 400 | 403 no es el agente asignado | 404 | 409 no está En atención
```

**`POST /api/casos/:id/validacion`** (HU-07)
```json
{ "decision": "aprobar" | "devolver", "motivo": "obligatorio al devolver", "usuario_id": 5 }
// 200 → caso actualizado | 400 | 403 no es Validador | 404 | 409 no está En validación o sin solución
```

**`GET /api/casos/:id/historial?usuario_id=3`** (HU-08)
```json
// 200 → [{ "id", "evento", "estado_anterior", "estado_nuevo", "usuario", "rol", "fecha" }]
// 400 | 403 sin permiso | 404
```

Las cuatro rutas ya están conectadas a su servicio y al contenedor; responden 501 hasta que se implementen.

## Archivos por historia

| Historia | Servicio | Repositorio | Pruebas | Frontend |
|---|---|---|---|---|
| HU-04 | `services/casos/asignarCaso.js` | `casosRepository.asignarAgente()` (agregar cuando HU-05 esté en `main`) | `tests/services/asignarCaso.test.js` | botón "Asignarme" en la bandeja |
| HU-06 | `services/casos/registrarAtencion.js` | `atencionesRepository.js` | `tests/services/registrarAtencion.test.js` | formulario de atención |
| HU-07 | `services/casos/validarSolucion.js` | `casosRepository.cerrar()` (agregar cuando HU-05 esté en `main`) | `tests/services/validarSolucion.test.js` | vista del validador |
| HU-08 | `services/casos/consultarHistorial.js` | `historialRepository.listarPorCaso()` | `tests/services/consultarHistorial.test.js` | `historial.html` |

Los repositorios en memoria (`tests/fakes/`) ya incluyen `asignarAgente`, `cerrar`, atenciones y `listarPorCaso`, para escribir las pruebas sin MySQL.

## Calendario

| Día | Actividad |
|---|---|
| Mié 7 (tarde) | Review y Retro del Sprint 1. Sprint Planning (este documento). HU-04, HU-06, HU-07 y HU-08 a Ready |
| Jue 8 | **Daily**. Desarrollo. **Refinement** de las historias del Sprint 3 (HU-09, HU-10, HU-11, HU-12) |
| Vie 9 | **Daily**. **Review y Retrospective** al final del día |
| Sáb 10 | Sprint 3 Planning |

## Riesgos

| Riesgo | Plan |
|---|---|
| HU-05 (Sprint 1) no llega a `main` | HU-04, HU-07 y HU-08 avanzan con los repositorios en memoria; el método del repositorio se agrega al fusionar HU-05 |
| HU-03 (Sprint 1) no llega a tiempo | Los botones de HU-04, HU-06 y HU-07 van en páginas propias, como hizo HU-05 con `cambiar-estado.html`, y se mueven a la bandeja cuando exista |
| HU-04 y HU-06 tocan `cambiarEstado.js` | Cambios pequeños en zonas distintas, PR cortos, `git pull` antes de cada PR |
| Capacidad: cada integrante tiene trabajo abierto del Sprint 1 | Se respeta el orden de pull; lo que no alcance queda documentado en la Review del Sprint 2 |
| No se registran fechas otra vez | Mejora de la Retro: quien mueve la tarjeta anota la fecha ese mismo día |
