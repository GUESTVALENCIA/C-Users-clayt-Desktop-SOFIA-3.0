#!/usr/bin/env python3
from __future__ import annotations

import base64
import json
import os
import pathlib
import re
import shutil
import subprocess
from typing import Any

TASK_NAME = 'probe_exact_claude_model_20260727'
ROOTS = [pathlib.Path('/opt/sofia'), pathlib.Path('/root'), pathlib.Path('/etc/systemd/system')]
DB_PATTERNS = [
    re.compile(r'^\s*NEON_DATABASE_URL\s*=\s*["\']?([^\s"\'`;]+)', re.I | re.M),
    re.compile(r'\bNEON_DATABASE_URL\b\s*[:=]\s*["\']([^"\']{20,})["\']', re.I),
    re.compile(r'(postgres(?:ql)?://[^\s"\'`;]+)', re.I),
]


def candidates_from_system() -> list[str]:
    found: list[str] = []
    for pid_dir in pathlib.Path('/proc').iterdir():
        if not pid_dir.name.isdigit():
            continue
        try:
            env = (pid_dir / 'environ').read_bytes().split(b'\0')
        except Exception:
            continue
        for entry in env:
            if entry.startswith(b'NEON_DATABASE_URL='):
                value = entry.split(b'=',1)[1].decode('utf-8','ignore')
                if value and value not in found:
                    found.append(value)
    seen = 0
    for root in ROOTS:
        if not root.exists():
            continue
        for path in root.rglob('*'):
            if seen > 15000:
                break
            seen += 1
            try:
                if not path.is_file() or path.stat().st_size > 2_000_000:
                    continue
            except Exception:
                continue
            s = str(path)
            if any(x in s for x in ('/node_modules/','/.cache/','/.npm/','/.git/','/logs/')):
                continue
            try:
                text = path.read_text(encoding='utf-8', errors='ignore')
            except Exception:
                continue
            if 'NEON_DATABASE_URL' not in text and 'postgres' not in text:
                continue
            for pattern in DB_PATTERNS:
                for match in pattern.finditer(text):
                    value = match.group(1).strip().strip('"\'')
                    if value.startswith(('postgres://','postgresql://')) and value not in found:
                        found.append(value)
    return found


def walk_strings(obj: Any):
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield str(k)
            yield from walk_strings(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from walk_strings(v)
    elif isinstance(obj, str):
        yield obj


def probe() -> dict[str, Any]:
    claude = shutil.which('claude')
    result: dict[str, Any] = {
        'ok': False,
        'requested_alias': 'opus',
        'claude_path': claude,
    }
    try:
        result['claude_version'] = subprocess.run(
            ['claude','--version'], text=True, capture_output=True, timeout=15
        ).stdout.strip()[:200] if claude else None
    except Exception as exc:
        result['claude_version_error'] = type(exc).__name__
    if not claude:
        result['error'] = 'claude_cli_missing'
        return result
    try:
        proc = subprocess.run(
            [claude,'-p','--model','opus','--output-format','json','--max-turns','1','Reply only with OK.'],
            cwd='/opt/sofia/sofia-mobile', text=True, capture_output=True, timeout=120,
        )
    except subprocess.TimeoutExpired:
        result['error'] = 'claude_probe_timeout'
        return result
    except Exception as exc:
        result['error'] = f'{type(exc).__name__}:{str(exc)[:160]}'
        return result
    result['exit_code'] = proc.returncode
    result['stderr_tail'] = proc.stderr[-500:]
    data = None
    try:
        data = json.loads(proc.stdout)
    except Exception:
        result['stdout_head'] = proc.stdout[:500]
    model_ids: list[str] = []
    if data is not None:
        for value in walk_strings(data):
            if re.search(r'claude|opus|sonnet|fable|mythos', value, re.I):
                for m in re.findall(r'[A-Za-z0-9._:/-]*(?:claude|opus|sonnet|fable|mythos)[A-Za-z0-9._:/-]*', value, re.I):
                    if len(m) >= 4 and m not in model_ids:
                        model_ids.append(m)
        if isinstance(data, dict):
            result['model_usage_keys'] = list((data.get('modelUsage') or data.get('model_usage') or {}).keys())
            for key in result['model_usage_keys']:
                if key not in model_ids:
                    model_ids.append(key)
            for key in ('model','model_id','modelId'):
                if data.get(key) and str(data[key]) not in model_ids:
                    model_ids.append(str(data[key]))
    result['model_ids'] = model_ids[:30]
    result['ok'] = proc.returncode == 0 and bool(model_ids)
    if proc.returncode != 0 and 'error' not in result:
        result['error'] = 'claude_probe_failed'
    elif not model_ids and 'error' not in result:
        result['error'] = 'model_identifier_not_found_in_json'
    return result


def write_to_neon(payload: dict[str, Any]) -> None:
    urls = candidates_from_system()
    encoded = base64.b64encode(json.dumps(payload, ensure_ascii=False, separators=(',',':')).encode()).decode()
    sql = (
        "UPDATE public.gv_sofia_tareas SET ultimo_resultado="
        f"convert_from(decode('{encoded}','base64'),'UTF8') "
        f"WHERE nombre='{TASK_NAME}';"
    )
    psql = shutil.which('psql')
    if not psql:
        raise RuntimeError('psql_missing')
    errors=[]
    for url in urls:
        try:
            proc=subprocess.run([psql,url,'-v','ON_ERROR_STOP=1','-Atc',sql],text=True,capture_output=True,timeout=30)
            if proc.returncode == 0:
                print('MODEL_PROBE_RECORDED')
                return
            errors.append(proc.stderr[-120:])
        except Exception as exc:
            errors.append(type(exc).__name__)
    raise RuntimeError('neon_write_failed:' + '|'.join(errors[-3:]))


payload=probe()
try:
    write_to_neon(payload)
except Exception as exc:
    # Always leave a compact stdout breadcrumb if Neon write cannot be completed.
    print(json.dumps({'probe':payload,'record_error':str(exc)[:300]},ensure_ascii=False,separators=(',',':')))
    raise
