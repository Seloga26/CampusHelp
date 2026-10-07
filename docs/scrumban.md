# Cómo aplicamos ScrumBan

## Product Goal

Entregar un MVP de CampusHelp que permita gestionar de extremo a extremo incidentes y solicitudes de servicio tecnológico universitario, desde su registro hasta su validación y cierre, con información persistente e indicadores reales.

## Sprints

| Sprint | Fechas | Sprint Goal | Historias | Planning |
|---|---|---|---|---|
| 0 | sáb 26 sep – vie 2 oct | Preparación: comprender el Taller y alistar el entorno | — | [sprint-0.md](sprints/sprint-0.md) |
| 1 | sáb 3 – mar 6 oct (4 días) | Un solicitante registra y consulta sus casos, y un agente los ve en la bandeja y avanza su estado con historial, todo persistido en MySQL | HU-01, HU-02, HU-03, HU-05 | [sprint-1-planning.md](sprints/sprint-1-planning.md) |
| 2 | mar 6 – vie 9 oct (4 días) | Completar asignación, atención, validación e historial | HU-04, HU-06, HU-07, HU-08 | [sprint-2-planning.md](sprints/sprint-2-planning.md) |
| 3 | sáb 10 – lun 12 oct (3 días) | Completar filtros, indicadores, categorías y detalle | HU-09, HU-10, HU-11, HU-12 | |

Resultados: Sprint 1 → [Review](reviews/sprint-1.md) · [Retro](retrospectivas/sprint-1.md)

Cada historia pertenece a un solo sprint. Si no se termina dentro de su timebox, sigue abierta en su sprint original con el mismo responsable; no se mezcla con el sprint siguiente.
| — | **mar 13 oct** | **Entrega final y presentación** | | |

El Taller sugiere sprints de 1 semana. Como la entrega final es el martes 13 de octubre, el equipo los acortó a 3–4 días para mantener los tres sprints con su cadencia completa (Planning, Daily, Refinement, Review y Retrospective). La decisión está en el registro de cambios del [backlog](backlog.md).

### Cadencia con sprints cortos

| Evento | Cuándo |
|---|---|
| Sprint Planning | Primer día del sprint, máximo 30 min |
| Daily | Todos los días del sprint, 10–15 min |
| Refinement | Penúltimo día del sprint, para dejar Ready las historias del siguiente |
| Review + Retrospective | Último día del sprint, al final de la jornada |

### Plan de contingencia

Si al cerrar el Sprint 2 el Throughput muestra que no alcanza el tiempo, se recorta en este orden, de menor a mayor impacto en el MVP:

1. **HU-12** (P3): el detalle del caso se cubre en parte con HU-02 y HU-08.
2. **HU-11** (P2): las categorías ya vienen cargadas en el seed.

HU-01 a HU-10 no se recortan: cubren el flujo obligatorio y los módulos de historial, filtros e indicadores que exige el Taller.

## Tablero

`Product Backlog | Ready | En análisis | En atención | En validación | Done`

| Columna | Límite WIP | Entra cuando… |
|---|---|---|
| Product Backlog | — | Existe la historia |
| Ready | — | Cumple la Definition of Ready |
| En análisis | **3** | Alguien la toma (pull) para diseño/tareas |
| En atención | **3** | Tareas técnicas definidas; se programa |
| En validación | **2** | Código en PR y pruebas listas para ejecutar |
| Done | — | Cumple la Definition of Done |

### Políticas

- **Pull:** solo se inicia trabajo nuevo si la columna destino tiene capacidad.
- **WIP alcanzado:** no se toma otra tarea; primero se ayuda a terminar, probar o desbloquear.
- **Expedite:** máximo 1 elemento urgente a la vez; se registra qué trabajo desplaza.
- **Bloqueos:** tarjeta marcada como *Blocked* con motivo y fecha de inicio/fin.
- **Fechas:** cada movimiento de columna se registra en `docs/metricas/registro_flujo.csv` el mismo día.

## Eventos

| Evento | Cuándo | Duración | Evidencia |
|---|---|---|---|
| Sprint Planning | Inicio de sprint | 30–45 min | Sprint Goal e historias en esta página |
| Daily | Días de trabajo | 10–15 min | Notas breves en el tablero |
| Refinement | ≥ 1 por sprint | 30 min | Fichas en `docs/historias/` |
| Review | Fin de sprint | 20 min | `docs/reviews/sprint-N.md` |
| Retrospective | Fin de sprint | 20 min | `docs/retrospectivas/sprint-N.md` |

## Definition of Ready

Una historia está **Ready** cuando tiene:

- [ ] Actor, necesidad y valor claros
- [ ] Prioridad
- [ ] Criterios de aceptación (Given / When / Then)
- [ ] Estimación en Story Points
- [ ] Dependencias identificadas
- [ ] Ninguna pregunta crítica pendiente

## Definition of Done

Una historia está **Done** cuando:

- [ ] Código integrado en `main` mediante PR
- [ ] Criterios de aceptación verificados
- [ ] Pruebas ejecutadas y resultados registrados
- [ ] Sin defectos críticos abiertos
- [ ] Documentación actualizada (README / API / backlog)
- [ ] Funcionalidad demostrable con datos persistentes
