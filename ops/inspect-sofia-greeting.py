#!/usr/bin/env python3
from pathlib import Path
import re

paths = [
    Path('/opt/sofia/sofia-mobile/index.html'),
    Path('/opt/sofia/sofia-mobile/gateway.cjs'),
]
patterns = [
    r'salud', r'hola', r'buenos d[ií]as', r'buenas tardes', r'buenas noches',
    r'speechSynthesis', r'Audio\(', r'new Audio', r'play\(', r'clientContent',
    r'setupComplete', r'BidiGenerateContent', r'inputAudioTranscription',
    r'turnComplete', r'send\(', r'ws\.onopen', r'onopen', r'primer', r'inicial'
]
rx = re.compile('|'.join(patterns), re.I)
for path in paths:
    print(f'FILE={path}')
    if not path.exists():
        print('MISSING')
        continue
    lines = path.read_text(encoding='utf-8', errors='replace').splitlines()
    hits = [i for i, line in enumerate(lines) if rx.search(line)]
    shown = set()
    for i in hits:
        for j in range(max(0, i-2), min(len(lines), i+3)):
            if j in shown:
                continue
            shown.add(j)
            print(f'{j+1}: {lines[j]}')
    print(f'HITS={len(hits)}')
