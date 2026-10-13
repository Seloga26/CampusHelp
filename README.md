# CampusHelp

MVP web para gestionar **incidentes** y **solicitudes de servicio** tecnológico de una universidad, desarrollado en 3 sprints aplicando **ScrumBan**.

Flujo principal: **Registrar → Clasificar → Priorizar → Asignar → Atender → Validar → Cerrar**

| | |
|---|---|
| **Equipo** | Sebastian, Keyla, Miguel |
| **Stack** | Node.js 18+ · Express · MySQL 8 · HTML/CSS/JS |
| **Metodología** | ScrumBan — sprints de 1 semana, WIP: análisis 3 · atención 3 · validación 2 |

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior
- MySQL 8 (local, XAMPP/WAMP o Docker)
- Git

## Instalación y ejecución

```bash
git clone https://github.com/Seloga26/CampusHelp.git
cd CampusHelp
npm install
cp .env.example .env          # en Windows: copy .env.example .env
# edita .env con tu usuario y contraseña de MySQL
npm run db:init               # crea BD, tablas y datos de prueba (borra datos existentes)
npm start                     # http://localhost:3000
```

Comprobación rápida: `http://localhost:3000/api/health` debe responder `{"app":"ok","db":"ok"}`.

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca el servidor y lo reinicia al guardar cambios |
| `npm test` | Ejecuta las pruebas automáticas |

### Usuarios de prueba

No hay autenticación real (permitido por el Taller). Se cargan estos usuarios:

| Usuario | Rol |
|---|---|
| ana@campus.edu, bruno@campus.edu | Solicitante |
| carla@campus.edu, diego@campus.edu | Agente |
| elena@campus.edu | Validador |
| fabio@campus.edu | Administrador |

## Arquitectura

Cliente-servidor con API REST, organizada como **arquitectura limpia en capas** aplicando **SOLID**. Detalle, diagrama y receta para implementar una historia: [ADR-003](docs/decisiones/ADR-003-arquitectura.md).

```
CampusHelp/
├── database/              schema.sql, seed.sql, init.js
├── src/
│   ├── domain/            reglas puras: estados, catálogos, errores del negocio
│   ├── services/          casos de uso (uno por acción); reciben sus dependencias
│   ├── repositories/      único lugar con SQL, un repositorio por entidad
│   ├── routes/            HTTP: leer petición → llamar servicio → responder
│   ├── middleware/        errores → respuestas HTTP; soporte async
│   ├── config/            conexión MySQL y contenedor (inyección de dependencias)
│   ├── app.js             arma Express a partir del contenedor
│   └── server.js          punto de entrada
├── public/                frontend (HTML, CSS, JS)
├── tests/                 domain/, services/, api/ y fakes/ (repositorios en memoria)
└── docs/                  documentación ScrumBan (ver abajo)
```

Regla de dependencias: `routes → services → domain`, y `services` usa `repositories` solo a través de lo que le inyecta `config/contenedor.js`. `npm test` corre sin MySQL.

## API

| Método | Ruta | Historia | Estado |
|---|---|---|---|
| GET | `/api/health` | — | ✅ |
| GET | `/api/categorias` | HU-01 | ✅ (activas, para el registro) |
| GET | `/api/categorias/gestion` | HU-11 | ✅ |
| GET | `/api/categorias/areas` | HU-11 | ✅ (áreas activas, incluidas las vacías) |
| POST | `/api/categorias` | HU-11 | ✅ |
| PATCH | `/api/categorias/:id` | HU-11 | ✅ |
| GET | `/api/usuarios?rol=` | — | ✅ |
| POST | `/api/casos` | HU-01 | ✅ |
| GET | `/api/casos` | HU-02, HU-03 | ✅ (filtros de HU-09: ⏳ Sprint 3) |
| PATCH | `/api/casos/:id/estado` | HU-05 | ✅ |
| PATCH | `/api/casos/:id/asignar` | HU-04 | ✅ |
| POST | `/api/casos/:id/atencion` | HU-06 | ✅ |
| POST | `/api/casos/:id/validacion` | HU-07 | ✅ |Sprint 2 |
| GET | `/api/casos/:id/atenciones` | HU-07 | ✅ | Sprint 2 |
| GET | `/api/casos/:id/historial` | HU-08 | ✅ |
| GET | `/api/casos/:id` | HU-12 | ✅ |
| GET | `/api/indicadores` | HU-10 | ✅ |

### Cambiar estado (HU-05)

`PATCH /api/casos/:id/estado` recibe `{ "estado": "En análisis", "usuario_id": 3 }`
y devuelve `200` con el caso actualizado. Respuestas de error: `400` por datos
inválidos, `403` si el usuario no es un agente activo o no es el agente asignado
al caso (HU-04), `404` si el caso no existe y `409` por una transición no permitida.

El agente avanza `Pendiente → En análisis → En atención → En validación`.
El estado y el evento de historial se guardan juntos; el inicio de atención se
registra una sola vez. Aprobar o devolver desde validación corresponde a HU-07.

