# Casos de prueba

Registrar el **resultado real** y la fecha al ejecutar cada caso. Si falla, crear el defecto en [defectos.md](defectos.md).

| ID | Historia | Tipo | Área | Caso | Resultado esperado | Resultado obtenido | Estado | Fecha | Ejecutó |
|---|---|---|---|---|---|---|---|---|---|
| CP-01 | HU-01 | Incidente | Red | Registrar Wi-Fi sin conexión | Se crea y persiste el incidente | Pasa (`tests/services/registrarCaso.test.js`) | OK | 2026-10-06 | Sebastian |
| CP-02 | HU-01 | Solicitud | Software | Solicitar instalación de software | Se crea y persiste la solicitud | Pasa (`tests/services/registrarCaso.test.js`) | OK | 2026-10-06 | Sebastian |
| CP-03 | HU-01 | Incidente | Cuentas | Registrar sin descripción | El sistema rechaza el registro | Pasa (`tests/services/registrarCaso.test.js`) | OK | 2026-10-06 | Sebastian |
| CP-04 | HU-05 | Incidente | Red | Transición válida | Cambia estado y crea historial | | Pendiente | | |
| CP-05 | HU-05 | Solicitud | Software | Transición inválida | Sistema impide la operación | | Pendiente | | |
| CP-06 | HU-04 | Ambos | Todas | Asignar agente | Se registra responsable y fecha | | Pendiente | | |
| CP-07 | HU-06 | Ambos | Todas | Registrar diagnóstico/solución | La atención queda almacenada | | Pendiente | | |
| CP-08 | HU-07 | Ambos | Todas | Devolver desde validación | Vuelve a atención y registra historial | | Pendiente | | |
| CP-09 | HU-07 | Ambos | Todas | Aprobar solución | Caso queda Cerrado y registra fecha | | Pendiente | | |
| CP-10 | HU-09 | Ambos | Todas | Filtrar por prioridad/área/tipo | Solo aparecen coincidencias | | Pendiente | | |

## Casos adicionales del equipo (mínimo 5)

| ID | Historia | Tipo | Área | Caso | Resultado esperado | Resultado obtenido | Estado | Fecha | Ejecutó |
|---|---|---|---|---|---|---|---|---|---|
| CP-11 | HU-01 | Incidente | Hardware | Registrar con una categoría inexistente o inactiva | El sistema rechaza el registro y no guarda nada | Pasa (`tests/services/registrarCaso.test.js`) | OK | 2026-10-06 | Sebastian |
| CP-12 | HU-02 | Ambos | Todas | Ana consulta "Mis casos" cuando ella tiene 2 casos y Bruno 1 | Solo aparecen los 2 casos de Ana, el más reciente primero | | Pendiente | | |
| CP-13 | HU-03 | Ambos | Todas | Abrir la bandeja con casos P1, P2, P3 y uno Cerrada | No aparece el Cerrada; orden P1→P3 y, en igual prioridad, el más antiguo primero | | Pendiente | | |
| CP-14 | HU-05 | Incidente | Red | Cambiar el estado de un caso Cerrada | El sistema lo rechaza y no crea historial | | Pendiente | | |
| CP-15 | HU-05 | Solicitud | Software | Un usuario Solicitante intenta cambiar el estado | El sistema lo rechaza (403) | | Pendiente | | |
| CP-16 | HU-01 | Solicitud | Cuentas | Registrar un caso válido y revisar la tabla historial | Existe el evento "Caso registrado" con estado nuevo Pendiente | Pasa (`tests/services/registrarCaso.test.js`) | OK | 2026-10-06 | Sebastian |
| CP-17 | HU-04 | Incidente | Red | Diego intenta asignarse un caso ya asignado a Carla | 409; el caso sigue asignado a Carla | | Pendiente | | |
| CP-18 | HU-04 | Solicitud | Software | Un Solicitante intenta asignarse un caso | 403; no cambia nada | | Pendiente | | |
| CP-19 | HU-04 | Incidente | Hardware | Diego intenta cambiar el estado de un caso asignado a Carla | 403; el estado no cambia | | Pendiente | | |
| CP-20 | HU-06 | Incidente | Red | Diego registra la atención de un caso asignado a Carla | 403; no se guarda la atención | | Pendiente | | |
| CP-21 | HU-06 | Solicitud | Cuentas | Registrar atención de un caso En análisis | 409; no se guarda la atención | | Pendiente | | |
| CP-22 | HU-06 | Incidente | Plataformas | Pasar a En validación un caso En atención sin atenciones | 409; el estado no cambia | | Pendiente | | |

Ideas para los siguientes sprints: cerrar un caso sin solución, registrar atención con un agente no asignado, indicadores con cero casos.
