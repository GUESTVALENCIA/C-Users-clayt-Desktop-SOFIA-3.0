#!/usr/bin/env python3
from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
import pathlib
import re

ROOTS = [pathlib.Path('/opt/sofia'), pathlib.Path('/root')]
OUT = pathlib.Path('/opt/sofia/sofia-mobile/audio-pipeline-inspect.json')


def redact(text: str) -> str:
    text = re.sub(r'(st-|AIza|sk-|ghp_)[A-Za-z0-9._-]{8,}', '***REDACTED***', text)
    text = re.sub(r'([?&](?:key|token|auth)=)[^&\s"\']+', r'\1***REDACTED***', text, flags=re.I)
    return text


def line_excerpt(source: str, patterns: list[str], radius: int = 14) -> list[dict]:
    lines = source.splitlines()
    indexes: set[int] = set()
    for i, line in enumerate(lines):
        if any(p.lower() in line.lower() for p in patterns):
            for j in range(max(0, i-radius), min(len(lines), i+radius+1)):
                indexes.add(j)
    return [{'line': i+1, 'text': redact(lines[i])[:500]} for i in sorted(indexes)]


def block_hash(source: str, start_pattern: str, end_pattern: str | None = None, span: int = 80) -> str | None:
    lines = source.splitlines()
    start = next((i for i,l in enumerate(lines) if start_pattern.lower() in l.lower()), None)
    if start is None:
        return None
    end = min(len(lines), start + span)
    if end_pattern:
        for i in range(start+1, end):
            if end_pattern.lower() in lines[i].lower():
                end = i+1
                break
    block = '\n'.join(lines[start:end])
    return hashlib.sha256(block.encode()).hexdigest()[:16]


def inspect_file(path: pathlib.Path) -> dict:
    data = path.read_bytes()
    source = data.decode('utf-8', errors='ignore')
    st = path.stat()
    rates = sorted(set(re.findall(r'audio/pcm(?:;|\\?u003[bB])rate[=:]?\s*["\']?(\d+)', source, flags=re.I)))
    rates += [x for x in re.findall(r'rate=(\d+)', source, flags=re.I) if x not in rates]
    sello = None
    m = re.search(r'<p id="sello"[^>]*>([^<]+)</p>', source)
    if m:
        sello = m.group(1)
    return {
        'path': str(path),
        'mtime_utc': dt.datetime.fromtimestamp(st.st_mtime, dt.timezone.utc).isoformat(),
        'size': st.st_size,
        'sha256': hashlib.sha256(data).hexdigest(),
        'seal': sello,
        'pcm_rates_declared': rates,
        'audio_worklet': 'AudioWorkletNode' in source,
        'script_processor': 'createScriptProcessor' in source,
        'resample_markers': [x for x in ['downsample','resample','targetRate','sampleRate','48000','16000','24000'] if x.lower() in source.lower()],
        'send_block_hash': block_hash(source, 'function enviarAudio', '}', 120),
        'worklet_block_hash': block_hash(source, 'registerProcessor', None, 120),
        'setup_block_hash': block_hash(source, 'inputAudioTranscription', None, 100),
        'silent_sink': 'micNode.connect(micSink)' in source,
        'automatic_greeting': '[inicio]' in source,
    }


def main() -> int:
    candidates: list[pathlib.Path] = []
    seen: set[str] = set()
    for root in ROOTS:
        if not root.exists():
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            depth = len(pathlib.Path(dirpath).parts) - len(root.parts)
            if depth > 8:
                dirnames[:] = []
                continue
            dirnames[:] = [d for d in dirnames if d not in {'.git','node_modules','cache'}]
            for name in filenames:
                low = name.lower()
                if low.startswith('index.html') or ('sofia' in low and low.endswith(('.html','.bak','.backup'))):
                    p = pathlib.Path(dirpath)/name
                    try:
                        if p.stat().st_size <= 5_000_000:
                            key = str(p.resolve())
                            if key not in seen:
                                seen.add(key); candidates.append(p)
                    except Exception:
                        pass
    candidates.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    summaries = [inspect_file(p) for p in candidates[:40]]

    current = pathlib.Path('/opt/sofia/sofia-mobile/index.html')
    source = current.read_text(encoding='utf-8', errors='ignore')
    excerpts = line_excerpt(source, [
        'function enviarAudio', 'realtimeInput', 'mediaChunks', 'audio/pcm',
        'registerProcessor', 'AudioWorkletNode', 'inputAudioTranscription',
        'gemini_ws_error', 'wake_error'
    ], radius=12)

    report = {
        'generated_at_utc': dt.datetime.now(dt.timezone.utc).isoformat(),
        'current': inspect_file(current),
        'candidate_count': len(candidates),
        'candidates': summaries,
        'current_audio_excerpts': excerpts,
    }
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print('AUDIO_PIPELINE_INSPECT_WRITTEN=' + str(OUT))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
