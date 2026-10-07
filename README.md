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
| GET | `/api/categorias` | HU-11 | ✅ (lectura) |
| GET | `/api/usuarios?rol=` | — | ✅ |
| POST | `/api/casos` | HU-01 | ✅ |
| GET | `/api/casos` | HU-02, HU-03, HU-09 | ⏳ Sprint 1 |
| PATCH | `/api/casos/:id/estado` | HU-05 | ⏳ Sprint 1 |
| PATCH | `/api/casos/:id/asignar` | HU-04 | ⏳ Sprint 2 |
| POST | `/api/casos/:id/atencion` | HU-06 | ⏳ Sprint 2 |
| POST | `/api/casos/:id/validacion` | HU-07 | ⏳ Sprint 2 |
| GET | `/api/casos/:id/historial` | HU-08 | ⏳ Sprint 2 |
| GET | `/api/casos/:id` | HU-12 | ⏳ Sprint 3 |
| GET | `/api/indicadores` | HU-10 | ⏳ Sprint 3 |

Los endpoints pendientes responden `501` hasta que se implementan.

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
