'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_VAULT_ROOT = 'C:\\Users\\clayt\\Desktop\\SOFÍA AI\\sofia-ai\\sofia-vault\\Conocimiento\\OpenClaw\\Oficial';

const OFFICIAL_ROOT = path.join(ROOT, 'resources', 'openclaw-official');
const RAW_DOCS_ROOT = path.join(OFFICIAL_ROOT, 'raw', 'docs');
const RAW_REPO_ROOT = path.join(OFFICIAL_ROOT, 'raw', 'repo');
const NORMALIZED_ROOT = path.join(OFFICIAL_ROOT, 'normalized');
const BUILD_ROOT = path.join(OFFICIAL_ROOT, 'build');
const STATE_ROOT = path.join(OFFICIAL_ROOT, 'state');
const VENDOR_REPO_ROOT = path.join(OFFICIAL_ROOT, 'vendor', 'openclaw-repo');
const README_TARGET = path.join(ROOT, 'README_OPENCLAW_MAESTRO.md');
const BUILD_README_TARGET = path.join(BUILD_ROOT, 'README_OPENCLAW_MAESTRO.md');
const VAULT_ROOT = process.env.OPENCLAW_VAULT_ROOT || DEFAULT_VAULT_ROOT;

const USER_AGENT = 'SOFIA-OpenClaw-Official-Sync/1.0 (+https://github.com/openclaw/openclaw)';

