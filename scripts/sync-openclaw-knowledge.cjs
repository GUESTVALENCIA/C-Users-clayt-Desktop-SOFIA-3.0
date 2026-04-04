'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_SOFIA_AI_ROOT = 'C:\\Users\\clayt\\Desktop\\SOFIA AI\\sofia-ai';
const SOFIA_AI_ROOT = path.resolve(process.env.SOFIA_AI_ROOT || DEFAULT_SOFIA_AI_ROOT);

const OPENCLAW_CONTROL_ROOT = path.join(ROOT, 'resources', 'openclaw-control');
const OPENCLAW_NOTES_ROOT = path.join(OPENCLAW_CONTROL_ROOT, 'notes');
const PUBLIC_API_ROOT = path.join(ROOT, 'resources', 'public-api-library');

const EDITOR_INVENTORY_PATH = path.join(OPENCLAW_CONTROL_ROOT, 'editor-mcp-inventory.json');
const OPENCLAW_LIBRARY_INDEX_PATH = path.join(OPENCLAW_CONTROL_ROOT, 'openclaw-library-index.json');
const MEMORY_POLICY_PATH = path.join(OPENCLAW_CONTROL_ROOT, 'memory-policy.json');
const OPENCLAW_CAPABILITY_REGISTRY_PATH = path.join(OPENCLAW_CONTROL_ROOT, 'openclaw-capability-registry.json');
const KNOWLEDGE_ROUTING_POLICY_PATH = path.join(OPENCLAW_CONTROL_ROOT, 'knowledge-routing-policy.json');
const MCP_TOOL_PRIORITY_MAP_PATH = path.join(OPENCLAW_CONTROL_ROOT, 'mcp-tool-priority-map.json');
const TEACHING_MANIFEST_PATH = path.join(OPENCLAW_CONTROL_ROOT, 'openclaw-teaching-manifest.json');

const PUBLIC_API_LIBRARY_PATH = path.join(PUBLIC_API_ROOT, 'public-api-library.json');
const PUBLIC_API_STATUS_PATH = path.join(PUBLIC_API_ROOT, 'public-api-library-status.json');
const PUBLIC_API_INDEX_PATH = path.join(PUBLIC_API_ROOT, 'INDEX.md');
const PUBLIC_API_CAPABILITY_REGISTRY_PATH = path.join(PUBLIC_API_ROOT, 'public-api-capability-registry.json');
const PUBLIC_API_USAGE_GUIDE_PATH = path.join(PUBLIC_API_ROOT, 'USAGE.md');

const OPENCLAW_VAULT_ROOT = path.join(SOFIA_AI_ROOT, 'sofia-vault', 'Conocimiento', 'OpenClaw');
const PUBLIC_API_VAULT_ROOT = path.join(SOFIA_AI_ROOT, 'sofia-vault', 'Conocimiento', 'Public-APIs');

const SOURCE_URLS = {
  home: 'https://docs.openclaw.ai/',
  docsDirectory: 'https://docs.openclaw.ai/start/docs-directory',
  install: 'https://docs.openclaw.ai/install/index',
  gateway: 'https://docs.openclaw.ai/gateway/configuration',
  configExamples: 'https://docs.openclaw.ai/gateway/configuration-examples',
  channels: 'https://docs.openclaw.ai/channels/index',
  routing: 'https://docs.openclaw.ai/channels/channel-routing',
  features: 'https://docs.openclaw.ai/concepts/features',
  multiAgent: 'https://docs.openclaw.ai/concepts/multi-agent',
  agent: 'https://docs.openclaw.ai/concepts/agent',
  context: 'https://docs.openclaw.ai/concepts/context',
  contextEngine: 'https://docs.openclaw.ai/concepts/context-engine',
  memory: 'https://docs.openclaw.ai/concepts/memory',
  compaction: 'https://docs.openclaw.ai/concepts/compaction',
  presence: 'https://docs.openclaw.ai/concepts/presence',
  streaming: 'https://docs.openclaw.ai/concepts/streaming',
  nodes: 'https://docs.openclaw.ai/nodes',
  web: 'https://docs.openclaw.ai/web/control-ui',
  dashboard: 'https://docs.openclaw.ai/web/dashboard',
  security: 'https://docs.openclaw.ai/gateway/security',
  troubleshooting: 'https://docs.openclaw.ai/help/troubleshooting',
  skills: 'https://docs.openclaw.ai/tools/skills',
  plugins: 'https://docs.openclaw.ai/tools/plugin',
  clawhub: 'https://docs.openclaw.ai/tools/clawhub',
};

const CONFIG_TARGETS = [
  { id: 'sofia-3-workspace', editor: 'SOFIA 3.0', path: path.join(ROOT, '.mcp.json'), kind: 'workspace' },
  { id: 'sofia-ai-workspace', editor: 'sofia-ai', path: path.join(SOFIA_AI_ROOT, '.mcp.json'), kind: 'workspace' },
  { id: 'vscode-mcp', editor: 'VS Code', path: 'C:\\Users\\clayt\\AppData\\Roaming\\Code\\User\\mcp.json', kind: 'editor-mcp' },
  { id: 'vscode-settings', editor: 'VS Code', path: 'C:\\Users\\clayt\\AppData\\Roaming\\Code\\User\\settings.json', kind: 'editor-settings' },
  { id: 'cursor-settings', editor: 'Cursor', path: 'C:\\Users\\clayt\\AppData\\Roaming\\Cursor\\User\\settings.json', kind: 'editor-settings' },
  { id: 'trae-mcp', editor: 'Trae', path: 'C:\\Users\\clayt\\AppData\\Roaming\\Trae\\User\\mcp.json', kind: 'editor-mcp' },
  { id: 'trae-settings', editor: 'Trae', path: 'C:\\Users\\clayt\\AppData\\Roaming\\Trae\\User\\settings.json', kind: 'editor-settings' },
  { id: 'windsurf-settings', editor: 'Windsurf', path: 'C:\\Users\\clayt\\AppData\\Roaming\\Windsurf\\User\\settings.json', kind: 'editor-settings' },
  { id: 'void-settings', editor: 'Void', path: 'C:\\Users\\clayt\\AppData\\Roaming\\Void\\User\\settings.json', kind: 'editor-settings' },
];

const KNOWN_MCP_INTENTS = [
  { id: 'structured-public-data', label: 'Datos publicos estructurados', category: 'public-api', tool: 'fetch_url', serverType: 'api', fallback: ['context7', 'official-web'] },
  { id: 'openclaw-runtime', label: 'Funcionamiento de OpenClaw', category: 'openclaw-knowledge', tool: 'local-registry', serverType: 'knowledge', fallback: ['context7', 'official-web'] },
  { id: 'sdk-or-library-docs', label: 'SDKs y documentacion actualizada', category: 'context7', tool: 'context7', serverType: 'context7', fallback: ['official-web'] },
  { id: 'file-work', label: 'Archivos y workspace local', category: 'filesystem', tool: 'read_file', serverType: 'openclaw-gateway', fallback: ['search_files'] },
  { id: 'memory-and-knowledge', label: 'Memoria y vault', category: 'memory', tool: 'memory_search', serverType: 'openclaw-gateway', fallback: ['vault_search'] },
  { id: 'system-actions', label: 'Computer use y shell', category: 'execution', tool: 'execute_command', serverType: 'openclaw-gateway', fallback: ['capture_screen', 'execute_desktop'] },
  { id: 'business-ops', label: 'GuestsValencia y datos internos', category: 'business', tool: 'check_bookings', serverType: 'openclaw-gateway', fallback: ['neon_query', 'create_report'] },
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeText(filePath, text) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, text, 'utf8');
}

function writeJson(filePath, value) {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function stripJsonComments(input) {
  let text = String(input || '').replace(/^\uFEFF/, '');
  text = text.replace(/\/\*[\s\S]*?\*\//g, '');
  text = text.replace(/(^|[^:\\])\/\/.*$/gm, '$1');
  text = text.replace(/,\s*([}\]])/g, '$1');
  return text;
}

