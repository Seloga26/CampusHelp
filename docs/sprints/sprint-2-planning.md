# Sprint 2 — Planning

**Inicio del sprint:** martes 6 de octubre de 2026, el mismo día en que cierra el Sprint 1
**Fechas del sprint:** martes 6 – viernes 9 de octubre de 2026
**Equipo:** Sebastian (@Seloga26), Keyla (@Keyla-Cartagena), Miguel (@miguelfsociety)

## Punto de partida

El Sprint 1 entrega el registro de casos (HU-01), la consulta de mis casos (HU-02), la bandeja del agente (HU-03) y el cambio de estado con historial (HU-05). Sobre esa base, el Sprint 2 completa el resto del flujo obligatorio del Taller hasta el cierre.

## Sprint Goal

> Completar asignación, atención, validación e historial: un agente se asigna un caso y registra diagnóstico y solución, un validador aprueba o devuelve, y cualquier usuario autorizado consulta lo ocurrido.

**Demo al cierre** (flujo completo del Taller, sección 18):
Registrar → ver en la bandeja → **asignarse** → En análisis → En atención → **registrar solución** → En validación → **aprobar (Cerrada)** o **devolver (En atención)** → **consultar el historial**.

## Historias seleccionadas

| Historia | SP | Responsable (propuesto) | Ficha | Issue |
|---|---|---|---|---|
| HU-04 Asignarme un caso | 3 | Sebastian | [HU-04](../historias/HU-04.md) | #4 |
| HU-06 Registrar diagnóstico y solución | 5 | Miguel | [HU-06](../historias/HU-06.md) | #6 |
| HU-07 Aprobar o devolver una solución | 5 | Keyla | [HU-07](../historias/HU-07.md) | #7 |
| HU-08 Consultar el historial | 5 | Sebastian | [HU-08](../historias/HU-08.md) | #8 |
| **Total** | **18** | Sebastian 8 · Miguel 5 · Keyla 5 | | |

**Capacidad:** 18 SP en 4 días de sprint, con el desarrollo concentrado el jueves y el viernes. Sebastian lleva 8 SP porque HU-04 es pequeña y la termina antes de que las demás la necesiten.

## Orden de pull y dependencias

```
HU-04 (Sebastian) ──► HU-06 (Miguel) ──► HU-07 (Keyla)
HU-08 (Sebastian) ── independiente: lee el historial que escriben las demás
```

- HU-06 necesita casos con agente asignado (HU-04) y HU-07 necesita casos con solución (HU-06).
- Para no esperar, **todos empiezan el backend el jueves en paralelo** con los repositorios en memoria (`tests/fakes/`), que ya simulan asignaciones, atenciones, cierre e historial. La espera real solo aparece al probar el flujo completo con MySQL.
- WIP: 4 historias para 3 personas. Entran 3 a En análisis el jueves (HU-04, HU-06, HU-07). HU-08 entra cuando HU-04 pase a En atención, y así se respeta el límite de 3.

## Tareas técnicas

| ID | Historia | Tarea | Capa | Responsable | Día |
|---|---|---|---|---|---|
| T2-01 | HU-04 | `casosRepository.asignarAgente()` | Repositorio | Sebastian | Jue |
| T2-02 | HU-04 | Servicio `asignarCaso.js` + pruebas CP-06, CP-17, CP-18 | Servicio / pruebas | Sebastian | Jue |
| T2-03 | HU-04 | Regla en `cambiarEstado.js`: solo el agente asignado + prueba CP-19 | Servicio / pruebas | Sebastian | Jue |
| T2-04 | HU-04 | Botón "Asignarme" y columna de agente en `bandeja.html` | Frontend | Sebastian | Jue |
| T2-05 | HU-06 | `atencionesRepository.crear()` y `contarPorCaso()` | Repositorio | Miguel | Jue |
| T2-06 | HU-06 | Servicio `registrarAtencion.js` + pruebas CP-07, CP-20, CP-21 | Servicio / pruebas | Miguel | Jue |
| T2-07 | HU-06 | Regla en `cambiarEstado.js`: no pasar a En validación sin atención + prueba CP-22 | Servicio / pruebas | Miguel | Jue |
| T2-08 | HU-06 | Página `atender.html?id=` con el formulario, enlazada desde la bandeja | Frontend | Miguel | Vie |
| T2-09 | HU-07 | `casosRepository.cerrar()` y `atencionesRepository.listarPorCaso()` | Repositorio | Keyla | Jue |
| T2-10 | HU-07 | Servicios `validarSolucion.js` y `listarAtenciones.js` + pruebas CP-08, CP-09, CP-23, CP-24, CP-25 | Servicio / pruebas | Keyla | Jue |
| T2-11 | HU-07 | Página `validacion.html` con la solución y Aprobar / Devolver | Frontend | Keyla | Vie |
| T2-12 | HU-08 | `historialRepository.listarPorCaso()` | Repositorio | Sebastian | Vie |
| T2-13 | HU-08 | Servicio `consultarHistorial.js` + pruebas CP-26, CP-27, CP-28 | Servicio / pruebas | Sebastian | Vie |
| T2-14 | HU-08 | Página `historial.html?id=`, enlazada desde la bandeja y "Mis casos" | Frontend | Sebastian | Vie |
| T2-15 | Todas | Prueba del flujo completo contra MySQL y registro de resultados en `casos_prueba.md` | Pruebas | Los tres | Vie |
| T2-16 | Todas | Tabla de API del README y fichas actualizadas | Documentación | Cada responsable | Vie |

