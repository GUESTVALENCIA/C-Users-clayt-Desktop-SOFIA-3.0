#!/usr/bin/env python3
from pathlib import Path
import re

html = Path('/opt/sofia/sofia-mobile/index.html').read_text(encoding='utf-8', errors='replace')
gateway = Path('/opt/sofia/sofia-mobile/gateway.cjs').read_text(encoding='utf-8', errors='replace')
all_text = html + '\n' + gateway

local_playback = bool(re.search(r'speechSynthesis|new\s+Audio\s*\(|<audio\b[^>]*src=', html, re.I))
greeting_literal = bool(re.search(r'\b(hola|buenos días|buenas tardes|buenas noches)\b', html, re.I))
prompt_greeting = bool(re.search(r'\b(saluda|saludo|da la bienvenida|preséntate)\b', gateway, re.I))

setup_blocks = []
for m in re.finditer(r'setupComplete', html, re.I):
    setup_blocks.append(html[max(0,m.start()-250):m.end()+700])
setup_blob = '\n'.join(setup_blocks)
setup_sends = bool(re.search(r'clientContent|turns\s*:|enviarTexto|send\s*\(', setup_blob, re.I))

# Detect an explicit first-turn payload anywhere near connection/open/setup handling.
connection_blocks = []
for pat in (r'ws\.onopen', r'onopen\s*=', r'setupComplete'):
    for m in re.finditer(pat, html, re.I):
        connection_blocks.append(html[max(0,m.start()-200):m.end()+1000])
conn_blob = '\n'.join(connection_blocks)
first_turn = bool(re.search(r'clientContent|turns\s*:', conn_blob, re.I))

# Does the client explicitly request a greeting or initial utterance?
explicit_request = bool(re.search(r'(saluda|saludo|hola|buenos días|buenas tardes|buenas noches).{0,180}(clientContent|turns\s*:|send\s*\()', conn_blob, re.I|re.S) or re.search(r'(clientContent|turns\s*:|send\s*\().{0,180}(saluda|saludo|hola|buenos días|buenas tardes|buenas noches)', conn_blob, re.I|re.S))

print(f'LOCAL_PLAYBACK={int(local_playback)};HTML_GREETING_LITERAL={int(greeting_literal)};SETUP_SEND={int(setup_sends)};FIRST_TURN={int(first_turn)};EXPLICIT_GREETING_REQUEST={int(explicit_request)};PROMPT_GREETING={int(prompt_greeting)}')
