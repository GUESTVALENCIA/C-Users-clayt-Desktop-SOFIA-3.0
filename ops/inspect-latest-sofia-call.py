#!/usr/bin/env python3
from __future__ import annotations

import datetime as dt
import json
import pathlib
from typing import Any

SRC = pathlib.Path('/opt/sofia/sofia-mobile/.data/mobile-call-events.jsonl')
OUT = pathlib.Path('/opt/sofia/sofia-mobile/latest-call-diagnostic.json')

TEXT_KEYS = {'text','texto','transcript','transcription','oido','oido_clay','message','mensaje','prompt','response','respuesta','token','authorization','content','parts','payload'}
SAFE_KEYS = {
    'code','reason','readyState','ready_state','bufferedAmount','buffered_amount',
    'sampleRate','sample_rate','sr','bytes','byteLength','chunks','frames','duration_ms',
    'error','error_name','name','type','event','evento','tipo','mode','modo','state','status',
    'close_code','close_reason','wasClean','was_clean','url_kind','model','mime','source'
}


def parse_ts(value: Any) -> dt.datetime | None:
    if not isinstance(value, str):
        return None
    try:
        return dt.datetime.fromisoformat(value.replace('Z','+00:00'))
    except Exception:
        return None


def event_name(obj: dict[str, Any]) -> str:
    for key in ('event','evento','event_type','tipo','name'):
        val = obj.get(key)
        if isinstance(val, str):
            return val
    return 'unknown'


def event_ts(obj: dict[str, Any]) -> dt.datetime | None:
    for key in ('ts','timestamp','created_at','time'):
        got = parse_ts(obj.get(key))
        if got:
            return got
    return None


def safe_detail(obj: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for key, value in obj.items():
        if key.lower() in TEXT_KEYS:
            continue
        if key in SAFE_KEYS or key.lower() in {x.lower() for x in SAFE_KEYS}:
            if isinstance(value, (str, int, float, bool)) or value is None:
                text = value
                if isinstance(text, str) and len(text) > 180:
                    text = text[:180]
                out[key] = text
    return out


def main() -> int:
    rows: list[dict[str, Any]] = []
    for line in SRC.read_text(encoding='utf-8', errors='ignore').splitlines():
        try:
            obj = json.loads(line)
            if isinstance(obj, dict) and event_ts(obj):
                rows.append(obj)
        except Exception:
            continue
    rows.sort(key=lambda x: event_ts(x) or dt.datetime.min.replace(tzinfo=dt.timezone.utc))

    starts = [r for r in rows if event_name(r).lower() in {'ws_open','websocket_open','gemini_setup_ok','call_started'}]
    anchor = event_ts(starts[-1]) if starts else (event_ts(rows[-1]) if rows else None)
    if not anchor:
        OUT.write_text(json.dumps({'classification':'NO_EVENTS'}, indent=2), encoding='utf-8')
        return 0

    begin = anchor - dt.timedelta(seconds=3)
    end = anchor + dt.timedelta(seconds=120)
    call = [r for r in rows if (event_ts(r) and begin <= event_ts(r) <= end)]

    sequence = []
    for row in call:
        ts = event_ts(row)
        name = event_name(row)
        sequence.append({
            'delta_ms': int((ts - anchor).total_seconds() * 1000) if ts else None,
            'ts': ts.isoformat() if ts else None,
            'event': name,
            'safe': safe_detail(row),
        })

    names = [event_name(x).lower() for x in call]
    audio_flow = any(x in names for x in ('mic_audio_fluye','audio_chunk_sent','audio_sent'))
    transcription = any(x in names for x in ('oido_clay','inputaudiotranscription','input_audio_transcription','transcription'))
    ws_error = any(x in names for x in ('ws_error','websocket_error'))
    ws_close = any(x in names for x in ('ws_close','websocket_close'))

    if audio_flow and not transcription and ws_error:
        classification = 'PCM_SENT_NO_TRANSCRIPTION_THEN_WEBSOCKET_ERROR'
    elif audio_flow and not transcription:
        classification = 'PCM_SENT_BUT_NO_TRANSCRIPTION'
    elif not audio_flow:
        classification = 'NO_PCM_FLOW'
    else:
        classification = 'TRANSCRIPTION_PRESENT'

    report = {
        'generated_at_utc': dt.datetime.now(dt.timezone.utc).isoformat(),
        'anchor_utc': anchor.isoformat(),
        'classification': classification,
        'audio_flow': audio_flow,
        'transcription_seen': transcription,
        'websocket_error_seen': ws_error,
        'websocket_close_seen': ws_close,
        'event_count': len(sequence),
        'sequence': sequence,
    }
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print('LATEST_CALL_DIAGNOSTIC_WRITTEN=' + str(OUT))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
