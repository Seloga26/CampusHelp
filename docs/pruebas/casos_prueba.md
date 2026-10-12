# Casos de prueba

Registrar el **resultado real** y la fecha al ejecutar cada caso. Si falla, crear el defecto en [defectos.md](defectos.md).

| ID | Historia | Tipo | Área | Caso | Resultado esperado | Resultado obtenido | Estado | Fecha | Ejecutó |
|---|---|---|---|---|---|---|---|---|---|
| CP-01 | HU-01 | Incidente | Red | Registrar Wi-Fi sin conexión | Se crea y persiste el incidente | Formulario: caso Pendiente con tipo, categoría, prioridad, solicitante y fecha en MySQL 8.0.46, evento "Caso registrado"; aparece en la bandeja; doble clic crea un solo caso (DEF-02) | Pasa (Chrome y MySQL real) | 2026-10-11 | Sebastian |
| CP-02 | HU-01 | Solicitud | Software | Solicitar instalación de software | Se crea y persiste la solicitud | Formulario: solicitud guardada en MySQL 8.0.46 y visible en "Mis casos"; sigue disponible tras reiniciar servidor y conexiones | Pasa (Chrome y MySQL real) | 2026-10-11 | Sebastian |
| CP-03 | HU-01 | Incidente | Cuentas | Registrar sin descripción | El sistema rechaza el registro | Vacía: el formulario no envía (`required`); con menos de 10 caracteres: HTTP 400 con mensaje, sin filas en MySQL y el texto escrito se conserva | Pasa (Chrome y MySQL real) | 2026-10-11 | Sebastian |
| CP-04 | HU-05 | Incidente | Red | Transición válida | Cambia estado y crea historial | Botón en bandeja: HTTP 200, estado e historial con autor; doble clic genera un solo cambio en MySQL 8.0.46 | Pasa (Chrome y MySQL real) | 2026-10-09 | Miguel |
| CP-05 | HU-05 | Solicitud | Software | Transición inválida | Sistema impide la operación | HTTP 409; estado e historial intactos en MySQL 8.0.46 | Pasa (MySQL real) | 2026-10-09 | Miguel |
| CP-06 | HU-04 | Ambos | Todas | Asignar agente | Se registra responsable y fecha | Botón Asignarme en bandeja: HTTP 200, `agente_id` y `fecha_asignacion` guardados, evento "Caso asignado", estado sin cambio; doble clic genera una sola asignación; dos agentes simultáneos: solo uno gana (MySQL 8.0.46) | Pasa (Chrome y MySQL real) | 2026-10-11 | Sebastian |
| CP-07 | HU-06 | Ambos | Todas | Registrar diagnóstico/solución | La atención queda almacenada | Incidente y solicitud registrados y asignados desde la interfaz: atención con autor/fecha, estado conservado y envío a validación con seis eventos completos; también pasan doble clic y varias atenciones sin modificar las anteriores | Pasa (Chrome y MySQL 8.0.46) | 2026-10-12 | Miguel |
| CP-08 | HU-07 | Ambos | Todas | Devolver desde validación | Vuelve a atención y registra historial | | Pendiente | | |
| CP-09 | HU-07 | Ambos | Todas | Aprobar solución | Caso queda Cerrado y registra fecha | | Pendiente | | |
| CP-10 | HU-09 | Ambos | Todas | Filtrar por prioridad/área/tipo | Solo aparecen coincidencias | | Pendiente | | |

## Casos adicionales del equipo (mínimo 5)

