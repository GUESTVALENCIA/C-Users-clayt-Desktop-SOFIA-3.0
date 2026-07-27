'use strict';
const fs = require('node:fs');
const path = require('node:path');

const BASE = '/opt/sofia/sofia-mobile';
const MOD = path.join(BASE, 'sofia-flagship.cjs');
const OUT = path.join(BASE, 'flagship-inspect.json');

function sanitize(value, key='') {
  if (/token|secret|password|credential|api.?key|email|account|organization|project/i.test(key)) return '***REDACTED***';
  if (Array.isArray(value)) return value.slice(0, 50).map(v => sanitize(v));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k,v] of Object.entries(value)) out[k] = sanitize(v, k);
    return out;
  }
  if (typeof value === 'string') {
    return value.replace(/st-[A-Za-z0-9._-]{8,}/g, '***REDACTED***').slice(0, 1000);
  }
  return value;
}

function contextLines(source) {
  const lines = source.split(/\r?\n/);
  const rx = /opus|claude|modelo|model|elegirCerebro|razonarFlagship|1440|rotaci[oó]n|franja|fallback|quota|cuota/i;
  const hits = new Set();
  lines.forEach((line, i) => {
    if (rx.test(line) && !/token|secret|password|credential|api.?key/i.test(line)) {
      for (let j=Math.max(0,i-7); j<Math.min(lines.length,i+8); j++) hits.add(j);
    }
  });
  return [...hits].sort((a,b)=>a-b).slice(0,500).map(i => ({line:i+1,text:lines[i].slice(0,1400)}));
}

(async () => {
  const source = fs.readFileSync(MOD, 'utf8');
  const mod = require(MOD);
  let current = null;
  let currentError = null;
  try { current = await mod.elegirCerebro(); } catch (e) { currentError = String(e && e.message || e); }
  const payload = {
    timestamp: new Date().toISOString(),
    module: MOD,
    exported_functions: Object.keys(mod),
    current_selector_result: sanitize(current),
    current_selector_error: currentError,
    source_context: contextLines(source),
    literal_counts: {
      opus_4_8: (source.match(/Opus\s*4\.8/gi)||[]).length,
      opus_5: (source.match(/Opus\s*5/gi)||[]).length,
      model_opus: (source.match(/model[^\n]{0,80}opus|opus[^\n]{0,80}model/gi)||[]).length,
    }
  };
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), 'utf8');
  console.log('FLAGSHIP_INSPECT_PUBLISHED');
})().catch(e => { console.error(e); process.exit(1); });