En `/cambiar-estado.html` se puede operar un caso existente indicando su ID y
estado actual. El servidor comprueba el estado persistido. El control reutilizable
para la bandeja y la guía de pruebas están en
[docs/pruebas/HU-05.md](docs/pruebas/HU-05.md). En `/bandeja.html`, cada caso
incluye el botón **Pasar a <siguiente estado>**, con el agente seleccionado en
"Actuar como". Al guardar se actualiza la tabla; los errores quedan visibles
y el doble clic no duplica el cambio. Los casos En validación quedan a cargo
del validador y no muestran botón de avance.

### Asignarme un caso (HU-04)

`PATCH /api/casos/:id/asignar` recibe `{ "usuario_id": 3 }` (el agente de
"Actuar como") y devuelve `200` con el caso actualizado, incluido el nombre del
agente. Se guardan `agente_id` y `fecha_asignacion`, y se registra el evento
"Caso asignado" en la misma transacción. Asignar **no** cambia el estado.

Errores: `400` por datos inválidos, `403` si no es un agente activo, `404` si el
caso no existe y `409` si está cerrado o ya tiene agente (no hay reasignación en
el MVP). Si dos agentes se asignan el mismo caso a la vez, solo uno lo consigue.

Desde HU-04, **solo el agente asignado cambia el estado** (Taller, sección 7):
un caso sin agente no sale de Pendiente y otro agente recibe `403`. En
`/bandeja.html`, los casos sin agente muestran **Asignarme**; si el agente
seleccionado no es el asignado, el botón de estado queda deshabilitado y explica
por qué.

### Registrar atención (HU-06)

`POST /api/casos/:id/atencion` recibe `{ "diagnostico": "El AP estaba apagado",
"solucion": "Se reinició y verificó el AP", "usuario_id": 3 }` y devuelve `201`
con la atención creada (`id`, `caso_id`, `diagnostico`, `solucion`, `fecha`,
`agente_id`). El caso debe estar En atención y asignado al agente activo que
registra. Ambos textos son obligatorios y requieren al menos 10 caracteres
después de quitar espacios al inicio y al final.

Atención e historial se guardan en una transacción; el estado se conserva. Se
pueden registrar varias atenciones, sin editar las anteriores. Errores: `400`
por datos inválidos, `403` por permisos, `404` por caso inexistente y `409`
por estado incorrecto. HU-05 responde `409` al intentar pasar
a En validación sin una atención del propio caso.

La página `/atender.html?id=10` permite registrar la atención directamente;
también puede indicarse el ID en el formulario. La bandeja muestra **Registrar
atención** en los casos En atención asignados al agente seleccionado; el
formulario permite volver a la bandeja para enviar a validación. Pruebas,
alcance y contrato de integración: [guía de HU-06](docs/pruebas/HU-06.md).
El recorrido registro → asignación real → atención → validación se verifica
para incidentes y solicitudes en `tests/browser/atencion-flujo.mysql.test.js`
con Chrome y una base temporal MySQL; incluye los rechazos de permisos,
estado incorrecto y ausencia de solución, además del historial completo.

### Consultar el historial (HU-08)

`GET /api/casos/:id/historial?usuario_id=3` devuelve `200` con los eventos del
caso en orden cronológico: `id`, `evento`, `estado_anterior`, `estado_nuevo`,
`usuario`, `rol` y `fecha`. Agentes, validadores y administradores ven cualquier
caso; un solicitante, solo los suyos. Errores: `400` por `usuario_id` o id
inválido, `403` sin permiso (o usuario inactivo) y `404` si el caso no existe.
El historial es solo lectura.

La página `/historial.html?id=10` muestra la línea de tiempo con fecha, evento,
cambio de estado y quién lo hizo. Se abre con **Ver historial** desde la bandeja
y desde "Mis casos", o escribiendo el número de caso.

### Indicadores del servicio (HU-10)

`GET /api/indicadores?usuario_id=6` devuelve `200` con `total`, `abiertos`,
`cerrados`, los conteos `por_estado`, `por_tipo` y `por_prioridad` (todos los
valores del catálogo, incluidos los ceros) y `tiempos` (`asignacion`,
`atencion` y `resolucion`), cada uno con `promedio_horas` (un decimal, o `null`
si no hay casos para calcularlo) y `casos`. Todo se calcula en la base con
`GROUP BY` y `TIMESTAMPDIFF`. Solo un Administrador activo lo consulta:
`400` por `usuario_id` inválido y `403` para cualquier otro rol. Es solo lectura.

La página `/indicadores.html` muestra las tarjetas de resumen y de tiempos, y
barras por estado, tipo y prioridad hechas con CSS. Se abre desde Inicio.

### Gestionar categorías (HU-11)

