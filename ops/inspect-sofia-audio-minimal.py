#!/usr/bin/env python3
import datetime as dt
import hashlib
import json
import pathlib

OUT = pathlib.Path('/opt/sofia/sofia-mobile/audio-minimal.json')
CURRENT = pathlib.Path('/opt/sofia/sofia-mobile/index.html')
KEYWORDS = [
    'function enviarAudio', 'realtimeInput', 'mediaChunks', 'audio/pcm',
    'registerProcessor', 'AudioWorkletNode', 'inputAudioTranscription',
    'sampleRate', 'downsample', 'resample', 'Int16Array', 'Float32Array'
]

report = {'generated_at_utc': dt.datetime.now(dt.timezone.utc).isoformat(), 'error': None, 'current': {}, 'files': [], 'lines': []}
try:
    data = CURRENT.read_bytes()
    source = data.decode('utf-8', errors='ignore')
    lines = source.splitlines()
    report['current'] = {
        'sha256': hashlib.sha256(data).hexdigest(),
        'size': len(data),
        'has_worklet': 'AudioWorkletNode' in source,
        'has_sink': 'micNode.connect(micSink)' in source,
        'has_send': 'function enviarAudio' in source,
        'has_transcription_config': 'inputAudioTranscription' in source,
    }
    selected = set()
    for i, line in enumerate(lines):
        if any(k.lower() in line.lower() for k in KEYWORDS):
            for j in range(max(0, i-8), min(len(lines), i+10)):
                selected.add(j)
    for i in sorted(selected):
        text = lines[i]
        if len(text) > 700:
            text = text[:700]
        report['lines'].append({'line': i+1, 'text': text})

    for p in sorted(CURRENT.parent.glob('index.html*'), key=lambda x: x.stat().st_mtime, reverse=True):
        try:
            d = p.read_bytes()
            s = d.decode('utf-8', errors='ignore')
            report['files'].append({
                'name': p.name,
                'mtime_utc': dt.datetime.fromtimestamp(p.stat().st_mtime, dt.timezone.utc).isoformat(),
                'sha256': hashlib.sha256(d).hexdigest(),
                'size': len(d),
                'has_worklet': 'AudioWorkletNode' in s,
                'has_sink': 'micNode.connect(micSink)' in s,
                'send_line': next((x.strip()[:500] for x in s.splitlines() if 'realtimeInput' in x or 'mediaChunks' in x), None),
                'pcm_lines': [x.strip()[:300] for x in s.splitlines() if 'audio/pcm' in x][:5],
            })
        except Exception as exc:
            report['files'].append({'name': p.name, 'error': type(exc).__name__})
except Exception as exc:
    report['error'] = f'{type(exc).__name__}:{str(exc)[:300]}'
finally:
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print('AUDIO_MINIMAL_WRITTEN=' + str(OUT))
