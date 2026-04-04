const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PKG_PATH = path.join(ROOT, 'package.json')
const OPENCLAW_ROOT = path.join(ROOT, 'resources', 'openclaw-control')
const PUBLIC_API_ROOT = path.join(ROOT, 'resources', 'public-api-library')
const README_PATH = path.join(ROOT, 'README.md')
const SOFIA_MD_PATH = path.join(ROOT, 'SOFIA.md')

function readJson(filePath, fallback = {}) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

function nowIso() {
  return new Date().toISOString()
}

function safeList(values) {
  if (!Array.isArray(values) || values.length === 0) return '-'
  return values.join(', ')
}

function canonicalizePresentationName(value) {
  return String(value || '')
    .replace(/opencloud/gi, 'openclaw')
    .replace(/sandra/gi, 'sofia')
}

function generateReadme(pkg, inventory, libraryIndex, memoryPolicy, openClawRegistry, routingPolicy, publicApiRegistry, teachingManifest) {
  const summary = inventory.summary || {}
  const publicSummary = publicApiRegistry.summary || {}
  const capabilitySummary = openClawRegistry.summary || {}
  const routingSummary = routingPolicy.summary || {}

  return `# SOFIA 3.0

Electron + React control app para orquestacion visible de Sofia sobre OpenClaw, MCP y biblioteca RAC de APIs publicas.

## Estado dinamico
- Ultima actualizacion: ${nowIso()}
- Version app: ${pkg.version || 'n/a'}
- MCP total: ${summary.totalServers ?? 0} (configs: ${summary.configsFound ?? 0}/${summary.configsScanned ?? 0}, parseFailures: ${summary.parseFailures ?? 0})
- APIs publicas: ${publicSummary.totalEntries ?? 0} total / ${publicSummary.usableEntries ?? 0} usables / ${publicSummary.noiseEntries ?? 0} noise
- OpenClaw capabilities: ${capabilitySummary.totalCapabilities ?? 0}
- Context7 detectado en workspaces: ${(summary.context7Detected ?? []).length}
- Lanes de memoria Sofia/OpenClaw: ${(memoryPolicy.lanes ?? []).length}

## Prioridad de consulta
1. Biblioteca RAC local de APIs publicas
2. Servidores MCP locales y clonados
3. Biblioteca canonica local de OpenClaw
4. Context7
5. Fuentes oficiales externas

## Snapshot operativo
- MCP primario para datos publicos: ${publicApiRegistry.preferredMcpServer?.name || 'sin servidor online'}
- Orden canonico: ${safeList(routingSummary.defaultOrder)}
- Notas OpenClaw: ${(libraryIndex.notes ?? []).length}
- Teaching manifest: ${(teachingManifest.examples ?? []).length} ejemplos operativos

## Comandos
\`\`\`bash
npm run dev
npm run build
npm run sync:public-apis
npm run sync:openclaw-knowledge
npm run sync:docs
\`\`\`

## Politica de integracion
- OpenClaw es el unico nombre oficial.
- Sofia es la identidad principal del runtime.
- Las APIs publicas y MCP tienen prioridad sobre Context7 y navegacion general para datos estructurados.
- No fake UI: todo visible debe estar conectado a estado real o marcado como degraded, blocked, disabled o noise.
`
}