const OFFICIAL_SOURCES = [
  { id: 'overview', title: 'Overview', url: 'https://docs.openclaw.ai/', sourceType: 'docs', section: 'overview', topic: 'overview' },
  { id: 'index', title: 'Index', url: 'https://docs.openclaw.ai/index', sourceType: 'docs', section: 'overview', topic: 'overview-index' },
  { id: 'docs-hubs', title: 'Docs Hubs', url: 'https://docs.openclaw.ai/start/hubs', sourceType: 'docs', section: 'overview', topic: 'docs-hubs' },
  { id: 'architecture', title: 'Architecture', url: 'https://docs.openclaw.ai/concepts/architecture', sourceType: 'docs', section: 'overview', topic: 'architecture' },
  { id: 'onboarding-overview', title: 'Onboarding Overview', url: 'https://docs.openclaw.ai/start/onboarding-overview', sourceType: 'docs', section: 'install', topic: 'onboarding' },
  { id: 'quickstart', title: 'Quickstart', url: 'https://docs.openclaw.ai/quickstart', sourceType: 'docs', section: 'install', topic: 'quickstart' },
  { id: 'install', title: 'Install', url: 'https://docs.openclaw.ai/install/index', sourceType: 'docs', section: 'install', topic: 'install' },
  { id: 'setup', title: 'Setup', url: 'https://docs.openclaw.ai/start/setup', sourceType: 'docs', section: 'install', topic: 'setup' },
  { id: 'wizard', title: 'Wizard', url: 'https://docs.openclaw.ai/start/wizard', sourceType: 'docs', section: 'install', topic: 'wizard' },
  { id: 'onboarding', title: 'Onboarding', url: 'https://docs.openclaw.ai/start/onboarding', sourceType: 'docs', section: 'install', topic: 'onboarding-cli' },
  { id: 'wizard-cli-reference', title: 'Wizard CLI Reference', url: 'https://docs.openclaw.ai/start/wizard-cli-reference', sourceType: 'docs', section: 'install', topic: 'wizard-cli-reference' },
  { id: 'wizard-cli-automation', title: 'Wizard CLI Automation', url: 'https://docs.openclaw.ai/start/wizard-cli-automation', sourceType: 'docs', section: 'install', topic: 'wizard-cli-automation' },
  { id: 'gateway-hub', title: 'Gateway Hub', url: 'https://docs.openclaw.ai/gateway', sourceType: 'docs', section: 'gateway', topic: 'gateway-hub' },
  { id: 'gateway-configuration', title: 'Gateway Configuration', url: 'https://docs.openclaw.ai/gateway/configuration', sourceType: 'docs', section: 'gateway', topic: 'gateway' },
  { id: 'gateway-config-examples', title: 'Gateway Configuration Examples', url: 'https://docs.openclaw.ai/gateway/configuration-examples', sourceType: 'docs', section: 'gateway', topic: 'gateway-examples' },
  { id: 'gateway-protocol', title: 'Gateway Protocol', url: 'https://docs.openclaw.ai/gateway/protocol', sourceType: 'docs', section: 'gateway', topic: 'gateway-protocol' },
  { id: 'gateway-authentication', title: 'Gateway Authentication', url: 'https://docs.openclaw.ai/gateway/authentication', sourceType: 'docs', section: 'gateway', topic: 'gateway-auth' },
  { id: 'gateway-openai-http-api', title: 'Gateway OpenAI HTTP API', url: 'https://docs.openclaw.ai/gateway/openai-http-api', sourceType: 'docs', section: 'gateway', topic: 'gateway-openai-http-api' },
  { id: 'gateway-secrets', title: 'Gateway Secrets', url: 'https://docs.openclaw.ai/gateway/secrets', sourceType: 'docs', section: 'gateway', topic: 'gateway-secrets' },
  { id: 'channels-hub', title: 'Channels Hub', url: 'https://docs.openclaw.ai/channels', sourceType: 'docs', section: 'channels', topic: 'channels-hub' },
  { id: 'channels-index', title: 'Channels', url: 'https://docs.openclaw.ai/channels/index', sourceType: 'docs', section: 'channels', topic: 'channels' },
  { id: 'channel-whatsapp', title: 'WhatsApp', url: 'https://docs.openclaw.ai/channels/whatsapp', sourceType: 'docs', section: 'channels', topic: 'channel-whatsapp' },
  { id: 'channel-telegram', title: 'Telegram', url: 'https://docs.openclaw.ai/channels/telegram', sourceType: 'docs', section: 'channels', topic: 'channel-telegram' },
  { id: 'channel-discord', title: 'Discord', url: 'https://docs.openclaw.ai/channels/discord', sourceType: 'docs', section: 'channels', topic: 'channel-discord' },
  { id: 'channel-slack', title: 'Slack', url: 'https://docs.openclaw.ai/channels/slack', sourceType: 'docs', section: 'channels', topic: 'channel-slack' },
  { id: 'channel-signal', title: 'Signal', url: 'https://docs.openclaw.ai/channels/signal', sourceType: 'docs', section: 'channels', topic: 'channel-signal' },
  { id: 'channel-bluebubbles', title: 'BlueBubbles', url: 'https://docs.openclaw.ai/channels/bluebubbles', sourceType: 'docs', section: 'channels', topic: 'channel-bluebubbles' },
  { id: 'channel-pairing', title: 'Channel Pairing', url: 'https://docs.openclaw.ai/channels/pairing', sourceType: 'docs', section: 'channels', topic: 'channel-pairing' },
  { id: 'channel-groups', title: 'Channel Groups', url: 'https://docs.openclaw.ai/channels/groups', sourceType: 'docs', section: 'channels', topic: 'channel-groups' },
  { id: 'channel-routing', title: 'Channel Routing', url: 'https://docs.openclaw.ai/channels/channel-routing', sourceType: 'docs', section: 'channels', topic: 'routing' },
  { id: 'channel-troubleshooting', title: 'Channel Troubleshooting', url: 'https://docs.openclaw.ai/channels/troubleshooting', sourceType: 'docs', section: 'channels', topic: 'channel-troubleshooting' },
  { id: 'agent', title: 'Agent', url: 'https://docs.openclaw.ai/concepts/agent', sourceType: 'docs', section: 'agents', topic: 'agent' },
  { id: 'agent-loop', title: 'Agent Loop', url: 'https://docs.openclaw.ai/agent-loop', sourceType: 'docs', section: 'agents', topic: 'agent-loop' },
  { id: 'agent-workspace', title: 'Agent Workspace', url: 'https://docs.openclaw.ai/concepts/agent-workspace', sourceType: 'docs', section: 'agents', topic: 'agent-workspace' },
  { id: 'multi-agent', title: 'Multi-Agent Routing', url: 'https://docs.openclaw.ai/concepts/multi-agent', sourceType: 'docs', section: 'agents', topic: 'multi-agent' },
  { id: 'context', title: 'Context', url: 'https://docs.openclaw.ai/concepts/context', sourceType: 'docs', section: 'memory', topic: 'context' },
  { id: 'context-root', title: 'Context Root', url: 'https://docs.openclaw.ai/context/', sourceType: 'docs', section: 'memory', topic: 'context-root' },
  { id: 'context-engine', title: 'Context Engine', url: 'https://docs.openclaw.ai/concepts/context-engine', sourceType: 'docs', section: 'memory', topic: 'context-engine' },
  { id: 'memory', title: 'Memory', url: 'https://docs.openclaw.ai/concepts/memory', sourceType: 'docs', section: 'memory', topic: 'memory' },
  { id: 'session', title: 'Session', url: 'https://docs.openclaw.ai/concepts/session', sourceType: 'docs', section: 'memory', topic: 'session' },
  { id: 'compaction', title: 'Compaction', url: 'https://docs.openclaw.ai/concepts/compaction', sourceType: 'docs', section: 'memory', topic: 'compaction' },
  { id: 'session-pruning', title: 'Session Pruning', url: 'https://docs.openclaw.ai/concepts/session-pruning', sourceType: 'docs', section: 'memory', topic: 'session-pruning' },
  { id: 'session-tool', title: 'Session Tool', url: 'https://docs.openclaw.ai/concepts/session-tool', sourceType: 'docs', section: 'memory', topic: 'session-tool' },
  { id: 'tools-hub', title: 'Tools Hub', url: 'https://docs.openclaw.ai/tools', sourceType: 'docs', section: 'extensibility', topic: 'tools-hub' },
  { id: 'tools-skills', title: 'Skills', url: 'https://docs.openclaw.ai/tools/skills', sourceType: 'docs', section: 'extensibility', topic: 'skills' },
  { id: 'tools-skills-config', title: 'Skills Config', url: 'https://docs.openclaw.ai/tools/skills-config', sourceType: 'docs', section: 'extensibility', topic: 'skills-config' },
  { id: 'tools-clawhub', title: 'ClawHub', url: 'https://docs.openclaw.ai/tools/clawhub', sourceType: 'docs', section: 'extensibility', topic: 'clawhub' },
  { id: 'tools-prose', title: 'Prose', url: 'https://docs.openclaw.ai/prose', sourceType: 'docs', section: 'extensibility', topic: 'prose' },
  { id: 'tools-plugin', title: 'Plugins', url: 'https://docs.openclaw.ai/tools/plugin', sourceType: 'docs', section: 'extensibility', topic: 'plugins' },
  { id: 'plugins-building', title: 'Building Plugins', url: 'https://docs.openclaw.ai/plugins/building-plugins', sourceType: 'docs', section: 'extensibility', topic: 'plugins-building' },
  { id: 'plugins-manifest', title: 'Plugin Manifest', url: 'https://docs.openclaw.ai/plugins/manifest', sourceType: 'docs', section: 'extensibility', topic: 'plugins-manifest' },
  { id: 'tools-exec', title: 'Exec Tool', url: 'https://docs.openclaw.ai/tools/exec', sourceType: 'docs', section: 'extensibility', topic: 'tool-exec' },
  { id: 'tools-pdf', title: 'PDF Tool', url: 'https://docs.openclaw.ai/tools/pdf', sourceType: 'docs', section: 'extensibility', topic: 'tool-pdf' },
  { id: 'tools-subagents', title: 'Subagents Tool', url: 'https://docs.openclaw.ai/tools/subagents', sourceType: 'docs', section: 'extensibility', topic: 'tool-subagents' },
  { id: 'providers-hub', title: 'Providers Hub', url: 'https://docs.openclaw.ai/providers', sourceType: 'docs', section: 'models', topic: 'providers-hub' },
  { id: 'providers-models', title: 'Provider Models', url: 'https://docs.openclaw.ai/providers/models', sourceType: 'docs', section: 'models', topic: 'providers-models' },
  { id: 'models', title: 'Models', url: 'https://docs.openclaw.ai/concepts/models', sourceType: 'docs', section: 'models', topic: 'models' },
  { id: 'model-providers', title: 'Model Providers', url: 'https://docs.openclaw.ai/concepts/model-providers', sourceType: 'docs', section: 'models', topic: 'providers' },
  { id: 'model-failover', title: 'Model Failover', url: 'https://docs.openclaw.ai/concepts/model-failover', sourceType: 'docs', section: 'models', topic: 'model-failover' },
  { id: 'provider-openai', title: 'OpenAI Provider', url: 'https://docs.openclaw.ai/providers/openai', sourceType: 'docs', section: 'models', topic: 'provider-openai' },
  { id: 'provider-anthropic', title: 'Anthropic Provider', url: 'https://docs.openclaw.ai/providers/anthropic', sourceType: 'docs', section: 'models', topic: 'provider-anthropic' },
  { id: 'provider-openrouter', title: 'OpenRouter Provider', url: 'https://docs.openclaw.ai/providers/openrouter', sourceType: 'docs', section: 'models', topic: 'provider-openrouter' },
  { id: 'web-hub', title: 'Web Hub', url: 'https://docs.openclaw.ai/web', sourceType: 'docs', section: 'surfaces', topic: 'web-hub' },
  { id: 'control-ui', title: 'Control UI', url: 'https://docs.openclaw.ai/web/control-ui', sourceType: 'docs', section: 'surfaces', topic: 'control-ui' },
  { id: 'dashboard', title: 'Dashboard', url: 'https://docs.openclaw.ai/web/dashboard', sourceType: 'docs', section: 'surfaces', topic: 'dashboard' },
  { id: 'webchat', title: 'WebChat', url: 'https://docs.openclaw.ai/web/webchat', sourceType: 'docs', section: 'surfaces', topic: 'webchat' },
  { id: 'nodes', title: 'Nodes', url: 'https://docs.openclaw.ai/nodes', sourceType: 'docs', section: 'nodes', topic: 'nodes' },
  { id: 'platforms', title: 'Platforms', url: 'https://docs.openclaw.ai/platforms', sourceType: 'docs', section: 'nodes', topic: 'platforms' },
  { id: 'platform-ios', title: 'iOS', url: 'https://docs.openclaw.ai/platforms/ios', sourceType: 'docs', section: 'nodes', topic: 'platform-ios' },
  { id: 'platform-android', title: 'Android', url: 'https://docs.openclaw.ai/platforms/android', sourceType: 'docs', section: 'nodes', topic: 'platform-android' },
  { id: 'platform-macos', title: 'macOS', url: 'https://docs.openclaw.ai/platforms/macos', sourceType: 'docs', section: 'nodes', topic: 'platform-macos' },
  { id: 'gateway-security', title: 'Gateway Security', url: 'https://docs.openclaw.ai/gateway/security', sourceType: 'docs', section: 'security', topic: 'security' },
  { id: 'gateway-remote', title: 'Remote Access', url: 'https://docs.openclaw.ai/gateway/remote', sourceType: 'docs', section: 'security', topic: 'remote-access' },
  { id: 'gateway-remote-readme', title: 'Remote Gateway README', url: 'https://docs.openclaw.ai/gateway/remote-gateway-readme', sourceType: 'docs', section: 'security', topic: 'remote-gateway-readme' },
  { id: 'gateway-tailscale', title: 'Tailscale', url: 'https://docs.openclaw.ai/gateway/tailscale', sourceType: 'docs', section: 'security', topic: 'tailscale' },
  { id: 'gateway-troubleshooting', title: 'Gateway Troubleshooting', url: 'https://docs.openclaw.ai/gateway/troubleshooting', sourceType: 'docs', section: 'ops', topic: 'gateway-troubleshooting' },
  { id: 'help-troubleshooting', title: 'Help Troubleshooting', url: 'https://docs.openclaw.ai/help/troubleshooting', sourceType: 'docs', section: 'ops', topic: 'help-troubleshooting' },
  { id: 'security-formal-verification', title: 'Formal Verification', url: 'https://docs.openclaw.ai/security/formal-verification', sourceType: 'docs', section: 'security', topic: 'formal-verification' },
  { id: 'security-threat-model-atlas', title: 'Threat Model Atlas', url: 'https://docs.openclaw.ai/security/THREAT-MODEL-ATLAS', sourceType: 'docs', section: 'security', topic: 'threat-model-atlas' },
  { id: 'repo-readme', title: 'Repository README', url: 'https://raw.githubusercontent.com/openclaw/openclaw/main/README.md', sourceType: 'repo', section: 'repo', topic: 'repo-readme' },
  { id: 'repo-contributing', title: 'Repository Contributing', url: 'https://raw.githubusercontent.com/openclaw/openclaw/main/CONTRIBUTING.md', sourceType: 'repo', section: 'repo', topic: 'repo-contributing' },
  { id: 'repo-security', title: 'Repository Security', url: 'https://raw.githubusercontent.com/openclaw/openclaw/main/SECURITY.md', sourceType: 'repo', section: 'repo', topic: 'repo-security' },
  { id: 'repo-vision', title: 'Repository Vision', url: 'https://raw.githubusercontent.com/openclaw/openclaw/main/VISION.md', sourceType: 'repo', section: 'repo', topic: 'repo-vision' },
  { id: 'repo-changelog', title: 'Repository Changelog', url: 'https://raw.githubusercontent.com/openclaw/openclaw/main/CHANGELOG.md', sourceType: 'repo', section: 'repo', topic: 'repo-changelog' },
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

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function decodeEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };
  return String(text || '').replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, (match) => entities[match] || match);
}

