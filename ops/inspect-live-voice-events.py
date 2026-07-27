#!/usr/bin/env python3
from __future__ import annotations
import json, pathlib, re, subprocess, datetime as dt

ROOT = pathlib.Path('/opt/sofia/sofia-mobile')
PATTERNS = ('gemini_setup_ok','mic_modo','mic_worklet_sink','mic_audio_fluye','oido_clay','audio_modelo','gemini_error','ws_close','ws_error','mic_error','audio_error')
rows=[]
for p in sorted(ROOT.rglob('*')):
    if not p.is_file() or p.stat().st_size > 20_000_000:
        continue
    if not any(x in p.name.lower() for x in ('event','log','jsonl','ndjson')):
        continue
    try:
        lines=p.read_text('utf-8','ignore').splitlines()[-5000:]
    except Exception:
        continue
    for line in lines:
        low=line.lower()
        if any(k in low for k in PATTERNS):
            clean=re.sub(r'(?i)(token|authorization|x-sofia-token)["\'\s:=]+[^,}\s]+', r'\1=***', line)
            rows.append({'file':str(p.relative_to(ROOT)),'line':clean[-1200:]})

journal=''
try:
    journal=subprocess.check_output(['journalctl','-u','sofia-gateway','--since','-90 min','--no-pager','-n','500'],text=True,stderr=subprocess.STDOUT,timeout=20)
except Exception as e:
    journal='JOURNAL_ERROR='+str(e)
for line in journal.splitlines():
    low=line.lower()
    if any(k in low for k in PATTERNS) or 'error' in low or 'close' in low:
        rows.append({'file':'journal:sofia-gateway','line':line[-1200:]})

out={'generated_at':dt.datetime.now(dt.timezone.utc).isoformat(),'events':rows[-300:]}
path=ROOT/'voice-live-diagnostic.json'
path.write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'EXPORTED={path} EVENTS={len(out["events"])}')
