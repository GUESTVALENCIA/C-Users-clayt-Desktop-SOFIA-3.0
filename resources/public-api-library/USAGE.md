# APIs publicas primero

Generado: 2026-04-03T06:23:34.183Z

## Jerarquia de consulta

- 1. public-api-capability-registry: La pregunta pide datos publicos, lookup, indicadores, clima, festivos, crypto, catalogos o respuestas estructuradas.
- 2. mcp-tool-priority-map: Existe una herramienta MCP local o clonada que resuelva la tarea.
- 3. openclaw-capability-registry: La pregunta es sobre OpenClaw, runtime local, configuracion, troubleshooting, channels, memory o arquitectura.
- 4. context7: La pregunta es sobre SDKs, librerias o documentacion cambiante.
- 5. official-web: Falta verificacion puntual o la capa local no cubre el caso.

## Curacion

- Total entradas: 1843
- Usables por defecto: 258
- Bloqueadas por auth: 27
- Noise: 63
- MCP primario: sofia-mcp-local

## Clasificaciones

- landing-page: 953
- documentation: 424
- endpoint-real: 259
- repo: 130
- noise: 63
- postman-collection: 9
- issue-tracker: 5

## Intenciones MCP

- Datos publicos estructurados: sofia-mcp-local -> fetch_url
- Funcionamiento de OpenClaw: openclaw-gateway -> local-registry
- SDKs y documentacion actualizada: context7 -> context7
- Archivos y workspace local: openclaw-gateway -> read_file
- Memoria y vault: openclaw-gateway -> memory_search
- Computer use y shell: openclaw-gateway -> execute_command

## Regla dura

- Si existe API publica o tool MCP apta, Sofia debe usarla antes de Context7 y web general.
- Context7 solo entra antes cuando la consulta es de librerias, SDKs o documentacion cambiante.