| ID | Historia | Tipo | Área | Caso | Resultado esperado | Resultado obtenido | Estado | Fecha | Ejecutó |
|---|---|---|---|---|---|---|---|---|---|
| CP-11 | HU-01 | Incidente | Hardware | Registrar con una categoría inexistente o inactiva | El sistema rechaza el registro y no guarda nada | Pasa (`tests/services/registrarCaso.test.js`) | OK | 2026-10-06 | Sebastian |
| CP-12 | HU-02 | Ambos | Todas | Ana consulta "Mis casos" cuando ella tiene 2 casos y Bruno 1 | Solo aparecen los 2 casos de Ana, el más reciente primero | Pasa (`tests/services/listarCasos.test.js`, `tests/api/listarCasos.test.js`) | OK | 2026-10-09 | Keyla |
| CP-13 | HU-03 | Ambos | Todas | Abrir la bandeja con casos P1, P2, P3 y uno Cerrada | No aparece el Cerrada; orden P1→P3 y, en igual prioridad, el más antiguo primero | Pasa (`tests/services/listarCasos.test.js`, `tests/api/listarCasos.test.js`) | OK | 2026-10-09 | Keyla |
| CP-14 | HU-05 | Incidente | Red | Cambiar el estado de un caso Cerrada | El sistema lo rechaza y no crea historial | HTTP 409; caso cerrado intacto, sin historial; ausente en bandeja | Pasa (Chrome y MySQL real) | 2026-10-09 | Miguel |
| CP-15 | HU-05 | Solicitud | Software | Un usuario Solicitante intenta cambiar el estado | El sistema lo rechaza (403) | HTTP 403; estado e historial intactos; selector de bandeja solo lista agentes | Pasa (Chrome y MySQL real) | 2026-10-09 | Miguel |
| CP-16 | HU-01 | Solicitud | Cuentas | Registrar un caso válido y revisar la tabla historial | Existe el evento "Caso registrado" con estado nuevo Pendiente | Pasa (`tests/services/registrarCaso.test.js`) | OK | 2026-10-06 | Sebastian |
| CP-17 | HU-04 | Incidente | Red | Diego intenta asignarse un caso ya asignado a Carla | 409; el caso sigue asignado a Carla | HTTP 409; agente, fecha e historial intactos en MySQL | Pasa (MySQL real) | 2026-10-11 | Sebastian |
| CP-18 | HU-04 | Solicitud | Software | Un Solicitante intenta asignarse un caso | 403; no cambia nada | HTTP 403 para Solicitante, Validador, Administrador y agente inactivo; sin escrituras | Pasa (MySQL real) | 2026-10-11 | Sebastian |
| CP-19 | HU-04 | Incidente | Hardware | Diego intenta cambiar el estado de un caso asignado a Carla | 403; el estado no cambia | HTTP 403 y estado intacto; en la bandeja el botón queda deshabilitado con "Asignado a Carla Agente"; un caso sin agente tampoco sale de Pendiente | Pasa (Chrome y MySQL real) | 2026-10-11 | Sebastian |
| CP-20 | HU-06 | Incidente | Red | Diego registra la atención de un caso asignado a Carla | 403; no se guarda la atención | Asignación real desde bandeja: Diego ve 403 y conserva los textos; caso, atención e historial intactos; reintento válido al seleccionar Carla (también probado para solicitud) | Pasa (Chrome y MySQL 8.0.46) | 2026-10-12 | Miguel |
| CP-21 | HU-06 | Solicitud | Cuentas | Registrar atención de un caso En análisis | 409; no se guarda la atención | Caso registrado, asignado y avanzado desde la interfaz: formulario muestra 409; caso, atención e historial intactos en MySQL; también se verifica para incidente | Pasa (Chrome y MySQL 8.0.46) | 2026-10-12 | Miguel |
| CP-22 | HU-06 | Incidente | Plataformas | Pasar a En validación un caso En atención sin atenciones | 409; el estado no cambia | Bandeja rechaza validar sin solución propia aun con atenciones de otros casos; datos intactos; tras registrar atención se envía a validación. Recorrido real adicional con incidente de Red y solicitud de Cuentas | Pasa (Chrome y MySQL 8.0.46) | 2026-10-12 | Miguel |
| CP-23 | HU-07 | Incidente | Red | Un Agente intenta aprobar una solución | 403; no cambia nada | | Pendiente | | |
| CP-24 | HU-07 | Solicitud | Software | Aprobar un caso que está En atención | 409; el estado no cambia | | Pendiente | | |
| CP-25 | HU-07 | Incidente | Hardware | Devolver sin motivo o con menos de 10 caracteres | 400; el caso sigue En validación | | Pendiente | | |
| CP-26 | HU-08 | Incidente | Red | Consultar el historial de un caso registrado, asignado y en análisis | 3 eventos en orden cronológico con usuario y fecha | Desde la bandeja, Diego abre `historial.html?id=N`: "Caso registrado" (Ana), "Caso asignado" (Carla) y "Pendiente → En análisis" (Carla), con fecha; con eventos del mismo segundo se conserva el orden de registro (MySQL 8.0.46) | Pasa (Chrome y MySQL real) | 2026-10-11 | Sebastian |
| CP-27 | HU-08 | Solicitud | Cuentas | Bruno consulta el historial de un caso de Ana | 403 | HTTP 403; la página muestra "Solo puedes consultar el historial de tus propios casos" y no lista eventos | Pasa (Chrome y MySQL real) | 2026-10-11 | Sebastian |
| CP-28 | HU-08 | Ambos | Todas | Consultar el historial de un caso inexistente | 404 | HTTP 404; la página muestra "No existe un caso con el número …" | Pasa (Chrome y MySQL real) | 2026-10-11 | Sebastian |
| CP-29 | HU-09 | Ambos | Red | Filtrar por estado Cerrada y categoría Wi-Fi | Solo aparecen los casos cerrados de Wi-Fi | | Pendiente | | |
| CP-30 | HU-09 | Ambos | Todas | Filtrar con un valor fuera del catálogo (`prioridad=P9`, `estado=Abierto`) | 400 con los valores permitidos; no se listan casos | | Pendiente | | |
| CP-31 | HU-09 | Ambos | Plataformas | Filtrar una combinación sin coincidencias | Lista vacía y mensaje "No hay casos con esos filtros" | | Pendiente | | |
| CP-32 | HU-10 | Ambos | Todas | Consultar indicadores con 3 incidentes y 2 solicitudes en distintos estados y prioridades | Cada conteo coincide con MySQL, incluidos los ceros | Fabio ve total 5, abiertos 3, cerrados 2; por estado 1/1/0/1/2, por tipo 3/2 y por prioridad 2/2/1, iguales a `SELECT … GROUP BY` en la base | Pasa (memoria y MySQL 8.0.46) | 2026-10-11 | Sebastian |
| CP-33 | HU-10 | Ambos | Todas | Dos casos cerrados que tardaron 2 h y 4 h | Tiempo de resolución promedio 3,0 h sobre 2 casos | Resolución 3,0 h sobre 2 casos; además asignación 0,5 h (4 casos) y atención 1,8 h (2 casos) | Pasa (memoria y MySQL 8.0.46) | 2026-10-11 | Sebastian |
| CP-34 | HU-10 | Ambos | Todas | Consultar indicadores sin casos cerrados | Tiempos de atención y resolución "Sin datos"; la página no falla | Atención y resolución en `null` con 0 casos; la página muestra "Sin datos" y no falla | Pasa (memoria y MySQL 8.0.46) | 2026-10-11 | Sebastian |
| CP-35 | HU-10 | Ambos | Todas | Un Agente pide los indicadores | 403 | Agente, Validador y Solicitante reciben 403; la página pide elegir un administrador y no muestra datos | Pasa (memoria y MySQL 8.0.46) | 2026-10-11 | Sebastian |
| CP-36 | HU-11 | Ambos | Red | Crear la categoría "VPN institucional" en Red y conectividad | Queda activa y aparece al registrar un caso de esa área | Fabio crea desde la página: HTTP 201, categoría activa en MySQL y catálogo de registro, contador 0; doble envío crea una sola fila. También crea la primera categoría de un área vacía | Pasa (memoria, HTTP, Chrome y MySQL 8.0.46) | 2026-10-12 | Miguel |
| CP-37 | HU-11 | Ambos | Red | Crear "wi-fi" donde ya existe "Wi-Fi" | 409; no se crea nada | Mayúsculas/tildes rechazadas con 409 y textos conservados; índice real impide duplicados. Creaciones y ediciones concurrentes dejan una sola categoría con el nombre | Pasa (memoria, HTTP, Chrome y MySQL 8.0.46) | 2026-10-12 | Miguel |
| CP-38 | HU-11 | Ambos | Hardware | Desactivar "Impresora", que tiene casos | No aparece al registrar; los casos existentes la siguen mostrando | Desactivar desde la página oculta Impresora del registro; sigue en Mis casos, con categoría y caso intactos y contador 1. Reactivar vuelve a ofrecerla en el registro | Pasa (memoria, HTTP, Chrome y MySQL 8.0.46) | 2026-10-12 | Miguel |
| CP-39 | HU-11 | Ambos | Todas | Un Agente intenta crear o editar una categoría | 403; no cambia nada | Agente recibe 403 al crear/editar y no ve controles habilitados; categorías intactas en MySQL. Servicio rechaza también otros roles y administrador inactivo | Pasa (memoria, HTTP, Chrome y MySQL 8.0.46) | 2026-10-12 | Miguel |
| CP-40 | HU-12 | Incidente | Red | Ana abre el detalle de su caso con una atención | Ve datos, agente y solución con diagnóstico y fecha | | Pendiente | | |
| CP-41 | HU-12 | Solicitud | Cuentas | Bruno pide el detalle de un caso de Ana | 403 | | Pendiente | | |
| CP-42 | HU-12 | Ambos | Todas | Detalle de un caso Pendiente | Datos del caso y "Aún no hay una solución registrada" | | Pendiente | | |
| CP-43 | HU-12 | Incidente | Hardware | Detalle de un caso devuelto con dos atenciones | La más reciente como solución vigente y la anterior debajo | | Pendiente | | |

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

HU-10 se ejecutó el 2026-10-11 en MySQL 8.0.46 con `CAMPUSHELP_TEST_MYSQL=1`:
**179 pruebas aprobadas, sin fallos** en la suite completa (las 4 omitidas son
las de navegador). Las 4 suites de navegador se corrieron aparte con
`CAMPUSHELP_TEST_BROWSER=1` en Chromium: **30 pruebas aprobadas, sin fallos**.
`tests/indicadores.mysql.test.js` fija las fechas de los casos en una base
temporal para CP-32 a CP-35 y la elimina al terminar. La página
`indicadores.html` se revisó en Chromium a 1280 px y 390 px.
