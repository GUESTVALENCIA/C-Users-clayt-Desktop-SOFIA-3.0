#!/usr/bin/env python3
"""Temporary reversible hotfix for the live Sofia iOS microphone graph.

No credentials. Does not change Gemini Live, VAD, turn detection, prompts,
tools, brain routing, reservations, messages, prices, Beds24 or Booking.
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

EXPECTED_SHA256 = "433921b74b5b57543b072f57f7b76fd65490c42968629419fe4a213fcfda4c27"
DEFAULT_FILE = pathlib.Path("/opt/sofia/sofia-mobile/index.html")
STAMP = "v27-jul-a · micro worklet estable"


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, found {count}")
    return source.replace(old, new, 1)


def patch_source(source: str) -> tuple[str, bool]:
    if "mic_worklet_sink','zero_gain" in source:
        return source, False

    updated = replace_once(
        source,
        "let ws=null, audioCtx=null, micStream=null, micNode=null, srcNode=null;",
        "let ws=null, audioCtx=null, micStream=null, micNode=null, srcNode=null, micSink=null;",
        "audio globals",
    )
    updated = replace_once(
        updated,
        """      micNode = new AudioWorkletNode(audioCtx, 'sofia-mic');
      micNode.port.onmessage = (ev) => enviarAudio(ev.data);
      srcNode.connect(micNode);
      try { callEvent('mic_modo','audioworklet'); } catch(e){}""",
        """      micNode = new AudioWorkletNode(audioCtx, 'sofia-mic');
      micNode.port.onmessage = (ev) => enviarAudio(ev.data);
      // Mantiene activo el grafo de audio de Safari sin monitorización audible.
      micSink = audioCtx.createGain();
      micSink.gain.value = 0;
      srcNode.connect(micNode);
      micNode.connect(micSink);
      micSink.connect(audioCtx.destination);
      try { callEvent('mic_modo','audioworklet'); callEvent('mic_worklet_sink','zero_gain'); } catch(e){}""",
        "AudioWorklet sink",
    )
    updated = replace_once(
        updated,
        """        try { micNode && micNode.disconnect(); } catch(e){}
        micNode = audioCtx.createScriptProcessor(4096,1,1);""",
        """        try { micNode && micNode.disconnect(); } catch(e){}
        try { micSink && micSink.disconnect(); } catch(e){}
        micSink = null;
        micNode = audioCtx.createScriptProcessor(4096,1,1);""",
        "fallback cleanup",
    )
    updated = replace_once(
        updated,
        """  try { micNode&&micNode.disconnect(); srcNode&&srcNode.disconnect(); } catch(e){}
  try { audioCtx&&audioCtx.close(); } catch(e){}""",
        """  try { micNode&&micNode.disconnect(); micSink&&micSink.disconnect(); srcNode&&srcNode.disconnect(); } catch(e){}
  try { audioCtx&&audioCtx.close(); } catch(e){}""",
        "stop disconnect",
    )
    updated = replace_once(
        updated,
        "playCtx=null; audioCtx=null; micNode=null; srcNode=null;",
        "playCtx=null; audioCtx=null; micNode=null; micSink=null; srcNode=null;",
        "stop reset",
    )
    updated, n = re.subn(
        r'(<p id="sello"[^>]*>)([^<]*)(</p>)',
        rf"\1{STAMP}\3",
        updated,
        count=1,
    )
    if n != 1:
        raise RuntimeError(f"version seal: expected exactly one match, found {n}")
    return updated, True


def validate_html(source: str) -> None:
    required = [
        "bidiGenerateContent",
        "inputAudioTranscription",
        "name:'consultar_cerebro'",
        "fc.name === 'consultar_cerebro'",
        "micNode.connect(micSink)",
        "micSink.connect(audioCtx.destination)",
        "micSink.gain.value = 0",
        "mic_worklet_sink','zero_gain",
    ]
    missing = [marker for marker in required if marker not in source]
    if missing:
        raise RuntimeError("missing required markers: " + ", ".join(missing))

    forbidden = ["INPUT_IDLE_MS", "inputIdleTimer", "despacharUtterance", "[MULETILLA]"]
    present = [marker for marker in forbidden if marker in source]
    if present:
        raise RuntimeError("manual turn markers present: " + ", ".join(present))

    scripts = re.findall(r"<script(?:\s[^>]*)?>(.*?)</script>", source, flags=re.S | re.I)
    inline = "\n".join(part for part in scripts if part.strip())
    tmp = pathlib.Path("/tmp/sofia-index-inline-check.js")
    tmp.write_text(inline, encoding="utf-8")
    subprocess.run(["node", "--check", str(tmp)], check=True, text=True, capture_output=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=pathlib.Path, default=DEFAULT_FILE)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--restart", action="store_true")
    args = parser.parse_args()

    path = args.file.resolve()
    original_bytes = path.read_bytes()
    original_sha = hashlib.sha256(original_bytes).hexdigest()
    raw_source = original_bytes.decode("utf-8")
    newline = "\r\n" if "\r\n" in raw_source else "\n"
    source = raw_source.replace("\r\n", "\n")

    already = "mic_worklet_sink','zero_gain" in source
    if not already and original_sha != EXPECTED_SHA256:
        raise RuntimeError(f"HASH_MISMATCH:{original_sha}")

    patched, changed = patch_source(source)
    validate_html(patched)

    if not args.apply:
        print(f"CHECK_OK HASH_BEFORE={original_sha} CHANGED={str(changed).lower()} NEWLINE={'CRLF' if newline == chr(13)+chr(10) else 'LF'}")
        return 0

    backup_text = "none"
    if changed:
        stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        backup = path.with_name(path.name + f".before-ios-mic-{stamp}")
        shutil.copy2(path, backup)
        temp = path.with_name(path.name + ".hotfix-tmp")
        output = patched if newline == "\n" else patched.replace("\n", "\r\n")
        temp.write_bytes(output.encode("utf-8"))
        temp.replace(path)
        backup_text = str(backup)

    if args.restart:
        stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        subprocess.run(
            [
                "systemd-run",
                f"--unit=sofia-ios-mic-restart-{stamp}",
                "--on-active=2s",
                "/bin/systemctl",
                "restart",
                "sofia-gateway",
            ],
            check=True,
            text=True,
            capture_output=True,
        )

    print(
        "HOTFIX_APPLIED "
        f"HASH_BEFORE={original_sha} BACKUP={backup_text} "
        "JS_SYNTAX=pass RESTART_SCHEDULED=" + ("yes" if args.restart else "no")
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"HOTFIX_FAILED {exc}", file=sys.stderr)
        raise SystemExit(1)
