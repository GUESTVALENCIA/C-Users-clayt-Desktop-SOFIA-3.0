# SOFIA 3.0

Electron + React control app para orquestacion de SOFIA/Sandra/OpenClaw sin romper routers actuales.

## Estado dinamico
- Ultima actualizacion: 2026-03-27
- Version app: 3.0.0
- MCP total: 40 (configs: 9/9, parseFailures: 1)
- Editores auditados: 7
- Context7 detectado en workspaces: 2
- Notas OpenClaw en biblioteca: 8
- Lanes de memoria Sandra/Sofia: 3

## Layout actual
- Sidebars flotantes izquierda/derecha (Home/Studio + Monitor/Ops)
- Composer flotante inferior responsive
- Barra superior: selectores de router + Paleta + Maintenance + Actions
- Bandeja terminal operativa inferior (real, no fake)

## Comandos
```bash
npm run dev
npm run build
npm run sync:openclaw-knowledge
npm run sync:docs
```

## Build local (Windows unpacked)
- Salida oficial: `release/win-unpacked/SOFÍA.exe`
- Wrapper estable: `launch-sofia.cmd`
- Acceso directo oficial: `C:\Users\clayt\Desktop\SOFÍA.lnk`
- Los `release-ui*` no son destino oficial del acceso directo

## Politica de integracion
- No tocar system prompt actual.
- No romper selectores/router de SOFIA 3.0.
- No fake UI: todo visible conectado a estado real o marcado como unavailable/degraded.
