# SOFIA.md

Documento operativo interno. Se regenera con `npm run sync:docs`.

## Snapshot
- Timestamp: 2026-04-03T06:23:34.376Z
- Version app: 3.0.0
- MCP total: 35
- Editores: SOFIA 3.0, VS Code, Cursor, Trae, Windsurf, Void
- APIs publicas: 1843 total / 258 usables
- MCP primario: sofia-mcp-local

## Servidores notables
- SOFIA 3.0: openclaw-local (http)
- SOFIA 3.0: context7 (stdio)
- SOFIA 3.0: g4f-official (stdio)
- VS Code: github/github-mcp-server (http)
- VS Code: neondatabase/mcp-server-neon (http)
- VS Code: figma/mcp-server-guide (http)
- VS Code: sofia-full-access (http)
- VS Code: sofia-mcp-native (tcp)
- VS Code: MCP_DOCKER (stdio)
- VS Code: ollama (stdio)
- VS Code: sofia-mcp-native (stdio)
- Cursor: sofia-mcp-adapter (stdio)

## Memoria Sofia / OpenClaw
- sofia-product-memory | owner: sofia-3.0 | scope: user, project, product, editorial
- sofia-openclaw-memory | owner: sofia-openclaw | scope: agent, workspace, operational, routing
- federation-bus | owner: shared-adapters | scope: task-state, booking-state, repair-state, swarm-state

## Routing de conocimiento
- 1. public-api-capability-registry | Menor coste en tokens y respuesta mas estructurada.
- 2. mcp-tool-priority-map | Menor latencia y ejecucion reproducible.
- 3. openclaw-capability-registry | La base local ya esta curada para este sistema.
- 4. context7 | Capa de actualizacion controlada.
- 5. official-web | Ultimo recurso, no primera opcion.

## Curacion de APIs publicas
- endpoint-real: 259
- documentation: 424
- postman-collection: 9
- landing-page: 953
- repo: 130
- issue-tracker: 5
- noise: 63

## Intenciones MCP
- Datos publicos estructurados: sofia-mcp-local -> fetch_url
- Funcionamiento de OpenClaw: openclaw-gateway -> local-registry
- SDKs y documentacion actualizada: context7 -> context7
- Archivos y workspace local: openclaw-gateway -> read_file
- Memoria y vault: openclaw-gateway -> memory_search
- Computer use y shell: openclaw-gateway -> execute_command

## Regla de mantenimiento
- Cada implementacion relevante debe ejecutar:
  - `npm run sync:public-apis`
  - `npm run sync:openclaw-knowledge`
  - `npm run sync:docs`
- Objetivo: mantener README, SOFIA.md, Obsidian y los registros canonicamente alineados.
