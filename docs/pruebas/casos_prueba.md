# Casos de prueba

Registrar el **resultado real** y la fecha al ejecutar cada caso. Si falla, crear el defecto en [defectos.md](defectos.md).

| ID | Historia | Tipo | Área | Caso | Resultado esperado | Resultado obtenido | Estado | Fecha | Ejecutó |
|---|---|---|---|---|---|---|---|---|---|
| CP-01 | HU-01 | Incidente | Red | Registrar Wi-Fi sin conexión | Se crea y persiste el incidente | | Pendiente | | |
| CP-02 | HU-01 | Solicitud | Software | Solicitar instalación de software | Se crea y persiste la solicitud | | Pendiente | | |
| CP-03 | HU-01 | Incidente | Cuentas | Registrar sin descripción | El sistema rechaza el registro | | Pendiente | | |
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
| CP-11 | | | | | | | Pendiente | | |
| CP-12 | | | | | | | Pendiente | | |
| CP-13 | | | | | | | Pendiente | | |
| CP-14 | | | | | | | Pendiente | | |
| CP-15 | | | | | | | Pendiente | | |

Ideas: cerrar un caso sin solución, registrar atención con un agente no asignado, categoría que no pertenece al área, modificar un caso Cerrado, indicadores con cero casos.
