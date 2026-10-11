# Sprint 3 — Planning

**Fechas del sprint:** sábado 10 – lunes 12 de octubre de 2026 (inicia el mismo día en que cierra el Sprint 2)
**Planning y refinamiento registrados:** domingo 11 de octubre
**Entrega final:** martes 13 de octubre
**Equipo:** Sebastian (@Seloga26), Keyla (@Keyla-Cartagena), Miguel (@miguelfsociety)

## Punto de partida

El Sprint 3 se planifica **sobre el resultado completo de los sprints 1 y 2**, como se hizo con el Sprint 2 respecto al Sprint 1. Se asume el flujo obligatorio del Taller funcionando de punta a punta y persistido en MySQL:

Registrar (HU-01) → ver en "Mis casos" (HU-02) y en la bandeja (HU-03) → asignarse (HU-04) → cambiar estado (HU-05) → registrar diagnóstico y solución (HU-06) → aprobar o devolver hasta **Cerrada** (HU-07) → consultar el historial (HU-08).

Las historias de esos sprints que siguen abiertas **no forman parte de este sprint ni ocupan su capacidad**: se terminan como historias de su sprint original, con sus responsables. Su estado se sigue en la [Review del Sprint 2](../reviews/sprint-2.md).

## Sprint Goal

> Un administrador encuentra casos con filtros, conoce el comportamiento del servicio con indicadores calculados sobre datos reales y gestiona las categorías de soporte; el solicitante consulta el detalle de su caso y la solución registrada.

**Demo al cierre** (lunes 12, tarde): sobre casos que recorrieron el flujo completo, filtrar por estado, tipo, área, categoría y prioridad; ver los indicadores con sus tiempos; crear y desactivar una categoría; y abrir como solicitante el detalle de un caso cerrado con su solución.

## Historias seleccionadas

| Historia | SP | Prioridad | Responsable (propuesto) | Ficha | Issue |
|---|---|---|---|---|---|
| HU-09 Filtrar casos | 3 | P2 | Keyla | [HU-09](../historias/HU-09.md) | #9 |
| HU-10 Indicadores del servicio | 5 | P2 | Sebastian | [HU-10](../historias/HU-10.md) | #10 |
| HU-11 Gestionar categorías | 3 | P2 | Miguel | [HU-11](../historias/HU-11.md) | #11 |
| HU-12 Detalle del caso y solución | 3 | P3 | Miguel | [HU-12](../historias/HU-12.md) | #12 |
| **Total** | **14** | | Sebastian 5 · Keyla 3 · Miguel 6 | | |

**Por qué este reparto:** cada uno sigue sobre el código que ya conoce. Keyla amplía con filtros el listado de casos que construyó en HU-02 y HU-03. Miguel reutiliza en HU-12 las atenciones de HU-06 y toma HU-11, que es independiente. Sebastian toma HU-10, la más grande, que lee las fechas que guardan HU-01, HU-04, HU-05 y HU-07.

## Orden de pull y dependencias

```
Keyla:     HU-09
Miguel:    HU-11 ─► HU-12
Sebastian: HU-10
```

- Las cuatro historias son independientes entre sí; solo dependen de código de los sprints 1 y 2.
- **HU-10** usa `fecha_asignacion` (HU-04), `fecha_inicio_atencion` (HU-05) y `fecha_cierre` (HU-07). Sus pruebas con MySQL fijan las fechas en la base temporal, así que no dependen del orden en que se cierren los casos.
- **HU-12** usa `atencionesRepository.listarPorCaso()` (HU-07). Mientras se desarrolla, el repositorio en memoria ya cumple ese contrato.
- **WIP del tablero:** En análisis 3, En atención 3, En validación 2 (sin cambios). Entran primero HU-09, HU-10 y HU-11; HU-12 entra cuando HU-11 pase a En validación.

## Tareas técnicas

| ID | Historia | Tarea | Capa | Responsable | Día |
|---|---|---|---|---|---|
| T3-01 | HU-09 | Validar y traducir los cinco filtros en `listarCasos.js` | Servicio | Keyla | Dom |
| T3-02 | HU-09 | Condiciones con parámetros en `casosRepository.listar()` y en el repositorio en memoria | Repositorio | Keyla | Dom |
| T3-03 | HU-09 | Pruebas CP-10, CP-29, CP-30, CP-31 (memoria y MySQL) | Pruebas | Keyla | Dom |
| T3-04 | HU-09 | Página `casos.html` con filtros y contador | Frontend | Keyla | Lun |
| T3-05 | HU-10 | `indicadoresRepository.contar()` y `promediarTiempos()` | Repositorio | Sebastian | Dom |
| T3-06 | HU-10 | Servicio `consultarIndicadores.js`: permiso, ceros del catálogo y redondeo | Servicio | Sebastian | Dom |
| T3-07 | HU-10 | Pruebas CP-32 a CP-35, con fechas controladas en MySQL | Pruebas | Sebastian | Dom |
| T3-08 | HU-10 | Página `indicadores.html` con tarjetas y barras CSS | Frontend | Sebastian | Lun |
| T3-09 | HU-11 | `categoriasRepository.listarTodas()`, `buscarPorId()`, `buscarAreaActivaPorId()`, `existeNombreEnArea()`, `crear()`, `actualizar()` | Repositorio | Miguel | Dom |
| T3-10 | HU-11 | Servicios de gestión + pruebas CP-36 a CP-39 | Servicio / pruebas | Miguel | Dom |
| T3-11 | HU-11 | Página `categorias.html` | Frontend | Miguel | Lun |
| T3-12 | HU-12 | Servicio `consultarDetalle.js` + pruebas CP-40 a CP-43 | Servicio / pruebas | Miguel | Lun |
| T3-13 | HU-12 | Página `detalle.html?id=` enlazada desde "Mis casos" y la bandeja | Frontend | Miguel | Lun |
| T3-14 | Todas | Prueba integrada del sprint con MySQL y resultados en `casos_prueba.md` | Pruebas | Los tres | Lun mediodía |
| T3-15 | Todas | Review y Retro del Sprint 3, métricas finales en `docs/metricas/README.md` | Documentación | Los tres | Lun tarde |
| T3-16 | Todas | Guion de la demo y presentación del 13 | Documentación | Los tres | Lun tarde |

