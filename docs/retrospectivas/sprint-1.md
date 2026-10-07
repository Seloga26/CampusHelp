# Retrospectiva — Sprint 1

**Fecha:** miércoles 7 de octubre de 2026  ·  **Asistentes:** _completar_

**Sprint Goal:** un solicitante registra y consulta sus casos, y un agente los ve en la bandeja y avanza su estado dejando historial, todo persistido en MySQL. → **No cumplido.**

> Los datos salen del repositorio. Las observaciones son una **propuesta basada en esa evidencia**: el equipo las confirma, corrige o completa en la reunión.

## Datos

| Métrica | Valor | Fuente |
|---|---|---|
| Throughput | **0** historias Done (0 de 16 SP) | Review del Sprint 1 |
| WIP máximo | 2 historias con trabajo real (HU-01, HU-05) | ramas y commits |
| Lead Time / Cycle Time | No calculable: ninguna historia llegó a Done | `docs/metricas/registro_flujo.csv` |
| Defectos | 1 (DEF-01, P3, corregido y verificado el mismo día) | `docs/pruebas/defectos.md` |
| Bloqueos | HU-01 no puede cerrarse sin la bandeja (HU-03). Ningún bloqueo se marcó como `blocked` en el tablero | Issues, tablero |
| Entrada a Ready | 6 oct, último día del sprint, aunque el refinamiento estaba listo el 4 oct | `registro_flujo.csv`, PR #13 |
| Fechas del flujo registradas | Solo la entrada a Ready; ninguna fecha de En análisis, En atención ni En validación | `registro_flujo.csv` |

## ¿Qué funcionó?

- El refinamiento con criterios Given/When/Then y el contrato de API permitieron que HU-01 y HU-05 se programaran en paralelo sin conflictos de código.
- La arquitectura limpia hizo posible probar reglas sin MySQL: la revisión de HU-01 encontró DEF-01 antes de llegar a `main`.
- HU-05 se construyó sin esperar la bandeja, como se decidió en el refinamiento.

## ¿Qué no funcionó?

- **Las historias entraron tarde al flujo:** el planning se cerró el 4 oct, pero las tarjetas pasaron a Ready el 6 oct, último día del sprint.
- **El camino crítico no avanzó:** HU-03 y la tarea T0 (casos de ejemplo) eran las primeras del plan porque desbloqueaban a las demás, y no tuvieron actividad en el repositorio.
- **Un bloqueo no se hizo visible:** ninguna tarjeta se marcó `blocked` y no hubo ayuda entre integrantes sobre HU-03.
- **Las fechas del flujo no se registraron**, así que no se pueden calcular Cycle Time ni Lead Time del sprint.
- **El cambio de arquitectura** se hizo el último día del sprint y consumió parte de la única jornada de desarrollo.
- **Trabajo terminado sin integrar:** HU-05 quedó en una rama sin PR.

## Evidencia

- Review del Sprint 1: [reviews/sprint-1.md](../reviews/sprint-1.md)
- Registro del flujo: [metricas/registro_flujo.csv](../metricas/registro_flujo.csv)
- Historial de commits y PR #13 a #17

## Mejora seleccionada

- **Problema:** el trabajo que desbloquea a los demás (HU-03) no avanzó y nadie lo notó a tiempo, porque los bloqueos y las fechas no se registran en el tablero.
- **Hipótesis:** si cada Daily empieza por la historia del camino crítico y todo bloqueo se marca `blocked` el mismo día, el equipo hará *swarming* (varios sobre la misma historia) y al menos 3 historias llegarán a Done en el Sprint 2.
- **Cambio:**
  1. La Daily revisa primero HU-03 y luego el resto del tablero, de derecha a izquierda (lo más cercano a Done primero).
  2. Quien no avance en su historia durante un día la marca `blocked` con el motivo en un comentario del Issue.
  3. Cada movimiento de tarjeta se anota en `registro_flujo.csv` ese mismo día; quien mueve la tarjeta, anota la fecha.
  4. Ninguna rama termina el día sin PR abierto si su historia está en En validación.
- **Indicador:** historias Done al cierre del Sprint 2 (meta: ≥ 3) y porcentaje de movimientos con fecha en `registro_flujo.csv` (meta: 100 %).
- **Responsable:** _completar_ (propuesta: Sebastian revisa el CSV al final de cada Daily)
- **Fecha de revisión:** Retrospectiva del Sprint 2, viernes 9 de octubre.
