// G4F Proxy Inteligente v2 — Stack definitivo verificado 2026-04-03
// 5 proveedores texto: Yqcloud(GPT-5-mini) + GeminiPro(Gemini2.5Flash) + Qwen3(235B) + Cohere(Command) + OperaAria
// OpenClaw → :8080 → (mapeo) → G4F Docker :8082
const http = require('http');

const G4F_HOST = '127.0.0.1';
const G4F_PORT = 8082;
const PROXY_PORT = 8080;

// ═══════════════════════════════════════════════════════════════
// STACK DEFINITIVO — Verificado 2026-04-03
// 5 proveedores texto GRATIS + imagen + TTS
// ═══════════════════════════════════════════════════════════════

// EXACT match: modelo exacto → proveedor verificado (evaluado PRIMERO)
const EXACT_MODEL_PROVIDER = {
  // GeminiPro — Real Gemini 2.5 Flash (Google free API tier)
  'gemini-2.5-flash': 'GeminiPro',
  'gemini-2.5-flash-lite': 'GeminiPro',
  'gemma-3-27b-it': 'GeminiPro',
  'gemma-3-12b-it': 'GeminiPro',
  'gemma-3-4b-it': 'GeminiPro',
  'gemma-3-1b-it': 'GeminiPro',
  'gemma-3n-e4b-it': 'GeminiPro',

  // Qwen_Qwen_3 — Real Qwen3 235B (HuggingFace space)
  'qwen-3-235b': 'Qwen_Qwen_3',

  // CohereForAI — Real Command (Cohere HuggingFace space)
  'command-a': 'CohereForAI_C4AI_Command',
  'command-r-plus': 'CohereForAI_C4AI_Command',
  'command-r7b': 'CohereForAI_C4AI_Command',

  // OperaAria — Real Aria (Opera, OpenAI+Google hybrid)
  'aria': 'OperaAria',

  // Imagen — BlackForestLabs (HuggingFace space, free)
  'flux-dev': 'BlackForestLabs_Flux1Dev',
  'flux-kontext-dev': 'BlackForestLabs_Flux1KontextDev',

  // TTS — OpenAIFM (free)
  'openai-tts': 'OpenAIFM',
};

// PREFIX match: prefijo de modelo → proveedor (fallback si no hay match exacto)
const MODEL_TO_PROVIDER = {
  // Texto genérico → Yqcloud (GPT-5-mini catch-all, acepta cualquier nombre)
  'gpt-': 'Yqcloud',
  'claude-': 'Yqcloud',
  'deepseek-': 'Yqcloud',
  'llama-': 'Yqcloud',
  'grok-': 'Yqcloud',
  'glm-': 'Yqcloud',
  'phi-': 'Yqcloud',
  'kimi-': 'Yqcloud',
  'o1': 'Yqcloud',
  'o3': 'Yqcloud',
  'o4': 'Yqcloud',
  'ernie-': 'Yqcloud',
  'minimax-': 'Yqcloud',
  'moonshotai/': 'Yqcloud',
  'mistral-': 'Yqcloud',

  // Gemini sin match exacto → Yqcloud fallback
  'gemini-': 'Yqcloud',
  // Qwen sin match exacto → Yqcloud fallback
  'qwen-': 'Yqcloud',
  // Command sin match exacto → Yqcloud fallback
  'command-': 'Yqcloud',

  // Imagen (rutas directas a G4F Docker sin provider, auto-selección)
  'flux': 'BlackForestLabs_Flux1Dev',
  'gpt-image': 'Yqcloud',
  'dall-e-3': 'Yqcloud',

  // Search/Perplexity (puede no funcionar sin auth)
  'sonar-': 'Perplexity',
  'perplexity': 'Perplexity',
  'pplx_': 'Perplexity',
};

