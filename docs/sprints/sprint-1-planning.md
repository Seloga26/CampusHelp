# Sprint 1 — Planning

**Fechas del sprint:** sábado 3 – martes 6 de octubre de 2026 (acortado: la entrega final es el martes 13)
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

**Capacidad:** es el primer sprint, así que no hay velocidad histórica. Quedan 2 días de desarrollo (lunes 5 y martes 6) más lo que se adelante hoy domingo, así que 16 SP es ajustado. Si HU-02 no alcanza a terminarse, pasa al Sprint 2 y se registra en la Review; eso es preferible a dejar historias a medias. El Throughput real de este sprint será la base para planear el Sprint 2.

No hay roles fijos: el responsable es quien lleva la historia hasta Done, pero cualquiera puede ayudar en sus tareas, sobre todo cuando una columna llega a su límite WIP.

## Flujo planeado en el tablero

1. Al fusionar el PR de este planning, las 4 historias pasan a **Ready**. Registrar la fecha en `docs/metricas/registro_flujo.csv`.
2. **Pull inicial:** Sebastian jala HU-01, Keyla jala HU-03 y Miguel jala HU-05. **En análisis queda en 3/3**, su límite.
3. **HU-02 espera en Ready.** Se jala cuando haya espacio en En análisis, es decir, cuando alguna de las otras tres pase a En atención. Esto es el principio Pull del Taller: no se empieza trabajo nuevo sin capacidad.
4. Cada movimiento de columna se registra el mismo día en `registro_flujo.csv`.

## Tareas que desbloquean a los demás (hacer primero)

| Tarea | Responsable | Desbloquea | Meta |
|---|---|---|---|
| **T0** — 6 a 8 casos de ejemplo en `database/seed.sql` (varios tipos, áreas, prioridades y estados, incluido uno Cerrada) | Keyla | HU-02, HU-03, HU-05 | Lunes 5 |
| `historialRepository.registrar()` en `src/repositories/historialRepository.js` | Sebastian | HU-05 | Primero, antes del resto de HU-01 |
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

**Historial** (lo implementa HU-01, lo usa HU-05). Dentro de una transacción:
```js
await enTransaccion(async (tx) => {
  const id = await tx.casos.crear({ ... });
  await tx.historial.registrar({ casoId: id, evento: 'Caso registrado',
    estadoAnterior: null, estadoNuevo: 'Pendiente', usuarioId });
});
```

La arquitectura y la receta para implementar cada historia están en [ADR-003](../decisiones/ADR-003-arquitectura.md).

## Acuerdos para no pisarse en el código

Cada historia trabaja en sus propios archivos. Las rutas del Sprint 1 ya están conectadas a su servicio, así que nadie necesita tocar `src/routes/`, `src/app.js` ni `src/config/contenedor.js`.

| Historia | Servicio (caso de uso) | Repositorio (solo su método) | Pruebas | Frontend |
|---|---|---|---|---|
| HU-01 | `src/services/casos/registrarCaso.js` | `casosRepository.crear`, `historialRepository.registrar` | `tests/services/registrarCaso.test.js` | `public/registrar.html`, `public/js/registrar.js`, `public/js/comun.js` |
| HU-02 / HU-03 | `src/services/casos/listarCasos.js` | `casosRepository.listar` | `tests/services/listarCasos.test.js` | `public/mis-casos.html`, `public/bandeja.html`, `public/js/mis-casos.js`, `public/js/bandeja.js` |
| HU-05 | `src/services/casos/cambiarEstado.js` | `casosRepository.buscarPorId`, `casosRepository.actualizarEstado` | `tests/services/cambiarEstado.test.js` | botón en `public/js/bandeja.js` |

- **`src/repositories/casosRepository.js`:** cada método ya tiene su bloque marcado con la HU; cada uno edita solo el suyo.
- **Pruebas de servicios:** usan `crearReposEnMemoria()` de `tests/fakes/`, sin MySQL. Ver el ejemplo en `tests/services/catalogos.test.js`.
- **`public/js/bandeja.js`:** lo crea Keyla (HU-03). Miguel agrega el botón de cambio de estado (HU-05) cuando HU-03 esté integrada. Coordinarlo en la Daily.
- **`public/index.html`:** pasa a ser un menú con enlaces a las páginas. Sebastian agrega los enlaces.
- Antes de abrir un PR, hacer `git pull origin main` en la rama para resolver conflictos localmente.

## Calendario del sprint

| Día | Actividad |
|---|---|
| Sáb 3 | Configuración: repositorio, protección de `main`, tablero, Issues #1–#12 y etiquetas |
| Dom 4 | **Sprint Planning** y refinamiento de HU-01, HU-02, HU-03 y HU-05 (este documento) |
| Dom 4 | Si alguien puede adelantar: verificar `npm run db:init` y `/api/health`, y empezar T0, el historial y `comun.js` |
| Lun 5 | **Daily** (hora: ____). T0, el historial y `comun.js` integrados en la mañana. Desarrollo de HU-01, HU-03 y HU-05 |
| Mar 6 (mañana) | Reestructuración del backend a arquitectura limpia con SOLID ([ADR-003](../decisiones/ADR-003-arquitectura.md)), antes de empezar a programar las historias |
| Mar 6 | **Daily**. Meta: las 4 historias en En validación o Done. **Refinement** de las historias del Sprint 2 (HU-04, HU-06, HU-07, HU-08) |
| Mar 6 (final del día) | **Sprint Review** (demo del flujo) y **Retrospective** con las métricas del sprint |
| Mié 7 | Sprint 2 Planning |

## Riesgos

| Riesgo | Plan |
|---|---|
| Conflictos al integrar archivos compartidos | Acuerdos de la sección anterior y PR pequeños |
| MySQL configurado distinto en cada equipo | Todos validan `/api/health` el lunes; cualquier problema se marca como `blocked` |
| HU-01 se retrasa y frena la demo completa | T0 permite avanzar HU-02, HU-03 y HU-05 con datos de ejemplo |
| En análisis llena (3/3) con el equipo completo | Si alguien se bloquea, marca `blocked` con motivo y ayuda a otro; no jala trabajo nuevo |
| Solo 2 días de desarrollo | PR pequeños e integración diaria; si HU-02 no cabe, pasa al Sprint 2 |
