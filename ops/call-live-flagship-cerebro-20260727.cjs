'use strict';
const fs=require('node:fs');
const cp=require('node:child_process');
const path=require('node:path');
const OUT='/opt/sofia/sofia-mobile/model-inspect.json';
function sanitize(value,key=''){
  if(/token|secret|password|credential|api.?key|email|account|organization|project/i.test(key)) return '***REDACTED***';
  if(Array.isArray(value)) return value.slice(0,50).map(v=>sanitize(v));
  if(value&&typeof value==='object'){const o={};for(const[k,v]of Object.entries(value))o[k]=sanitize(v,k);return o;}
  if(typeof value==='string') return value.replace(/st-[A-Za-z0-9._-]{8,}/g,'***REDACTED***').slice(0,2000);
  return value;
}
(async()=>{
  const payload={timestamp:new Date().toISOString()};
  try{
    const pid=Number(cp.execFileSync('systemctl',['show','sofia-gateway','-p','MainPID','--value'],{encoding:'utf8'}).trim());
    payload.service_pid=pid;
    if(!pid) throw new Error('missing_main_pid');
    const entries=fs.readFileSync(`/proc/${pid}/environ`).toString('utf8').split('\0');
    const env={}; for(const e of entries){const i=e.indexOf('=');if(i>0)env[e.slice(0,i)]=e.slice(i+1);}
    const token=env.SOFIA_RUNTIME_TOKEN || env.RUNTIME_TOKEN || env.SOFIA_TOKEN;
    if(!token) throw new Error('runtime_token_not_in_service_env');
    const port=env.SOFIA_MOBILE_PORT || '8910';
    const res=await fetch(`http://127.0.0.1:${port}/api/tool`,{
      method:'POST',headers:{'content-type':'application/json','x-sofia-token':token},
      body:JSON.stringify({name:'flagship_cerebro',args:{}}),signal:AbortSignal.timeout(30000)
    });
    payload.http_status=res.status;
    const text=await res.text();
    try{payload.response=sanitize(JSON.parse(text));}catch{payload.response_text=text.slice(0,3000);}
  }catch(e){payload.error=String(e&&e.stack||e);}
  fs.writeFileSync(OUT,JSON.stringify(payload,null,2));
  console.log('LIVE_FLAGSHIP_TOOL_RESULT_PUBLISHED');
})().catch(e=>{fs.writeFileSync(OUT,JSON.stringify({fatal:String(e&&e.stack||e)},null,2));process.exit(1)});