function repairCommonMojibake(text) {
  return String(text || '')
    .replace(/â€‹/g, '')
    .replace(/â€”/g, '—')
    .replace(/â€“/g, '–')
    .replace(/â€œ|â€/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€˜|â€™/g, "'")
    .replace(/â€¦/g, '...')
    .replace(/âŒ˜/g, '⌘')
    .replace(/ðŸ¦ž/g, '🦞')
    .replace(/Â /g, ' ')
    .replace(/Â/g, '');
}

function stripHtmlToText(html) {
  let text = String(html || '');
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
  text = text.replace(/<(br|\/p|\/div|\/li|\/h1|\/h2|\/h3|\/h4|\/h5|\/h6|\/section|\/article)>/gi, '\n');
  text = text.replace(/<\/pre>/gi, '\n');
  text = text.replace(/<pre[^>]*>/gi, '\n');
  text = text.replace(/<code[^>]*>/gi, '`');
  text = text.replace(/<\/code>/gi, '`');
  text = text.replace(/<[^>]+>/g, ' ');
  text = decodeEntities(text);
  text = text.replace(/\r/g, '');
  text = text.replace(/[ \t]+\n/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]{2,}/g, ' ');
  return repairCommonMojibake(text.trim());
}

function firstMarkdownHeading(markdown) {
  const match = String(markdown || '').match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function htmlTitle(html) {
  const h1 = String(html || '').match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return stripHtmlToText(h1[1]).trim();
  const title = String(html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return title ? stripHtmlToText(title[1]).trim() : null;
}

function extractFrontmatter(markdown) {
  const match = String(markdown || '').match(/^---\s*\n([\s\S]*?)\n---\s*\n?/m);
  return match ? match[1] : '';
}

function extractFrontmatterSummary(markdown) {
  const frontmatter = extractFrontmatter(markdown);
  if (!frontmatter) return '';
  const match = frontmatter.match(/^summary:\s*(?:"([^"]+)"|'([^']+)'|(.+))$/m);
  return repairCommonMojibake((match?.[1] || match?.[2] || match?.[3] || '').trim());
}

function normalizeLine(line) {
  return String(line || '').replace(/\s+/g, ' ').trim();
}

function normalizeCompare(line) {
  return normalizeLine(line)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isBoilerplateLine(line) {
  const value = normalizeCompare(line);
  if (!value) return true;
  const exact = new Set([
    'skip to main content',
    'openclaw home page',
    'english',
    'search',
    'search...',
    'github',
    'releases',
    'discord',
    'navigation',
    'overview',
    'showcase',
    'features',
    'first steps',
    'guides',
    'fundamentals',
    'get started',
    'install',
    'channels',
    'agents',
    'tools plugins',
    'models',
    'platforms',
    'gateway ops',
    'reference',
    'help',
    'gateway',
    'nodes and devices',
    'web interfaces',
    'sessions and memory',
    'messages and delivery',
    'multi-agent',
    'multi agent',
  ]);
  if (exact.has(value)) return true;
  if (/^on this page\b/.test(value)) return true;
  if (/^openclaw\b/.test(value) && value.length <= 20) return true;
  if (/^[a-z0-9-]+$/.test(value) && value.length <= 2) return true;
  return false;
}

function isSubstantiveParagraph(text) {
  const value = normalizeLine(text);
  if (value.length < 70) return false;
  if (isBoilerplateLine(value)) return false;
  if (/^what is .+\?$/.test(value.toLowerCase())) return false;
  if (/^(quick start|configuration|memory|compaction|security|dashboard|control ui|webchat|nodes|skills|plugins)$/i.test(value)) return false;
  return /[a-z]/i.test(value);
}

function hasSubstantialContent(lines, index) {
  const window = lines.slice(index + 1, index + 8).map(normalizeLine).filter(Boolean);
  return window.some((line) => isSubstantiveParagraph(line) || line.length >= 90);
}

function markerCandidates(source, title) {
  const base = [
    title,
    source.title,
    source.topic,
    'What is OpenClaw?',
    'Quick start',
    'Configuration',
    'Gateway Configuration',
    'Multi-Agent Routing',
    'Memory',
    'Compaction',
    'Control UI (browser)',
    'Dashboard',
    'WebChat',
    'Nodes',
    'Security',
    'Troubleshooting',
  ];
  return Array.from(new Set(base.filter(Boolean).map((value) => normalizeCompare(value))));
}

function extractMainDocText(text, source, title) {
  const rawLines = String(text || '')
    .split('\n')
    .map((line) => normalizeLine(line));
  const lines = rawLines.filter(Boolean);
  if (lines.length === 0) return '';

  const candidates = markerCandidates(source, title);
  const onThisPageIndex = lines.findIndex((line) => normalizeCompare(line).startsWith('on this page'));
  const searchStart = onThisPageIndex >= 0 ? onThisPageIndex + 1 : 0;

  let start = -1;
  for (let i = searchStart; i < lines.length; i += 1) {
    const current = normalizeCompare(lines[i]);
    if (!current) continue;
    if (candidates.some((candidate) => candidate && (current === candidate || current.startsWith(candidate)))) {
      if (hasSubstantialContent(lines, i)) {
        start = i;
        break;
      }
      start = i;
    }
  }

  if (start < 0) {
    start = lines.findIndex((line, index) => index >= searchStart && !isBoilerplateLine(line) && hasSubstantialContent(lines, index));
  }
  if (start < 0) start = 0;

  const output = [];
  for (let i = start; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;
    if (output.length === 0 && isBoilerplateLine(line)) continue;
    if (output.length > 0 && isBoilerplateLine(line) && !hasSubstantialContent(lines, i)) continue;
    output.push(line);
  }

  return output.join('\n');
}

function extractCommands(text) {
  const commands = [];
  const lines = String(text || '').split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const lower = line.toLowerCase();
    if (/^(npm|npx|pnpm|bun|ssh)\b/.test(lower) || lower.startsWith('openclaw ')) commands.push(line);
  }
  return Array.from(new Set(commands));
}

function stripMarkdownToText(markdown) {
  let text = repairCommonMojibake(String(markdown || ''));
  text = text.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/m, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/^\s*<(?:p|picture|source|img|a)\b.*$/gim, '');
  text = text.replace(/<\/?(?:p|picture|source|img|a|br|span|div)\b[^>\n]*>/gi, ' ');
  text = text.replace(/<\/?[A-Z][A-Za-z0-9]*(?:\s[^>\n]*)?>/g, ' ');
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/^\s*>\s?/gm, '');
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/```[a-z0-9_-]*\n/gi, '\n');
  text = text.replace(/```/g, '\n');
  text = text.replace(/\r/g, '');
  text = text.replace(/[ \t]+\n/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]{2,}/g, ' ');
  return text.trim();
}

