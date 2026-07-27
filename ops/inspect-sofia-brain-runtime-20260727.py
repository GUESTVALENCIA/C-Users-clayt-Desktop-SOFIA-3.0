#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import pathlib
import re
import subprocess
from typing import Any

ROOTS = [
    pathlib.Path('/opt/sofia'),
    pathlib.Path('/root/.claude'),
    pathlib.Path('/root'),
]
TARGETS = [
    pathlib.Path('/opt/sofia/sofia-mobile/index.html'),
    pathlib.Path('/opt/sofia/sofia-mobile/gateway.cjs'),
]
KEY_RE = re.compile(r'(opus|claude|model|modelo|cerebro|flagship|rotaci[oó]n|franja|1440)', re.I)
SECRET_RE = re.compile(r'(token|secret|password|api[_-]?key|credential)', re.I)


def safe_line(text: str) -> str:
    text = re.sub(r'(st-[A-Za-z0-9._-]{8,})', '***REDACTED***', text)
    text = re.sub(r'(?i)(token|secret|password|api[_-]?key|credential)\s*[=:]\s*[^\s,;]+', r'\1=***REDACTED***', text)
    return text[:1200]


def extract_context(path: pathlib.Path, radius: int = 8) -> list[dict[str, Any]]:
    if not path.exists() or path.stat().st_size > 5_000_000:
        return []
    try:
        lines = path.read_text(encoding='utf-8', errors='replace').splitlines()
    except Exception:
        return []
    hits: set[int] = set()
    for i, line in enumerate(lines):
        if KEY_RE.search(line) and not SECRET_RE.search(line):
            for j in range(max(0, i-radius), min(len(lines), i+radius+1)):
                hits.add(j)
    out = []
    for i in sorted(hits):
        out.append({'line': i+1, 'text': safe_line(lines[i])})
    return out[:500]


def scan_json(path: pathlib.Path) -> list[dict[str, Any]]:
    if not path.exists() or path.stat().st_size > 2_000_000:
        return []
    try:
        data = json.loads(path.read_text(encoding='utf-8', errors='replace'))
    except Exception:
        return []
    out: list[dict[str, Any]] = []
    def walk(obj: Any, prefix: str = '') -> None:
        if len(out) >= 300:
            return
        if isinstance(obj, dict):
            for k, v in obj.items():
                p = f'{prefix}.{k}' if prefix else str(k)
                if SECRET_RE.search(str(k)):
                    continue
                if KEY_RE.search(str(k)) or (isinstance(v, str) and KEY_RE.search(v)):
                    out.append({'path': p, 'value': safe_line(json.dumps(v, ensure_ascii=False))})
                walk(v, p)
        elif isinstance(obj, list):
            for i, v in enumerate(obj[:200]):
                walk(v, f'{prefix}[{i}]')
    walk(data)
    return out


def cmd(command: list[str]) -> str:
    try:
        p = subprocess.run(command, text=True, capture_output=True, timeout=15)
        return safe_line((p.stdout + '\n' + p.stderr).strip())
    except Exception as exc:
        return f'ERROR:{type(exc).__name__}:{exc}'


result: dict[str, Any] = {
    'timestamp_utc': cmd(['date', '-u', '+%Y-%m-%dT%H:%M:%SZ']),
    'files': {},
    'json_config': {},
    'candidate_files': [],
    'processes': cmd(['bash', '-lc', "ps -eo pid,lstart,args | grep -Ei 'claude|opus|sofia|gateway|flagship' | grep -v grep | head -80"]),
    'claude_cli': {
        'path': cmd(['bash', '-lc', 'command -v claude || true']),
        'version': cmd(['bash', '-lc', 'timeout 10s claude --version 2>&1 || true']),
    },
    'systemd_exec': cmd(['bash', '-lc', "systemctl show sofia-gateway -p ExecStart -p WorkingDirectory -p FragmentPath --no-pager 2>/dev/null || true"]),
    'model_env_names': cmd(['bash', '-lc', "systemctl show sofia-gateway -p Environment --no-pager 2>/dev/null | tr ' ' '\n' | grep -Ei 'MODEL|OPUS|CLAUDE|FLAGSHIP|BRAIN|CEREBRO' | sed -E 's/=.*/=***VALUE_PRESENT***/' || true"]),
}

for target in TARGETS:
    result['files'][str(target)] = extract_context(target)

seen: set[str] = set()
for root in ROOTS:
    if not root.exists():
        continue
    for path in root.rglob('*'):
        if len(result['candidate_files']) >= 250:
            break
        if not path.is_file():
            continue
        s = str(path)
        if any(part in s for part in ['/node_modules/', '/.cache/', '/.npm/', '/proc/', '/sys/']):
            continue
        name = path.name.lower()
        if KEY_RE.search(name) or name in {'settings.json', '.claude.json', 'config.json', 'schedule.json'}:
            if s not in seen:
                seen.add(s)
                result['candidate_files'].append(s)
                if path.suffix.lower() == '.json' or name.endswith('.json'):
                    rows = scan_json(path)
                    if rows:
                        result['json_config'][s] = rows

out = pathlib.Path('/opt/sofia/sofia-mobile/brain-runtime-inspect.json')
out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'EXPORTED={out}')
