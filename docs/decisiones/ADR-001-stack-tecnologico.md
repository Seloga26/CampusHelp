# ADR-001 — Stack tecnológico

**Fecha:** 2026-10-03 · **Estado:** Aceptada

## Contexto

El Taller permite que el equipo proponga la tecnología si la documenta. Se requiere persistencia en base de datos, una API para el flujo principal y un frontend web, en 3 sprints de 1 semana con 3 integrantes.

## Decisión

- **Backend:** Node.js + Express (API REST siguiendo `api_sugerida_CampusHelp.json`).
- **Base de datos:** MySQL 8, partiendo del esquema entregado por el docente.
- **Frontend:** HTML, CSS y JavaScript sin framework, servido por Express.
- **Pruebas:** `node --test` (incluido en Node, sin dependencias extra).

## Consecuencias

- Un solo lenguaje (JavaScript) en frontend y backend reduce la curva de aprendizaje.
- El esquema del docente se usa casi sin cambios (ver ADR-002).
- Sin framework de frontend: menos configuración, pero hay que organizar bien el JS a medida que crezca.
- Cada integrante necesita MySQL instalado localmente.