// Modelos que requieren API key (OpenRouter, GitHub Copilot, etc.)
const API_KEY_PROVIDERS = {
  'OpenRouter': { provider: 'OpenRouter', apiKey: null }, // se inyecta si existe
  'GithubCopilotAPI': { provider: 'GithubCopilotAPI', apiKey: null },
  'DeepInfra': { provider: 'DeepInfra', apiKey: null },
  'Groq': { provider: 'Groq', apiKey: null },
  'CohereForAI': { provider: 'CohereForAI', apiKey: null },
  'HuggingFace': { provider: 'HuggingFace', apiKey: null },
};

function getProviderForModel(modelId) {
  if (!modelId) return { provider: 'Yqcloud', model: 'gpt-3.5-turbo' };

  const lowerModel = modelId.toLowerCase();

  // 1. EXACT match primero (proveedores reales verificados)
  for (const [exactModel, provider] of Object.entries(EXACT_MODEL_PROVIDER)) {
    if (lowerModel === exactModel.toLowerCase()) {
      return { provider, model: modelId };
    }
  }

  // 2. PREFIX match (Yqcloud catch-all para texto genérico)
  for (const [prefix, provider] of Object.entries(MODEL_TO_PROVIDER)) {
    if (lowerModel.startsWith(prefix.toLowerCase())) {
      return { provider, model: modelId };
    }
  }

  // 3. Por defecto Yqcloud (GPT-5-mini)
  return { provider: 'Yqcloud', model: modelId };
}

function sanitize(messages) {
  if (!Array.isArray(messages)) return messages;
  return messages
    .map(m => {
      // Mantener tool results como mensajes de usuario para que G4F los entienda
      if (m.role === 'tool') {
        return { role: 'user', content: `[Tool Result: ${m.name || 'unknown'}]\n${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}` };
      }
      // Mantener assistant con tool_calls — convertir a texto descriptivo
      if (m.role === 'assistant' && m.tool_calls) {
        const callsText = m.tool_calls.map(tc => {
          const fn = tc.function || tc;
          return `[Called tool: ${fn.name}(${fn.arguments || '{}'})]`;
        }).join('\n');
        const content = m.content ? m.content + '\n' + callsText : callsText;
        return { role: 'assistant', content };
      }
      let content = m.content;
      if (content === null || content === undefined) content = '';
      else if (Array.isArray(content)) content = content.filter(p => p.type === 'text').map(p => p.text).join('\n');
      return { role: m.role, content: String(content) };
    })
    .filter(m => m.role !== 'assistant' || m.content.trim() !== ''); // quitar asistente vacío
}

// Limitar contexto total — PollinationsAI/Yqcloud no toleran requests enormes (OpenClaw manda 90K+)
const MAX_CONTEXT_CHARS = 12000;  // Budget total de caracteres (reducido de 14000)
const MAX_SYSTEM_CHARS = 4000;    // System prompt max (reducido de 5000)
const MAX_MSG_CHARS = 2000;       // Cada mensaje individual max (reducido de 2500)

function trimContext(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return messages;

  // 1. Truncar system prompt si es enorme (preservar inicio = tool prompt)
  let system = null;
  let rest = messages;
  if (messages[0].role === 'system') {
    system = { ...messages[0] };
    const sysContent = system.content || '';
    if (sysContent.length > MAX_SYSTEM_CHARS) {
      system.content = sysContent.slice(0, MAX_SYSTEM_CHARS) + '\n[...truncated]';
      console.log(`[proxy] System truncated: ${sysContent.length} → ${MAX_SYSTEM_CHARS}`);
    }
    rest = messages.slice(1);
  }

  // 2. Truncar mensajes individuales largos
  rest = rest.map(m => {
    const content = m.content || '';
    if (content.length > MAX_MSG_CHARS) {
      return { ...m, content: content.slice(0, MAX_MSG_CHARS) + '\n[...truncated]' };
    }
    return m;
  });

  // 3. Mantener últimos mensajes que quepan en el budget
  const systemLen = system ? system.content.length : 0;
  const budget = MAX_CONTEXT_CHARS - systemLen;
  const kept = [];
  let used = 0;
  for (let i = rest.length - 1; i >= 0; i--) {
    const len = (rest[i].content || '').length;
    if (used + len > budget && kept.length >= 2) break;
    kept.unshift(rest[i]);
    used += len;
  }

  const result = system ? [system, ...kept] : kept;
  if (kept.length < rest.length) {
    console.log(`[proxy] Context trimmed: kept ${kept.length}/${rest.length} msgs`);
  }
  return result;
}