En `/categorias.html`, seleccionar a Fabio Administrador permite crear,
editar, desactivar y reactivar categorías. El catálogo agrupa por área las
activas e inactivas y muestra cuántos casos tiene cada una. Todas las páginas
incluyen el enlace **Categorías** en el menú.

`GET /api/categorias/gestion?usuario_id=6` lista todas las categorías.
`POST /api/categorias` recibe `{ area_id, nombre, descripcion?, usuario_id }`
y devuelve `201`. `PATCH /api/categorias/:id` recibe
`{ nombre?, descripcion?, activa?, usuario_id }` y devuelve `200`; conserva
los campos omitidos y el área. `activa` debe ser un booleano. Solo un
Administrador activo puede consultar la gestión o modificar categorías.

El nombre tiene entre 3 y 100 caracteres tras recortar espacios; la descripción
es opcional, de hasta 255. Se rechazan nombres repetidos en la misma área sin
distinguir mayúsculas ni tildes, incluso para categorías inactivas. El índice
único protege también los intentos concurrentes. Errores: `400` datos inválidos
o área inexistente/inactiva, `403` sin permiso, `404` categoría inexistente,
`409` nombre repetido.

Desactivar oculta la categoría al registrar casos; sus casos existentes y su
clasificación se conservan. Reactivarla vuelve a ofrecerla en el registro.
`GET /api/categorias/areas` ofrece las cinco áreas activas, incluso cuando una
no tiene categorías; las áreas no se administran en esta historia.
Evidencia y comandos de prueba: [guía de HU-11](docs/pruebas/HU-11.md).

### Consultar detalle y solución (HU-12)

`GET /api/casos/:id?usuario_id=1` devuelve el caso con tipo, título,
descripción, área, categoría, prioridad, estado, solicitante, agente y las
fechas de creación, asignación, inicio de atención y cierre, junto con
`atenciones` de la más reciente a la más antigua. Cada atención contiene
diagnóstico, solución, agente y fecha. Es una consulta de solo lectura.

Un Solicitante activo solo consulta sus propios casos; Agente, Validador y
Administrador activos consultan cualquier caso. Respuestas: `200` detalle,
`400` IDs inválidos, `403` sin permiso o usuario inactivo y `404` caso inexistente.

La página `/detalle.html?id=10` se abre con **Ver detalle** desde Mis casos
o la bandeja. Destaca la atención más reciente como **Solución vigente** y
conserva las anteriores debajo; sin atenciones muestra **Aún no hay una
solución registrada**. Incluye enlace al historial y limpia los datos al
cambiar de usuario o fallar la consulta. Los menús incluyen **Detalle**.
Pruebas y evidencia: [guía de HU-12](docs/pruebas/HU-12.md).

### `GET /api/casos`

| Parámetro | Resultado | Orden |
|---|---|---|
| `?usuario_id=1` | Casos de ese solicitante, incluidos los cerrados (HU-02) | Más reciente primero |
| `?vista=bandeja` | Casos que no están `Cerrada` (HU-03) | Prioridad P1 → P3, luego el más antiguo primero |
| sin parámetros | Todos los casos | Más reciente primero |

Cada caso incluye: `id`, `tipo`, `titulo`, `prioridad`, `estado`, `area`, `categoria`, `solicitante`, `agente`, `agente_id` (ambos `null` si no está asignado) y `fecha_creacion`. Si no hay casos responde `200` con `[]`. Un `usuario_id` que no sea un entero positivo, o una `vista` distinta de `bandeja`, responde `400`.

## Reglas de negocio clave

- Tipo: `Incidente` o `Solicitud de servicio`. Prioridad: `P1` urgente, `P2` normal, `P3` baja.
- Toda categoría pertenece a una de las 5 áreas; área y categoría son obligatorias.
- Estados: `Pendiente → En análisis → En atención → En validación → Cerrada`; desde validación se puede devolver a `En atención`.
- Un caso `Cerrada` no cambia de estado. Todo cambio de estado genera historial.
- Solo el agente asignado registra la atención.

## Documentación ScrumBan

| Documento | Contenido |
|---|---|
| [docs/backlog.md](docs/backlog.md) | Product Backlog con prioridad, puntos, sprint y estado |
| [docs/scrumban.md](docs/scrumban.md) | Product Goal, calendario de sprints, tablero, políticas WIP, DoR y DoD |
| [docs/sprints/](docs/sprints/) | Sprint 0 y Sprint Planning de cada sprint |
| [docs/historias/](docs/historias/) | Fichas de historia refinadas |
| [docs/pruebas/](docs/pruebas/) | Casos de prueba, resultados y defectos |
| [docs/metricas/](docs/metricas/) | Registro de fechas del flujo y métricas |
| [docs/reviews/](docs/reviews/) · [docs/retrospectivas/](docs/retrospectivas/) | Evidencia por sprint |
| [docs/decisiones/](docs/decisiones/) | Decisiones técnicas (ADR): stack, modelo de datos y arquitectura |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Ramas, commits y pull requests |
