# SOFIA 3.0

Electron + React control app para orquestacion visible de Sofia, MCP y biblioteca RAG de APIs publicas.

## Estado dinamico
- Ultima actualizacion: 2026-04-03T06:23:34.374Z
- Version app: 3.0.0
- MCP total: 35 (configs: 8/9, parseFailures: 1)
- APIs publicas: 1843 total / 258 usables / 63 noise
- Context7 detectado en workspaces: 1
- Lanes de memoria Sofia: 3

## Prioridad de consulta
1. Biblioteca RAG local de APIs publicas
2. Servidores MCP locales y clonados
3. Context7
4. Fuentes oficiales externas

## Snapshot operativo
- MCP primario para datos publicos: sofia-mcp-local
- Orden canonico: public-api-capability-registry, mcp-tool-priority-map, context7, official-web
- Teaching manifest: 4 ejemplos operativos

## Comandos
```bash
npm run dev
npm run build
npm run sync:public-apis
npm run sync:openclaw-knowledge
npm run sync:docs
```

## Politica de integracion
- Sofia es el unico nombre oficial.
- Sofia es la identidad principal del runtime.
- Las APIs publicas y MCP tienen prioridad sobre Context7 y navegacion general para datos estructurados.
- No fake UI: todo visible debe estar conectado a estado real o marcado como degraded, blocked, disabled o noise.
