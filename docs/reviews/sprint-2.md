# Sprint Review — Sprint 2

**Sprint:** martes 6 – sábado 10 de octubre de 2026 (el cierre pasó del viernes 9 al sábado 10; ver el registro de cambios del [backlog](../backlog.md))
**Cierre del timebox:** sábado 10 de octubre  ·  **Review registrada:** domingo 11 de octubre  ·  **Asistentes:** _completar_

**Sprint Goal:** completar asignación, atención, validación e historial: un agente se asigna un caso y registra diagnóstico y solución, un validador aprueba o devuelve, y cualquier usuario autorizado consulta lo ocurrido.

**¿Se cumplió?** **No.** Al cierre del sábado 10 ninguna historia del Sprint 2 estaba en Done. HU-06 quedó construida y probada, pero En validación porque dependía de la asignación (HU-04). HU-04, HU-07 y HU-08 no tenían trabajo en el repositorio. En cambio, el sprint sí cerró deuda del Sprint 1: HU-05 llegó a Done y HU-02 y HU-03 se integraron en `main`.

> Los datos de este documento salen del repositorio (commits, PR, Issues y archivos de `docs/`). Las secciones marcadas con _completar_ se llenan en la reunión.

## Historias del Sprint 2 al cierre (sábado 10)

| Historia | SP | Responsable | Dónde quedó | Evidencia | Resultado |
|---|---|---|---|---|---|
| HU-04 Asignarme un caso | 3 | Sebastian | Ready | Sin rama ni commits hasta el 10 oct | No iniciada en el timebox |
| HU-06 Registrar diagnóstico y solución | 5 | Miguel | En validación desde el 9 oct | PR #27 y #30; CP-07, CP-20, CP-21 y CP-22 aprobados con Chrome y MySQL 8.0.46 | No Done: el cierre esperaba la asignación real de HU-04 (CP-19) |
| HU-07 Aprobar o devolver una solución | 5 | Keyla | Ready | Sin rama ni commits | No iniciada. Motivo: _completar_ |
| HU-08 Consultar el historial | 5 | Sebastian | Ready | Sin rama ni commits hasta el 10 oct | No iniciada en el timebox |

**Throughput del Sprint 2 al cierre:** 0 historias Done · **Puntos terminados:** 0 de 18.

## Historias del Sprint 1 cerradas o integradas durante el Sprint 2

| Historia | Responsable | Resultado | Evidencia |
|---|---|---|---|
| HU-05 Cambiar estado | Miguel | **Done el 9 oct** | PR #27, #28 y #29; Issue #5 cerrado |
| HU-02 Mis casos | Keyla | Integrada en `main` el 9 oct; sin fecha Done registrada | PR #23 y #24 |
| HU-03 Bandeja | Keyla | Integrada en `main` el 9 oct; sin fecha Done registrada | PR #23 y #25 |
| HU-01 Registrar caso | Sebastian | Seguía En validación al cierre | PR #17 (6 oct) |

## Qué se puede demostrar (estado de `main` al cierre)

1. Registrar un caso (`registrar.html`) y verlo en "Mis casos" y en la bandeja, ordenado por prioridad.
2. En la bandeja, avanzar el estado de un caso: Pendiente → En análisis → En atención → En validación, con historial.
3. Registrar diagnóstico y solución (`atender.html`) y comprobar que sin atención no se puede enviar a validación.
4. **No se puede demostrar:** asignarse un caso, aprobar o devolver, cerrar un caso ni consultar el historial en pantalla.

## Trabajo terminado después del cierre (domingo 11, dentro del Sprint 3)

Según la regla del equipo, estas historias siguen perteneciendo a su sprint original; su Lead Time refleja el retraso.

| Historia | Sprint | Done | Evidencia |
|---|---|---|---|
| HU-04 Asignarme un caso | 2 | 11 oct | PR #31; CP-06, CP-17, CP-18 y CP-19 |
| HU-08 Consultar el historial | 2 | 11 oct | PR #32; CP-26, CP-27 y CP-28 |
| HU-01 Registrar caso | 1 | 11 oct | PR #33; prueba con MySQL real y en la bandeja. Se encontraron y corrigieron DEF-02 y DEF-03 |

Con HU-04 integrada, **HU-06 quedó desbloqueada** y puede cerrarse. **HU-07 sigue sin iniciar**: sin ella el flujo obligatorio no llega a Cerrada.

## Otros resultados del sprint

| Fecha | Resultado | Evidencia |
|---|---|---|
| 7 oct | Review y Retro del Sprint 1, planning del Sprint 2 y refinamiento de HU-04, HU-06, HU-07 y HU-08 | PR #18 a #22 |
| 9 oct | Casos de prueba adicionales para HU-02, HU-03 y HU-05 | PR #23 |
| 9 oct | Mejora visual de todas las páginas | PR #26 |
| 9 oct | Primera historia con fechas de En análisis y En atención en el registro de flujo (HU-06) | `registro_flujo.csv` |

## Retroalimentación y cambios al backlog

- El Sprint 3 mantiene HU-09, HU-10, HU-11 y HU-12, con el plan de contingencia de [scrumban.md](../scrumban.md) (recortar primero HU-12 y luego HU-11). Ver [sprint-3-planning.md](../sprints/sprint-3-planning.md).
- HU-07 tiene prioridad sobre cualquier historia del Sprint 3, porque sin ella no se demuestra el flujo obligatorio el 13 de octubre.
- _completar con comentarios de la reunión_
