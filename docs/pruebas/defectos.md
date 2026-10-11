# Registro de defectos

| ID | Sprint | Descripción | Pasos para reproducir | Resultado esperado | Resultado obtenido | Prioridad | Estado | Caso de prueba | Corregido en (commit/PR) |
|---|---|---|---|---|---|---|---|---|---|
| DEF-01 | 1 | Un título de más de 180 caracteres no se validaba en el servidor y llegaba a MySQL (`VARCHAR(180)`) | `POST /api/casos` con un caso válido cuyo título tiene 300 caracteres (sin pasar por el formulario, que limita a 180) | 400 con mensaje de validación | El servicio lo aceptaba; contra MySQL la inserción falla y la API responde 500 | P3 | Verificado | Prueba "rechaza un título de más de 180 caracteres…" en `tests/services/registrarCaso.test.js` | `d9bcb17`, PR #17 |
| DEF-02 | 3 | Un doble clic en **Registrar caso** creaba el caso dos veces | En `registrar.html`, llenar el formulario y pulsar dos veces seguidas el botón | Un solo caso y un solo evento de historial | Se enviaban dos `POST /api/casos` y quedaban dos casos iguales | P2 | Verificado | CP-01 en `tests/browser/registro.mysql.test.js` | PR de cierre de HU-01 |
| DEF-03 | 3 | Los nombres de área, categoría y usuario se insertaban como HTML en el formulario, en inicio y en "Actuar como" | Cambiar el nombre de una categoría por `<img src=x onerror=...>` y abrir `registrar.html` | El nombre se muestra como texto | El navegador interpretaba el nombre como HTML (riesgo cuando HU-11 permita editar categorías) | P2 | Verificado | Última prueba de `tests/browser/registro.mysql.test.js` | PR de cierre de HU-01 |

Estados: Abierto → En corrección → Corregido → Verificado.

**Cómo se detectó DEF-01:** revisión de código de HU-01 el 2026-10-06, probando el servicio con valores límite antes de fusionar.

**Cómo se detectaron DEF-02 y DEF-03:** al escribir la prueba de navegador con MySQL real para cerrar HU-01 (2026-10-11). Ambas pruebas fallaron antes de la corrección y pasan después.
