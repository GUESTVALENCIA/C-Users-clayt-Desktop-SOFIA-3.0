'use strict';
const fs = require('node:fs');
const cp = require('node:child_process');
const path = require('node:path');

const BASE='/opt/sofia/sofia-mobile';
const OUT=path.join(BASE,'model-inspect.json');

function sanitize(value, key='') {
  if (/token|secret|password|credential|api.?key|email|account|organization|project/i.test(key)) return '***REDACTED***';
  if (Array.isArray(value)) return value.slice(0,50).map(v=>sanitize(v));
  if (value && typeof value === 'object') {
    const o={}; for (const [k,v] of Object.entries(value)) o[k]=sanitize(v,k); return o;
  }
  if (typeof value === 'string') return value.replace(/st-[A-Za-z0-9._-]{8,}/g,'***REDACTED***').slice(0,1500);
  return value;
}

(async()=>{
  const pid=Number(cp.execFileSync('systemctl',['show','sofia-gateway','-p','MainPID','--value'],{encoding:'utf8'}).trim());
  if (!pid) throw new Error('sofia_gateway_pid_missing');
  const envRaw=fs.readFileSync(`/proc/${pid}/environ`);
  for (const entry of envRaw.toString('utf8').split('\0')) {
    const i=entry.indexOf('='); if (i>0) process.env[entry.slice(0,i)]=entry.slice(i+1);
  }
  process.chdir(BASE);
  const mod=require(path.join(BASE,'sofia-flagship.cjs'));
  let current=null, error=null;
  try { current=await mod.elegirCerebro(); } catch(e) { error=String(e&&e.stack||e); }
  const source=fs.readFileSync(path.join(BASE,'sofia-flagship.cjs'),'utf8');
  const lines=source.split(/\r?\n/);
  const ctx=[];
  for(let i=0;i<lines.length;i++){
    if(/elegirCerebro|razonarFlagship|opus|claude|model|modelo|fallback|cuota|quota|sonnet|haiku/i.test(lines[i]) && !/token|secret|password|credential|api.?key/i.test(lines[i])){
      for(let j=Math.max(0,i-5);j<Math.min(lines.length,i+6);j++) if(!ctx.some(x=>x.line===j+1)) ctx.push({line:j+1,text:lines[j].slice(0,1400)});
    }
  }
  fs.writeFileSync(OUT,JSON.stringify({
    timestamp:new Date().toISOString(),
    service_pid:pid,
    selector_result:sanitize(current),
    selector_error:error,
    exports:Object.keys(mod),
    source_context:ctx.slice(0,600),
    literals:{opus_4_8:(source.match(/Opus\s*4\.8/gi)||[]).length,opus_5:(source.match(/Opus\s*5/gi)||[]).length}
  },null,2));
  console.log('LIVE_SELECTOR_PUBLISHED');
})().catch(e=>{console.error(e);process.exit(1)});
