# Guion de la demo — martes 13 de octubre

**Duración objetivo:** 15 minutos de demo + preguntas · **Versión:** `main` en `7a9e885` (PR #48)

Cada integrante muestra las historias que construyó y explica las decisiones detrás.

## Preparación (antes de entrar)

```bash
git checkout main && git pull
npm install
npm run db:init      # deja la base limpia con los datos de prueba
npm start            # http://localhost:3000
```

- [ ] `http://localhost:3000/api/health` responde `{"app":"ok","db":"ok"}`
- [ ] `npm test` sin fallos (con MySQL configurado, sin pruebas omitidas)
- [ ] Una pestaña con el tablero del proyecto en GitHub y otra con `docs/metricas/README.md`
- [ ] Ensayar una vez el recorrido completo de la parte 2 (si algo falla, se sabe antes)

Usuarios de prueba (selector **"Actuar como"**): Ana Solicitante, Carla Agente, Elena Validadora y Fabio Administrador.

## 1. Contexto y forma de trabajo (2 min) — Sebastian

- Qué es CampusHelp: un MVP para registrar y atender incidentes y solicitudes de servicios tecnológicos de la universidad.
- ScrumBan en tres sprints cortos (3–6, 6–10 y 10–12 oct) para llegar a la entrega del 13. Tablero con límites de WIP (En análisis 3, En atención 3, En validación 2), pull por prioridad y Definition of Ready / Done (`docs/scrumban.md`).
- Stack: Node + Express + MySQL (ADR-001). Arquitectura en capas (ADR-003): rutas → servicios con las reglas → repositorios. Los repositorios en memoria permitieron construir y probar historias sin esperar a otras.

## 2. Flujo obligatorio de punta a punta (7 min)

| Paso | Actuar como | Pantalla | Qué mostrar | Presenta |
|---|---|---|---|---|
| 1 | Ana | Registrar | Registrar un incidente P1 de Red. Mencionar que un doble clic ya no duplica el caso (DEF-02) | Sebastian |
| 2 | Ana | Mis casos | El caso aparece como Pendiente | Keyla |
| 3 | Carla | Bandeja | Ordenada por prioridad y antigüedad, con color por prioridad | Keyla |
| 4 | Carla | Bandeja | **Asignarme**. Con otro agente, el cambio de estado queda deshabilitado (CP-19) | Sebastian |
| 5 | Carla | Bandeja / Cambiar estado | Pendiente → En análisis → En atención. Las transiciones no permitidas se rechazan | Miguel |
| 6 | Carla | Atender | Registrar diagnóstico y solución. Sin atención no se puede pasar a En validación | Miguel |
| 7 | Carla | Cambiar estado | En atención → En validación | Miguel |
| 8 | Elena | Validación | **Devolver** con motivo: vuelve a En atención. Volver a enviarlo y **Aprobar**: queda Cerrada con fecha de cierre | Keyla |
| 9 | Ana | Historial | Todos los eventos en orden, con usuario, rol y fecha | Sebastian |

Puntos a explicar mientras se avanza:

- Cada cambio de estado y su evento de historial se guardan en **una sola transacción**: nunca queda un estado sin historial.
- Las reglas viven en el servidor: un agente no puede aprobar (403), no se aprueba un caso que no está En validación (409), devolver exige motivo (400).

## 3. Historias del Sprint 3 (4 min)

| Historia | Actuar como | Pantalla | Qué mostrar | Presenta |
|---|---|---|---|---|
| HU-09 | Fabio | Todos los casos | Combinar filtros de estado, tipo, prioridad, área y categoría | Keyla |
| HU-10 | Fabio | Indicadores | Conteos por estado, tipo y prioridad, y tiempos promedio calculados con los casos de la demo. Con otro rol: acceso denegado | Sebastian |
| HU-11 | Fabio | Categorías | Crear una categoría, intentar repetir el nombre en la misma área (rechazado) y desactivarla. Ya no aparece al registrar un caso | Miguel |
| HU-12 | Ana | Mis casos → Ver detalle | Abrir el caso cerrado y ver la solución registrada | Miguel |

## 4. Calidad y métricas (2 min) — los tres

- **Pruebas:** 206 automáticas sin fallos, más casos con Chrome y MySQL registrados en `docs/pruebas/casos_prueba.md`. Tres defectos encontrados y corregidos (`docs/pruebas/defectos.md`).
- **Métricas** (`docs/metricas/README.md`): Throughput 0 → 0 → 4; Lead Time de las historias del sprint 5 → 4,5 → 0,75 días.
- **Mejora que funcionó:** cerrar cada historia al fusionarla. **Lo que no:** seguimos integrando tarde el último día; se explica en la Retro del Sprint 3.
- **Transparencia:** algunas fechas del CSV se completaron después desde GitHub y están declaradas como tales.

## Preguntas probables

| Pregunta | Respuesta corta |
|---|---|
| ¿Por qué los sprints 1 y 2 terminaron con 0 historias Done? | Las historias que desbloqueaban a otras quedaron para el final y el trabajo terminado no se cerraba. La Retro del Sprint 2 cambió eso y el Sprint 3 cerró 4 propias y 7 atrasadas |
| ¿Por qué ajustaron el modelo de datos del docente? | ADR-002 |
| ¿Cómo garantizan que el historial es completo? | Estado e historial en la misma transacción; lo comprueban las pruebas con MySQL |
| ¿Cómo se repartió el trabajo? | Cada integrante tomó historias completas, de la base de datos a la pantalla, con un PR por historia |
