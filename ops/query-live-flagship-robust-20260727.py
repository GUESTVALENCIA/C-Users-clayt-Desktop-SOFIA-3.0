#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import pathlib
import re
import subprocess
import urllib.error
import urllib.request

ROOTS = [pathlib.Path('/opt/sofia'), pathlib.Path('/etc/systemd/system'), pathlib.Path('/root')]
TOKEN_PATTERNS = [
    re.compile(r'^\s*SOFIA_RUNTIME_TOKEN\s*=\s*["\']?([^\s"\'`;]+)', re.I | re.M),
    re.compile(r'\bSOFIA_RUNTIME_TOKEN\b\s*[:=]\s*["\']([^"\']{12,})["\']', re.I),
]
PLACEHOLDERS = {'change-me','changeme','placeholder','example','your-token','undefined','null',''}


def sanitize(obj):
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if re.search(r'token|secret|password|credential|api.?key|email|account', str(k), re.I):
                out[k] = '***REDACTED***'
            else:
                out[k] = sanitize(v)
        return out
    if isinstance(obj, list):
        return [sanitize(v) for v in obj[:50]]
    if isinstance(obj, str):
        return re.sub(r'st-[A-Za-z0-9._-]{8,}', '***REDACTED***', obj)[:2000]
    return obj


def add_candidate(value: str, candidates: list[str]):
    value = value.strip().strip('"\'')
    if len(value) >= 12 and value.lower() not in PLACEHOLDERS and value not in candidates:
        candidates.append(value)


candidates: list[str] = []
# Process environments, including the live gateway if the value was exported.
try:
    pids = subprocess.check_output(['pgrep','-f','sofia.*gateway|gateway.cjs'], text=True).split()
except Exception:
    pids = []
for pid in pids:
    try:
        for entry in pathlib.Path(f'/proc/{pid}/environ').read_bytes().split(b'\0'):
            if entry.startswith(b'SOFIA_RUNTIME_TOKEN='):
                add_candidate(entry.split(b'=',1)[1].decode('utf-8','ignore'), candidates)
    except Exception:
        pass

# Configuration files. Values never leave this process.
seen = 0
for root in ROOTS:
    if not root.exists():
        continue
    for path in root.rglob('*'):
        if seen > 12000:
            break
        seen += 1
        try:
            if not path.is_file() or path.stat().st_size > 2_000_000:
                continue
        except Exception:
            continue
        s = str(path)
        if any(x in s for x in ('/node_modules/','/.cache/','/.npm/','/logs/','.git/')):
            continue
        try:
            data = path.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            continue
        if 'SOFIA_RUNTIME_TOKEN' not in data:
            continue
        for pattern in TOKEN_PATTERNS:
            for match in pattern.finditer(data):
                add_candidate(match.group(1), candidates)


def request(path: str, token: str, body=None):
    url = 'http://127.0.0.1:8910' + path
    headers = {'X-Sofia-Token': token}
    data = None
    method = 'GET'
    if body is not None:
        headers['Content-Type'] = 'application/json'
        data = json.dumps(body).encode()
        method = 'POST'
    req = urllib.request.Request(url, headers=headers, data=data, method=method)
    with urllib.request.urlopen(req, timeout=35) as r:
        raw = r.read().decode('utf-8','replace')
        return r.status, json.loads(raw)

valid = None
for candidate in candidates:
    try:
        status, payload = request('/api/status', candidate)
        if status == 200 and isinstance(payload, dict) and payload.get('ok') is True:
            valid = candidate
            break
    except Exception:
        continue

if not valid:
    print(json.dumps({'ok':False,'error':'no_valid_runtime_token','candidate_count':len(candidates)}, ensure_ascii=False, separators=(',',':')))
    raise SystemExit(2)

try:
    status, payload = request('/api/tool', valid, {'name':'flagship_cerebro','args':{}})
    print(json.dumps({'ok':status == 200,'http_status':status,'result':sanitize(payload)}, ensure_ascii=False, separators=(',',':')))
except Exception as exc:
    print(json.dumps({'ok':False,'error':type(exc).__name__,'detail':str(exc)[:300]}, ensure_ascii=False, separators=(',',':')))
    raise SystemExit(3)
