# Sprint 1 — Planning

**Fechas del sprint:** sábado 3 – viernes 9 de octubre de 2026
**Sprint Planning:** domingo 4 de octubre de 2026
**Equipo:** Sebastian (@Seloga26), Keyla (@Keyla-Cartagena), Miguel (@miguelfsociety)

## Sprint Goal

> Un solicitante puede registrar un incidente o una solicitud y consultar sus casos, y un agente puede verlos en la bandeja y avanzar su estado dejando historial, con todo persistido en MySQL.

Al final del sprint se debe poder demostrar: **Registrar → ver en la bandeja → pasar a En análisis → En atención → En validación**, y ver el historial de esos cambios en la base de datos.

## Historias seleccionadas

| Historia | SP | Responsable (propuesto) | Ficha | Issue |
|---|---|---|---|---|
| HU-01 Registrar incidente o solicitud | 5 | Sebastian | [HU-01](../historias/HU-01.md) | #1 |
| HU-03 Bandeja de casos pendientes | 3 | Keyla | [HU-03](../historias/HU-03.md) | #3 |
| HU-05 Cambiar estado del caso | 5 | Miguel | [HU-05](../historias/HU-05.md) | #5 |
| HU-02 Consultar mis casos | 3 | Keyla (la jala la primera persona con capacidad) | [HU-02](../historias/HU-02.md) | #2 |
| **Total** | **16** | | | |

**Capacidad:** es el primer sprint, así que no hay velocidad histórica. 16 SP con 3 personas y 5 días hábiles se considera alcanzable. El Throughput real de este sprint será la base para planear el Sprint 2.

No hay roles fijos: el responsable es quien lleva la historia hasta Done, pero cualquiera puede ayudar en sus tareas, sobre todo cuando una columna llega a su límite WIP.

## Flujo planeado en el tablero

1. Al aprobar el PR de este planning, las 4 historias pasan a **Ready**. Registrar la fecha en `docs/metricas/registro_flujo.csv`.
2. **Pull inicial:** Sebastian jala HU-01, Keyla jala HU-03 y Miguel jala HU-05. **En análisis queda en 3/3**, su límite.
3. **HU-02 espera en Ready.** Se jala cuando haya espacio en En análisis, es decir, cuando alguna de las otras tres pase a En atención. Esto es el principio Pull del Taller: no se empieza trabajo nuevo sin capacidad.
4. Cada movimiento de columna se registra el mismo día en `registro_flujo.csv`.

## Tareas que desbloquean a los demás (hacer primero)

| Tarea | Responsable | Desbloquea | Meta |
|---|---|---|---|
| **T0** — 6 a 8 casos de ejemplo en `database/seed.sql` (varios tipos, áreas, prioridades y estados, incluido uno Cerrada) | Keyla | HU-02, HU-03, HU-05 | Lunes 5 |
| `src/services/historial.js` con `registrarEvento()` | Sebastian | HU-05 | Lunes 5 |
| `public/js/comun.js` con el selector "Actuar como" y un helper para llamar la API | Sebastian | Todas las páginas | Lunes 5 |

Conviene subir estas tareas en PR pequeños y separados, para que se aprueben rápido.

## Contrato de la API para este sprint

Se acuerda antes de programar para que frontend y backend no se esperen entre sí.

**`POST /api/casos`** (HU-01)
```json
// Petición
{ "tipo": "Incidente", "titulo": "Sin Wi-Fi en bloque B", "descripcion": "No conecta desde las 8 am",
  "prioridad": "P1", "categoria_id": 8, "usuario_id": 1 }
// 201 → el caso creado (mismos campos que en GET) | 400 → { "error": "mensaje" }
```

**`GET /api/casos`** (HU-02 y HU-03)

| Parámetro | Resultado | Orden |
|---|---|---|
| `?usuario_id=1` | Casos de ese solicitante (incluye cerrados) | Más reciente primero |
| `?vista=bandeja` | Casos que no están Cerrada | Prioridad P1→P3, luego el más antiguo primero |
| sin parámetros | Todos | Más reciente primero |

```json
[{ "id": 1, "tipo": "Incidente", "titulo": "...", "prioridad": "P1", "estado": "Pendiente",
   "area": "Red y conectividad", "categoria": "Wi-Fi", "solicitante": "Ana Solicitante",
   "agente": null, "fecha_creacion": "2026-10-05 09:30:00" }]
```

**`PATCH /api/casos/:id/estado`** (HU-05)
```json
// Petición
{ "estado": "En análisis", "usuario_id": 3 }
// 200 → el caso actualizado | 403 no es Agente | 404 no existe | 409 transición no permitida
```

**Helper de historial** (lo crea HU-01, lo usa HU-05)
```js
registrarEvento(conn, { casoId, evento, estadoAnterior, estadoNuevo, usuarioId })
```

## Acuerdos para no pisarse en el código

Cada historia trabaja en sus propios archivos. En los archivos compartidos, cada uno cambia solo su parte.

| Historia | Archivos propios |
|---|---|
| HU-01 | `src/services/casosRegistro.js`, `src/services/historial.js`, `public/registrar.html`, `public/js/registrar.js`, `public/js/comun.js` |
| HU-02 / HU-03 | `src/services/casosConsulta.js`, `public/mis-casos.html`, `public/bandeja.html`, `public/js/mis-casos.js`, `public/js/bandeja.js` |
| HU-05 | `src/services/casosEstado.js` |

- **`src/routes/casos.js`:** cada historia reemplaza solo su línea `pendiente(...)`.
- **`public/js/bandeja.js`:** lo crea Keyla (HU-03). Miguel agrega el botón de cambio de estado (HU-05) cuando HU-03 esté integrada. Coordinarlo en la Daily.
- **`public/index.html`:** pasa a ser un menú con enlaces a las páginas. Sebastian agrega los enlaces.
- Antes de abrir un PR, hacer `git pull origin main` en la rama para resolver conflictos localmente.

## Calendario del sprint

| Día | Actividad |
|---|---|
| Sáb 3 | Configuración: repositorio, protección de `main`, tablero, Issues #1–#12 y etiquetas |
| Dom 4 | **Sprint Planning** y refinamiento de HU-01, HU-02, HU-03 y HU-05 (este documento) |
| Lun 5 | Cada uno verifica `npm run db:init` y `/api/health` en su equipo. T0, `historial.js` y `comun.js` integrados |
| Lun 5 – Vie 9 | **Daily** de 10–15 min. Hora: ____ . Revisar flujo, bloqueos y WIP |
| Mié 7 | **Refinement** de las historias del Sprint 2 (HU-04, HU-06, HU-07, HU-08) |
| Jue 8 | Meta: las 4 historias en En validación o Done |
| Vie 9 | **Sprint Review** (demo del flujo) y **Retrospective** con las métricas del sprint |

## Riesgos

| Riesgo | Plan |
|---|---|
| Conflictos al integrar archivos compartidos | Acuerdos de la sección anterior y PR pequeños |
| MySQL configurado distinto en cada equipo | Todos validan `/api/health` el lunes; cualquier problema se marca como `blocked` |
| HU-01 se retrasa y frena la demo completa | T0 permite avanzar HU-02, HU-03 y HU-05 con datos de ejemplo |
| En análisis llena (3/3) con el equipo completo | Si alguien se bloquea, marca `blocked` con motivo y ayuda a otro; no jala trabajo nuevo |
