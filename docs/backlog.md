# Product Backlog — CampusHelp

Backlog inicial del docente, refinado por el equipo. Una historia pasa a **Ready** cuando cumple la Definition of Ready ([scrumban.md](scrumban.md)) y su ficha está en [historias/](historias/). Puntos: escala 1, 2, 3, 5, 8, 13.

| ID | Historia | Prioridad | SP | Sprint | Dependencias | Responsable | Estado |
|---|---|---|---|---|---|---|---|
| HU-01 | Como solicitante, quiero registrar un incidente o solicitud para pedir atención tecnológica. | P1 | 5 | 1 | — | Sebastian | Done (2026-10-11, PR #33; Issue #1 cerrado) |
| HU-02 | Como solicitante, quiero consultar mis casos para conocer su estado. | P1 | 3 | 1 | HU-03 (mismo backend) | Keyla | En validación (integrada el 9 oct, PR #24; falta registrar Done) |
| HU-03 | Como agente, quiero visualizar la bandeja de casos pendientes para seleccionar trabajo. | P1 | 3 | 1 | HU-01 (se mitiga con T0) | Keyla | En validación (integrada el 9 oct, PR #25; falta registrar Done) |
| HU-05 | Como agente, quiero cambiar el estado del caso para reflejar su avance. | P1 | 5 | 1 | HU-03 (solo frontend) | Miguel | Done (2026-10-09, PR #28; Issue #5 cerrada) |
| HU-04 | Como agente, quiero asignarme un caso para asumir su atención. | P1 | 3 | 2 | HU-05, HU-03 | Sebastian | Done (2026-10-11, PR #31; Issue #4 cerrado) |
| HU-06 | Como agente, quiero registrar diagnóstico y solución para documentar la atención. | P1 | 5 | 2 | HU-04, HU-05 | Miguel | En validación (desbloqueada el 11 oct al integrarse HU-04; falta registrar Done) |
| HU-07 | Como validador, quiero aprobar o devolver una solución para controlar la calidad. | P1 | 5 | 2 | HU-06 | Keyla | Ready |
| HU-08 | Como usuario autorizado, quiero consultar el historial para conocer lo ocurrido. | P2 | 5 | 2 | HU-05 | Sebastian | Done (2026-10-11, PR #32; Issue #8 cerrado) |
| HU-09 | Como administrador, quiero filtrar casos para encontrarlos rápidamente. | P2 | 3 | 3 | HU-02, HU-03 | Keyla | Ready (2026-10-11) |
| HU-10 | Como administrador, quiero visualizar indicadores para conocer el comportamiento del servicio. | P2 | 5 | 3 | HU-04, HU-05, HU-07 | Sebastian | Ready (2026-10-11) |
| HU-11 | Como administrador, quiero gestionar categorías de soporte. | P2 | 3 | 3 | — | Miguel | Ready (2026-10-11) |
| HU-12 | Como solicitante, quiero consultar el detalle de mi caso y la solución registrada. | P3 | 3 | 3 | HU-06, HU-07 | Miguel | Ready (2026-10-11) |

**Totales por sprint:** Sprint 1 = 16 SP (0 terminados al cierre del timebox; sus historias siguen abiertas con sus responsables) · Sprint 2 = 18 SP (0 terminados al cierre del sábado 10) · Sprint 3 = 14 SP

Cada historia pertenece a un solo sprint: las del Sprint 1 no terminadas no se mueven al Sprint 2.

**T0** = casos de ejemplo en `database/seed.sql`, primera tarea del Sprint 1 (ver [sprint-1-planning.md](sprints/sprint-1-planning.md)).

## Nuevos PBI y cambios

Registrar aquí historias nuevas (evento E5), divisiones de historias grandes (E3), cambios de prioridad o de plan, con fecha y motivo.

| Fecha | Cambio | Motivo | Decidido por |
|---|---|---|---|
| 2026-10-04 | La semana del 26 sep al 2 oct pasa a ser Sprint 0 (preparación); los sprints 1–3 van del 3 al 23 de octubre | El repositorio y el tablero quedaron listos el 3 oct; así los sprints de desarrollo duran una semana y las fechas registradas son reales | Equipo |
| 2026-10-04 | HU-05 depende de HU-03 solo en el frontend; el backend se hace en paralelo | Evitar que HU-05 espere a HU-03 y repartir el trabajo entre los tres | Equipo |
| 2026-10-04 | Nueva tarea T0 (casos de ejemplo en el seed) | Quitar el bloqueo de HU-02, HU-03 y HU-05 mientras se termina HU-01 | Equipo |
| 2026-10-04 | Los PR ya no requieren aprobación; quien abre el PR lo fusiona | La espera de aprobaciones demoraba la integración; se mantiene el uso de PR para trazabilidad con los Issues | Equipo |
| 2026-10-04 | Sprints acortados: S1 3–6 oct, S2 7–9 oct, S3 10–12 oct; entrega el mar 13 oct. Reemplaza el calendario de una semana por sprint | La entrega final es el martes 13 de octubre; con sprints de una semana no alcanzaban los tres sprints. Plan de contingencia: recortar HU-12 y luego HU-11 si el Throughput no alcanza | Equipo |
| 2026-10-06 | Backend reorganizado en arquitectura limpia por capas con SOLID (ADR-003); rutas del Sprint 1 preconectadas | Separar SQL de reglas de negocio, probar servicios sin MySQL y evitar conflictos entre integrantes. Se hizo antes de escribir código de las historias | Equipo |
| 2026-10-07 | Sprint 1 cerrado con 0 historias Done. Sus historias **no se mezclan** con el Sprint 2: siguen abiertas como trabajo del Sprint 1, con los mismos responsables | Mantener la responsabilidad de cada integrante y la trazabilidad de cada sprint. Ver Review y Retro del Sprint 1 | Equipo |
| 2026-10-07 | Sprint 2 mantiene su alcance planeado (HU-04, HU-06, HU-07, HU-08); HU-07 y HU-08 se refinan hoy | Las historias del Sprint 1 no ocupan capacidad del Sprint 2 | Equipo |
| 2026-10-07 | HU-04: solo el agente asignado cambia el estado. HU-06: no se pasa a En validación sin atención registrada | Reglas del Taller (sección 7) que el refinamiento de HU-05 había dejado para el Sprint 2 | Equipo |
| 2026-10-07 | DEF-01 registrado (título de más de 180 caracteres respondía 500) | Encontrado en revisión de código de HU-01; corregido en `d9bcb17` | Equipo |
| 2026-10-07 | Sprint 2 planificado sobre el resultado del Sprint 1 completo; HU-07 a Keyla y HU-08 a Sebastian; tareas T2-01 a T2-16 | Repartir 18 SP entre los tres y fijar el orden de pull | Equipo |
| 2026-10-07 | El Sprint 2 empieza el martes 6 de octubre, el mismo día en que cierra el Sprint 1 (6–9 oct, 4 días) | Sprints consecutivos sin días sueltos entre uno y otro | Equipo |
| 2026-10-11 | El Sprint 2 cierra el sábado 10 de octubre (no el viernes 9). El Sprint 3 va del sábado 10 al lunes 12 | El trabajo del viernes 9 terminó de integrarse esa noche; se mantiene el Sprint 3 de tres días antes de la entrega del 13 | Equipo |
| 2026-10-11 | Sprint 2 cerrado con 0 de 4 historias Done. HU-04 y HU-08 se terminaron el 11 oct y siguen contando como historias del Sprint 2; HU-06 queda desbloqueada y HU-07 sigue abierta con Keyla | Regla del equipo: cada historia pertenece a un solo sprint. Ver Review y Retro del Sprint 2 | Equipo |
| 2026-10-11 | DEF-02 (registro duplicado por doble clic) y DEF-03 (nombres insertados como HTML) registrados y corregidos | Encontrados al probar HU-01 con navegador y MySQL real; PR #33 | Equipo |
| 2026-10-11 | Sprint 3 planificado sobre el resultado completo de los sprints 1 y 2: HU-09 a Keyla, HU-10 a Sebastian, HU-11 y HU-12 a Miguel. Tareas T3-01 a T3-16 y casos CP-29 a CP-43 | Las historias abiertas de los sprints 1 y 2 no se mezclan con el Sprint 3: las terminan sus responsables como trabajo de su sprint, sin ocupar capacidad del Sprint 3 | Equipo |
