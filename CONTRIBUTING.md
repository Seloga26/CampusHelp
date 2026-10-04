# Cómo trabajamos en el repositorio

El historial de commits es evidencia evaluada (rúbrica: *Repositorio y documentación*), así que cada integrante hace commits con su propia cuenta y por su propio trabajo.

## Ramas

- `main`: siempre ejecutable. Solo se actualiza por Pull Request.
- Una rama por historia o tarea, creada desde `main`:
  - `feature/HU-01-registrar-caso`
  - `fix/DEF-03-filtro-prioridad`
  - `docs/retro-sprint-1`

```bash
git checkout main && git pull
git checkout -b feature/HU-01-registrar-caso
# ... trabajo y commits ...
git push -u origin feature/HU-01-registrar-caso
# abrir Pull Request en GitHub
```

## Mensajes de commit

Formato: `tipo(HU-XX): descripción en presente`

| Tipo | Uso |
|---|---|
| `feat` | Funcionalidad nueva |
| `fix` | Corrección de defecto |
| `test` | Pruebas |
| `docs` | Documentación |
| `refactor` | Cambio interno sin alterar comportamiento |
| `chore` | Configuración, dependencias |

Ejemplos:
- `feat(HU-01): validar descripción mínima de 10 caracteres`
- `fix(DEF-02): impedir cerrar caso sin solución`
- `docs: agregar retrospectiva sprint 1`

Commits pequeños y frecuentes; mejor varios al día que uno grande al final.

## Pull Requests

1. Usa la plantilla y enlaza la historia (`HU-XX`) o el defecto (`DEF-XX`).
2. `npm test` debe pasar.
3. No se requiere aprobación: quien abre el PR lo fusiona cuando `npm test` pasa. Si el cambio toca código de otra historia, avisar en la Daily o pedir un comentario antes de fusionar.
4. Tras el merge, mueve la tarjeta en el tablero y registra la fecha en `docs/metricas/registro_flujo.csv`.

## Relación con el tablero

Cada historia del tablero corresponde a un Issue de GitHub. Las columnas del tablero (Product Backlog | Ready | En análisis | En atención | En validación | Done) y los límites WIP están en [docs/scrumban.md](docs/scrumban.md).
