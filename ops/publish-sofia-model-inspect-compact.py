#!/usr/bin/env python3
from __future__ import annotations
import json, pathlib, re, subprocess

BASE = pathlib.Path('/opt/sofia/sofia-mobile')
INDEX = BASE / 'index.html'
GATEWAY = BASE / 'gateway.cjs'
OUT = BASE / 'model-inspect.json'


def run(cmd: str) -> str:
    try:
        p = subprocess.run(['bash','-lc',cmd], text=True, capture_output=True, timeout=12)
        return (p.stdout + '\n' + p.stderr).strip()[:8000]
    except Exception as exc:
        return f'ERROR:{type(exc).__name__}:{exc}'


def contexts(path: pathlib.Path, patterns: list[str], radius: int = 12, max_lines: int = 240):
    lines = path.read_text(encoding='utf-8', errors='replace').splitlines()
    hits = set()
    regs = [re.compile(p, re.I) for p in patterns]
    for i,line in enumerate(lines):
        if any(r.search(line) for r in regs):
            for j in range(max(0,i-radius), min(len(lines),i+radius+1)):
                hits.add(j)
    out=[]
    for i in sorted(hits)[:max_lines]:
        t=lines[i]
        t=re.sub(r'(st-[A-Za-z0-9._-]{8,})','***REDACTED***',t)
        t=re.sub(r'(?i)(token|secret|password|api[_-]?key)\s*[=:]\s*[^\s,;]+',r'\1=***REDACTED***',t)
        out.append({'line':i+1,'text':t[:1200]})
    return out

index_text = INDEX.read_text(encoding='utf-8', errors='replace')
gateway_text = GATEWAY.read_text(encoding='utf-8', errors='replace')
patterns=[r'flagship_cerebro',r'razonar_flagship',r'Opus\s*4\.8',r'Opus\s*5',r'claude',r'modelo',r'model',r'1440',r'rotaci[oó]n',r'franja']

payload={
  'opus_4_8_count': len(re.findall(r'Opus\s*4\.8', index_text+gateway_text, flags=re.I)),
  'opus_5_count': len(re.findall(r'Opus\s*5', index_text+gateway_text, flags=re.I)),
  'index_context': contexts(INDEX, patterns, radius=8, max_lines=180),
  'gateway_context': contexts(GATEWAY, patterns, radius=10, max_lines=260),
  'claude_cli_path': run('command -v claude || true'),
  'claude_cli_version': run('claude --version 2>&1 || true'),
  'running_processes': run("ps -eo pid,lstart,args | grep -Ei 'claude|opus|sofia-gateway|flagship' | grep -v grep | head -80"),
  'gateway_service': run('systemctl show sofia-gateway -p ExecStart -p WorkingDirectory -p FragmentPath --no-pager 2>/dev/null || true'),
  'model_env_names': run("systemctl show sofia-gateway -p Environment --no-pager 2>/dev/null | tr ' ' '\n' | grep -Ei 'MODEL|OPUS|CLAUDE|FLAGSHIP|BRAIN|CEREBRO' | sed -E 's/=.*/=***VALUE_PRESENT***/' || true"),
  'candidate_files': run("find /opt/sofia /root/.claude -maxdepth 5 -type f 2>/dev/null | grep -Ei 'model|opus|claude|flagship|brain|cerebro|rotat|schedule|franja' | head -160"),
}
OUT.write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
print('MODEL_INSPECT_PUBLISHED')