function repairLooseJsonStrings(input) {
  const text = String(input || '');
  let output = '';
  let inString = false;
  let escape = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (!inString) {
      output += char;
      if (char === '"') inString = true;
      continue;
    }
    if (escape) {
      output += char;
      escape = false;
      continue;
    }
    if (char === '\\') {
      const next = text[index + 1] || '';
      if (/["\\/bfnrtu]/.test(next)) {
        output += char;
        escape = true;
      } else {
        output += '\\\\';
      }
      continue;
    }
    if (char === '"') {
      inString = false;
      output += char;
      continue;
    }
    if (char === '\n') {
      output += '\\n';
      continue;
    }
    if (char === '\r') {
      output += '\\r';
      continue;
    }
    if (char === '\t') {
      output += '\\t';
      continue;
    }
    if (char.charCodeAt(0) < 32) {
      output += ' ';
      continue;
    }
    output += char;
  }

  return output;
}

function parseJsoncFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(stripJsonComments(raw));
    } catch {
      return JSON.parse(repairLooseJsonStrings(stripJsonComments(raw)));
    }
  }
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  const results = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(item);
  }
  return results;
}

function slugify(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
}

function canonicalizePresentationName(value) {
  return String(value || '')
    .replace(/opencloud/gi, 'openclaw')
    .replace(/sandra/gi, 'sofia');
}

function canonicalizePresentationText(value) {
  return String(value || '')
    .replace(/OpenCloud/g, 'OpenClaw')
    .replace(/opencloud/g, 'openclaw')
    .replace(/Sandra/g, 'Sofia')
    .replace(/sandra/g, 'sofia');
}

function safeHost(url) {
  try {
    return new URL(String(url || '')).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function safePath(url) {
  try {
    return new URL(String(url || '')).pathname.toLowerCase();
  } catch {
    return '';
  }
}

function isSecretKey(key) {
  return /(token|secret|password|key|credential|bearer|auth)/i.test(String(key || ''));
}

function sanitizeEnv(env) {
  if (!env || typeof env !== 'object') return { keys: [], values: {} };
  const values = {};
  for (const [key, value] of Object.entries(env)) {
    values[key] = isSecretKey(key) ? '<redacted>' : String(value);
  }
  return { keys: Object.keys(env), values };
}

function makeCapability(config) {
  return {
    id: config.id,
    category: config.category,
    title: config.title,
    officialName: 'OpenClaw',
    summary: config.summary,
    howItWorks: config.summary,
    howSofiaShouldUseIt: config.summary,
    localStatus: config.localStatus || 'configured',
    queryPriority: config.queryPriority || 3,
    preferredExecutionSurface: config.preferredExecutionSurface,
    apiFamily: config.apiFamily,
    mcpServer: config.mcpServer || null,
    latencyClass: config.latencyClass || 'medium',
    tokenSavingsValue: config.tokenSavingsValue == null ? 40 : config.tokenSavingsValue,
    qualityTier: config.qualityTier == null ? 70 : config.qualityTier,
    requiresNetwork: config.requiresNetwork === true,
    requiresAuth: config.requiresAuth === true,
    localCacheable: config.localCacheable !== false,
    safeForDefaultUse: config.safeForDefaultUse !== false,
    sources: [config.source].filter(Boolean),
    localEvidence: config.localEvidence || [],
  };
}

function removeStaleFiles(dirPath, keepFiles) {
  if (!fs.existsSync(dirPath)) return;
  const keep = new Set(keepFiles);
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith('.md')) continue;
    if (keep.has(entry.name)) continue;
    fs.unlinkSync(path.join(dirPath, entry.name));
  }
}

function readPublicApiDataset() {
  return {
    library: readJson(PUBLIC_API_LIBRARY_PATH, {
      generatedAt: null,
      totalApis: 0,
      totalSources: 0,
      stats: { bySource: {}, byCategory: {} },
      mcp: { ok: false, reason: 'missing', servers: [] },
      entries: [],
    }),
    status: readJson(PUBLIC_API_STATUS_PATH, {
      generatedAt: null,
      totalApis: 0,
      totalSources: 0,
      stats: { bySource: {}, byCategory: {} },
      mcp: { ok: false, reason: 'missing', servers: [] },
    }),
  };
}

function extractObjectBlock(raw, propertyNames) {
  for (const propertyName of propertyNames) {
    const marker = `"${propertyName}"`;
    const markerIndex = raw.indexOf(marker);
    if (markerIndex === -1) continue;
    const braceStart = raw.indexOf('{', markerIndex);
    if (braceStart === -1) continue;
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let index = braceStart; index < raw.length; index += 1) {
      const char = raw[index];
      if (inString) {
        if (escape) {
          escape = false;
          continue;
        }
        if (char === '\\') {
          escape = true;
          continue;
        }
        if (char === '"') inString = false;
        continue;
      }
      if (char === '"') {
        inString = true;
        continue;
      }
      if (char === '{') depth += 1;
      if (char === '}') {
        depth -= 1;
        if (depth === 0) return raw.slice(braceStart, index + 1);
      }
    }
  }
  return null;
}

function extractServersFromFallbackBlock(source, raw) {
  const block = extractObjectBlock(raw, ['mcp.servers', 'mcpServers', 'servers']);
  if (!block) return [];
  try {
    const parsed = JSON.parse(repairLooseJsonStrings(stripJsonComments(block)));
    return extractServers(source, { 'mcp.servers': parsed });
  } catch {
    return [];
  }
}

function summarizeServer(name, config, source) {
  const env = sanitizeEnv(config?.env);
  const transport = config?.url
    ? 'http'
    : config?.host || config?.port || config?.type === 'tcp'
      ? 'tcp'
      : config?.command
        ? 'stdio'
        : config?.type || 'unknown';

  return {
    name,
    displayName: canonicalizePresentationName(name),
    sourceId: source.id,
    editor: source.editor,
    kind: source.kind,
    transport,
    type: config?.type || transport,
    url: typeof config?.url === 'string' ? config.url : null,
    host: typeof config?.host === 'string' ? config.host : null,
    port: Number.isFinite(Number(config?.port)) ? Number(config.port) : null,
    command: typeof config?.command === 'string' ? config.command : null,
    args: Array.isArray(config?.args) ? config.args.map((item) => String(item)) : typeof config?.args === 'string' ? [config.args] : [],
    cwd: typeof config?.cwd === 'string' ? config.cwd : null,
    autostart: config?.autostart === true || config?.autoStart === true,
    description: typeof config?.description === 'string' ? config.description : null,
    displayDescription: typeof config?.description === 'string' ? canonicalizePresentationText(config.description) : null,
    version: typeof config?.version === 'string' ? config.version : null,
    gallery: typeof config?.gallery === 'string' ? config.gallery : null,
    envKeys: env.keys,
    env: env.values,
  };
}

function extractServers(source, parsed) {
  const servers = [];
  if (parsed?.mcpServers && typeof parsed.mcpServers === 'object') {
    for (const [name, config] of Object.entries(parsed.mcpServers)) servers.push(summarizeServer(name, config, source));
  }
  if (parsed?.servers && typeof parsed.servers === 'object') {
    for (const [name, config] of Object.entries(parsed.servers)) servers.push(summarizeServer(name, config, source));
  }
  if (parsed?.['mcp.servers'] && typeof parsed['mcp.servers'] === 'object') {
    for (const [name, config] of Object.entries(parsed['mcp.servers'])) servers.push(summarizeServer(name, config, source));
  }
  return servers;
}

