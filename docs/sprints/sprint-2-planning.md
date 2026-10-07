# Sprint 2 — Planning

**Fechas del sprint:** miércoles 7 – viernes 9 de octubre de 2026
**Sprint Planning:** miércoles 7 de octubre de 2026 (tarde)
**Equipo:** Sebastian (@Seloga26), Keyla (@Keyla-Cartagena), Miguel (@miguelfsociety)

## Punto de partida

El Sprint 1 cerró con **0 historias Done** ([Review](../reviews/sprint-1.md), [Retro](../retrospectivas/sprint-1.md)). Por el principio Pull, este sprint **primero termina lo empezado** y solo después jala trabajo nuevo.

## Sprint Goal

> Un agente ve la bandeja, se asigna un caso, avanza su estado y registra diagnóstico y solución; el solicitante consulta sus casos. Todo persistido en MySQL y demostrable de punta a punta hasta **En validación**.

Demo al cierre: **Registrar → ver en la bandeja → asignarse → En análisis → En atención → registrar solución → En validación**.

## Historias seleccionadas (en orden de pull)

| # | Historia | SP | Viene de | Responsable (propuesto) | Por qué en este orden |
|---|---|---|---|---|---|
| 1 | HU-05 Cambiar estado | 5 | Sprint 1 | Miguel | Ya está programada: falta corregir la documentación, PR y merge. Desbloquea HU-04 y HU-06 en el backend |
| 2 | HU-03 Bandeja (+ T0) | 3 | Sprint 1 | Keyla + apoyo de Sebastian | **Camino crítico:** sin bandeja no se cierra HU-01 ni se integran HU-04, HU-05 y HU-06 |
| 3 | HU-01 Registrar (cierre) | — | Sprint 1 | Sebastian | Solo falta validar: prueba con MySQL y verlo en la bandeja |
| 4 | HU-04 Asignarme un caso | 3 | Nueva | Sebastian | Depende de HU-05 en `main` |
| 5 | HU-06 Registrar diagnóstico y solución | 5 | Nueva | Miguel | Depende de HU-04 y HU-05 |
| 6 | HU-02 Consultar mis casos | 3 | Sprint 1 | Keyla | Reutiliza el backend de HU-03; se jala cuando HU-03 pase a En validación |
| | **Total** | **19** (+ cierre de HU-01) | | | |

**Capacidad:** el Sprint 1 tuvo Throughput 0, así que no hay velocidad de referencia. 19 SP en 3 días es ambicioso; el orden de la tabla es también el orden de recorte. Si el viernes no alcanza, HU-02 pasa al Sprint 3 antes que cualquier otra.

**No hay roles fijos.** El responsable lleva la historia a Done, pero el apoyo en HU-03 es explícito: es la mejora acordada en la Retro (*swarming* sobre el camino crítico).

## Fuera de este sprint

| Historia | Nuevo destino | Motivo |
|---|---|---|
| HU-07 Aprobar o devolver | Sprint 3 | Depende de HU-06; sin ella no hay qué validar |
| HU-08 Consultar historial | Sprint 3 | El historial ya se guarda; consultarlo puede esperar |
| HU-11 Gestionar categorías | Recortada (contingencia) | Las categorías vienen en el seed; no es un módulo obligatorio |
| HU-12 Detalle del caso | Recortada (contingencia) | Se cubre en parte con HU-02 y HU-08 |

El Sprint 3 queda con HU-07, HU-08, HU-09 y HU-10 (18 SP). HU-07 es imprescindible: sin ella no se puede demostrar el cierre del flujo.

## Dependencias

```
HU-05 ──► HU-04 ──► HU-06
  │                   ▲
  └───────────────────┘
HU-03 ──► (botones en la bandeja de HU-04, HU-05 y HU-06), cierre de HU-01, HU-02
```

## Reglas nuevas que cambian HU-05

Se acordaron en el refinamiento de HU-04 y HU-06 y se implementan dentro de esas historias:

| Regla | La implementa | Archivo |
|---|---|---|
| Solo el agente **asignado** cambia el estado (un caso sin asignar no sale de Pendiente) | HU-04 | `services/casos/cambiarEstado.js` |
| No se pasa a En validación sin al menos una atención registrada | HU-06 | `services/casos/cambiarEstado.js` |

Ambas tocan el mismo archivo en partes distintas: coordinarlo en la Daily y hacer `git pull origin main` antes de abrir PR.

## Contrato de API nuevo

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

Las dos rutas ya están conectadas a su servicio y al contenedor; responden 501 hasta que se implementen.

## Archivos por historia

| Historia | Servicio | Repositorio | Pruebas | Frontend |
|---|---|---|---|---|
| HU-04 | `services/casos/asignarCaso.js` | `casosRepository.asignarAgente()` (agregar cuando HU-05 esté en `main`) | `tests/services/asignarCaso.test.js` | botón "Asignarme" en `bandeja.html` |
| HU-06 | `services/casos/registrarAtencion.js` | `repositories/atencionesRepository.js` | `tests/services/registrarAtencion.test.js` | formulario de atención |
| HU-03 / HU-02 | `services/casos/listarCasos.js` | `casosRepository.listar()` | `tests/services/listarCasos.test.js` | `bandeja.html`, `mis-casos.html` |

Los repositorios en memoria (`tests/fakes/`) ya incluyen `asignarAgente`, atenciones y el agente asignado, para escribir las pruebas sin MySQL.

## Calendario

| Día | Actividad |
|---|---|
| Mié 7 (tarde) | Review y Retro del Sprint 1. Sprint Planning (este documento). Mover tarjetas y anotar fechas |
| Jue 8 | **Daily** (empieza por HU-03). HU-05 fusionada en la mañana. T0 y HU-03 en curso. HU-04 en curso. **Refinement** de HU-07, HU-08, HU-09 y HU-10 |
| Vie 9 | **Daily**. Meta: HU-05, HU-03, HU-01 y HU-04 en Done; HU-06 en validación. **Review y Retrospective** al final del día |
| Sáb 10 | Sprint 3 Planning |

## Riesgos

| Riesgo | Plan |
|---|---|
| HU-03 vuelve a no avanzar | Se marca `blocked` el mismo día y Sebastian se suma; si el jueves a mediodía no hay rama, Sebastian la toma |
| HU-04 y HU-06 tocan `cambiarEstado.js` | Cambios pequeños en zonas distintas, PR cortos, `git pull` antes de cada PR |
| La rama de HU-05 choca con `main` | Miguel actualiza su rama desde `main` antes del PR (posibles conflictos en `casos_prueba.md` y `casosRepository.js`) |
| No se registran fechas otra vez | Mejora de la Retro: quien mueve la tarjeta anota la fecha; se revisa al final de cada Daily |
