# Cómo aplicamos ScrumBan

## Product Goal

Entregar un MVP de CampusHelp que permita gestionar de extremo a extremo incidentes y solicitudes de servicio tecnológico universitario, desde su registro hasta su validación y cierre, con información persistente e indicadores reales.

## Sprints

| Sprint | Fechas | Sprint Goal | Historias | Planning |
|---|---|---|---|---|
| 0 | sáb 26 sep – vie 2 oct | Preparación: comprender el Taller y alistar el entorno | — | [sprint-0.md](sprints/sprint-0.md) |
| 1 | sáb 3 oct – vie 9 oct | Un solicitante registra y consulta sus casos, y un agente los ve en la bandeja y avanza su estado con historial, todo persistido en MySQL | HU-01, HU-02, HU-03, HU-05 | [sprint-1-planning.md](sprints/sprint-1-planning.md) |
| 2 | sáb 10 oct – vie 16 oct | Completar asignación, atención, validación e historial | HU-04, HU-06, HU-07, HU-08 | |
| 3 | sáb 17 oct – vie 23 oct | Completar filtros, indicadores, categorías y detalle | HU-09, HU-10, HU-11, HU-12 | |

El Sprint 0 no entrega historias; los tres sprints de desarrollo duran una semana, como pide el Taller.

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
