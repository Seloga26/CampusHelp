# ADR-002 — Ajustes al modelo de datos del docente

**Fecha:** 2026-10-03 · **Estado:** Aceptada

El Taller (sección 8) permite agregar campos o restricciones si se justifican. Cambios sobre `schema_CampusHelp.sql`:

| Cambio | Justificación |
|---|---|
| Juego de caracteres `utf8mb4` | Los valores del dominio llevan tildes ("En análisis", "Plataformas académicas") |
| `CHECK` en `caso.tipo`, `prioridad`, `estado` y `usuario.rol` | La BD rechaza valores fuera de las reglas de negocio (sección 7) aunque falle el backend |
| `CHECK` descripción ≥ 10 caracteres | Regla de HU-01 |
| `usuario.correo` único; `(area_id, nombre)` único en categoría | Evita usuarios y categorías duplicados |
| Campo `caso.fecha_inicio_atencion` | Permite calcular el tiempo de atención para indicadores (HU-10) |
| Índices en estado, tipo/prioridad, usuario, agente e historial | Consultas de bandeja, filtros (HU-09) e historial (HU-08) |
| `tipo` ampliado a `VARCHAR(25)` | "Solicitud de servicio" tiene 21 caracteres y no cabía en `VARCHAR(20)` |

La transición entre estados se valida en el backend (`src/services/estados.js`), no en la BD.