## Contrato de API

| Método | Ruta | Historia | Cuerpo / parámetros | Respuestas |
|---|---|---|---|---|
| PATCH | `/api/casos/:id/asignar` | HU-04 | `{ usuario_id }` | 200 caso · 400 · 403 no es Agente · 404 · 409 cerrado o ya asignado |
| POST | `/api/casos/:id/atencion` | HU-06 | `{ diagnostico, solucion, usuario_id }` | 201 atención · 400 · 403 no es el agente asignado · 404 · 409 no está En atención |
| POST | `/api/casos/:id/validacion` | HU-07 | `{ decision: "aprobar" \| "devolver", motivo, usuario_id }` | 200 caso · 400 · 403 no es Validador · 404 · 409 no está En validación o sin solución |
| GET | `/api/casos/:id/atenciones` | HU-07 | — | 200 lista (más reciente primero) · 404 |
| GET | `/api/casos/:id/historial` | HU-08 | `?usuario_id=` | 200 lista cronológica · 400 · 403 · 404 |

Las cinco rutas ya están conectadas a su servicio y al contenedor; responden 501 hasta que se implementen. Detalle en cada ficha.

## Reglas nuevas sobre el cambio de estado (HU-05)

| Regla | La implementa | Tarea |
|---|---|---|
| Solo el agente **asignado** cambia el estado; un caso sin asignar no sale de Pendiente | HU-04 | T2-03 |
| No se pasa a En validación sin al menos una atención registrada | HU-06 | T2-07 |

Las dos tocan `services/casos/cambiarEstado.js` en partes distintas: Sebastian integra primero (jueves en la mañana) y Miguel hace `git pull origin main` antes de su PR.

## Archivos por historia

| Historia | Servicio | Repositorio | Pruebas | Frontend |
|---|---|---|---|---|
| HU-04 | `services/casos/asignarCaso.js` | `casosRepository.asignarAgente()` | `tests/services/asignarCaso.test.js` | `bandeja.html` |
| HU-06 | `services/casos/registrarAtencion.js` | `atencionesRepository.crear()`, `contarPorCaso()` | `tests/services/registrarAtencion.test.js` | `atender.html` |
| HU-07 | `services/casos/validarSolucion.js`, `listarAtenciones.js` | `casosRepository.cerrar()`, `atencionesRepository.listarPorCaso()` | `tests/services/validarSolucion.test.js` | `validacion.html` |
| HU-08 | `services/casos/consultarHistorial.js` | `historialRepository.listarPorCaso()` | `tests/services/consultarHistorial.test.js` | `historial.html` |

En `public/index.html` cada responsable agrega el enlace de su página al menú.

## Calendario

| Día | Actividad |
|---|---|
| Mar 6 | **Inicio del Sprint 2** (cierre del Sprint 1 ese mismo día) |
| Mié 7 | Sprint Planning (este documento). HU-04, HU-06, HU-07 y HU-08 a **Ready**; anotar la fecha en `registro_flujo.csv` |
| Jue 8 | **Daily**. HU-04, HU-06 y HU-07 a En análisis. Backend y pruebas con repositorios en memoria (T2-01 a T2-07, T2-09, T2-10). PR de HU-04 en la mañana. **Refinement** del Sprint 3 (HU-09, HU-10, HU-11, HU-12) |
| Vie 9 | **Daily**. HU-08 y frontends (T2-08, T2-11 a T2-14). Mediodía: prueba del flujo completo con MySQL (T2-15). Tarde: **Sprint Review** (demo del flujo completo) y **Retrospective** con las métricas |
| Sáb 10 | Sprint 3 Planning |

## Definition of Done del sprint

Además de la DoD general ([scrumban.md](../scrumban.md)): las cuatro historias se demuestran juntas en el flujo completo, con los datos en MySQL, y sus casos de prueba (CP-06 a CP-09 y CP-17 a CP-28) tienen el resultado real registrado.

## Riesgos

| Riesgo | Plan |
|---|---|
| Cadena HU-04 → HU-06 → HU-07: un retraso arrastra a las siguientes | Backend en paralelo con repositorios en memoria; HU-04 es la más pequeña y se integra primero |
| HU-04 y HU-06 tocan `cambiarEstado.js` | Cambios pequeños en zonas distintas, PR cortos, `git pull` antes de cada PR |
| La prueba con MySQL se deja para el final | T2-15 tiene hora fija el viernes a mediodía, antes de la Review |
| No se registran fechas del flujo | Quien mueve la tarjeta anota la fecha ese mismo día (mejora acordada en la Retro del Sprint 1) |
