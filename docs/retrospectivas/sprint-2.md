# Retrospectiva — Sprint 2

**Sprint:** martes 6 – sábado 10 de octubre de 2026  ·  **Retro registrada:** domingo 11 de octubre  ·  **Asistentes:** _completar_

**Sprint Goal:** completar asignación, atención, validación e historial. → **No cumplido** (0 de 4 historias Done al cierre).

> Los datos salen del repositorio. Las observaciones son una **propuesta basada en esa evidencia**: el equipo las confirma, corrige o completa en la reunión.

## Datos

| Métrica | Valor | Fuente |
|---|---|---|
| Throughput del Sprint 2 | **0** historias Done al cierre (0 de 18 SP) | [Review](../reviews/sprint-2.md) |
| Historias del Sprint 1 cerradas en el Sprint 2 | 1 de 4 (HU-05). HU-02 y HU-03 se integraron, pero sin fecha Done | `registro_flujo.csv`, PR #23 a #29 |
| Lead Time | HU-05: 3 días (Ready 6 oct → Done 9 oct) | `registro_flujo.csv` |
| Cycle Time | No calculable para HU-05: no se registró su entrada a En análisis | `registro_flujo.csv` |
| WIP máximo | 4 historias con trabajo el 9 oct (HU-02, HU-03, HU-05, HU-06), todo en la misma tarde | commits y PR |
| Concentración del trabajo | Los 7 PR de código del sprint se fusionaron el viernes 9 entre las 19:49 y las 23:23 | PR #24 a #30 |
| Defectos | 0 nuevos durante el timebox | `docs/pruebas/defectos.md` |
| Bloqueos | 1: HU-06 esperó a HU-04 desde el 9 oct. Tiene el motivo en el CSV, pero ninguna tarjeta se marcó `blocked` | `registro_flujo.csv`, Issues |
| Fechas del flujo | Solo HU-05 y HU-06 registraron movimientos. HU-02 y HU-03 se integraron sin fechas | `registro_flujo.csv` |

## Seguimiento de la mejora del Sprint 1

| Indicador acordado | Meta | Resultado |
|---|---|---|
| Historias del Sprint 1 cerradas al final del Sprint 2 | 4 de 4 | **1 de 4** (HU-05) |
| Historias del Sprint 2 en Done | ≥ 2 | **0** |
| Movimientos de tarjeta con fecha en el CSV | 100 % | **Parcial**: Miguel registró todas las suyas; HU-02 y HU-03, ninguna |

**Lectura:** la mejora se aplicó solo en parte. Donde se registraron fechas (HU-05, HU-06) el avance se ve y se puede medir; donde no, el trabajo terminado no cuenta como Done. La revisión de bloqueos en la Daily no evitó que HU-04, la primera historia en el orden de pull, quedara sin empezar.

## ¿Qué funcionó?

- **HU-05 y HU-06 se probaron a fondo**: pruebas automáticas, MySQL real y navegador, con resultados registrados en `casos_prueba.md`.
- **Keyla integró HU-02 y HU-03 en un solo día** gracias a que el backend y los casos de ejemplo ya estaban listos.
- **Un PR por historia** permitió ver en el historial quién hizo qué y cuándo.
- **Los repositorios en memoria** dejaron construir HU-06 sin esperar la asignación real.

## ¿Qué no funcionó?

- **Se repitió el problema del Sprint 1: el camino crítico no avanzó.** HU-04 era la más pequeña y la primera del orden de pull porque desbloqueaba HU-06 y HU-07, y no se empezó en el timebox.
- **Todo el trabajo llegó al final.** Los PR de código se fusionaron la noche del viernes 9, sin margen para probar el flujo completo con MySQL (tarea T2-15).
- **HU-07 no tuvo actividad ni aviso.** No hubo rama, comentario ni marca `blocked`, así que el equipo no pudo reaccionar.
- **Las historias integradas no se cerraron.** HU-02 y HU-03 están en `main`, pero sin fechas ni Issues cerrados no cuentan en el Throughput.

## Evidencia

- Review del Sprint 2: [reviews/sprint-2.md](../reviews/sprint-2.md)
- Registro del flujo: [metricas/registro_flujo.csv](../metricas/registro_flujo.csv)
- Historial de commits y PR #18 a #30

## Mejora seleccionada

- **Problema:** las historias que desbloquean a otras se dejan para el final, y el trabajo se integra en bloque el último día, sin tiempo para probar ni cerrar.
- **Hipótesis:** si cada historia se integra en cuanto pasa sus pruebas y se cierra en el mismo momento, el trabajo terminado cuenta como Done y el sprint se puede probar antes de la Review.
- **Cambio:**
  1. **Historias abiertas en su sprint:** las historias pendientes de los sprints 1 y 2 las terminan sus responsables como trabajo de su sprint; no se mezclan con el Sprint 3 ni ocupan su capacidad.
  2. **Integrar el mismo día:** cada historia abre su PR en cuanto pasan sus pruebas, sin esperar a la tarde del cierre.
  3. **Cerrar al fusionar:** quien fusiona el PR anota la fecha Done en el CSV y cierra el Issue en el mismo momento.
  4. **Avisar bloqueos el mismo día:** si una historia no avanza en el día, se marca `blocked` con el motivo.
- **Indicador:** Throughput del Sprint 3 ≥ 2; todas las historias fusionadas con fecha Done en el CSV el mismo día; ningún PR de código fusionado después de las 18:00 del último día. Aparte, se sigue el cierre de HU-02, HU-03, HU-06 y HU-07 en sus sprints.
- **Responsable:** _completar_
- **Fecha de revisión:** Retrospectiva del Sprint 3, lunes 12 de octubre.