function extractFacts(text) {
  const facts = [];
  const lines = String(text || '').split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.length < 25) continue;
    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      facts.push(line.replace(/^[-*]\s+/, '').trim());
    }
    if (facts.length >= 10) break;
  }
  return Array.from(new Set(facts));
}

function firstParagraph(text) {
  const parts = String(text || '')
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  for (const part of parts) {
    if (/[<][a-z!/]/i.test(part)) continue;
    if (isSubstantiveParagraph(part)) return part;
  }
  return parts[0] || '';
}

function detectDependencies(text) {
  const haystack = String(text || '').toLowerCase();
  return {
    requires_plugin: /\bplugin\b|\bplugins\b/.test(haystack),
    requires_auth: /\bauth\b|\boauth\b|\btoken\b|\bpassword\b|\bprovider\b/.test(haystack),
    requires_pairing: /\bpairing\b|\bapprove\b/.test(haystack),
    requires_node: /\bnode\b|\bnodes\b|\bcamera\b|\bcanvas\b|\bdevice\b/.test(haystack),
    requires_channel: /\bchannel\b|\bchannels\b|\bwhatsapp\b|\btelegram\b|\bdiscord\b|\bimessage\b/.test(haystack),
    security_sensitive: /\bsecurity\b|\ballowlist\b|\binsecure\b|\bsandbox\b|\bremote\b/.test(haystack),
  };
}

