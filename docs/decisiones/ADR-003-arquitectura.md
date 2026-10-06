# ADR-003 — Arquitectura limpia en capas con principios SOLID

**Fecha:** 2026-10-06 · **Estado:** Aceptada · **Reemplaza:** la organización inicial de `src/` descrita en ADR-001

## Contexto

La primera versión tenía rutas, servicios y acceso a datos, pero los servicios iban a llamar directamente a MySQL. Eso mezclaba SQL con reglas de negocio y obligaba a tener la base de datos corriendo para probar cualquier regla. Antes de empezar las historias del Sprint 1, el equipo decidió ordenar el backend con una arquitectura limpia aplicando SOLID.

## Decisión

El sistema es **cliente-servidor**: el navegador consume una **API REST** en Express, que guarda los datos en MySQL. Es un **monolito** (un solo proyecto que se despliega junto). El backend se organiza en **capas** que respetan la **regla de dependencias**: las capas externas conocen a las internas, nunca al revés.

```
            ┌──────────────────────────────────────────────┐
 Navegador  │ public/  HTML + JS por página                │
            └──────────────────┬───────────────────────────┘
                               │ HTTP / JSON
            ┌──────────────────▼───────────────────────────┐
 HTTP       │ src/routes/  +  src/middleware/              │  Express
            │ leer petición → llamar servicio → responder  │
            └──────────────────┬───────────────────────────┘
                               │ llama
            ┌──────────────────▼───────────────────────────┐
 Casos de   │ src/services/                                │  sin Express
 uso        │ registrarCaso, cambiarEstado, listarCasos…   │  sin MySQL
            └───────┬──────────────────────────┬───────────┘
                    │ usa reglas               │ usa (inyectado)
            ┌───────▼─────────┐      ┌─────────▼───────────┐
 Dominio    │ src/domain/     │      │ src/repositories/   │  único lugar
            │ estados,        │      │ SQL por entidad     │  con SQL
            │ catálogos,      │      └─────────┬───────────┘
            │ errores         │                │
            └─────────────────┘      ┌─────────▼───────────┐
                                     │ MySQL               │
                                     └─────────────────────┘

 src/config/contenedor.js arma todo: MySQL → repositorios → servicios → app
```

| Capa | Carpeta | Responsabilidad | Puede depender de |
|---|---|---|---|
| Dominio | `src/domain/` | Reglas puras: estados y transiciones, catálogos (tipos, prioridades, roles), errores del negocio | Nada |
| Casos de uso | `src/services/` | Una función por acción del usuario (HU). Valida, aplica reglas y coordina repositorios | Dominio y repositorios **recibidos como parámetro** |
| Repositorios | `src/repositories/` | Solo SQL. Un repositorio por entidad | Un `ejecutor` con `query()` (pool o conexión) |
| HTTP | `src/routes/`, `src/middleware/`, `src/app.js` | Traducir HTTP ↔ servicios. Convertir errores en códigos HTTP | Servicios y errores del dominio |
| Composición | `src/config/` | Crear la conexión a MySQL e inyectar dependencias | Todo (es el único lugar que lo hace) |

## Cómo se aplica SOLID

| Principio | Dónde se ve |
|---|---|
| **S** — Responsabilidad única | Cada capa tiene un solo motivo para cambiar: el SQL cambia solo en `repositories/`, las reglas en `domain/` y `services/`, el formato HTTP en `routes/`. Cada servicio implementa una sola acción. |
| **O** — Abierto/cerrado | El flujo de estados es una tabla (`TRANSICIONES` en `domain/estados.js`); cambiar el flujo no exige modificar `puedeTransicionar()`. Un caso de uso nuevo se agrega como archivo nuevo y una línea en el contenedor, sin tocar los existentes. |
| **L** — Sustitución de Liskov | Los repositorios en memoria de `tests/fakes/` cumplen el mismo contrato que los de MySQL; los servicios funcionan igual con ambos. |
| **I** — Segregación de interfaces | Repositorios pequeños por entidad (`casos`, `historial`, `usuarios`, `categorias`) en vez de un único objeto de acceso a datos. Cada ruta recibe solo los servicios que usa. |
| **D** — Inversión de dependencias | Los servicios no importan MySQL: reciben `repos` y `enTransaccion` desde `config/contenedor.js`. Las reglas de alto nivel no dependen de detalles de infraestructura. |

## Decisiones de detalle

- **Errores del negocio** (`domain/errores.js`): `ErrorValidacion` (400), `ErrorPermiso` (403), `ErrorNoEncontrado` (404), `ErrorConflicto` (409), `ErrorNoImplementado` (501). Los servicios lanzan el error y `middleware/errores.js` lo traduce. Errores inesperados responden 500 sin exponer detalles internos.
- **Transacciones**: `enTransaccion(async (tx) => { ... })` entrega repositorios que comparten una sola conexión; si algo falla, se hace ROLLBACK. Se usa cuando una acción escribe en varias tablas (ej.: caso + historial en HU-01 y HU-05).
- **Rutas del Sprint 1 ya conectadas**: `POST /api/casos`, `GET /api/casos` y `PATCH /api/casos/:id/estado` llaman a su servicio; los servicios y métodos de repositorio responden 501 hasta que cada historia los implemente. Así cada integrante trabaja en sus propios archivos.
- **Sin framework de inyección**: las dependencias se pasan como parámetros a funciones `crearX(...)`. Es suficiente para el tamaño del proyecto y fácil de explicar.

## Receta para implementar una historia

1. **Dominio** (si aplica): agrega la regla pura en `src/domain/` y su prueba en `tests/domain/`.
2. **Repositorio**: implementa tu método en `src/repositories/<entidad>Repository.js` (solo SQL).
3. **Servicio**: implementa tu caso de uso en `src/services/casos/<accion>.js`. Valida la entrada, aplica reglas y lanza errores del dominio. Usa `enTransaccion` si escribes en más de una tabla.
4. **Pruebas del servicio**: en `tests/services/`, con `crearReposEnMemoria()` (sin MySQL). Cubre los criterios de aceptación de la ficha.
5. **Ruta**: en el Sprint 1 ya está conectada. Para historias nuevas, regístrala en `src/config/contenedor.js` y agrega la ruta en `src/routes/`.
6. **Frontend**: tu página en `public/` consumiendo la API.
7. **Prueba real**: `npm run db:init`, `npm start` y ejecuta los casos de prueba (CP) de la ficha.

## Consecuencias

- **A favor:** reglas de negocio probables sin base de datos (`npm test` corre en segundos), SQL concentrado en un solo lugar, menos conflictos al trabajar en paralelo y una estructura fácil de defender.
- **En contra:** más archivos por historia (repositorio + servicio + prueba). Se acepta porque cada archivo es pequeño y tiene un propósito claro.
