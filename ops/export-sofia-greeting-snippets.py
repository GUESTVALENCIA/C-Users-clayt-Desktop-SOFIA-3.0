#!/usr/bin/env python3
from pathlib import Path
import json, re

out = {"index": [], "gateway": []}
for label, path in [
    ("index", Path('/opt/sofia/sofia-mobile/index.html')),
    ("gateway", Path('/opt/sofia/sofia-mobile/gateway.cjs')),
]:
    text = path.read_text(encoding='utf-8', errors='replace')
    lines = text.splitlines()
    if label == 'index':
        rx = re.compile(r'setupComplete|clientContent|turns\s*:|salud|hola|buenos d[ií]as|buenas tardes|buenas noches', re.I)
    else:
        rx = re.compile(r'salud|saludo|da la bienvenida|pres[eé]ntate|hola|buenos d[ií]as|buenas tardes|buenas noches', re.I)
    hits = [i for i, line in enumerate(lines) if rx.search(line)]
    selected = []
    seen = set()
    for i in hits:
        for j in range(max(0, i-2), min(len(lines), i+3)):
            if j in seen:
                continue
            seen.add(j)
            line = lines[j]
            # Never export long token-like strings or environment assignments.
            line = re.sub(r'([A-Za-z0-9._-]{24,})', '***REDACTED***', line)
            selected.append({"line": j+1, "text": line[:500]})
    out[label] = selected[:80]

Path('/opt/sofia/sofia-mobile/greeting-inspect.json').write_text(
    json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8'
)
print('EXPORTED=/opt/sofia/sofia-mobile/greeting-inspect.json')
