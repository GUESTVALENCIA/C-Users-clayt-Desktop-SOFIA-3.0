#!/usr/bin/env python3
"""Reversible hotfix for Sofia's Gemini Live microphone encoder.

Scope: replace only function enviarAudio() and the visible version seal.
It preserves Gemini Live, native VAD/turns, prompts, tools, brain routing,
reservations, messages, prices, Beds24 and Booking.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import pathlib
import re
import shutil
import subprocess
import sys

EXPECTED_SHA256 = "41109bc3dfba4644cd1faaa48d889e8cbad23d41b0840057a5f40bf96a6a2c73"
DEFAULT_FILE = pathlib.Path("/opt/sofia/sofia-mobile/index.html")
STAMP = "v27-jul-b · PCM16 100 ms estable"

NEW_FUNCTION = r'''function enviarAudio(inp) {
  if (!ws || ws.readyState !== 1 || !audioCtx || !inp || !inp.length) return;

  const input = inp instanceof Float32Array ? inp : new Float32Array(inp);
  const srcRate = Math.max(8000, Math.round(audioCtx.sampleRate || 48000));
  const frameSamples = Math.round(srcRate / 10); // 100 ms por trama

  // Un WebSocket nuevo significa una llamada nueva: descarta cualquier resto anterior.
  if (enviarAudio._ws !== ws || enviarAudio._rate !== srcRate || !enviarAudio._q) {
    enviarAudio._ws = ws;
    enviarAudio._rate = srcRate;
    enviarAudio._q = [];
    enviarAudio._qSamples = 0;
    enviarAudio._sentFrames = 0;
  }

  enviarAudio._q.push(new Float32Array(input));
  enviarAudio._qSamples += input.length;

  while (enviarAudio._qSamples >= frameSamples) {
    const block = new Float32Array(frameSamples);
    let written = 0;
    while (written < frameSamples && enviarAudio._q.length) {
      const head = enviarAudio._q[0];
      const take = Math.min(head.length, frameSamples - written);
      block.set(head.subarray(0, take), written);
      written += take;
      if (take === head.length) enviarAudio._q.shift();
      else enviarAudio._q[0] = head.slice(take);
    }
    enviarAudio._qSamples -= frameSamples;

    // Gemini Live: PCM crudo mono, 16 bits little-endian, 16 kHz.
    const targetSamples = 1600; // 100 ms a 16 kHz
    const ratio = frameSamples / targetSamples;
    const pcm = new Int16Array(targetSamples);
    for (let i = 0; i < targetSamples; i++) {
      const a = Math.floor(i * ratio);
      const b = Math.max(a + 1, Math.min(frameSamples, Math.floor((i + 1) * ratio)));
      let sum = 0;
      for (let j = a; j < b; j++) sum += block[j];
      const v = Math.max(-1, Math.min(1, sum / Math.max(1, b - a)));
      pcm[i] = v < 0 ? Math.round(v * 0x8000) : Math.round(v * 0x7FFF);
    }

    // No dejes que una red lenta convierta el WebSocket en una presa a punto de romperse.
    if (ws.bufferedAmount > 2_000_000) {
      try { callEvent('pcm_backpressure', String(ws.bufferedAmount)); } catch(e){}
      return;
    }

    const bytes = new Uint8Array(pcm.buffer);
    let bin = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      bin += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }

    ws.send(JSON.stringify({
      realtimeInput: {
        audio: {
          data: btoa(bin),
          mimeType: 'audio/pcm;rate=16000'
        }
      }
    }));

    enviarAudio._sentFrames++;
    if (enviarAudio._sentFrames === 1) {
      try {
        callEvent('pcm16_stream', 'src=' + srcRate + ';target=16000;chunk_ms=100;bytes=' + bytes.length);
      } catch(e){}
    }
  }
}'''


def find_function_span(source: str, name: str) -> tuple[int, int]:
    marker = f"function {name}("
    start = source.find(marker)
    if start < 0:
        raise RuntimeError(f"function not found: {name}")
    brace = source.find("{", start)
    if brace < 0:
        raise RuntimeError(f"opening brace not found: {name}")

    depth = 0
    i = brace
    state = "code"
    quote = ""
    while i < len(source):
        ch = source[i]
        nxt = source[i + 1] if i + 1 < len(source) else ""

        if state == "line_comment":
            if ch == "\n":
                state = "code"
        elif state == "block_comment":
            if ch == "*" and nxt == "/":
                state = "code"
                i += 1
        elif state == "string":
            if ch == "\\":
                i += 1
            elif ch == quote:
                state = "code"
        elif state == "template":
            if ch == "\\":
                i += 1
            elif ch == "`":
                state = "code"
        else:
            if ch == "/" and nxt == "/":
                state = "line_comment"
                i += 1
            elif ch == "/" and nxt == "*":
                state = "block_comment"
                i += 1
            elif ch in ("'", '"'):
                state = "string"
                quote = ch
            elif ch == "`":
                state = "template"
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return start, i + 1
        i += 1

    raise RuntimeError(f"closing brace not found: {name}")


def replace_function(source: str) -> tuple[str, bool]:
    if "pcm16_stream" in source and "chunk_ms=100" in source:
        return source, False
    start, end = find_function_span(source, "enviarAudio")
    return source[:start] + NEW_FUNCTION + source[end:], True


def update_seal(source: str) -> str:
    updated, count = re.subn(
        r'(<p id="sello"[^>]*>)([^<]*)(</p>)',
        rf"\1{STAMP}\3",
        source,
        count=1,
    )
    if count != 1:
        raise RuntimeError(f"version seal: expected 1 match, found {count}")
    return updated


def validate(source: str) -> None:
    required = [
        "BidiGenerateContentConstrained",
        "inputAudioTranscription",
        "name:'consultar_cerebro'",
        "fc.name === 'consultar_cerebro'",
        "micNode.connect(micSink)",
        "const frameSamples = Math.round(srcRate / 10)",
        "const targetSamples = 1600",
        "mimeType: 'audio/pcm;rate=16000'",
        "realtimeInput:",
        "pcm16_stream",
        "chunk_ms=100",
    ]
    missing = [x for x in required if x not in source]
    if missing:
        raise RuntimeError("missing required markers: " + ", ".join(missing))

    forbidden = ["INPUT_IDLE_MS", "inputIdleTimer", "despacharUtterance", "[MULETILLA]"]
    present = [x for x in forbidden if x in source]
    if present:
        raise RuntimeError("manual turn markers present: " + ", ".join(present))

    scripts = re.findall(r"<script(?:\s[^>]*)?>(.*?)</script>", source, flags=re.S | re.I)
    inline = "\n".join(part for part in scripts if part.strip())
    tmp = pathlib.Path("/tmp/sofia-pcm16-inline-check.js")
    tmp.write_text(inline, encoding="utf-8")
    subprocess.run(["node", "--check", str(tmp)], check=True, text=True, capture_output=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=pathlib.Path, default=DEFAULT_FILE)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    path = args.file.resolve()
    original_bytes = path.read_bytes()
    original_sha = hashlib.sha256(original_bytes).hexdigest()
    raw = original_bytes.decode("utf-8")
    newline = "\r\n" if "\r\n" in raw else "\n"
    source = raw.replace("\r\n", "\n")

    already = "pcm16_stream" in source and "chunk_ms=100" in source
    if not already and original_sha != EXPECTED_SHA256:
        raise RuntimeError(f"HASH_MISMATCH:{original_sha}")

    patched, changed = replace_function(source)
    patched = update_seal(patched)
    validate(patched)

    if not args.apply:
        print(f"CHECK_OK HASH_BEFORE={original_sha} CHANGED={str(changed).lower()}")
        return 0

    backup_text = "none"
    if changed:
        stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        backup = path.with_name(path.name + f".before-pcm16-buffer-{stamp}")
        shutil.copy2(path, backup)
        output = patched if newline == "\n" else patched.replace("\n", "\r\n")
        temp = path.with_name(path.name + ".pcm16-tmp")
        temp.write_bytes(output.encode("utf-8"))
        temp.replace(path)
        backup_text = str(backup)

    final_sha = hashlib.sha256(path.read_bytes()).hexdigest()
    print(
        "PCM16_HOTFIX_APPLIED "
        f"HASH_BEFORE={original_sha} HASH_AFTER={final_sha} "
        f"BACKUP={backup_text} JS_SYNTAX=pass CHUNK_MS=100 TARGET_RATE=16000"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"PCM16_HOTFIX_FAILED {exc}", file=sys.stderr)
        raise SystemExit(1)
