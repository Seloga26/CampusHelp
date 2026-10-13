# Sprint Review — Sprint 3

**Sprint:** sábado 10 – lunes 12 de octubre de 2026  ·  **Review registrada:** lunes 12 de octubre  ·  **Asistentes:** _completar_

**Sprint Goal:** un administrador encuentra casos con filtros, conoce el comportamiento del servicio con indicadores calculados sobre datos reales y gestiona las categorías de soporte; el solicitante consulta el detalle de su caso y la solución registrada.

**¿Se cumplió?** **Sí.** Las cuatro historias del sprint (HU-09, HU-10, HU-11 y HU-12) están fusionadas en `main` y con su Issue cerrado. Además, durante el sprint se cerraron las siete historias que seguían abiertas de los sprints 1 y 2, y el flujo obligatorio del Taller se puede recorrer completo, de Registrar a Cerrada.

> Los datos de este documento salen del repositorio (commits, PR, Issues y archivos de `docs/`). Las secciones marcadas con _completar_ se llenan en la reunión.

## Historias del Sprint 3

| Historia | SP | Responsable | Done | Evidencia | Resultado |
|---|---|---|---|---|---|
| HU-09 Filtrar casos | 3 | Keyla | 12 oct | PR #46, #47 y #48; Issue #9; `casos.html` | Terminada. CP-10 y CP-29 a CP-31 ejecutados el 12 oct con API y MySQL 8.0.46 (sin prueba en navegador) |
| HU-10 Indicadores del servicio | 5 | Sebastian | 11 oct | PR #38 y #39; Issue #10; CP-32 a CP-35 con MySQL 8.0.46 | Terminada |
| HU-11 Gestionar categorías | 3 | Miguel | 12 oct | PR #43 y #44; Issue #11; CP-36 a CP-39 con MySQL 8.0.46 y Chrome | Terminada |
| HU-12 Detalle del caso y solución | 3 | Miguel | 12 oct | PR #45; Issue #12; CP-40 a CP-43 con MySQL 8.0.46 y Chrome | Terminada |

**Throughput del Sprint 3:** 4 historias Done · **Puntos terminados:** 14 de 14.

## Historias de sprints anteriores cerradas durante el Sprint 3

Siguen perteneciendo a su sprint original; su Lead Time refleja el retraso.

| Historia | Sprint | Responsable | Done | Evidencia |
|---|---|---|---|---|
| HU-04 Asignarme un caso | 2 | Sebastian | 11 oct | PR #31; CP-06, CP-17, CP-18 y CP-19 |
| HU-08 Consultar el historial | 2 | Sebastian | 11 oct | PR #32; CP-26, CP-27 y CP-28 |
| HU-01 Registrar caso | 1 | Sebastian | 11 oct | PR #33; DEF-02 y DEF-03 corregidos |
| HU-06 Registrar diagnóstico y solución | 2 | Miguel | 12 oct | PR #42; recorrido con asignación real en Chrome y MySQL 8.0.46 |
| HU-07 Aprobar o devolver una solución | 2 | Keyla | 12 oct | PR #40; Issue #7; CP-08, CP-09 y CP-23 a CP-25 ejecutados el 12 oct con API y MySQL 8.0.46 (sin prueba en navegador) |
| HU-02 Consultar mis casos | 1 | Keyla | 12 oct | PR #24 (fusionado el 9 oct); Issue #2; CP-12 |
| HU-03 Bandeja de casos pendientes | 1 | Keyla | 12 oct | PR #25 (fusionado el 9 oct); Issue #3; CP-13 |

**Estado final del backlog:** 12 de 12 historias en Done (48 SP).

## Qué se puede demostrar (estado de `main` al cierre)

1. **Flujo obligatorio completo:** registrar un caso → verlo en "Mis casos" y en la bandeja → asignarse → En análisis → En atención → registrar diagnóstico y solución → En validación → aprobar (Cerrada) o devolver (vuelve a En atención) → consultar el historial.
2. **Filtros (HU-09):** "Todos los casos" con filtros por estado, tipo, prioridad, área y categoría.
3. **Indicadores (HU-10):** conteos y tiempos promedio calculados sobre los casos de la base, solo para el administrador.
4. **Categorías (HU-11):** crear, editar y desactivar categorías, con validación de nombre repetido en el área.
5. **Detalle (HU-12):** el solicitante abre el detalle de su caso con la solución registrada.

**Pruebas automáticas al cierre:** con MySQL 8.0.46, 248 pruebas, 241 aprobadas, 0 fallidas y 7 omitidas (las de navegador, que necesitan Chrome). Sin MySQL: 208 pruebas, 192 aprobadas y 16 omitidas.

## Pendientes antes de la entrega

| Pendiente | Responsable | Por qué importa |
|---|---|---|
| Probar HU-07 y HU-09 en navegador (validación y filtros en Chrome) | Keyla | Sus casos se ejecutaron por API y MySQL; falta comprobar las pantallas, incluido el mensaje de CP-31 |
| Prueba integrada del flujo completo con MySQL (T3-14) | Los tres | Es el recorrido de la demo y nadie lo ha corrido con todas las historias juntas |
| Confirmar las fechas completadas de HU-02, HU-03, HU-07 y HU-09 | Keyla | Se tomaron de GitHub, no del tablero; ver [métricas](../metricas/README.md) |

## Retroalimentación y cambios al backlog

- No quedan historias en el backlog. Las ideas que surjan en la demo se registran como mejoras futuras, fuera del alcance del MVP.
- _completar con comentarios de la reunión_

## Evidencia

- Commit de la demo: `main` en `7a9e885` (PR #48)
- Registro del flujo: [metricas/registro_flujo.csv](../metricas/registro_flujo.csv)
- Métricas: [metricas/README.md](../metricas/README.md)
- Guion de la demo: [demo.md](demo.md)