// Parsear tool calls del contenido del modelo (formato JSON emulado)
function parseToolCalls(content) {
  if (!content || typeof content !== 'string') return null;
  const trimmed = content.trim();

  // Intentar extraer JSON de la respuesta
  let obj = null;
  try {
    obj = JSON.parse(trimmed);
  } catch {
    // Buscar JSON embebido en la respuesta
    const jsonMatch = trimmed.match(/\{[\s\S]*"tool_calls"[\s\S]*\}/);
    if (jsonMatch) {
      try { obj = JSON.parse(jsonMatch[0]); } catch {}
    }
    if (!obj) {
      // Buscar array directo [{name:...}]
      const arrMatch = trimmed.match(/\[[\s\S]*\{[\s\S]*"name"[\s\S]*\}[\s\S]*\]/);
      if (arrMatch) {
        try { obj = { tool_calls: JSON.parse(arrMatch[0]) }; } catch {}
      }
    }
  }

  if (!obj) return null;

  let calls = null;
  if (Array.isArray(obj.tool_calls)) calls = obj.tool_calls;
  else if (obj.name || obj.tool) calls = [obj];
  else if (Array.isArray(obj)) calls = obj;

  if (!calls || calls.length === 0) return null;

  const openaiCalls = [];
  let idx = 0;
  for (const c of calls) {
    if (typeof c !== 'object' || !c) continue;
    const name = c.name || c.tool;
    if (!name) continue;
    let args;
    if (typeof c.arguments === 'string') args = c.arguments;
    else {
      try { args = JSON.stringify(c.arguments || {}); } catch { args = '{}'; }
    }
    openaiCalls.push({
      id: `call_g4f_${++idx}_${Date.now()}`,
      type: 'function',
      function: { name, arguments: args }
    });
  }

  return openaiCalls.length > 0 ? openaiCalls : null;
}

