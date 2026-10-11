# Sprint 3 — Planning

**Fechas del sprint:** sábado 10 – lunes 12 de octubre de 2026 (inicia el mismo día en que cierra el Sprint 2)
**Planning y refinamiento registrados:** domingo 11 de octubre
**Entrega final:** martes 13 de octubre
**Equipo:** Sebastian (@Seloga26), Keyla (@Keyla-Cartagena), Miguel (@miguelfsociety)

## Punto de partida

Al empezar este planning, `main` tiene el registro (HU-01), "Mis casos" (HU-02), la bandeja (HU-03), la asignación (HU-04), el cambio de estado (HU-05), el registro de atención (HU-06) y el historial (HU-08), con 195 pruebas pasando contra MySQL 8.0.46 y Chrome.

Quedan abiertas de sprints anteriores, con sus mismos responsables:

| Historia | Sprint | Responsable | Qué falta |
|---|---|---|---|
| HU-02 Mis casos | 1 | Keyla | Registrar fecha Done y cerrar el Issue #2 |
| HU-03 Bandeja | 1 | Keyla | Registrar fecha Done y cerrar el Issue #3 |
| HU-06 Registrar atención | 2 | Miguel | Cerrar: CP-19 ya pasa con HU-04 integrada. Fecha Done, quitar el bloqueo del CSV y cerrar el Issue #6 |
| **HU-07 Aprobar o devolver** | 2 | Keyla | **Toda la historia.** Sin ella ningún caso llega a Cerrada y no se demuestra el flujo obligatorio |

## Sprint Goal

> Un administrador encuentra casos con filtros y conoce el comportamiento del servicio con indicadores calculados sobre datos reales; además, gestiona las categorías y el solicitante consulta el detalle y la solución de su caso.

**Demo al cierre** (lunes 12, tarde): el flujo completo del Taller hasta **Cerrada** (requiere HU-07), después los filtros sobre esos casos y los indicadores con sus tiempos.

## Historias seleccionadas

| Historia | SP | Prioridad | Responsable (propuesto) | Ficha | Issue |
|---|---|---|---|---|---|
| HU-09 Filtrar casos | 3 | P2 | Sebastian | [HU-09](../historias/HU-09.md) | #9 |
| HU-10 Indicadores del servicio | 5 | P2 | Sebastian | [HU-10](../historias/HU-10.md) | #10 |
| HU-11 Gestionar categorías | 3 | P2 | Miguel | [HU-11](../historias/HU-11.md) | #11 |
| HU-12 Detalle del caso y solución | 3 | P3 | Miguel | [HU-12](../historias/HU-12.md) | #12 |
| **Total** | **14** | | Sebastian 8 · Miguel 6 · Keyla 0 | | |

**Por qué este reparto:** Keyla dedica el sprint a HU-07, que pesa 5 SP y es la única pieza que falta del flujo obligatorio. Miguel primero cierra HU-06 (minutos de trabajo) y luego toma HU-11 y HU-12. Sebastian no tiene historias abiertas y toma las dos que exige el Taller como módulos obligatorios (filtros e indicadores).

## Orden de pull y dependencias

```
Keyla:     HU-02/HU-03 (cerrar) ─► HU-07 ──────────────┐
Miguel:    HU-06 (cerrar) ─► HU-11 ─► HU-12            ├─► Demo del flujo completo (lun 12)
Sebastian: HU-09 ─► HU-10 (tiempos de cierre ◄── HU-07)┘
```

- **Política de la Retro del Sprint 2 (WIP personal de 1):** nadie toma una historia del Sprint 3 mientras tenga una abierta de un sprint anterior.
- **HU-10 depende de HU-07** solo para los tiempos con `fecha_cierre`. Los conteos y el tiempo hasta la asignación se construyen sin esperar; las pruebas de tiempos fijan las fechas en la base temporal.
- **HU-12 y HU-07 comparten `atencionesRepository.listarPorCaso()`** (tarea T2-09 de HU-07). Quien llegue primero lo implementa con el contrato del repositorio en memoria y avisa en la Daily.
- **WIP del tablero:** En análisis 3, En atención 3, En validación 2 (sin cambios). Con HU-07, HU-09 y HU-11 en curso, HU-10 y HU-12 esperan a que alguna avance.
- **Si HU-07 no está en En validación el lunes a mediodía**, Sebastian y Miguel dejan de tomar historias nuevas y ayudan a terminarla (política "WIP alcanzado: primero ayudar a terminar").

## Tareas técnicas

