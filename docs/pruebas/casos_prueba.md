# Casos de prueba

Registrar el **resultado real** y la fecha al ejecutar cada caso. Si falla, crear el defecto en [defectos.md](defectos.md).

| ID | Historia | Tipo | Área | Caso | Resultado esperado | Resultado obtenido | Estado | Fecha | Ejecutó |
|---|---|---|---|---|---|---|---|---|---|
| CP-01 | HU-01 | Incidente | Red | Registrar Wi-Fi sin conexión | Se crea y persiste el incidente | Pasa (`tests/services/registrarCaso.test.js`) | OK | 2026-10-06 | Sebastian |
| CP-02 | HU-01 | Solicitud | Software | Solicitar instalación de software | Se crea y persiste la solicitud | Pasa (`tests/services/registrarCaso.test.js`) | OK | 2026-10-06 | Sebastian |
| CP-03 | HU-01 | Incidente | Cuentas | Registrar sin descripción | El sistema rechaza el registro | Pasa (`tests/services/registrarCaso.test.js`) | OK | 2026-10-06 | Sebastian |
| CP-04 | HU-05 | Incidente | Red | Transición válida | Cambia estado y crea historial | Botón en bandeja: HTTP 200, estado e historial con autor; doble clic genera un solo cambio en MySQL 8.0.46 | Pasa (Chrome y MySQL real) | 2026-10-09 | Codex |
| CP-05 | HU-05 | Solicitud | Software | Transición inválida | Sistema impide la operación | HTTP 409; estado e historial intactos en MySQL 8.0.46 | Pasa (MySQL real) | 2026-10-09 | Codex |
| CP-06 | HU-04 | Ambos | Todas | Asignar agente | Se registra responsable y fecha | | Pendiente | | |
| CP-07 | HU-06 | Ambos | Todas | Registrar diagnóstico/solución | La atención queda almacenada | Formulario con doble clic: un solo POST 201, atención e historial con autor/fecha, estado conservado y segunda atención sin modificar la primera | Pasa (Chrome y MySQL 8.0.46) | 2026-10-09 | Codex |
| CP-08 | HU-07 | Ambos | Todas | Devolver desde validación | Vuelve a atención y registra historial | | Pendiente | | |
| CP-09 | HU-07 | Ambos | Todas | Aprobar solución | Caso queda Cerrado y registra fecha | | Pendiente | | |
| CP-10 | HU-09 | Ambos | Todas | Filtrar por prioridad/área/tipo | Solo aparecen coincidencias | | Pendiente | | |

## Casos adicionales del equipo (mínimo 5)

