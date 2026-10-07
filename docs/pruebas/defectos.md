# Registro de defectos

| ID | Sprint | Descripción | Pasos para reproducir | Resultado esperado | Resultado obtenido | Prioridad | Estado | Caso de prueba | Corregido en (commit/PR) |
|---|---|---|---|---|---|---|---|---|---|
| DEF-01 | 1 | Un título de más de 180 caracteres no se validaba en el servidor y llegaba a MySQL (`VARCHAR(180)`) | `POST /api/casos` con un caso válido cuyo título tiene 300 caracteres (sin pasar por el formulario, que limita a 180) | 400 con mensaje de validación | El servicio lo aceptaba; contra MySQL la inserción falla y la API responde 500 | P3 | Verificado | Prueba "rechaza un título de más de 180 caracteres…" en `tests/services/registrarCaso.test.js` | `d9bcb17`, PR #17 |

Estados: Abierto → En corrección → Corregido → Verificado.

**Cómo se detectó DEF-01:** revisión de código de HU-01 el 2026-10-06, probando el servicio con valores límite antes de fusionar.
