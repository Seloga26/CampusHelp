# Product Backlog — CampusHelp

Backlog inicial del docente, refinado por el equipo. Una historia pasa a **Ready** cuando cumple la Definition of Ready ([scrumban.md](scrumban.md)) y su ficha está en [historias/](historias/). Puntos: escala 1, 2, 3, 5, 8, 13.

| ID | Historia | Prioridad | SP | Sprint | Dependencias | Responsable | Estado |
|---|---|---|---|---|---|---|---|
| HU-01 | Como solicitante, quiero registrar un incidente o solicitud para pedir atención tecnológica. | P1 | 5 | 1 → 2 | — | Sebastian | En validación |
| HU-05 | Como agente, quiero cambiar el estado del caso para reflejar su avance. | P1 | 5 | 1 → 2 | HU-03 (solo frontend) | Miguel | En atención (rama sin PR) |
| HU-03 | Como agente, quiero visualizar la bandeja de casos pendientes para seleccionar trabajo. | P1 | 3 | 1 → 2 | HU-01 (se mitiga con T0) | Keyla | Ready |
| HU-04 | Como agente, quiero asignarme un caso para asumir su atención. | P1 | 3 | 2 | HU-05 (backend), HU-03 (botón) | Sebastian | Ready |
| HU-06 | Como agente, quiero registrar diagnóstico y solución para documentar la atención. | P1 | 5 | 2 | HU-04, HU-05 | Miguel | Ready |
| HU-02 | Como solicitante, quiero consultar mis casos para conocer su estado. | P1 | 3 | 1 → 2 | HU-03 (mismo backend) | Keyla | Ready |
| HU-07 | Como validador, quiero aprobar o devolver una solución para controlar la calidad. | P1 | 5 | 2 → 3 | HU-06 | | Product Backlog |
| HU-08 | Como usuario autorizado, quiero consultar el historial para conocer lo ocurrido. | P2 | 5 | 2 → 3 | HU-05 | | Product Backlog |
| HU-09 | Como administrador, quiero filtrar casos para encontrarlos rápidamente. | P2 | 3 | 3 | HU-03 | | Product Backlog |
| HU-10 | Como administrador, quiero visualizar indicadores para conocer el comportamiento del servicio. | P2 | 5 | 3 | HU-07 | | Product Backlog |
| HU-11 | Como administrador, quiero gestionar categorías de soporte. | P2 | 3 | Recortada | — | | Product Backlog (solo si sobra capacidad) |
| HU-12 | Como solicitante, quiero consultar el detalle de mi caso y la solución registrada. | P3 | 3 | Recortada | HU-06 | | Product Backlog (solo si sobra capacidad) |

**Totales por sprint:** Sprint 1 = 16 SP planeados, 0 terminados · Sprint 2 = 19 SP (11 arrastrados + 8 nuevos) · Sprint 3 = 18 SP · Recortadas = 6 SP

La columna Sprint muestra los movimientos (`1 → 2` = arrastrada del Sprint 1 al 2). El orden de la tabla es el orden de prioridad actual.

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
| 2026-10-07 | Sprint 1 cerrado con 0 historias Done: HU-01, HU-02, HU-03 y HU-05 pasan al Sprint 2 | Las historias entraron a Ready el último día del sprint y el camino crítico (HU-03) no avanzó. Ver Review y Retro del Sprint 1 | Equipo |
| 2026-10-07 | HU-07 y HU-08 pasan al Sprint 3; se activa la contingencia: HU-11 y HU-12 quedan recortadas | Con el arrastre, el Sprint 2 no tiene capacidad para ellas; se priorizan el flujo obligatorio (HU-07) y los módulos de historial, filtros e indicadores | Equipo |
| 2026-10-07 | HU-04: solo el agente asignado cambia el estado. HU-06: no se pasa a En validación sin atención registrada | Reglas del Taller (sección 7) que el refinamiento de HU-05 había dejado para el Sprint 2 | Equipo |
| 2026-10-07 | DEF-01 registrado (título de más de 180 caracteres respondía 500) | Encontrado en revisión de código de HU-01; corregido en `d9bcb17` | Equipo |
