# Retrospectiva — Sprint 3

**Sprint:** sábado 10 – lunes 12 de octubre de 2026  ·  **Retro registrada:** lunes 12 de octubre  ·  **Asistentes:** _completar_

**Sprint Goal:** filtros, indicadores, gestión de categorías y detalle del caso. → **Cumplido** (4 de 4 historias Done, 14 de 14 SP).

> Los datos salen del repositorio. Las observaciones son una **propuesta basada en esa evidencia**: el equipo las confirma, corrige o completa en la reunión.

## Datos

| Métrica | Valor | Fuente |
|---|---|---|
| Throughput del Sprint 3 | **4** historias Done (14 de 14 SP) | [Review](../reviews/sprint-3.md) |
| Historias de sprints anteriores cerradas | **7** (HU-01, HU-02, HU-03, HU-04, HU-06, HU-07 y HU-08) | Issues #1 a #8 |
| Lead Time prom. (historias del sprint) | 0,75 días | `registro_flujo.csv` |
| Cycle Time prom. (historias del sprint) | 0 días: las cuatro empezaron y terminaron el mismo día | `registro_flujo.csv` |
| WIP máximo | 7 historias el 11 y el 12 oct | `registro_flujo.csv` |
| En validación | 3 historias abiertas del 9 al 11 oct (límite: 2) | `registro_flujo.csv` |
| Defectos | 2 (DEF-02 y DEF-03), encontrados y corregidos el 11 oct al cerrar HU-01 | `docs/pruebas/defectos.md` |
| Bloqueos | 1: HU-06, 2 días, heredado del Sprint 2 y resuelto el 11 oct con HU-04 | `registro_flujo.csv` |
| Hora de integración | 7 de los 9 PR del lunes 12 se fusionaron después de las 18:00 (#42 a #48) | PR #40 a #48 |
| Pruebas automáticas | 206 pruebas, 0 fallidas | `npm test` |

## Seguimiento de la mejora del Sprint 2

| Indicador acordado | Meta | Resultado |
|---|---|---|
| Throughput del Sprint 3 | ≥ 2 | **4** ✅ |
| Historias de los sprints 1 y 2 cerradas en su sprint | HU-02, HU-03, HU-06 y HU-07 | **Las cuatro**, el 12 oct ✅ |
| Fecha Done en el CSV el mismo día de la fusión | Todas | **Parcial**: Sebastian y Miguel sí; las de Keyla se completaron después a partir de GitHub |
| Ningún PR de código fusionado después de las 18:00 del último día | 0 | **No cumplido**: HU-11 (19:20), HU-12 (19:35) y HU-09 (21:29) |

**Lectura:** la mejora funcionó en lo principal. Cerrar cada historia en cuanto se fusiona llevó el Throughput de 0 a 4 y dejó el backlog sin atrasos. La parte de integrar temprano no se cumplió: el último día volvió a concentrar el trabajo en la noche.

## ¿Qué funcionó?

- **Cerrar al fusionar.** Sebastian y Miguel anotaron la fecha Done y cerraron el Issue en el mismo momento, así que su avance se vio y contó en las métricas.
- **Empezar por el camino crítico.** HU-04 se hizo primero el domingo y desbloqueó de inmediato a HU-06; con HU-07 el flujo llegó a Cerrada.
- **Historias independientes.** El planning del Sprint 3 separó las historias por responsable y sin dependencias entre ellas, y cada uno trabajó sin esperar a los demás.
- **Pruebas con MySQL real y navegador** en HU-01, HU-04, HU-06, HU-08, HU-10, HU-11 y HU-12. Al cerrar HU-01 así aparecieron DEF-02 y DEF-03, que las pruebas en memoria no detectaban.

## ¿Qué no funcionó?

- **La integración volvió a quedar para la noche del último día**, sin margen para la prueba integrada con MySQL antes de la Review (T3-14).
- **Las historias de Keyla se cerraron sin registro.** Los Issues se cerraron, pero sin fechas en el CSV ni resultados en `casos_prueba.md` para HU-07 y HU-09; las fechas se reconstruyeron desde GitHub.
- **El límite de WIP de En validación no se respetó.** HU-02 y HU-03 estuvieron fusionadas tres días sin cerrarse, y con HU-06 bloqueada la columna tuvo 3 historias.
- **Nadie marcó `blocked`.** El bloqueo de HU-06 quedó en el CSV, pero no en el tablero.

## Mejora para un próximo proyecto

- **Problema:** el trabajo se integra en bloque al final del sprint, y las historias se cierran sin dejar el registro que exige la DoD.
- **Hipótesis:** si la tarjeta solo puede pasar a Done con el resultado de sus casos de prueba y su fecha en el CSV, y cada historia se integra en cuanto pasa sus pruebas, el equipo llega a la Review con todo probado y las métricas completas.
- **Cambio:**
  1. Checklist en el PR: casos de prueba con resultado, fecha en el CSV e Issue cerrado. Sin los tres, no se fusiona.
  2. Fecha límite de integración: mediodía del último día del sprint; la tarde queda para la prueba integrada.
  3. Revisar el WIP de En validación en cada Daily.
- **Indicador:** 100 % de las historias Done con casos registrados y fechas a tiempo; 0 PR de código después del mediodía del último día.
- **Responsable:** _completar_

## Evidencia

- Review del Sprint 3: [reviews/sprint-3.md](../reviews/sprint-3.md)
- Métricas y comparación entre sprints: [metricas/README.md](../metricas/README.md)
- Registro del flujo: [metricas/registro_flujo.csv](../metricas/registro_flujo.csv)