| ID | Historia | Tipo | Área | Caso | Resultado esperado | Resultado obtenido | Estado | Fecha | Ejecutó |
|---|---|---|---|---|---|---|---|---|---|
| CP-11 | HU-01 | Incidente | Hardware | Registrar con una categoría inexistente o inactiva | El sistema rechaza el registro y no guarda nada | Pasa (`tests/services/registrarCaso.test.js`) | OK | 2026-10-06 | Sebastian |
| CP-12 | HU-02 | Ambos | Todas | Ana consulta "Mis casos" cuando ella tiene 2 casos y Bruno 1 | Solo aparecen los 2 casos de Ana, el más reciente primero | Pasa (`tests/services/listarCasos.test.js`, `tests/api/listarCasos.test.js`) | OK | 2026-10-09 | Keyla |
| CP-13 | HU-03 | Ambos | Todas | Abrir la bandeja con casos P1, P2, P3 y uno Cerrada | No aparece el Cerrada; orden P1→P3 y, en igual prioridad, el más antiguo primero | Pasa (`tests/services/listarCasos.test.js`, `tests/api/listarCasos.test.js`) | OK | 2026-10-09 | Keyla |
| CP-14 | HU-05 | Incidente | Red | Cambiar el estado de un caso Cerrada | El sistema lo rechaza y no crea historial | HTTP 409; caso cerrado intacto, sin historial; ausente en bandeja | Pasa (Chrome y MySQL real) | 2026-10-09 | Codex |
| CP-15 | HU-05 | Solicitud | Software | Un usuario Solicitante intenta cambiar el estado | El sistema lo rechaza (403) | HTTP 403; estado e historial intactos; selector de bandeja solo lista agentes | Pasa (Chrome y MySQL real) | 2026-10-09 | Codex |
| CP-16 | HU-01 | Solicitud | Cuentas | Registrar un caso válido y revisar la tabla historial | Existe el evento "Caso registrado" con estado nuevo Pendiente | Pasa (`tests/services/registrarCaso.test.js`) | OK | 2026-10-06 | Sebastian |
| CP-17 | HU-04 | Incidente | Red | Diego intenta asignarse un caso ya asignado a Carla | 409; el caso sigue asignado a Carla | | Pendiente | | |
| CP-18 | HU-04 | Solicitud | Software | Un Solicitante intenta asignarse un caso | 403; no cambia nada | | Pendiente | | |
| CP-19 | HU-04 | Incidente | Hardware | Diego intenta cambiar el estado de un caso asignado a Carla | 403; el estado no cambia | | Pendiente | | |
| CP-20 | HU-06 | Incidente | Red | Diego registra la atención de un caso asignado a Carla | 403; no se guarda la atención | Formulario muestra 403 y conserva los textos; sin escrituras; reintento válido al seleccionar Carla | Pasa (Chrome y MySQL 8.0.46) | 2026-10-09 | Codex |
| CP-21 | HU-06 | Solicitud | Cuentas | Registrar atención de un caso En análisis | 409; no se guarda la atención | Formulario muestra 409; estado, atención e historial intactos en MySQL | Pasa (Chrome y MySQL 8.0.46) | 2026-10-09 | Codex |
| CP-22 | HU-06 | Incidente | Plataformas | Pasar a En validación un caso En atención sin atenciones | 409; el estado no cambia | Bandeja muestra 409 sin solución; atención de otro caso no permite validar; se envía tras registrar atención propia | Pasa (Chrome y MySQL 8.0.46) | 2026-10-09 | Codex |
| CP-23 | HU-07 | Incidente | Red | Un Agente intenta aprobar una solución | 403; no cambia nada | | Pendiente | | |
| CP-24 | HU-07 | Solicitud | Software | Aprobar un caso que está En atención | 409; el estado no cambia | | Pendiente | | |
| CP-25 | HU-07 | Incidente | Hardware | Devolver sin motivo o con menos de 10 caracteres | 400; el caso sigue En validación | | Pendiente | | |
| CP-26 | HU-08 | Incidente | Red | Consultar el historial de un caso registrado, asignado y en análisis | 3 eventos en orden cronológico con usuario y fecha | | Pendiente | | |
| CP-27 | HU-08 | Solicitud | Cuentas | Bruno consulta el historial de un caso de Ana | 403 | | Pendiente | | |
| CP-28 | HU-08 | Ambos | Todas | Consultar el historial de un caso inexistente | 404 | | Pendiente | | |

Ideas para los siguientes sprints: cerrar un caso sin solución, registrar atención con un agente no asignado, indicadores con cero casos.

**Alcance de los resultados de HU-05:** pruebas HTTP contra Express y MySQL 8.0.46
en Docker, usando una base temporal eliminada al finalizar. Se verificaron también
concurrencia, rollback real y conservación del cambio tras reiniciar el servidor
HTTP y las conexiones. Véase [guía y evidencia de HU-05](HU-05.md).

HU-05 se revalidó con ADR-003 y MySQL real el 2026-10-06: suite completa de
73 pruebas aprobadas, sin fallos ni pruebas omitidas. La evidencia anterior del
2026-10-05 se conserva en la guía de HU-05.

HU-05 se integró en la bandeja y se revalidó el 2026-10-09: **119 pruebas
aprobadas, ninguna fallida ni omitida**, con MySQL 8.0.46 y Chrome. Incluye
el flujo de atención hasta validación, doble clic, agente seleccionado y
recarga fallida tras guardar. Las bases temporales y el perfil del navegador
se eliminaron; no se modificó `campushelp`. La asignación y CP-19 siguen en HU-04.

HU-06 se verificó en su rama local el 2026-10-07 con MySQL 8.0.46: **93 pruebas
aprobadas**, sin fallos ni omisiones en la suite completa. Las bases temporales
se eliminaron. Se comprobó también el formulario en Chrome con Express y
repositorios en memoria. El flujo desde la bandeja y la asignación siguen
pendientes de HU-03/HU-04; estos resultados no implican que HU-06 esté Done.
Véase [guía y evidencia de HU-06](HU-06.md).

HU-06 se revalidó el 2026-10-09 con una nueva suite de formulario en Chrome y
MySQL 8.0.46: **127 pruebas aprobadas, sin fallos ni omisiones** en la suite
completa. Se verificaron doble clic, conservación de textos ante errores,
rollback real y reintento, múltiples atenciones y envío desde bandeja a
validación. No se modificó `campushelp`. HU-06 pasa a En validación; permanece
abierta hasta demostrar el flujo desde la asignación real de HU-04.