function readConfigInventory(source) {
  const exists = fs.existsSync(source.path);
  const record = { ...source, exists, parseOk: false, context7Detected: false, notes: [], servers: [] };
  if (!exists) return record;

  const raw = fs.readFileSync(source.path, 'utf8');
  record.context7Detected = /context7/i.test(raw);

  try {
    const parsed = parseJsoncFile(source.path);
    record.parseOk = true;
    record.servers = extractServers(source, parsed);
    if (parsed?.['mcp.autoStart'] !== undefined) record.notes.push(`mcp.autoStart=${String(parsed['mcp.autoStart'])}`);
    if (parsed?.['chat.mcp.autostart'] !== undefined) record.notes.push(`chat.mcp.autostart=${String(parsed['chat.mcp.autostart'])}`);
    if (parsed?.['chat.mcp.gallery.enabled'] !== undefined) record.notes.push(`chat.mcp.gallery.enabled=${String(parsed['chat.mcp.gallery.enabled'])}`);
    if (parsed?.['chat.mcp.discovery.enabled'] !== undefined) record.notes.push('chat.mcp.discovery.enabled=present');
    if (parsed?.['trae.mcp.beta.enableWorkspaceMcp'] !== undefined) record.notes.push(`trae.mcp.beta.enableWorkspaceMcp=${String(parsed['trae.mcp.beta.enableWorkspaceMcp'])}`);
    if (/public-api/i.test(JSON.stringify(parsed))) record.notes.push('public-api-reference-detected');
  } catch (error) {
    record.notes.push(`parse-error:${error.message || error}`);
    const fallbackServers = extractServersFromFallbackBlock(source, raw);
    if (fallbackServers.length > 0) {
      record.servers = fallbackServers;
      record.notes.push('fallback-mcp-block-extracted');
    }
  }

  return record;
}

function buildInventory() {
  const configs = CONFIG_TARGETS.map(readConfigInventory);
  const allServers = uniqueBy(
    configs.flatMap((config) => config.servers),
    (server) => `${server.editor}:${server.name}:${server.transport}:${server.url || `${server.host || ''}:${server.port || ''}`}:${server.command || ''}`,
  );

  const summary = {
    generatedAt: new Date().toISOString(),
    configsScanned: configs.length,
    configsFound: configs.filter((item) => item.exists).length,
    parseFailures: configs.filter((item) => item.exists && !item.parseOk).length,
    editors: uniqueBy(configs.filter((item) => item.exists), (item) => item.editor).map((item) => item.editor),
    totalServers: allServers.length,
    transports: allServers.reduce((acc, server) => {
      acc[server.transport] = (acc[server.transport] || 0) + 1;
      return acc;
    }, {}),
    context7Detected: configs.filter((item) => item.context7Detected).map((item) => item.path),
    notableServers: allServers
      .filter((server) => /sofia|openclaw|opencloud|g4f|context7|mcp|public-api|neon|github|docker/i.test(`${server.name} ${server.description || ''}`))
      .map((server) => ({ editor: server.editor, name: server.displayName || server.name, rawName: server.name, transport: server.transport })),
  };

  return { summary, configs, servers: allServers };
}

function buildMemoryPolicy(inventory) {
  return {
    generatedAt: inventory.summary.generatedAt,
    policyVersion: 2,
    state: 'active',
    officialIdentity: 'sofia-openclaw',
    legacyAliases: ['sandra-openclaw-memory'],
    lanes: [
      {
        id: 'sofia-product-memory',
        owner: 'sofia-3.0',
        storage: ['neon', 'conversation-db', 'legacy-memory'],
        scope: ['user', 'project', 'product', 'editorial'],
        writeMode: 'owned',
        visible: true,
        description: 'Memoria de producto, usuario y contexto editorial de Sofia 3.0.',
      },
      {
        id: 'sofia-openclaw-memory',
        owner: 'sofia-openclaw',
        storage: ['agent-workspace', 'MEMORY.md', 'daily-memory', 'compaction-history', 'knowledge-registry'],
        scope: ['agent', 'workspace', 'operational', 'routing'],
        writeMode: 'owned',
        visible: true,
        description: 'Memoria operativa y de runtime de Sofia como agente principal OpenClaw.',
      },
      {
        id: 'federation-bus',
        owner: 'shared-adapters',
        storage: ['bridge-events', 'snapshots', 'status-exports', 'routing-events'],
        scope: ['task-state', 'booking-state', 'repair-state', 'swarm-state'],
        writeMode: 'replicated',
        visible: true,
        description: 'Capa federada para snapshots y estados sin mezclar memorias crudas.',
      },
    ],
    forbiddenSharing: ['system-prompt', 'auth-profiles', 'workspace-memory-files', 'raw-agent-session-history'],
    adapters: ['openclaw-bridge', 'event-bus', 'service-registry', 'status-snapshots', 'knowledge-routing-policy'],
    docs: [SOURCE_URLS.memory, SOURCE_URLS.compaction, SOURCE_URLS.context, SOURCE_URLS.contextEngine, SOURCE_URLS.multiAgent, SOURCE_URLS.agent],
  };
}

function inferClassification(entry) {
  const url = String(entry.url || '').toLowerCase();
  const host = safeHost(url);
  const pathname = safePath(url);
  const origin = String(entry.origin || '').toLowerCase();
  const sourceType = String(entry.sourceType || '').toLowerCase();

  if (
    origin.includes('contributing') ||
    origin.includes('security.md') ||
    origin.includes('sponsors') ||
    origin.includes('.github/workflows') ||
    origin.includes('robots.txt') ||
    url.includes('run-collection') ||
    url.includes('/button.svg') ||
    url.includes('utm_source=github') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.pdf')
  ) return { classification: 'noise', operationalDocs: false, confidence: 0.95 };

  if (/github\.com\/.+\/(issues|pulls|discussions)(\/|$)/.test(url)) return { classification: 'issue-tracker', operationalDocs: false, confidence: 0.98 };
  if (/github\.com\/.+\/.+/.test(url) || host === 'github.com') return { classification: 'repo', operationalDocs: false, confidence: 0.95 };
  if (url.includes('postman.com') || url.includes('run-collection')) return { classification: 'postman-collection', operationalDocs: false, confidence: 0.92 };
  if (entry.sourceId === 'msp-oracle') return { classification: 'endpoint-real', operationalDocs: false, confidence: 0.99 };

  const documentationSignals = ['/docs', 'docs.', '/developer', '/developers', '/reference', '/swagger', '/redoc', '/api-doc', '/api-docs', 'apiary', 'readthedocs', 'documentation'];
  const endpointSignals = ['/api/', '/v1/', '/v2/', '/v3/', '/graphql', '/forecast', '/fact', '/facts', '/spot'];

  if (endpointSignals.some((signal) => pathname.includes(signal)) || host.startsWith('api.') || host.includes('open-meteo') || sourceType === 'git-table') {
    return { classification: 'endpoint-real', operationalDocs: false, confidence: 0.82 };
  }

  if (documentationSignals.some((signal) => url.includes(signal))) {
    const operationalDocs = !origin.includes('readme') && !origin.includes('contributing');
    return { classification: 'documentation', operationalDocs, confidence: operationalDocs ? 0.87 : 0.7 };
  }

  if (host && pathname === '/') return { classification: 'landing-page', operationalDocs: false, confidence: 0.6 };
  return { classification: 'landing-page', operationalDocs: false, confidence: 0.45 };
}

function inferRequiresAuth(entry, classification) {
  const url = String(entry.url || '').toLowerCase();
  const host = safeHost(url);
  if (classification === 'noise' || classification === 'repo' || classification === 'issue-tracker') return false;
  if (entry.sourceId === 'msp-oracle') return false;
  if (host.includes('coinbase.com') || host.includes('frankfurter.app') || host.includes('open-meteo.com') || host.includes('date.nager.at')) return false;
  const authVendors = ['apilayer.com', 'abstractapi.com', 'fixer.io', 'aviationstack.com', 'marketstack.com', 'numverify.com', 'weatherstack.com', 'coinapi.io', 'alchemy.com', 'etherscan.io', 'graphhopper.com', 'amadeus.com'];
  if (authVendors.some((vendor) => host.includes(vendor))) return true;
  return url.includes('api_key') || url.includes('apikey') || url.includes('access_key') || url.includes('token=');
}

function qualityScoreForClassification(classification, operationalDocs, requiresAuth) {
  if (classification === 'endpoint-real') return requiresAuth ? 58 : 95;
  if (classification === 'documentation') return operationalDocs ? 78 : 50;
  if (classification === 'postman-collection') return 35;
  if (classification === 'landing-page') return 24;
  if (classification === 'repo') return 18;
  if (classification === 'issue-tracker') return 10;
  return 0;
}