async function fetchSource(source) {
  const response = await fetch(source.url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': source.sourceType === 'repo' ? 'text/plain, text/markdown;q=0.9, text/html;q=0.8, */*;q=0.5' : 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(30000),
  });
  const body = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    body,
    headers: Object.fromEntries(response.headers.entries()),
  };
}

function repoDocPathForUrl(url) {
  const parsed = new URL(url);
  let pathname = parsed.pathname || '/';
  if (pathname === '/' || pathname === '/index') return path.join(VENDOR_REPO_ROOT, 'docs', 'index.md');
  pathname = pathname.replace(/\/+$/, '');
  const segments = pathname.split('/').filter(Boolean);
  return path.join(VENDOR_REPO_ROOT, 'docs', ...segments) + '.md';
}

function repoPathForRawGitHubUrl(url) {
  const parsed = new URL(url);
  const match = parsed.pathname.match(/^\/openclaw\/openclaw\/main\/(.+)$/);
  return match ? path.join(VENDOR_REPO_ROOT, ...match[1].split('/')) : null;
}

async function fetchSourceWithRetry(source, retries = 1) {
  if (source.sourceType === 'docs') {
    const localPath = repoDocPathForUrl(source.url);
    if (fs.existsSync(localPath)) {
      return {
        ok: true,
        status: 200,
        body: fs.readFileSync(localPath, 'utf8'),
        headers: {},
        resolvedFrom: 'repo-clone',
        resolvedPath: localPath,
      };
    }
  }

  if (source.sourceType === 'repo') {
    const localPath = repoPathForRawGitHubUrl(source.url);
    if (localPath && fs.existsSync(localPath)) {
      return {
        ok: true,
        status: 200,
        body: fs.readFileSync(localPath, 'utf8'),
        headers: {},
        resolvedFrom: 'repo-clone',
        resolvedPath: localPath,
      };
    }
  }

  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchSource(source);
      if (response.ok || attempt === retries) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === retries) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
  throw lastError || new Error(`Failed to fetch ${source.url}`);
}

function toRawMarkdown(source, fetchedAt, status, body, text, hash, title) {
  return [
    `# ${title || source.title}`,
    '',
    `- source_url: ${source.url}`,
    `- source_type: ${source.sourceType}`,
    `- section: ${source.section}`,
    `- topic: ${source.topic}`,
    `- retrieved_at: ${fetchedAt}`,
    `- http_status: ${status}`,
    `- content_hash: ${hash}`,
    `- official_only: true`,
    '',
    '## Official Extract',
    '',
    text || '(empty extract)',
    '',
    '## Raw Body',
    '',
    '```text',
    body.slice(0, 120000),
    '```',
    '',
  ].join('\n');
}

function normalizeSourceEntry(source, fetchedAt, status, body) {
  const isMarkdown = source.sourceType === 'repo' || /^#\s+/m.test(body) || /^---\s*\n[\s\S]*?\n---\s*\n?#\s+/m.test(body);
  const title = isMarkdown ? firstMarkdownHeading(body) : htmlTitle(body);
  const rawText = isMarkdown ? stripMarkdownToText(body) : stripHtmlToText(body);
  const text = isMarkdown ? rawText : extractMainDocText(rawText, source, title || source.title);
  const hash = sha256(text);
  const summary = isMarkdown ? (extractFrontmatterSummary(body) || firstParagraph(text)) : firstParagraph(text);
  const facts = extractFacts(text);
  const commands = extractCommands(text);
  const deps = detectDependencies(text);
  return {
    entry: {
      id: source.id,
      canonical_topic: source.topic,
      title: title || source.title,
      section: source.section,
      source_url: source.url,
      source_type: source.sourceType,
      retrieved_at: fetchedAt,
      http_status: status,
      content_hash: hash,
      summary_official: summary,
      facts,
      commands,
      ...deps,
      related_topics: [],
    },
    rawMarkdown: toRawMarkdown(source, fetchedAt, status, body, text, hash, title || source.title),
  };
}

function buildCapabilities(entries) {
  return entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    category: entry.section,
    summary_official: entry.summary_official,
    source_url: entry.source_url,
    dependencies: {
      requires_plugin: entry.requires_plugin,
      requires_auth: entry.requires_auth,
      requires_pairing: entry.requires_pairing,
      requires_node: entry.requires_node,
      requires_channel: entry.requires_channel,
    },
  }));
}

function buildRunbooks(entries) {
  const items = [];
  for (const entry of entries) {
    for (const command of entry.commands) {
      items.push({
        id: `${entry.id}:${slugify(command)}`,
        topic: entry.canonical_topic,
        title: entry.title,
        command,
        source_url: entry.source_url,
      });
    }
  }
  return items;
}

function buildDependencies(entries) {
  return entries.map((entry) => ({
    id: entry.id,
    topic: entry.canonical_topic,
    title: entry.title,
    source_url: entry.source_url,
    requires_plugin: entry.requires_plugin,
    requires_auth: entry.requires_auth,
    requires_pairing: entry.requires_pairing,
    requires_node: entry.requires_node,
    requires_channel: entry.requires_channel,
    security_sensitive: entry.security_sensitive,
  }));
}

function buildErrors(entries) {
  return entries
    .filter((entry) => entry.section === 'ops' || entry.security_sensitive)
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      summary_official: entry.summary_official,
      facts: entry.facts,
      source_url: entry.source_url,
    }));
}

function buildConcepts(entries) {
  return entries.map((entry) => ({
    id: entry.id,
    topic: entry.canonical_topic,
    title: entry.title,
    summary_official: entry.summary_official,
    facts: entry.facts,
    source_url: entry.source_url,
  }));
}

function entryById(entries, id) {
  return entries.find((entry) => entry.id === id) || null;
}

function entryByIds(entries, ids) {
  for (const id of ids) {
    const entry = entryById(entries, id);
    if (entry) return entry;
  }
  return null;
}

function bullets(values) {
  if (!values || values.length === 0) return '- Sin datos oficiales cargados.';
  return values.map((value) => `- ${value}`).join('\n');
}

function sectionSummary(entry, fallback = 'Sin extracto oficial disponible.') {
  return entry?.summary_official || fallback;
}

function sectionFacts(entry, limit = 5) {
  return bullets((entry?.facts || []).slice(0, limit));
}

function sectionCommands(entries, ids) {
  const commands = [];
  for (const id of ids) {
    const entry = entryById(entries, id);
    for (const command of entry?.commands || []) commands.push(command);
  }
  return bullets(Array.from(new Set(commands)));
}

function generateReadme(entries) {
  const overview = entryById(entries, 'overview');
  const install = entryById(entries, 'install');
  const gateway = entryByIds(entries, ['gateway-configuration', 'gateway-config-examples', 'gateway-hub']);
  const channels = entryById(entries, 'channels-index');
  const routing = entryById(entries, 'channel-routing');
  const multiAgent = entryById(entries, 'multi-agent');
  const memory = entryById(entries, 'memory');
  const compaction = entryById(entries, 'compaction');
  const skills = entryById(entries, 'tools-skills');
  const plugins = entryById(entries, 'tools-plugin');
  const providers = entryById(entries, 'model-providers');
  const models = entryById(entries, 'models');
  const controlUi = entryById(entries, 'control-ui');
  const dashboard = entryById(entries, 'dashboard');
  const webchat = entryById(entries, 'webchat');
  const nodes = entryById(entries, 'nodes');
  const security = entryByIds(entries, ['gateway-security', 'gateway-authentication']);
  const remote = entryById(entries, 'gateway-remote');
  const troubleshooting = entryByIds(entries, ['help-troubleshooting', 'gateway-troubleshooting', 'channel-troubleshooting']);
  const repoReadme = entryById(entries, 'repo-readme');
  const channelTitles = OFFICIAL_SOURCES
    .filter((source) => source.section === 'channels' && source.id.startsWith('channel-') && !['channel-routing', 'channel-troubleshooting'].includes(source.id))
    .map((source) => source.title);

  return [
    '# README OpenClaw Maestro',
    '',
    'Documento independiente de referencia sobre OpenClaw, regenerado desde fuentes oficiales verificadas.',
    '',
    `Fecha: ${new Date().toISOString().slice(0, 10)}`,
    'Nombre oficial: `OpenClaw`',
    '',
    '## Que es OpenClaw',
    '',
    sectionSummary(overview),
    '',
    '### Hechos oficiales destacados',
    '',
    sectionFacts(overview),
    '',
    '## Que problema resuelve',
    '',
    sectionSummary(repoReadme, sectionSummary(overview)),
    '',
    '## Arquitectura real',
    '',
    'Lectura operacional de la documentacion oficial:',
    '',
    '`Canales y apps -> Gateway -> Agente -> Tools / memoria / UI / nodes`',
    '',
    '### Gateway',
    '',
    sectionSummary(gateway),
    '',
    '### Agentes y routing',
    '',
    sectionSummary(multiAgent),
    '',
    '### Canales',
    '',
    sectionSummary(channels),
    '',
    '### Sessions y channel routing',
    '',
    sectionSummary(routing),
    '',
    '## Como funciona el Gateway',
    '',
    'Comandos oficiales encontrados:',
    '',
    sectionCommands(entries, ['install', 'gateway-configuration', 'multi-agent']),
    '',
    '## Canales soportados',
    '',
    bullets(channelTitles),
    '',
    '## Agentes y aislamiento',
    '',
    sectionFacts(multiAgent, 8),
    '',
    '## Memoria, contexto y compaction',
    '',
    '### Memory',
    '',
    sectionSummary(memory),
    '',
    '### Compaction',
    '',
    sectionSummary(compaction),
    '',
    '## Tools, skills y plugins',
    '',
    '### Skills',
    '',
    sectionSummary(skills),
    '',
    '### Plugins',
    '',
    sectionSummary(plugins),
    '',
    '## Providers, modelos y autenticacion',
    '',
    sectionSummary(providers, sectionSummary(models)),
    '',
    '## UI, dashboard, webchat y apps',
    '',
    '### Control UI',
    '',
    sectionSummary(controlUi),
    '',
    '### Dashboard',
    '',
    sectionSummary(dashboard),
    '',
    '### WebChat',
    '',
    sectionSummary(webchat),
    '',
    '## Nodes, media, voz y dispositivo',
    '',
    sectionSummary(nodes),
    '',
    '## Seguridad, pairing y acceso remoto',
    '',
    '### Security',
    '',
    sectionSummary(security),
    '',
    '### Remote access',
    '',
    sectionSummary(remote),
    '',
    '## Troubleshooting y limites reales',
    '',
    sectionSummary(troubleshooting),
    '',
    '## Como se conecta a un ecosistema como el nuestro',
    '',
    'Lectura informativa basada en la arquitectura oficial:',
    '',
    '- OpenClaw actua como control plane del asistente.',
    '- El Gateway recibe eventos, conserva sesiones y enruta al agente correcto.',
    '- Tools, skills, plugins y nodes extienden lo que el asistente puede hacer.',
    '- La memoria en disco y la compaction sostienen continuidad operativa.',
    '- Las superficies web y los canales son la capa visible; el Gateway sigue siendo la fuente de verdad.',
    '',
    '## Que deberiamos aprovechar siempre como expertos',
    '',
    '- El Gateway como fuente unica de sesiones, routing y surfaces.',
    '- Multi-channel real en lugar de vivir en una sola UI.',
    '- Skills como capa de disciplina operativa del agente.',
    '- Plugins como expansion correcta del core.',
    '- Memoria escrita a disco y compaction como capacidades estructurales.',
    '- Nodes cuando se necesiten capacidades de camara, canvas, sistema o companion devices.',
    '',
    '## Que capacidades deberian estar activadas o preparadas',
    '',
    '- Gateway operativo.',
    '- Onboarding completo.',
    '- Modelo primario definido.',
    '- Pairing y auth del Gateway configurados.',
    '- Al menos un canal estable.',
    '- Skills de workspace.',
    '- Memoria y compaction.',
    '- Control UI.',
    '- Acceso remoto seguro.',
    '- Plugins y nodes segun dependencia real.',
    '',
    '## Fuentes oficiales consultadas',
    '',
    ...OFFICIAL_SOURCES.map((source) => `- [${source.title}](${source.url})`),
    '',
  ].join('\n');
}

function generateVaultFiles(entries, capabilities, runbooks, dependencies, errors) {
  const files = [];
  files.push({
    file: '00-Index.md',
    body: [
      '# OpenClaw Oficial',
      '',
      'Indice generado automaticamente desde fuentes oficiales verificadas.',
      '',
      `- Fuentes: ${entries.length}`,
      `- Capacidades: ${capabilities.length}`,
      `- Runbooks: ${runbooks.length}`,
      '',
      '## Modulos',
      '',
      '- `Conceptos.md`',
      '- `Capacidades.md`',
      '- `Runbooks.md`',
      '- `Dependencias.md`',
      '- `Errores.md`',
      '- `Fuentes.md`',
      '',
    ].join('\n'),
  });
  files.push({
    file: 'Conceptos.md',
    body: ['# Conceptos oficiales', '', ...entries.map((entry) => `## ${entry.title}\n\n${entry.summary_official}\n\nFuente: ${entry.source_url}\n`)].join('\n'),
  });
  files.push({
    file: 'Capacidades.md',
    body: ['# Capacidades oficiales', '', ...capabilities.map((item) => `- ${item.title}: ${item.summary_official}\n  Fuente: ${item.source_url}`)].join('\n'),
  });
  files.push({
    file: 'Runbooks.md',
    body: ['# Runbooks oficiales', '', ...runbooks.map((item) => `- ${item.command}\n  Tema: ${item.topic}\n  Fuente: ${item.source_url}`)].join('\n'),
  });
  files.push({
    file: 'Dependencias.md',
    body: ['# Dependencias y prerequisitos', '', ...dependencies.map((item) => `- ${item.title}: plugin=${item.requires_plugin}, auth=${item.requires_auth}, pairing=${item.requires_pairing}, node=${item.requires_node}, channel=${item.requires_channel}, security=${item.security_sensitive}`)].join('\n'),
  });
  files.push({
    file: 'Errores.md',
    body: ['# Errores y limites', '', ...errors.map((item) => `## ${item.title}\n\n${item.summary_official}\n\nFuente: ${item.source_url}\n`)].join('\n'),
  });
  files.push({
    file: 'Fuentes.md',
    body: ['# Fuentes oficiales', '', ...entries.map((entry) => `- [${entry.title}](${entry.source_url})`)].join('\n'),
  });
  return files;
}

async function main() {
  ensureDir(RAW_DOCS_ROOT);
  ensureDir(RAW_REPO_ROOT);
  ensureDir(NORMALIZED_ROOT);
  ensureDir(BUILD_ROOT);
  ensureDir(STATE_ROOT);

  const fetchLog = [];
  const normalizedEntries = [];

  for (const source of OFFICIAL_SOURCES) {
      const fetchedAt = new Date().toISOString();
    try {
      const response = await fetchSourceWithRetry(source, 1);
      if (!response.ok) {
        fetchLog.push({ id: source.id, url: source.url, status: 'failed', http_status: response.status, retrieved_at: fetchedAt });
        continue;
      }

      const normalized = normalizeSourceEntry(source, fetchedAt, response.status, response.body);
      normalizedEntries.push(normalized.entry);
      fetchLog.push({
        id: source.id,
        url: source.url,
        status: 'fetched',
        http_status: response.status,
        retrieved_at: fetchedAt,
        content_hash: normalized.entry.content_hash,
        resolved_from: response.resolvedFrom || 'network',
        resolved_path: response.resolvedPath || null,
      });

      const rawDir = source.sourceType === 'repo' ? RAW_REPO_ROOT : RAW_DOCS_ROOT;
      writeText(path.join(rawDir, `${source.id}.md`), normalized.rawMarkdown);
    } catch (error) {
      fetchLog.push({
        id: source.id,
        url: source.url,
        status: 'failed',
        retrieved_at: fetchedAt,
        error: error.message || String(error),
      });
    }
  }

  const capabilities = buildCapabilities(normalizedEntries);
  const runbooks = buildRunbooks(normalizedEntries);
  const dependencies = buildDependencies(normalizedEntries);
  const errors = buildErrors(normalizedEntries);
  const concepts = buildConcepts(normalizedEntries);
  const readme = generateReadme(normalizedEntries);

  writeJson(path.join(STATE_ROOT, 'url-manifest.json'), OFFICIAL_SOURCES);
  writeJson(path.join(STATE_ROOT, 'fetch-log.json'), fetchLog);
  writeJson(path.join(NORMALIZED_ROOT, 'sources.json'), normalizedEntries);
  writeJson(path.join(NORMALIZED_ROOT, 'capabilities.json'), capabilities);
  writeJson(path.join(NORMALIZED_ROOT, 'runbooks.json'), runbooks);
  writeJson(path.join(NORMALIZED_ROOT, 'dependencies.json'), dependencies);
  writeJson(path.join(NORMALIZED_ROOT, 'errors.json'), errors);
  writeJson(path.join(NORMALIZED_ROOT, 'concepts.json'), concepts);

  writeText(README_TARGET, readme);
  writeText(BUILD_README_TARGET, readme);

  if (fs.existsSync(path.dirname(VAULT_ROOT)) || fs.existsSync(VAULT_ROOT)) {
    const files = generateVaultFiles(normalizedEntries, capabilities, runbooks, dependencies, errors);
    for (const file of files) writeText(path.join(VAULT_ROOT, file.file), file.body);
  }

  console.log(`[sync-openclaw-official] Sources fetched: ${normalizedEntries.length}/${OFFICIAL_SOURCES.length}`);
  console.log(`[sync-openclaw-official] README: ${README_TARGET}`);
  console.log(`[sync-openclaw-official] Build root: ${BUILD_ROOT}`);
  console.log(`[sync-openclaw-official] Vault root: ${VAULT_ROOT}`);
}

main().catch((error) => {
  console.error('[sync-openclaw-official] Failed');
  console.error(error);
  process.exitCode = 1;
});