## Contrato de API

| Método | Ruta | Historia | Cuerpo / parámetros | Respuestas |
|---|---|---|---|---|
| GET | `/api/casos` | HU-09 | `?estado=&tipo=&area_id=&categoria_id=&prioridad=` | 200 lista · 400 valor inválido |
| GET | `/api/indicadores` | HU-10 | `?usuario_id=` | 200 indicadores · 400 · 403 no es Administrador |
| GET | `/api/categorias/gestion` | HU-11 | `?usuario_id=` | 200 todas las categorías · 400 · 403 |
| POST | `/api/categorias` | HU-11 | `{ area_id, nombre, descripcion, usuario_id }` | 201 · 400 · 403 · 409 nombre repetido |
| PATCH | `/api/categorias/:id` | HU-11 | `{ nombre?, descripcion?, activa?, usuario_id }` | 200 · 400 · 403 · 404 · 409 |
| GET | `/api/casos/:id` | HU-12 | `?usuario_id=` | 200 caso con atenciones · 400 · 403 · 404 |

Las rutas de HU-10, HU-11 y HU-12 ya están conectadas a su servicio y al contenedor; responden 501 hasta que se implementen. HU-09 amplía la ruta existente.

## Archivos por historia

| Historia | Servicio | Repositorio | Pruebas | Frontend |
|---|---|---|---|---|
| HU-09 | `services/casos/listarCasos.js` | `casosRepository.listar()` | `tests/services/listarCasos.test.js` | `casos.html` |
| HU-10 | `services/indicadores/consultarIndicadores.js` | `indicadoresRepository.js` | `tests/services/consultarIndicadores.test.js` | `indicadores.html` |
| HU-11 | `services/catalogos/listarCategoriasGestion.js`, `agregarCategoria.js`, `actualizarCategoria.js` | `categoriasRepository.js` | `tests/services/gestionarCategorias.test.js` | `categorias.html` |
| HU-12 | `services/casos/consultarDetalle.js` | `casosRepository.buscarPorId()`, `atencionesRepository.listarPorCaso()` | `tests/services/consultarDetalle.test.js` | `detalle.html` |

En `public/index.html` cada responsable agrega el enlace de su página al menú.

## Calendario

| Día | Actividad |
|---|---|
| Sáb 10 | **Inicio del Sprint 3** (cierre del Sprint 2 ese mismo día) |
| Dom 11 | **Sprint Planning y refinamiento** (este documento): HU-09 a HU-12 a **Ready**. HU-09, HU-10 y HU-11 a En análisis; backend y pruebas con repositorios en memoria |
| Lun 12 | **Daily**. Frontends y HU-12. **Mediodía:** prueba integrada con MySQL (T3-14). **Tarde:** Sprint Review (demo) y Retrospective con las métricas de los tres sprints |
| Mar 13 | **Entrega final y presentación** |

## Definition of Done del sprint

Además de la DoD general ([scrumban.md](../scrumban.md)): las cuatro historias se demuestran sobre casos reales en MySQL que recorrieron el flujo completo, y los casos CP-10 y CP-29 a CP-43 tienen su resultado real registrado.

## Riesgos

| Riesgo | Plan |
|---|---|
| Un día y medio de desarrollo para 14 SP | Plan de contingencia de [scrumban.md](../scrumban.md): se recorta primero HU-12 y luego HU-11; HU-09 y HU-10 no se recortan |
| Todo se integra el último día otra vez | Mejora de la Retro del Sprint 2: un PR en cuanto pasan las pruebas y ningún PR de código después de las 18:00 del lunes |
| HU-09 y HU-12 tocan archivos de casos (`listarCasos.js`, `casosRoutes.js`) | Cambios en zonas distintas, PR cortos y `git pull` antes de cada PR |
| No se registran fechas del flujo | Quien mueve la tarjeta anota la fecha ese mismo día |
