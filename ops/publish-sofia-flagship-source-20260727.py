#!/usr/bin/env python3
from __future__ import annotations
import json, pathlib, re, subprocess

BASE=pathlib.Path('/opt/sofia/sofia-mobile')
SRC=BASE/'sofia-flagship.cjs'
OUT=BASE/'model-inspect.json'

def run(cmd):
    try:
        p=subprocess.run(['bash','-lc',cmd],text=True,capture_output=True,timeout=12)
        return (p.stdout+'\n'+p.stderr).strip()[:12000]
    except Exception as e:
        return f'ERROR:{type(e).__name__}:{e}'

text=SRC.read_text(encoding='utf-8',errors='replace')
lines=text.splitlines()
rx=re.compile(r'opus|claude|model|modelo|elegirCerebro|razonarFlagship|1440|rotaci[oó]n|franja|fallback|cuota|quota|sonnet|haiku',re.I)
hits=set()
for i,line in enumerate(lines):
    if rx.search(line) and not re.search(r'token|secret|password|credential|api.?key',line,re.I):
        for j in range(max(0,i-8),min(len(lines),i+9)): hits.add(j)
ctx=[]
for i in sorted(hits)[:700]:
    s=lines[i]
    s=re.sub(r'(st-[A-Za-z0-9._-]{8,})','***REDACTED***',s)
    s=re.sub(r'(?i)(token|secret|password|credential|api.?key)\s*[=:]\s*[^\s,;]+',r'\1=***REDACTED***',s)
    ctx.append({'line':i+1,'text':s[:1500]})
payload={
 'source_file':str(SRC),
 'source_context':ctx,
 'literal_counts':{
   'opus_4_8':len(re.findall(r'Opus\s*4\.8',text,re.I)),
   'opus_5':len(re.findall(r'Opus\s*5',text,re.I)),
   'opus_alias':len(re.findall(r'["\']opus["\']',text,re.I)),
 },
 'claude_cli_path':run('command -v claude || true'),
 'claude_cli_version':run('claude --version 2>&1 || true'),
 'processes':run("ps -eo pid,lstart,args | grep -Ei 'claude|opus|sofia-gateway|flagship' | grep -v grep | head -100"),
 'service':run('systemctl show sofia-gateway -p ExecStart -p WorkingDirectory -p MainPID --no-pager 2>/dev/null || true'),
 'file_candidates':run("find /opt/sofia/sofia-mobile /root/.claude -maxdepth 4 -type f 2>/dev/null | grep -Ei 'model|opus|claude|flagship|brain|cerebro|rotat|schedule|franja' | head -200")
}
OUT.write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
print('FLAGSHIP_SOURCE_PUBLISHED')
