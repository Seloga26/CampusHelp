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

## Historias que pasan al Sprint 2

| Historia | Estado al pasar | Decisión |
|---|---|---|
| HU-01 | En validación | Se cierra cuando HU-03 muestre el caso y se registre la prueba con MySQL |
| HU-05 | En atención (rama sin PR) | Primera prioridad del Sprint 2: corregir documentación, PR y merge |
| HU-03 | Ready | Camino crítico del Sprint 2: bloquea HU-01, HU-04 y la integración de HU-05 |
| HU-02 | Ready | Se jala cuando haya capacidad |

## Retroalimentación y cambios al backlog

- HU-07 y HU-08 pasan del Sprint 2 al Sprint 3; se activa el plan de contingencia para HU-11 y HU-12. Ver [sprint-2-planning.md](../sprints/sprint-2-planning.md).
- _completar con comentarios de la reunión_