const server = http.createServer((req, res) => {
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    let body = Buffer.concat(chunks).toString();
    console.log(`[proxy] ${req.method} ${req.url} (${body.length} chars)`);

    let wasStreaming = false;
    let wasToolEmulated = false;
    let fallbackBody = null; // Body sin tools para retry via Yqcloud
    if (req.url?.includes('/chat/completions') && body) {
      try {
        const p = JSON.parse(body);
        const modelId = p.model || 'gpt-3.5-turbo';

        // Determinar proveedor basado en modelo
        let { provider, model } = getProviderForModel(modelId);

        // Guardar tools antes de borrarlas (G4F no las entiende)
        const savedTools = p.tools;
        delete p.tools;
        delete p.tool_choice;

        p.provider = provider;
        p.model = model;
        // Inyectar API key para proveedores que la requieren
        if (provider === 'HuggingFace' && process.env.HUGGINGFACE_TOKEN) {
          p.api_key = process.env.HUGGINGFACE_TOKEN;
        }
        if (provider === 'OpenRouter' && process.env.OPENROUTER_API_KEY) {
          p.api_key = process.env.OPENROUTER_API_KEY;
        }
        if (provider === 'DeepInfra' && process.env.DEEPINFRA_API_KEY) {
          p.api_key = process.env.DEEPINFRA_API_KEY;
        }
        if (provider === 'Groq' && process.env.GROQ_API_KEY) {
          p.api_key = process.env.GROQ_API_KEY;
        }

        // Sanitizar y recortar contexto PRIMERO (OpenClaw manda 90K+)
        p.messages = sanitize(p.messages);
        p.messages = trimContext(p.messages);

        // TOOL CALLING: emulación via system prompt + PollinationsAI
        // Se inyecta DESPUÉS del trim para que el tool prompt nunca se corte
        if (savedTools && savedTools.length > 0) {
          const toolDefs = savedTools.filter(t => t.type === 'function' && t.function);
          if (toolDefs.length > 0) {
            // Tool emulation: keep current provider, inject tool prompt
            // (PollinationsAI no longer works — use whatever provider was selected)

            // Tool prompt COMPACTO: solo nombre(params): descripcion corta
            const toolList = toolDefs.map(t => {
              const fn = t.function;
              const params = fn.parameters?.properties
                ? Object.keys(fn.parameters.properties).join(', ')
                : '';
              return `- ${fn.name}(${params}): ${(fn.description || '').slice(0, 60)}`;
            }).join('\n');

            const toolPrompt = [
              'You have these tools:',
              toolList,
              '',
              'To use a tool, respond ONLY with JSON: {"tool_calls": [{"name": "TOOL_NAME", "arguments": {"param": "value"}}]}',
              'If no tool is needed, respond normally in plain text.'
            ].join('\n');

            const hasSystem = p.messages.length > 0 && p.messages[0].role === 'system';
            if (hasSystem) {
              p.messages[0].content = toolPrompt + '\n\n' + p.messages[0].content;
            } else {
              p.messages.unshift({ role: 'system', content: toolPrompt });
            }

            wasToolEmulated = true;
            console.log(`[proxy] Tool emulation: ${toolDefs.length} tools via PollinationsAI/openai`);
          }
        }

        // Guardar body sin tools para fallback a Yqcloud si PollinationsAI falla
        if (wasToolEmulated) {
          const fb = JSON.parse(JSON.stringify(p));
          fb.provider = getProviderForModel(modelId).provider;
          fb.model = modelId;
          // Quitar tool prompt del system message
          if (fb.messages[0]?.role === 'system') {
            const idx = fb.messages[0].content.indexOf('\n\n');
            if (idx > 0) fb.messages[0].content = fb.messages[0].content.slice(idx + 2);
          }
          fb.stream = false;
          fallbackBody = JSON.stringify(fb);
        }

        // Deshabilitar streaming temporalmente (conversión a SSE después)
        if (p.stream) { wasStreaming = true; p.stream = false; }
        
        body = JSON.stringify(p);
        console.log(`[proxy] → ${provider} / ${model}`);
      } catch (e) {
        console.log(`[proxy] JSON error: ${e.message}`);
      }
    }

    const headers = { 
      ...req.headers, 
      host: `${G4F_HOST}:${G4F_PORT}`, 
      'content-length': Buffer.byteLength(body) 
    };

    const fwd = http.request({ 
      hostname: G4F_HOST, 
      port: G4F_PORT, 
      path: req.url, 
      method: req.method, 
      headers 
    }, upstream => {
      if (wasStreaming) {
        // Convertir respuesta no-streaming a formato SSE delta (OpenAI-compatible)
        const chunks2 = [];
        upstream.on('data', c => chunks2.push(c));
        upstream.on('end', () => {
          try {
            const raw = Buffer.concat(chunks2).toString();
            console.log(`[proxy] Upstream response (${raw.length} chars): ${raw.slice(0, 300)}`);
            const json = JSON.parse(raw);
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Access-Control-Allow-Origin': '*'
            });
            const content = json.choices?.[0]?.message?.content || '';
            const id = json.id || 'chatcmpl-proxy';
            const created = json.created || Math.floor(Date.now() / 1000);
            const model = json.model || 'unknown';

            // Detectar tool calls en la respuesta del modelo
            const toolCalls = parseToolCalls(content);

            // FALLBACK: Si PollinationsAI devolvio vacio, reintentar via Yqcloud sin tools
            if (!content.trim() && !toolCalls && wasToolEmulated && fallbackBody) {
              console.log(`[proxy] PollinationsAI empty → fallback to Yqcloud`);
              const fbReq = http.request({
                hostname: G4F_HOST, port: G4F_PORT, path: req.url, method: 'POST',
                headers: { 'Content-Type': 'application/json', host: `${G4F_HOST}:${G4F_PORT}`, 'content-length': Buffer.byteLength(fallbackBody) }
              }, fbRes => {
                const fbChunks = [];
                fbRes.on('data', c => fbChunks.push(c));
                fbRes.on('end', () => {
                  try {
                    const fbJson = JSON.parse(Buffer.concat(fbChunks).toString());
                    const fbContent = fbJson.choices?.[0]?.message?.content || 'No pude generar una respuesta.';
                    console.log(`[proxy] Yqcloud fallback response: ${fbContent.slice(0, 100)}`);
                    const fbDelta = { id, object: 'chat.completion.chunk', created, model,
                      choices: [{ index: 0, delta: { role: 'assistant', content: fbContent }, finish_reason: null }] };
                    res.write('data: ' + JSON.stringify(fbDelta) + '\n\n');
                    res.write('data: ' + JSON.stringify({ id, object: 'chat.completion.chunk', created, model,
                      choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] }) + '\n\n');
                    res.write('data: [DONE]\n\n');
                    res.end();
                  } catch (fbErr) {
                    res.write('data: ' + JSON.stringify({ id, object: 'chat.completion.chunk', created, model,
                      choices: [{ index: 0, delta: { role: 'assistant', content: 'Error en fallback.' }, finish_reason: null }] }) + '\n\n');
                    res.write('data: [DONE]\n\n');
                    res.end();
                  }
                });
              });
              fbReq.on('error', () => { res.write('data: [DONE]\n\n'); res.end(); });
              fbReq.write(fallbackBody);
              fbReq.end();
              return; // No continuar con la respuesta vacia
            }

            if (toolCalls) {
              // Respuesta con tool_calls en formato OpenAI
              console.log(`[proxy] Tool calls detected: ${toolCalls.map(t => t.function.name).join(', ')}`);
              const deltaChunk = {
                id, object: 'chat.completion.chunk', created, model,
                choices: [{
                  index: 0,
                  delta: { role: 'assistant', tool_calls: toolCalls },
                  finish_reason: null
                }]
              };
              res.write('data: ' + JSON.stringify(deltaChunk) + '\n\n');
              const doneChunk = {
                id, object: 'chat.completion.chunk', created, model,
                choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }],
                usage: json.usage || null
              };
              res.write('data: ' + JSON.stringify(doneChunk) + '\n\n');
            } else {
              // Respuesta normal de texto
              const deltaChunk = {
                id, object: 'chat.completion.chunk', created, model,
                choices: [{
                  index: 0,
                  delta: { role: 'assistant', content: content },
                  finish_reason: null
                }]
              };
              res.write('data: ' + JSON.stringify(deltaChunk) + '\n\n');
              const doneChunk = {
                id, object: 'chat.completion.chunk', created, model,
                choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
                usage: json.usage || null
              };
              res.write('data: ' + JSON.stringify(doneChunk) + '\n\n');
            }
            res.write('data: [DONE]\n\n');
          } catch (e) {
            res.writeHead(502);
            res.end(JSON.stringify({ error: { message: 'proxy parse error: ' + e.message } }));
          }
          res.end();
        });
      } else {
        res.writeHead(upstream.statusCode, upstream.headers);
        upstream.pipe(res);
      }
    });
    
    fwd.on('error', e => { 
      console.log(`[proxy] Forward error: ${e.message}`);
      res.writeHead(502); 
      res.end(JSON.stringify({ error: { message: 'Gateway error: ' + e.message } })); 
    });
    
    fwd.write(body);
    fwd.end();
  });
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`[g4f-proxy-intelligent] :${PROXY_PORT} → :${G4F_PORT}`);
  console.log(`[g4f-proxy-intelligent] Stack: Yqcloud(GPT-5-mini) | GeminiPro(Gemini2.5Flash) | Qwen3(235B) | Cohere(Command) | OperaAria`);
});