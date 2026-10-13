# Métricas del flujo

Las fechas se registran **el mismo día** del movimiento en [registro_flujo.csv](registro_flujo.csv) (formato `AAAA-MM-DD`). El Taller no acepta métricas reconstruidas al final.

| Métrica | Cálculo |
|---|---|
| **Lead Time** | Fecha Done − Fecha entrada Ready |
| **Cycle Time** | Fecha Done − Fecha inicio (En análisis) |
| **Throughput** | Historias Done por sprint |
| **WIP** | Historias en análisis + atención + validación en un día dado |
| **Defectos** | Filas de `docs/pruebas/defectos.md` por sprint |
| **Bloqueos** | Cantidad y suma de "Días bloqueado" por sprint |

## Fechas completadas a partir de GitHub

No todas las fechas se anotaron el día del movimiento. Las siguientes se completaron el **12 de octubre** con la evidencia del repositorio, y se declaran aquí para no presentarlas como registradas a tiempo:

| Historia | Campo | Fecha | Evidencia |
|---|---|---|---|
| HU-02, HU-03 | Inicio, En atención y En validación | 9 oct | Primer commit de la historia (PR #23, 09:03) y fusión de los PR #24 y #25 el mismo día |
| HU-02, HU-03 | Done | 12 oct | Cierre de los Issues #2 y #3 |
| HU-05 | Inicio y En atención | 6 oct | Commit `feat(HU-05)` del 6 oct, 09:35 |
| HU-07 | Inicio, En atención, En validación y Done | 12 oct | Único commit de la historia (16:41), PR #40 y cierre del Issue #7 |
| HU-09 | Inicio, En atención, En validación y Done | 12 oct | Commit de la historia (21:28), PR #46 a #48 y cierre del Issue #9 |
| HU-06 | Días bloqueado (2) | 9 – 11 oct | Motivo ya registrado; HU-04 se fusionó el 11 oct (PR #31) |

Regla usada para la fecha Done: **el día en que se cerró el Issue de la historia**, la misma que siguieron las historias con fechas registradas a tiempo. Las fechas de inicio salen del primer commit, así que el trabajo local anterior no se ve y el Cycle Time de esas historias puede quedar por debajo del real.

## Resumen por sprint

Las filas de los sprints 1 y 2 muestran el estado **al cierre de su timebox** y no se modifican.

| Sprint | Throughput | Lead Time prom. | Cycle Time prom. | WIP máx. | Defectos | Bloqueos (cant./días) |
|---|---|---|---|---|---|---|
| 1 | 0 (0 de 16 SP) | — (ninguna Done en el timebox) | — | 2 | 1 (DEF-01) | 1 (HU-01 esperando a HU-03; sin marcar) |
| 2 | 0 al cierre (0 de 18 SP); además cerró HU-05 del Sprint 1 | — (ninguna del Sprint 2 Done en el timebox) | — | 4 (9 oct) | 0 | 1 (HU-06 esperando a HU-04 desde el 9 oct) |
| 3 | **4** (14 de 14 SP); además se cerraron 7 historias de los sprints 1 y 2 | 0,75 días | 0 días (las 4 empezaron y terminaron el mismo día) | 7 (11 y 12 oct) | 2 (DEF-02, DEF-03) | 1 / 2 días (HU-06, heredado del Sprint 2; resuelto el 11 oct) |

## Resultado final por historia

| Historia | Sprint | Responsable | Ready | Done | Lead Time | Cycle Time |
|---|---|---|---|---|---|---|
| HU-01 | 1 | Sebastian | 6 oct | 11 oct | 5 | 5 |
| HU-02 | 1 | Keyla | 6 oct | 12 oct | 6 | 3 |
| HU-03 | 1 | Keyla | 6 oct | 12 oct | 6 | 3 |
| HU-05 | 1 | Miguel | 6 oct | 9 oct | 3 | 3 |
| HU-04 | 2 | Sebastian | 7 oct | 11 oct | 4 | 0 |
| HU-06 | 2 | Miguel | 7 oct | 12 oct | 5 | 5 |
| HU-07 | 2 | Keyla | 7 oct | 12 oct | 5 | 0 |
| HU-08 | 2 | Sebastian | 7 oct | 11 oct | 4 | 0 |
| HU-09 | 3 | Keyla | 11 oct | 12 oct | 1 | 0 |
| HU-10 | 3 | Sebastian | 11 oct | 11 oct | 0 | 0 |
| HU-11 | 3 | Miguel | 11 oct | 12 oct | 1 | 0 |
| HU-12 | 3 | Miguel | 11 oct | 12 oct | 1 | 0 |

**Promedios por sprint de origen** (en días):

| Sprint de origen | Lead Time prom. | Cycle Time prom. |
|---|---|---|
| 1 | 5,0 | 3,5 |
| 2 | 4,5 | 1,25 |
| 3 | 0,75 | 0 |
| **Proyecto (12 historias)** | **3,4** | **1,6** |

**WIP por día** (historias entre inicio y Done, contando el día de Done): 9 oct: 5 · 10 oct: 4 · 11 oct: 7 · 12 oct: 7. Del 9 al 11 oct **En validación tuvo 3 historias abiertas** (HU-02, HU-03 y HU-06), por encima del límite de 2: HU-02 y HU-03 estaban fusionadas pero no se cerraron, y HU-06 esperaba a HU-04.

## Comparación y efecto de la mejora

| Indicador | Sprint 1 | Sprint 2 | Sprint 3 |
|---|---|---|---|
| Historias del sprint en Done al cierre | 0 de 4 | 0 de 4 | **4 de 4** |
| Puntos terminados en el timebox | 0 de 16 | 0 de 18 | **14 de 14** |
| Lead Time de las historias del sprint | 5,0 días | 4,5 días | **0,75 días** |
| Historias de sprints anteriores pendientes al cierre | — | 7 | **0** |

**Mejora acordada en la Retro del Sprint 2:** terminar las historias abiertas en su sprint, integrar el mismo día, cerrar al fusionar y avisar los bloqueos el mismo día.

| Indicador de la mejora | Meta | Resultado |
|---|---|---|
| Throughput del Sprint 3 | ≥ 2 | **Cumplido: 4** |
| Historias de los sprints 1 y 2 cerradas | HU-02, HU-03, HU-06 y HU-07 | **Cumplido**: las cuatro cerradas el 12 oct |
| Fecha Done en el CSV el mismo día de la fusión | Todas | **Parcial**: Sebastian y Miguel sí; Keyla no (sus fechas se completaron después, ver arriba) |
| Ningún PR de código fusionado después de las 18:00 del último día | 0 | **No cumplido**: HU-11 (19:20), HU-12 (19:35) y HU-09 (21:29, 21:44 y 21:58) |

**Lectura:** el efecto es observable. El Throughput pasó de 0 en los dos primeros sprints a 4 en el tercero, y el Lead Time de las historias del sprint bajó de 4,5–5 días a menos de un día, porque cada historia se cerró en cuanto se fusionó. Los atrasos de los sprints anteriores también se cerraron. Lo que no cambió es la integración al final del día de cierre: tres historias entraron después de las 18:00 del lunes, sin margen para la prueba integrada con MySQL antes de la Review.
