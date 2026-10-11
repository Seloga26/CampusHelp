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

## Resumen por sprint

| Sprint | Throughput | Lead Time prom. | Cycle Time prom. | WIP máx. | Defectos | Bloqueos (cant./días) |
|---|---|---|---|---|---|---|
| 1 | 0 (0 de 16 SP) | — (ninguna Done en el timebox) | — | 2 | 1 (DEF-01) | 1 (HU-01 esperando a HU-03; sin marcar) |
| 2 | 0 al cierre (0 de 18 SP); además cerró HU-05 del Sprint 1 | — (ninguna del Sprint 2 Done en el timebox) | — | 4 (9 oct) | 0 | 1 (HU-06 esperando a HU-04 desde el 9 oct) |
| 3 | | | | | | |

## Comparación y efecto de la mejora

Comparar al menos dos momentos del proyecto y explicar si la mejora acordada en la retrospectiva tuvo un efecto observable.
