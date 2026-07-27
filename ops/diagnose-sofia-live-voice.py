#!/usr/bin/env python3
from __future__ import annotations

import datetime as dt
import json
import os
import pathlib
import re
import subprocess

ROOT = pathlib.Path('/opt/sofia')
PUBLIC = pathlib.Path('/opt/sofia/sofia-mobile/voice-live-diagnostic.json')
TOKENS = [
    'gemini_setup_ok', 'ws_open', 'websocket_open', 'ws_close', 'websocket_close',
    'ws_error', 'websocket_error', 'mic_modo', 'mic_worklet_sink',
    'mic_audio_fluye', 'mic_error', 'audio_error', 'oido_clay',
    'inputAudioTranscription', 'outputAudioTranscription', 'gemini_error',
    'call_started', 'call_ended', 'token_error', 'setupComplete'
]


def run(*args: str) -> str:
    try:
        return subprocess.check_output(args, stderr=subprocess.STDOUT, text=True, timeout=30)
    except subprocess.CalledProcessError as exc:
        return exc.output or ''
    except Exception as exc:
        return f'ERROR:{type(exc).__name__}'


def safe_recent_files() -> list[pathlib.Path]:
    out: list[pathlib.Path] = []
    cutoff = dt.datetime.now().timestamp() - 4 * 3600
    for base in [ROOT, pathlib.Path('/var/log')]:
        if not base.exists():
            continue
        for dirpath, dirnames, filenames in os.walk(base):
            depth = len(pathlib.Path(dirpath).parts) - len(base.parts)
            if depth > 5:
                dirnames[:] = []
                continue
            dirnames[:] = [d for d in dirnames if d not in {'.git', 'node_modules', 'cache', 'tmp'}]
            for name in filenames:
                p = pathlib.Path(dirpath) / name
                if p.suffix.lower() not in {'.log', '.jsonl', '.txt', '.out'}:
                    continue
                try:
                    st = p.stat()
                    if st.st_mtime >= cutoff and st.st_size <= 20_000_000:
                        out.append(p)
                except Exception:
                    pass
    return out


def extract_events(text: str) -> dict[str, int]:
    low = text.lower()
    return {t: low.count(t.lower()) for t in TOKENS if low.count(t.lower())}


def last_event_times(text: str) -> dict[str, str]:
    result: dict[str, str] = {}
    lines = text.splitlines()
    for token in TOKENS:
        for line in reversed(lines):
            if token.lower() in line.lower():
                # Return only an ISO-like timestamp if present, never message content.
                m = re.search(r'20\d{2}-\d{2}-\d{2}[T ][0-9:.+-]+Z?', line)
                result[token] = m.group(0)[:40] if m else 'present_no_timestamp'
                break
    return result


def main() -> int:
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    service = run('systemctl', 'is-active', 'sofia-gateway').strip()
    pid = run('systemctl', 'show', 'sofia-gateway', '-p', 'MainPID', '--value').strip()
    journal = run('journalctl', '-u', 'sofia-gateway', '--since', '45 minutes ago', '--no-pager', '-o', 'short-iso')

    combined = journal
    files_scanned: list[str] = []
    per_file: dict[str, dict[str, int]] = {}
    for path in safe_recent_files():
        try:
            text = path.read_text(encoding='utf-8', errors='ignore')[-3_000_000:]
        except Exception:
            continue
        counts = extract_events(text)
        if counts:
            rel = str(path)
            files_scanned.append(rel)
            per_file[rel] = counts
            combined += '\n' + text

    index = pathlib.Path('/opt/sofia/sofia-mobile/index.html')
    source = index.read_text(encoding='utf-8', errors='ignore') if index.exists() else ''
    sello = None
    m = re.search(r'<p id="sello"[^>]*>([^<]+)</p>', source)
    if m:
        sello = m.group(1)

    report = {
        'generated_at_utc': now,
        'service_active': service,
        'main_pid': pid,
        'client_seal': sello,
        'client_markers': {
            'gemini_native': 'BidiGenerateContentConstrained' in source and 'inputAudioTranscription' in source,
            'audio_worklet': "new AudioWorkletNode(audioCtx, 'sofia-mic')" in source,
            'silent_sink': 'micNode.connect(micSink)' in source and 'micSink.connect(audioCtx.destination)' in source,
            'brain_tool': "name:'consultar_cerebro'" in source and "fc.name === 'consultar_cerebro'" in source,
            'automatic_greeting': "parts:[{text:'[inicio]'}]" in source or '[inicio]' in source,
        },
        'event_counts_last_45m': extract_events(combined),
        'last_event_times': last_event_times(combined),
        'files_with_voice_events': per_file,
        'journal_lines': len(journal.splitlines()),
        'classification': None,
    }

    counts = report['event_counts_last_45m']
    if counts.get('gemini_setup_ok', 0) or counts.get('setupComplete', 0):
        if not counts.get('mic_modo', 0):
            report['classification'] = 'GEMINI_CONNECTED_BUT_MIC_NOT_INITIALIZED'
        elif not counts.get('mic_audio_fluye', 0):
            report['classification'] = 'MIC_INITIALIZED_BUT_NO_PCM_FLOW'
        elif not counts.get('oido_clay', 0) and not counts.get('inputAudioTranscription', 0):
            report['classification'] = 'PCM_FLOW_WITHOUT_TRANSCRIPTION'
        else:
            report['classification'] = 'MIC_AND_TRANSCRIPTION_EVENTS_PRESENT'
    elif counts.get('ws_error', 0) or counts.get('websocket_error', 0):
        report['classification'] = 'WEBSOCKET_FAILURE'
    else:
        report['classification'] = 'NO_RECENT_CALL_TELEMETRY_FOUND'

    PUBLIC.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print('VOICE_DIAGNOSTIC_WRITTEN=' + str(PUBLIC))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