| ID | Historia | Tarea | Capa | Responsable | Día |
|---|---|---|---|---|---|
| T3-01 | HU-09 | Validar y traducir los cinco filtros en `listarCasos.js` | Servicio | Sebastian | Dom |
| T3-02 | HU-09 | Condiciones con parámetros en `casosRepository.listar()` y en el repositorio en memoria | Repositorio | Sebastian | Dom |
| T3-03 | HU-09 | Pruebas CP-10, CP-29, CP-30, CP-31 (memoria y MySQL) | Pruebas | Sebastian | Dom |
| T3-04 | HU-09 | Página `casos.html` con filtros y contador | Frontend | Sebastian | Dom |
| T3-05 | HU-10 | `indicadoresRepository.contar()` y `promediarTiempos()` | Repositorio | Sebastian | Lun |
| T3-06 | HU-10 | Servicio `consultarIndicadores.js`: permiso, ceros del catálogo y redondeo | Servicio | Sebastian | Lun |
| T3-07 | HU-10 | Pruebas CP-32 a CP-35, con fechas controladas en MySQL | Pruebas | Sebastian | Lun |
| T3-08 | HU-10 | Página `indicadores.html` con tarjetas y barras CSS | Frontend | Sebastian | Lun |
| T3-09 | HU-11 | `categoriasRepository.listarTodas()`, `buscarPorId()`, `buscarAreaActivaPorId()`, `existeNombreEnArea()`, `crear()`, `actualizar()` | Repositorio | Miguel | Dom |
| T3-10 | HU-11 | Servicios de gestión + pruebas CP-36 a CP-39 | Servicio / pruebas | Miguel | Dom |
| T3-11 | HU-11 | Página `categorias.html` | Frontend | Miguel | Lun |
| T3-12 | HU-12 | Servicio `consultarDetalle.js` + pruebas CP-40 a CP-43 | Servicio / pruebas | Miguel | Lun |
| T3-13 | HU-12 | Página `detalle.html?id=` enlazada desde "Mis casos" y la bandeja | Frontend | Miguel | Lun |
| T3-14 | Todas | Prueba del flujo completo con MySQL y resultados en `casos_prueba.md` | Pruebas | Los tres | Lun mediodía |
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

Las rutas de HU-10, HU-11 y HU-12 quedan conectadas a su servicio y al contenedor; responden 501 hasta que se implementen. HU-09 amplía la ruta existente.

## Archivos por historia

| Historia | Servicio | Repositorio | Pruebas | Frontend |
|---|---|---|---|---|
| HU-09 | `services/casos/listarCasos.js` | `casosRepository.listar()` | `tests/services/listarCasos.test.js` | `casos.html` |
| HU-10 | `services/indicadores/consultarIndicadores.js` | `indicadoresRepository.js` (nuevo) | `tests/services/consultarIndicadores.test.js` | `indicadores.html` |
| HU-11 | `services/catalogos/listarCategoriasGestion.js`, `agregarCategoria.js`, `actualizarCategoria.js` | `categoriasRepository.js` | `tests/services/gestionarCategorias.test.js` | `categorias.html` |
| HU-12 | `services/casos/consultarDetalle.js` | `casosRepository.buscarPorId()`, `atencionesRepository.listarPorCaso()` | `tests/services/consultarDetalle.test.js` | `detalle.html` |

En `public/index.html` cada responsable agrega el enlace de su página al menú.

## Calendario

| Día | Actividad |
|---|---|
| Sáb 10 | **Inicio del Sprint 3** (cierre del Sprint 2 ese mismo día) |
| Dom 11 | Review y Retro del Sprint 2 registradas. **Sprint Planning y refinamiento** (este documento): HU-09 a HU-12 a **Ready**. Cierre de HU-02, HU-03 y HU-06. Inicio de HU-07, HU-09 y HU-11 |
| Lun 12 | **Daily** (primero HU-07). HU-10 y HU-12. **Mediodía:** prueba del flujo completo con MySQL (T3-14). **Tarde:** Sprint Review (demo) y Retrospective con las métricas de los tres sprints |
| Mar 13 | **Entrega final y presentación** |

## Definition of Done del sprint

Además de la DoD general ([scrumban.md](../scrumban.md)): el flujo completo del Taller se demuestra de Registrar a Cerrada con datos en MySQL, los indicadores se calculan sobre esos datos reales y los casos CP-29 a CP-43 tienen su resultado real registrado.

## Riesgos

| Riesgo | Plan |
|---|---|
| HU-07 no se termina y no se demuestra el cierre | Prioridad sobre todo el Sprint 3; ayuda del equipo si no está en validación el lunes a mediodía |
| Un día y medio de desarrollo para 14 SP más HU-07 | Plan de contingencia: se recorta primero HU-12 y luego HU-11; HU-09 y HU-10 no se recortan |
| HU-12 y HU-07 tocan `atencionesRepository` | El contrato ya está fijado en el repositorio en memoria; quien llegue primero lo implementa y avisa |
| Todo se integra el último día otra vez | Mejora de la Retro del Sprint 2: un PR en cuanto pasan las pruebas y ningún PR de código después de las 18:00 del lunes |
