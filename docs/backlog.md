# Product Backlog — CampusHelp

Backlog inicial del docente, refinado por el equipo. Una historia pasa a **Ready** cuando cumple la Definition of Ready ([scrumban.md](scrumban.md)) y su ficha está en [historias/](historias/). Puntos: escala 1, 2, 3, 5, 8, 13.

| ID | Historia | Prioridad | SP | Sprint | Dependencias | Responsable | Estado |
|---|---|---|---|---|---|---|---|
| HU-01 | Como solicitante, quiero registrar un incidente o solicitud para pedir atención tecnológica. | P1 | 5 | 1 | — | Sebastian | Ready |
| HU-02 | Como solicitante, quiero consultar mis casos para conocer su estado. | P1 | 3 | 1 | HU-01 (se mitiga con T0) | Keyla | Ready |
| HU-03 | Como agente, quiero visualizar la bandeja de casos pendientes para seleccionar trabajo. | P1 | 3 | 1 | HU-01 (se mitiga con T0) | Keyla | Ready |
| HU-05 | Como agente, quiero cambiar el estado del caso para reflejar su avance. | P1 | 5 | 1 | HU-03 (solo frontend) | Miguel | Ready |
| HU-04 | Como agente, quiero asignarme un caso para asumir su atención. | P1 | 3 | 2 | HU-03 | | Product Backlog |
| HU-06 | Como agente, quiero registrar diagnóstico y solución para documentar la atención. | P1 | 5 | 2 | HU-04, HU-05 | | Product Backlog |
| HU-07 | Como validador, quiero aprobar o devolver una solución para controlar la calidad. | P1 | 5 | 2 | HU-06 | | Product Backlog |
| HU-08 | Como usuario autorizado, quiero consultar el historial para conocer lo ocurrido. | P2 | 5 | 2 | HU-05 | | Product Backlog |
| HU-09 | Como administrador, quiero filtrar casos para encontrarlos rápidamente. | P2 | 3 | 3 | HU-03 | | Product Backlog |
| HU-10 | Como administrador, quiero visualizar indicadores para conocer el comportamiento del servicio. | P2 | 5 | 3 | HU-07 | | Product Backlog |
| HU-11 | Como administrador, quiero gestionar categorías de soporte. | P2 | 3 | 3 | — | | Product Backlog |
| HU-12 | Como solicitante, quiero consultar el detalle de mi caso y la solución registrada. | P3 | 3 | 3 | HU-06 | | Product Backlog |

**Totales por sprint:** Sprint 1 = 16 SP · Sprint 2 = 18 SP · Sprint 3 = 14 SP

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