function tokenSavingsForClassification(classification, operationalDocs, requiresAuth) {
  if (classification === 'endpoint-real') return requiresAuth ? 45 : 95;
  if (classification === 'documentation') return operationalDocs ? 62 : 30;
  if (classification === 'postman-collection') return 18;
  if (classification === 'landing-page') return 10;
  if (classification === 'repo') return 8;
  if (classification === 'issue-tracker') return 2;
  return 0;
}

function localStatusForEntry(classification, operationalDocs, requiresAuth) {
  if (classification === 'noise') return 'noise';
  if (requiresAuth) return 'blocked';
  if (classification === 'endpoint-real') return 'active';
  if (classification === 'documentation' && operationalDocs) return 'configured';
  if (classification === 'documentation' || classification === 'postman-collection') return 'degraded';
  return 'disabled';
}

function queryPriorityForEntry(classification, operationalDocs, requiresAuth) {
  if (classification === 'endpoint-real' && !requiresAuth) return 1;
  if (classification === 'documentation' && operationalDocs && !requiresAuth) return 2;
  if (classification === 'documentation') return 4;
  if (classification === 'postman-collection') return 5;
  if (classification === 'landing-page') return 6;
  if (classification === 'repo') return 7;
  if (classification === 'issue-tracker') return 8;
  return 99;
}

function preferredMcpServer(publicApiStatus) {
  const servers = Array.isArray(publicApiStatus?.mcp?.servers) ? publicApiStatus.mcp.servers : [];
  return servers.find((server) => server.name === 'sofia-mcp-local' && server.status === 'online')
    || servers.find((server) => server.status === 'online')
    || servers[0]
    || null;
}

