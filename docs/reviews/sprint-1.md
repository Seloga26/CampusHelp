# Sprint Review — Sprint 1

**Sprint:** sábado 3 – martes 6 de octubre de 2026
**Review:** miércoles 7 de octubre de 2026 (un día tarde, al inicio del Sprint 2)  ·  **Asistentes:** _completar_

**Sprint Goal:** un solicitante registra y consulta sus casos, y un agente los ve en la bandeja y avanza su estado dejando historial, todo persistido en MySQL.

**¿Se cumplió?** **No.** Se construyó el registro de casos (HU-01) y el backend de cambio de estado (HU-05), pero ninguna historia llegó a Done y la bandeja (HU-03) no se inició.

> Los datos de este documento salen del repositorio (commits, PR y archivos de `docs/`). Las secciones marcadas con _completar_ se llenan en la reunión.

## Historias del sprint

| Historia | SP | Responsable | Dónde quedó | Evidencia | Resultado |
|---|---|---|---|---|---|
| HU-01 Registrar incidente o solicitud | 5 | Sebastian | En validación | PR #17 fusionado el 6 oct (`48d8341`, `d9bcb17`); 8 pruebas automáticas | No Done: falta la prueba con MySQL real y verificar que el caso aparece en la bandeja (depende de HU-03) |
| HU-05 Cambiar estado del caso | 5 | Miguel | Rama `feature/HU-05-cambiar-estado` (`a66ce68`, 6 oct), sin PR | Backend con transacción y bloqueo de fila; pantalla provisional `cambiar-estado.html` | No Done: falta PR, corregir la documentación de pruebas e integrar en la bandeja |
| HU-03 Bandeja de casos pendientes (+ T0) | 3 | Keyla | Sin cambios en el repositorio | — | No iniciada en el repositorio. Motivo: _completar_ |
| HU-02 Consultar mis casos | 3 | Keyla | Sin cambios en el repositorio | — | No iniciada (dependía de que hubiera espacio en En análisis) |

**Throughput:** 0 historias Done · **Puntos terminados:** 0 de 16.

## Qué se puede demostrar

1. `registrar.html`: registrar un incidente y una solicitud; un registro sin descripción se rechaza con mensaje.
2. `npm test`: 27 pruebas automáticas en `main`, incluidas las de HU-01 con repositorios en memoria.
3. Desde la rama de HU-05: `cambiar-estado.html` avanza un caso de Pendiente hasta En validación y deja historial.

## Otros resultados del sprint

| Fecha | Resultado | Evidencia |
|---|---|---|
| 3 oct | Repositorio, protección de `main`, tablero e Issues #1–#12 | commit `98de469`, Issues |
| 4 oct | Sprint Planning y refinamiento de HU-01, HU-02, HU-03 y HU-05 | PR #13 |
| 4 oct | Calendario ajustado a la entrega del 13 de octubre | PR #14 |
| 6 oct | Backend reorganizado en arquitectura limpia con SOLID | PR #16, ADR-003 |
| 6 oct | Defecto DEF-01 detectado en revisión y corregido | `d9bcb17`, `docs/pruebas/defectos.md` |

## Historias del Sprint 1 sin terminar

**Decisión del equipo:** no se mezclan con el Sprint 2. Siguen siendo historias del Sprint 1, con los mismos responsables, y se cierran como tal. Al cerrarlas, su Lead Time y Cycle Time reflejarán el retraso real.

| Historia | Responsable | Dónde está | Qué falta para Done |
|---|---|---|---|
| HU-01 | Sebastian | En validación | Prueba con MySQL real y ver el caso en la bandeja (HU-03) |
| HU-05 | Miguel | En atención (rama sin PR) | Corregir la documentación de pruebas, PR y merge; integrar en la bandeja |
| HU-03 | Keyla | Ready | Desarrollo completo (incluye T0) |
| HU-02 | Keyla | Ready | Desarrollo completo |

## Retroalimentación y cambios al backlog

- El Sprint 2 mantiene su alcance planeado: HU-04, HU-06, HU-07 y HU-08. Ver [sprint-2-planning.md](../sprints/sprint-2-planning.md).
- _completar con comentarios de la reunión_