function generateSofiaMd(pkg, inventory, libraryIndex, memoryPolicy, routingPolicy, publicApiRegistry, mcpToolPriorityMap) {
  const summary = inventory.summary || {}
  const notable = Array.isArray(summary.notableServers) ? summary.notableServers.slice(0, 12) : []
  const lanes = Array.isArray(memoryPolicy.lanes) ? memoryPolicy.lanes : []
  const routing = Array.isArray(routingPolicy.consultationOrder) ? routingPolicy.consultationOrder : []
  const byClassification = publicApiRegistry.summary?.byClassification || {}
  const intents = Array.isArray(mcpToolPriorityMap.intents) ? mcpToolPriorityMap.intents.slice(0, 6) : []

  const notableLines = notable.length
    ? notable.map(item => `- ${item.editor}: ${canonicalizePresentationName(item.name)} (${item.transport})`).join('\n')
    : '- Sin snapshot de servidores notables.'

  const laneLines = lanes.length
    ? lanes.map(lane => `- ${lane.id} | owner: ${lane.owner} | scope: ${(lane.scope || []).join(', ')}`).join('\n')
    : '- Sin lanes definidas.'

  const routingLines = routing.length
    ? routing.map(item => `- ${item.priority}. ${item.surface} | ${item.reason}`).join('\n')
    : '- Sin politica de routing cargada.'

  const classLines = Object.entries(byClassification).length
    ? Object.entries(byClassification).map(([name, count]) => `- ${name}: ${count}`).join('\n')
    : '- Sin clasificaciones cargadas.'

  const intentLines = intents.length
    ? intents.map(intent => `- ${intent.label}: ${intent.preferredServer} -> ${intent.tool}`).join('\n')
    : '- Sin mapa de intenciones cargado.'

  return `# SOFIA.md

Documento operativo interno. Se regenera con \`npm run sync:docs\`.

## Snapshot
- Timestamp: ${nowIso()}
- Version app: ${pkg.version || 'n/a'}
- MCP total: ${summary.totalServers ?? 0}
- Editores: ${safeList(summary.editors)}
- APIs publicas: ${publicApiRegistry.summary?.totalEntries ?? 0} total / ${publicApiRegistry.summary?.usableEntries ?? 0} usables
- MCP primario: ${publicApiRegistry.preferredMcpServer?.name || 'sin servidor online'}

## Servidores notables
${notableLines}

## Memoria Sofia / OpenClaw
${laneLines}

## Routing de conocimiento
${routingLines}

## Curacion de APIs publicas
${classLines}

## Intenciones MCP
${intentLines}

## Regla de mantenimiento
- Cada implementacion relevante debe ejecutar:
  - \`npm run sync:public-apis\`
  - \`npm run sync:openclaw-knowledge\`
  - \`npm run sync:docs\`
- Objetivo: mantener README, SOFIA.md, Obsidian y los registros canonicamente alineados.
`
}

function main() {
  const pkg = readJson(PKG_PATH, {})
  const inventory = readJson(path.join(OPENCLAW_ROOT, 'editor-mcp-inventory.json'), {})
  const libraryIndex = readJson(path.join(OPENCLAW_ROOT, 'openclaw-library-index.json'), {})
  const memoryPolicy = readJson(path.join(OPENCLAW_ROOT, 'memory-policy.json'), {})
  const openClawRegistry = readJson(path.join(OPENCLAW_ROOT, 'openclaw-capability-registry.json'), {})
  const routingPolicy = readJson(path.join(OPENCLAW_ROOT, 'knowledge-routing-policy.json'), {})
  const mcpToolPriorityMap = readJson(path.join(OPENCLAW_ROOT, 'mcp-tool-priority-map.json'), {})
  const teachingManifest = readJson(path.join(OPENCLAW_ROOT, 'openclaw-teaching-manifest.json'), {})
  const publicApiRegistry = readJson(path.join(PUBLIC_API_ROOT, 'public-api-capability-registry.json'), {})

  const readme = generateReadme(pkg, inventory, libraryIndex, memoryPolicy, openClawRegistry, routingPolicy, publicApiRegistry, teachingManifest)
  const sofiaMd = generateSofiaMd(pkg, inventory, libraryIndex, memoryPolicy, routingPolicy, publicApiRegistry, mcpToolPriorityMap)

  fs.writeFileSync(README_PATH, readme, 'utf8')
  fs.writeFileSync(SOFIA_MD_PATH, sofiaMd, 'utf8')

  process.stdout.write(`synced docs: README.md + SOFIA.md @ ${nowIso()}\n`)
}

main()