function buildPublicApiCapabilityRegistry(publicApiLibrary, publicApiStatus) {
  const generatedAt = new Date().toISOString();
  const preferredServer = preferredMcpServer(publicApiStatus);
  const entries = Array.isArray(publicApiLibrary?.entries) ? publicApiLibrary.entries : [];

  const normalizedEntries = entries.map((entry, index) => {
    const { classification, operationalDocs, confidence } = inferClassification(entry);
    const requiresAuth = inferRequiresAuth(entry, classification);
    const localStatus = localStatusForEntry(classification, operationalDocs, requiresAuth);
    const safeForDefaultUse = !requiresAuth && (classification === 'endpoint-real' || (classification === 'documentation' && operationalDocs));
    return {
      id: `public-api-${String(index + 1).padStart(4, '0')}-${slugify(entry.name || safeHost(entry.url) || 'api')}`,
      title: entry.name || safeHost(entry.url) || 'Public API',
      category: entry.category || 'unsorted',
      apiFamily: safeHost(entry.url),
      url: entry.url,
      sourceId: entry.sourceId,
      sourceType: entry.sourceType,
      origin: entry.origin,
      classification,
      operationalDocs,
      classificationConfidence: confidence,
      preferredExecutionSurface: safeForDefaultUse ? 'mcp-tool:fetch_url' : classification === 'repo' ? 'official-web' : 'web-review',
      mcpServer: safeForDefaultUse ? preferredServer?.name || null : null,
      queryPriority: queryPriorityForEntry(classification, operationalDocs, requiresAuth),
      latencyClass: classification === 'endpoint-real' ? 'fast' : classification === 'documentation' ? 'medium' : 'slow',
      tokenSavingsValue: tokenSavingsForClassification(classification, operationalDocs, requiresAuth),
      qualityTier: qualityScoreForClassification(classification, operationalDocs, requiresAuth),
      requiresNetwork: true,
      requiresAuth,
      localCacheable: classification === 'endpoint-real' || classification === 'documentation',
      safeForDefaultUse,
      localStatus,
      notes: safeForDefaultUse
        ? 'Usar antes de Context7 y web general cuando la consulta pida datos publicos o lookup estructurado.'
        : classification === 'noise'
          ? 'No usar como ruta automatica.'
          : 'Solo usar como apoyo o revision manual.',
    };
  });

  normalizedEntries.sort((left, right) => {
    if (left.queryPriority !== right.queryPriority) return left.queryPriority - right.queryPriority;
    if (left.qualityTier !== right.qualityTier) return right.qualityTier - left.qualityTier;
    return String(left.title).localeCompare(String(right.title));
  });

  const byClassification = normalizedEntries.reduce((acc, entry) => {
    acc[entry.classification] = (acc[entry.classification] || 0) + 1;
    return acc;
  }, {});

  const topDomains = Object.entries(
    normalizedEntries.reduce((acc, entry) => {
      if (!entry.apiFamily) return acc;
      acc[entry.apiFamily] = (acc[entry.apiFamily] || 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([host, count]) => ({ host, count }));

  return {
    generatedAt,
    preferredMcpServer: preferredServer
      ? { name: preferredServer.name, status: preferredServer.status, host: preferredServer.host, port: preferredServer.port }
      : null,
    summary: {
      totalEntries: normalizedEntries.length,
      usableEntries: normalizedEntries.filter((entry) => entry.safeForDefaultUse).length,
      blockedEntries: normalizedEntries.filter((entry) => entry.localStatus === 'blocked').length,
      noiseEntries: normalizedEntries.filter((entry) => entry.localStatus === 'noise').length,
      documentationEntries: byClassification.documentation || 0,
      byClassification,
      byCategory: publicApiLibrary?.stats?.byCategory || {},
      bySource: publicApiLibrary?.stats?.bySource || {},
      topDomains,
    },
    sources: Array.isArray(publicApiLibrary?.sources) ? publicApiLibrary.sources : [],
    mcp: publicApiStatus?.mcp || publicApiLibrary?.mcp || { ok: false, reason: 'missing', servers: [] },
    entries: normalizedEntries,
  };
}

function buildOpenClawCapabilityRegistry(inventory, publicApiRegistry) {
  const generatedAt = inventory.summary.generatedAt;
  const preferredServer = publicApiRegistry.preferredMcpServer?.name || 'sofia-mcp-local';
  const entries = [
    makeCapability({ id: 'cap-public-api-rac', category: 'public-api', title: 'Biblioteca RAC de APIs publicas', summary: 'La primera ruta para datos publicos, lookup y respuestas estructuradas vive en la biblioteca curada de APIs publicas. Sofia debe intentar esta capa antes de navegar o resumir desde memoria.', source: PUBLIC_API_INDEX_PATH, localStatus: publicApiRegistry.summary.usableEntries > 0 ? 'active' : 'degraded', queryPriority: 1, preferredExecutionSurface: 'public-api-capability-registry', apiFamily: 'public-data', mcpServer: preferredServer, latencyClass: 'fast', tokenSavingsValue: 95, qualityTier: 100, requiresNetwork: true, localCacheable: true, localEvidence: [`usable=${publicApiRegistry.summary.usableEntries}`, `noise=${publicApiRegistry.summary.noiseEntries}`] }),
    makeCapability({ id: 'cap-mcp-local', category: 'mcp', title: 'Servidores MCP locales y clonados', summary: 'Los servidores MCP son la segunda capa operativa. Sofia debe usar fetch_url, herramientas del gateway y servidores locales antes de Context7 o web general cuando exista una herramienta adecuada.', source: SOURCE_URLS.gateway, localStatus: inventory.summary.totalServers > 0 ? 'active' : 'degraded', queryPriority: 2, preferredExecutionSurface: 'mcp-tool-priority-map', apiFamily: 'mcp-runtime', mcpServer: preferredServer, latencyClass: 'fast', tokenSavingsValue: 90, qualityTier: 96, requiresNetwork: true, localEvidence: [`servers=${inventory.summary.totalServers}`, `context7=${inventory.summary.context7Detected.length}`] }),
    makeCapability({ id: 'cap-openclaw-library', category: 'knowledge', title: 'Biblioteca local canonica de OpenClaw', summary: 'La explicacion del sistema OpenClaw, su instalacion, routing, memoria, skills, plugins, nodos y troubleshooting debe salir primero de la biblioteca local generada en este repo.', source: SOURCE_URLS.docsDirectory, localStatus: 'active', queryPriority: 3, preferredExecutionSurface: 'openclaw-capability-registry', apiFamily: 'openclaw-knowledge', latencyClass: 'fast', tokenSavingsValue: 85, qualityTier: 94, localEvidence: [`notes-root=${OPENCLAW_NOTES_ROOT}`] }),
    makeCapability({ id: 'cap-context7', category: 'context7', title: 'Context7 como capa de actualizacion', summary: 'Context7 se usa para librerias, SDKs y documentacion actualizada. No sustituye a la biblioteca RAC de APIs publicas ni al conocimiento local de OpenClaw.', source: SOURCE_URLS.context, localStatus: inventory.summary.context7Detected.length > 0 ? 'active' : 'degraded', queryPriority: 4, preferredExecutionSurface: 'context7', apiFamily: 'docs-updated', mcpServer: 'context7', latencyClass: 'medium', tokenSavingsValue: 55, qualityTier: 80, requiresNetwork: true, localCacheable: false, localEvidence: inventory.summary.context7Detected }),
    makeCapability({ id: 'cap-official-web', category: 'web', title: 'Fuentes oficiales externas', summary: 'La web oficial queda como ultimo recurso de verificacion cuando falten datos en la biblioteca local, MCP o Context7.', source: SOURCE_URLS.home, localStatus: 'configured', queryPriority: 5, preferredExecutionSurface: 'official-web', apiFamily: 'official-web', latencyClass: 'slow', tokenSavingsValue: 20, qualityTier: 50, requiresNetwork: true, localCacheable: false, safeForDefaultUse: false }),
    makeCapability({ id: 'cap-gateway', category: 'gateway', title: 'Gateway OpenClaw', summary: 'El Gateway sigue siendo la fuente de verdad para sesiones, routing, canales, dashboard y tools del runtime.', source: SOURCE_URLS.gateway, localStatus: 'active', preferredExecutionSurface: 'openclaw-local-runtime', apiFamily: 'openclaw-core', queryPriority: 3, qualityTier: 88, localEvidence: ['http://127.0.0.1:8098'] }),
    makeCapability({ id: 'cap-control-ui', category: 'web', title: 'Control UI y dashboard', summary: 'La Control UI sirve para chatear, ver sesiones, canales, skills, cron, nodos y aprobaciones. Sofia debe conocerla como superficie operativa y de diagnostico.', source: SOURCE_URLS.dashboard, localStatus: 'active', preferredExecutionSurface: 'openclaw-dashboard', apiFamily: 'control-ui', queryPriority: 3, qualityTier: 82, requiresNetwork: true, localEvidence: ['http://127.0.0.1:18789'] }),
    makeCapability({ id: 'cap-multi-channel', category: 'channels', title: 'Canales y gateway multicanal', summary: 'OpenClaw conecta WhatsApp, Telegram, Discord, iMessage y mas mediante un solo gateway y una politica de routing comun.', source: SOURCE_URLS.channels, localStatus: 'configured', preferredExecutionSurface: 'openclaw-channels', apiFamily: 'channels', queryPriority: 3, requiresNetwork: true }),
  makeCapability({ id: 'cap-multi-agent', category: 'agents', title: 'Routing multiagente y sesiones', summary: 'OpenClaw soporta agentes aislados con workspaces propios. En este sistema Sofia es la identidad principal y los aliases heredados no actuan como capa identitaria primaria.', source: SOURCE_URLS.multiAgent, localStatus: 'configured', preferredExecutionSurface: 'openclaw-routing', apiFamily: 'agents', queryPriority: 3, requiresNetwork: false, localEvidence: ['identity=sofia-openclaw'] }),
    makeCapability({ id: 'cap-memory-context', category: 'memory', title: 'Memoria, contexto y compaction', summary: 'La memoria de OpenClaw vive en disco y se compacta cuando el contexto se llena. Sofia debe recordar que contexto y memoria no son lo mismo y que la memoria operativa es propia.', source: SOURCE_URLS.memory, localStatus: 'active', preferredExecutionSurface: 'memory-policy', apiFamily: 'memory', queryPriority: 3, requiresNetwork: false, localEvidence: ['lane=sofia-openclaw-memory'] }),
    makeCapability({ id: 'cap-skills-plugins', category: 'extensibility', title: 'Skills, plugins y extensiones', summary: 'OpenClaw extiende capacidades mediante skills y plugins. Sofia debe conocer ambas capas y su precedencia para no improvisar integraciones.', source: SOURCE_URLS.skills, localStatus: 'configured', preferredExecutionSurface: 'openclaw-extensibility', apiFamily: 'skills-plugins', queryPriority: 3, requiresNetwork: false }),
    makeCapability({ id: 'cap-nodes', category: 'nodes', title: 'Nodes, voz y dispositivo', summary: 'Los nodes permiten camera, audio, canvas, location y otras capacidades de dispositivo. Son companions del gateway, no sustitutos.', source: SOURCE_URLS.nodes, localStatus: 'configured', preferredExecutionSurface: 'openclaw-nodes', apiFamily: 'nodes', queryPriority: 3, requiresNetwork: true }),
    makeCapability({ id: 'cap-security', category: 'security', title: 'Seguridad y allowlists', summary: 'La politica de seguridad es access control before intelligence. Sofia debe respetar allowlists, auth, pairing y no fingir ejecucion ni acceso.', source: SOURCE_URLS.security, localStatus: 'configured', preferredExecutionSurface: 'openclaw-security', apiFamily: 'security', queryPriority: 3, requiresNetwork: false }),
    makeCapability({ id: 'cap-troubleshooting', category: 'ops', title: 'Troubleshooting y diagnostico', summary: 'OpenClaw tiene una escalera clara de diagnostico. Sofia debe reportar estado real y recomendar el siguiente comando o superficie correcta, no adivinar.', source: SOURCE_URLS.troubleshooting, localStatus: 'active', preferredExecutionSurface: 'ops-diagnostics', apiFamily: 'troubleshooting', queryPriority: 3 }),
  ];

  return {
    generatedAt,
    summary: {
      totalCapabilities: entries.length,
      activeCount: entries.filter((entry) => entry.localStatus === 'active').length,
      configuredCount: entries.filter((entry) => entry.localStatus === 'configured').length,
      blockedCount: entries.filter((entry) => entry.localStatus === 'blocked').length,
      degradedCount: entries.filter((entry) => entry.localStatus === 'degraded').length,
      categories: entries.reduce((acc, entry) => {
        acc[entry.category] = (acc[entry.category] || 0) + 1;
        return acc;
      }, {}),
    },
    entries,
  };
}

function buildKnowledgeRoutingPolicy(publicApiRegistry, inventory) {
  const primaryServer = publicApiRegistry.preferredMcpServer?.name || 'sofia-mcp-local';
  return {
    generatedAt: inventory.summary.generatedAt,
    officialName: 'OpenClaw',
    identity: 'Sofia',
    summary: {
      defaultOrder: ['public-api-capability-registry', 'mcp-tool-priority-map', 'openclaw-capability-registry', 'context7', 'official-web'],
      primaryDataSurface: 'public-api-capability-registry',
      primaryMcpServer: primaryServer,
      context7Detected: inventory.summary.context7Detected.length,
      safeDefaultPublicApis: publicApiRegistry.summary.usableEntries,
    },
    consultationOrder: [
      { priority: 1, surface: 'public-api-capability-registry', when: 'La pregunta pide datos publicos, lookup, indicadores, clima, festivos, crypto, catalogos o respuestas estructuradas.', reason: 'Menor coste en tokens y respuesta mas estructurada.' },
      { priority: 2, surface: 'mcp-tool-priority-map', when: 'Existe una herramienta MCP local o clonada que resuelva la tarea.', reason: 'Menor latencia y ejecucion reproducible.' },
      { priority: 3, surface: 'openclaw-capability-registry', when: 'La pregunta es sobre OpenClaw, runtime local, configuracion, troubleshooting, channels, memory o arquitectura.', reason: 'La base local ya esta curada para este sistema.' },
      { priority: 4, surface: 'context7', when: 'La pregunta es sobre SDKs, librerias o documentacion cambiante.', reason: 'Capa de actualizacion controlada.' },
      { priority: 5, surface: 'official-web', when: 'Falta verificacion puntual o la capa local no cubre el caso.', reason: 'Ultimo recurso, no primera opcion.' },
    ],
    selectionCriteria: ['menor coste en tokens', 'menor latencia', 'mayor estructura de respuesta', 'menor necesidad de inferencia', 'disponibilidad local real'],
    hardRules: [
      'Si existe API publica o tool MCP apto, Sofia debe usarlo antes de web_search o navegacion general.',
      'Si una entrada esta marcada como blocked, degraded o noise, no puede ser la ruta automatica por defecto.',
      'OpenClaw y el sistema local se explican primero con la biblioteca local, no con APIs publicas.',
      'Context7 no sustituye la biblioteca RAC de APIs publicas.',
      'Web oficial queda como capa final de verificacion.',
    ],
    intentRules: [
      { intent: 'public-structured-data', primarySurface: 'public-api-capability-registry', mcpServer: primaryServer, tool: 'fetch_url', fallback: ['context7', 'official-web'] },
      { intent: 'openclaw-runtime-knowledge', primarySurface: 'openclaw-capability-registry', mcpServer: null, tool: 'local-knowledge', fallback: ['context7', 'official-web'] },
      { intent: 'sdk-or-library-docs', primarySurface: 'context7', mcpServer: 'context7', tool: 'context7', fallback: ['openclaw-capability-registry', 'official-web'] },
      { intent: 'manual-web-verification', primarySurface: 'official-web', mcpServer: null, tool: 'web', fallback: [] },
    ],
  };
}

function buildMcpToolPriorityMap(publicApiRegistry, publicApiStatus, inventory) {
  const primaryServer = preferredMcpServer(publicApiStatus);
  const servers = [];
  if (primaryServer) {
    servers.push({ id: primaryServer.name, label: canonicalizePresentationName(primaryServer.name), status: primaryServer.status, host: primaryServer.host, port: primaryServer.port, priority: 1, recommendedFor: ['structured-public-data', 'fast-lookups', 'catalogs'] });
  }
  for (const server of (inventory.servers || []).filter((item) => /context7|openclaw|opencloud|g4f|sofia/i.test(item.name))) {
    servers.push({
      id: `${server.editor}:${server.name}`,
      label: `${server.editor} :: ${server.displayName || server.name}`,
      status: server.autostart ? 'configured' : 'observed',
      host: server.host || server.url || server.command || 'local',
      port: server.port || null,
      priority: /context7/i.test(server.name) ? 4 : /openclaw|opencloud/i.test(server.name) ? 2 : 5,
      recommendedFor: /context7/i.test(server.name) ? ['sdk-or-library-docs'] : /openclaw|opencloud/i.test(server.name) ? ['local-tools', 'filesystem', 'memory'] : ['specialized-runtime'],
    });
  }

  return {
    generatedAt: inventory.summary.generatedAt,
    summary: {
      preferredServer: primaryServer?.name || null,
      onlineServers: servers.filter((server) => server.status === 'online' || server.status === 'configured').length,
      mappedIntents: KNOWN_MCP_INTENTS.length,
      safeDefaultPublicApis: publicApiRegistry.summary.usableEntries,
    },
    servers: uniqueBy(servers, (server) => server.id),
    intents: KNOWN_MCP_INTENTS.map((intent, index) => ({
      ...intent,
      priority: index + 1,
      preferredServer: intent.serverType === 'api' ? primaryServer?.name || 'sofia-mcp-local' : intent.serverType === 'context7' ? 'context7' : 'openclaw-gateway',
      notes: intent.id === 'structured-public-data' ? 'Intentar primero APIs publicas curadas y fetch_url.' : intent.id === 'sdk-or-library-docs' ? 'Usar Context7 para documentacion actualizable.' : 'Usar runtime local y tool adecuada antes de navegar.',
    })),
  };
}

function buildTeachingManifest(openClawRegistry, publicApiRegistry, routingPolicy, mcpToolPriorityMap) {
  return {
    generatedAt: openClawRegistry.generatedAt,
    officialName: 'OpenClaw',
    identity: 'Sofia',
    summary: {
      promptSections: 4,
      examples: 4,
      consultationOrder: routingPolicy.summary.defaultOrder,
      publicApisUsable: publicApiRegistry.summary.usableEntries,
      mcpMappedIntents: mcpToolPriorityMap.summary.mappedIntents,
    },
    consultationOrder: routingPolicy.summary.defaultOrder,
    surfaces: {
      systemPrompt: { purpose: 'Reglas de identidad, prioridades de consulta, no-fake-execution y tono.', shouldInclude: ['identity', 'routing-priority', 'tool-first', 'public-apis-first', 'context7-last-for-docs'], shouldAvoid: ['listas largas de APIs', 'catalogos completos', 'docs completas'] },
      openClawCapabilityRegistry: { purpose: 'Explicar como funciona OpenClaw en este sistema.', path: OPENCLAW_CAPABILITY_REGISTRY_PATH },
      publicApiCapabilityRegistry: { purpose: 'Resolver datos publicos y lookup con coste minimo de tokens.', path: PUBLIC_API_CAPABILITY_REGISTRY_PATH },
      mcpToolPriorityMap: { purpose: 'Elegir el servidor y la herramienta MCP adecuados por intencion.', path: MCP_TOOL_PRIORITY_MAP_PATH },
      context7: { purpose: 'Actualizar documentacion de librerias y SDKs cuando haga falta.', source: 'context7' },
      obsidian: { purpose: 'Navegacion humana y memoria durable del sistema.', openClawVault: OPENCLAW_VAULT_ROOT, publicApiVault: PUBLIC_API_VAULT_ROOT },
    },
    examples: [
      { id: 'example-weather', intent: 'weather', preferredRoute: ['public-api-capability-registry', 'mcp-tool:fetch_url'], explanation: 'Tiempo y clima deben salir de APIs publicas o MCP antes que de web general.' },
      { id: 'example-openclaw-install', intent: 'openclaw-installation', preferredRoute: ['openclaw-capability-registry', 'openclaw-library-notes', 'official-web'], explanation: 'Instalacion y configuracion de OpenClaw se explican primero con la biblioteca local.' },
      { id: 'example-sdk-docs', intent: 'sdk-docs', preferredRoute: ['context7', 'official-web'], explanation: 'Para SDKs o librerias externas, Context7 actualiza y la web oficial verifica.' },
      { id: 'example-mcp-tool', intent: 'structured-public-data', preferredRoute: ['mcp-tool-priority-map', 'sofia-mcp-local', 'fetch_url'], explanation: 'Si hay API y tool adecuada, Sofia debe ejecutar antes de describir.' },
    ],
  };
}

function buildUsageGuide(publicApiRegistry, routingPolicy, mcpToolPriorityMap) {
  return [
    '# APIs publicas primero',
    '',
    `Generado: ${publicApiRegistry.generatedAt}`,
    '',
    '## Jerarquia de consulta',
    '',
    ...routingPolicy.consultationOrder.map((item) => `- ${item.priority}. ${item.surface}: ${item.when}`),
    '',
    '## Curacion',
    '',
    `- Total entradas: ${publicApiRegistry.summary.totalEntries}`,
    `- Usables por defecto: ${publicApiRegistry.summary.usableEntries}`,
    `- Bloqueadas por auth: ${publicApiRegistry.summary.blockedEntries}`,
    `- Noise: ${publicApiRegistry.summary.noiseEntries}`,
    `- MCP primario: ${publicApiRegistry.preferredMcpServer?.name || 'sin servidor online'}`,
    '',
    '## Clasificaciones',
    '',
    ...Object.entries(publicApiRegistry.summary.byClassification || {}).sort((left, right) => right[1] - left[1]).map(([name, count]) => `- ${name}: ${count}`),
    '',
    '## Intenciones MCP',
    '',
    ...(mcpToolPriorityMap.intents || []).slice(0, 6).map((intent) => `- ${intent.label}: ${intent.preferredServer} -> ${intent.tool}`),
    '',
    '## Regla dura',
    '',
    '- Si existe API publica o tool MCP apta, Sofia debe usarla antes de Context7 y web general.',
    '- Context7 solo entra antes cuando la consulta es de librerias, SDKs o documentacion cambiante.',
    '',
  ].join('\n');
}

function buildKnowledgeNotes(inventory, publicApiRegistry, routingPolicy, mcpToolPriorityMap, memoryPolicy, openClawRegistry, teachingManifest) {
  const notes = [];

  notes.push({ file: '00-INDEX.md', title: 'OpenClaw Knowledge Index', body: ['# OpenClaw - Biblioteca operativa', '', `Generado: ${inventory.summary.generatedAt}`, '', '## Objetivo', '', 'OpenClaw es el nombre oficial unico. Sofia es el agente principal OpenClaw y usa una ruta fija de consulta para reducir tokens y aumentar velocidad: APIs publicas -> MCP -> conocimiento local OpenClaw -> Context7 -> web oficial.', '', '## Modulos', '', '- `01-Capacidades-y-arquitectura.md`', '- `02-Memoria-y-contexto.md`', '- `03-Multi-agent-routing-y-MCP.md`', '- `04-Presence-streaming-y-nodes.md`', '- `05-Integracion-Sofia-OpenClaw.md`', '- `06-Inventario-MCP-editores.md`', '- `07-Politica-memoria-Sofia-OpenClaw.md`', '- `08-APIs-publicas-primero.md`', '- `09-Routing-de-conocimiento.md`', '- `10-Ejemplos-de-consulta.md`', '', '## Snapshot', '', `- Editores/configs encontrados: ${inventory.summary.configsFound}/${inventory.summary.configsScanned}`, `- Servidores MCP unicos: ${inventory.summary.totalServers}`, `- APIs publicas usables por defecto: ${publicApiRegistry.summary.usableEntries}/${publicApiRegistry.summary.totalEntries}`, `- Context7 detectado: ${inventory.summary.context7Detected.length > 0 ? 'si' : 'no verificado'}`, `- Capabilities OpenClaw: ${openClawRegistry.summary.totalCapabilities}`, '', '## Fuentes', '', ...Object.values(SOURCE_URLS).map((url) => `- ${url}`), ''].join('\n') });
  notes.push({ file: '01-Capacidades-y-arquitectura.md', title: 'Capacidades y arquitectura', body: ['# Capacidades y arquitectura', '', '- OpenClaw es el gateway, Sofia es la identidad principal y visible.', '- El Gateway es la fuente de verdad para sesiones, routing, canales, tools, dashboard y surfaces web.', '- La prioridad de conocimiento de Sofia no parte de la web: parte de la biblioteca local y de la RAC de APIs publicas.', '', '## Orden operativo', '', ...routingPolicy.consultationOrder.map((item) => `- ${item.priority}. ${item.surface} -> ${item.reason}`), '', '## Capabilities activas/locales', '', ...openClawRegistry.entries.slice(0, 8).map((entry) => `- ${entry.title}: ${entry.localStatus}`), ''].join('\n') });
  notes.push({ file: '02-Memoria-y-contexto.md', title: 'Memoria y contexto', body: ['# Memoria y contexto', '', '- La memoria de OpenClaw vive en disco del workspace del agente.', '- La lane operativa oficial ahora es `sofia-openclaw-memory`.', '- Contexto no es memoria. El contexto se arma con prompt, historial, tools, adjuntos y compaction.', '- No se comparte `MEMORY.md`, `auth-profiles.json` ni historial crudo entre capas.', '', '## Lanes', '', ...(memoryPolicy.lanes || []).map((lane) => `- ${lane.id}: ${lane.description}`), ''].join('\n') });
  notes.push({ file: '03-Multi-agent-routing-y-MCP.md', title: 'Multi-agent routing y MCP', body: ['# Multi-agent routing y MCP', '', '- Sofia es la identidad principal. Multi-agent sigue existiendo, pero no como capa identitaria primaria separada.', '- MCP es la segunda capa de ejecucion tras la RAC de APIs publicas.', '- El servidor preferente para datos publicos es `sofia-mcp-local` cuando esta online.', '', '## Intenciones MCP', '', ...(mcpToolPriorityMap.intents || []).map((intent) => `- ${intent.label}: ${intent.preferredServer} -> ${intent.tool}`), ''].join('\n') });
  notes.push({ file: '04-Presence-streaming-y-nodes.md', title: 'Presence, streaming y nodes', body: ['# Presence, streaming y nodes', '', '- Presence es una vista best-effort del gateway y los clientes conectados.', '- Streaming en canales trabaja por bloques, no por token delta puro.', '- Nodes y surfaces de dispositivo amplian audio, camera, canvas y acciones locales.', '', '## Fuentes', '', `- Presence: ${SOURCE_URLS.presence}`, `- Streaming: ${SOURCE_URLS.streaming}`, `- Nodes: ${SOURCE_URLS.nodes}`, ''].join('\n') });
  notes.push({ file: '05-Integracion-Sofia-OpenClaw.md', title: 'Integracion Sofia OpenClaw', body: ['# Integracion Sofia OpenClaw', '', '- No se cambia la identidad visible: Sofia siempre responde como Sofia.', '- OpenClaw es el nombre oficial y la base del runtime.', '- La app conserva routers y selectores actuales, pero aprende con una sola verdad canonica generada por scripts.', '', '## Regla de integracion', '', '- APIs publicas primero para datos estructurados.', '- MCP despues para ejecucion y herramientas.', '- Biblioteca local OpenClaw para explicar el sistema.', '- Context7 para documentacion cambiante.', '- Web oficial solo al final.', ''].join('\n') });

  const inventoryLines = ['# Inventario MCP de editores', '', `Generado: ${inventory.summary.generatedAt}`, '', '## Resumen', '', `- Configs encontrados: ${inventory.summary.configsFound}/${inventory.summary.configsScanned}`, `- Servidores MCP unicos: ${inventory.summary.totalServers}`, `- Transportes: ${Object.entries(inventory.summary.transports).map(([key, value]) => `${key}=${value}`).join(', ') || 'sin datos'}`, `- Context7 detectado: ${inventory.summary.context7Detected.length > 0 ? inventory.summary.context7Detected.join(', ') : 'no verificado'}`, '', '## Configs auditados', ''];
  for (const config of inventory.configs) {
    inventoryLines.push(`### ${config.editor} :: ${path.basename(config.path)}`, '', `- Ruta: \`${config.path}\``, `- Existe: ${config.exists ? 'si' : 'no'}`, `- Parse OK: ${config.parseOk ? 'si' : 'no'}`, `- Servidores: ${config.servers.length}`);
    if (config.notes.length > 0) inventoryLines.push(`- Notas: ${config.notes.join(' | ')}`);
    for (const server of config.servers) inventoryLines.push(`- ${server.displayName || server.name}: ${server.transport}${server.url ? ` -> ${server.url}` : server.port ? ` -> ${server.host || '127.0.0.1'}:${server.port}` : ''}`);
    inventoryLines.push('');
  }

  notes.push({ file: '06-Inventario-MCP-editores.md', title: 'Inventario MCP editores', body: inventoryLines.join('\n') });
  notes.push({ file: '07-Politica-memoria-Sofia-OpenClaw.md', title: 'Politica memoria Sofia OpenClaw', body: ['# Politica de memoria Sofia OpenClaw', '', `Generado: ${memoryPolicy.generatedAt}`, '', '## Lanes', '', ...(memoryPolicy.lanes || []).map((lane) => `- ${lane.id} | owner: ${lane.owner} | scope: ${(lane.scope || []).join(', ')}`), '', '## Reglas', '', ...(memoryPolicy.forbiddenSharing || []).map((rule) => `- ${rule}`), '', '## Adapters', '', ...(memoryPolicy.adapters || []).map((adapter) => `- ${adapter}`), ''].join('\n') });
  notes.push({ file: '08-APIs-publicas-primero.md', title: 'APIs publicas primero', body: ['# APIs publicas primero', '', `- Total entradas: ${publicApiRegistry.summary.totalEntries}`, `- Usables por defecto: ${publicApiRegistry.summary.usableEntries}`, `- Bloqueadas por auth: ${publicApiRegistry.summary.blockedEntries}`, `- Noise: ${publicApiRegistry.summary.noiseEntries}`, `- MCP primario: ${publicApiRegistry.preferredMcpServer?.name || 'sin servidor online'}`, '', '## Clasificaciones', '', ...Object.entries(publicApiRegistry.summary.byClassification || {}).map(([name, count]) => `- ${name}: ${count}`), '', '## Regla dura', '', '- Solo `endpoint-real` y `documentation` operativa entran en ruta automatica por defecto.', '- `landing-page`, `repo`, `issue-tracker`, `postman-collection` y `noise` no son primera linea automatica.', ''].join('\n') });
  notes.push({ file: '09-Routing-de-conocimiento.md', title: 'Routing de conocimiento', body: ['# Routing de conocimiento', '', '## Orden fijo', '', ...routingPolicy.consultationOrder.map((item) => `- ${item.priority}. ${item.surface}: ${item.when}`), '', '## Hard rules', '', ...(routingPolicy.hardRules || []).map((rule) => `- ${rule}`), ''].join('\n') });
  notes.push({ file: '10-Ejemplos-de-consulta.md', title: 'Ejemplos de consulta', body: ['# Ejemplos de consulta', '', ...(teachingManifest.examples || []).map((example) => `- ${example.id}: ${example.explanation} Ruta -> ${example.preferredRoute.join(' -> ')}`), ''].join('\n') });

  return notes;
}

function buildLibraryIndex(notes, inventory, openClawRegistry, publicApiRegistry, routingPolicy, teachingManifest) {
  return {
    generatedAt: inventory.summary.generatedAt,
    notes: notes.map((note) => ({ file: note.file, title: note.title })),
    inventory: inventory.summary,
    capabilities: openClawRegistry.summary,
    publicApis: publicApiRegistry.summary,
    routing: routingPolicy.summary,
    teaching: teachingManifest.summary,
    sources: SOURCE_URLS,
    vaultPath: fs.existsSync(OPENCLAW_VAULT_ROOT) ? OPENCLAW_VAULT_ROOT : null,
    publicApiVaultPath: fs.existsSync(PUBLIC_API_VAULT_ROOT) ? PUBLIC_API_VAULT_ROOT : null,
  };
}

function syncVaultArtifacts(payload) {
  if (!fs.existsSync(SOFIA_AI_ROOT)) return;
  ensureDir(OPENCLAW_VAULT_ROOT);
  ensureDir(PUBLIC_API_VAULT_ROOT);
  removeStaleFiles(OPENCLAW_VAULT_ROOT, payload.notes.map((note) => note.file));
  for (const note of payload.notes) writeText(path.join(OPENCLAW_VAULT_ROOT, note.file), note.body);
  writeJson(path.join(OPENCLAW_VAULT_ROOT, 'editor-mcp-inventory.json'), payload.inventory);
  writeJson(path.join(OPENCLAW_VAULT_ROOT, 'openclaw-library-index.json'), payload.libraryIndex);
  writeJson(path.join(OPENCLAW_VAULT_ROOT, 'memory-policy.json'), payload.memoryPolicy);
  writeJson(path.join(OPENCLAW_VAULT_ROOT, 'openclaw-capability-registry.json'), payload.openClawRegistry);
  writeJson(path.join(OPENCLAW_VAULT_ROOT, 'knowledge-routing-policy.json'), payload.routingPolicy);
  writeJson(path.join(OPENCLAW_VAULT_ROOT, 'mcp-tool-priority-map.json'), payload.mcpToolPriorityMap);
  writeJson(path.join(OPENCLAW_VAULT_ROOT, 'openclaw-teaching-manifest.json'), payload.teachingManifest);
  writeJson(path.join(PUBLIC_API_VAULT_ROOT, 'public-api-capability-registry.json'), payload.publicApiRegistry);
  writeText(path.join(PUBLIC_API_VAULT_ROOT, 'USAGE.md'), payload.usageGuide);
}

function main() {
  ensureDir(OPENCLAW_CONTROL_ROOT);
  ensureDir(OPENCLAW_NOTES_ROOT);
  ensureDir(PUBLIC_API_ROOT);

  const inventory = buildInventory();
  const memoryPolicy = buildMemoryPolicy(inventory);
  const { library: publicApiLibrary, status: publicApiStatus } = readPublicApiDataset();
  const publicApiRegistry = buildPublicApiCapabilityRegistry(publicApiLibrary, publicApiStatus);
  const openClawRegistry = buildOpenClawCapabilityRegistry(inventory, publicApiRegistry);
  const routingPolicy = buildKnowledgeRoutingPolicy(publicApiRegistry, inventory);
  const mcpToolPriorityMap = buildMcpToolPriorityMap(publicApiRegistry, publicApiStatus, inventory);
  const teachingManifest = buildTeachingManifest(openClawRegistry, publicApiRegistry, routingPolicy, mcpToolPriorityMap);
  const notes = buildKnowledgeNotes(inventory, publicApiRegistry, routingPolicy, mcpToolPriorityMap, memoryPolicy, openClawRegistry, teachingManifest);
  const libraryIndex = buildLibraryIndex(notes, inventory, openClawRegistry, publicApiRegistry, routingPolicy, teachingManifest);
  const usageGuide = buildUsageGuide(publicApiRegistry, routingPolicy, mcpToolPriorityMap);

  removeStaleFiles(OPENCLAW_NOTES_ROOT, notes.map((note) => note.file));
  writeJson(EDITOR_INVENTORY_PATH, inventory);
  writeJson(OPENCLAW_LIBRARY_INDEX_PATH, libraryIndex);
  writeJson(MEMORY_POLICY_PATH, memoryPolicy);
  writeJson(OPENCLAW_CAPABILITY_REGISTRY_PATH, openClawRegistry);
  writeJson(KNOWLEDGE_ROUTING_POLICY_PATH, routingPolicy);
  writeJson(MCP_TOOL_PRIORITY_MAP_PATH, mcpToolPriorityMap);
  writeJson(TEACHING_MANIFEST_PATH, teachingManifest);
  writeJson(PUBLIC_API_CAPABILITY_REGISTRY_PATH, publicApiRegistry);
  writeText(PUBLIC_API_USAGE_GUIDE_PATH, usageGuide);
  for (const note of notes) writeText(path.join(OPENCLAW_NOTES_ROOT, note.file), note.body);

  syncVaultArtifacts({ notes, inventory, libraryIndex, memoryPolicy, openClawRegistry, routingPolicy, mcpToolPriorityMap, teachingManifest, publicApiRegistry, usageGuide });

  console.log('[sync-openclaw-knowledge] Completed');
  console.log(`[sync-openclaw-knowledge] Inventory: ${EDITOR_INVENTORY_PATH}`);
  console.log(`[sync-openclaw-knowledge] OpenClaw capabilities: ${OPENCLAW_CAPABILITY_REGISTRY_PATH}`);
  console.log(`[sync-openclaw-knowledge] Routing policy: ${KNOWLEDGE_ROUTING_POLICY_PATH}`);
  console.log(`[sync-openclaw-knowledge] Public API registry: ${PUBLIC_API_CAPABILITY_REGISTRY_PATH}`);
  console.log(`[sync-openclaw-knowledge] Usable public APIs: ${publicApiRegistry.summary.usableEntries}/${publicApiRegistry.summary.totalEntries}`);
}

try {
  main();
} catch (error) {
  console.error('[sync-openclaw-knowledge] Failed:', error.message || error);
  process.exitCode = 1;
}
