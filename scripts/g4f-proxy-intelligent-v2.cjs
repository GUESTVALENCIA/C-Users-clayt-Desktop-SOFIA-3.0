// G4F Proxy Inteligente V2 — Mapeo dinámico a múltiples proveedores ilimitados
// Catálogo completo: 712 modelos → 7+ proveedores en cadena de fallback
// OpenClaw → :8080 → G4F Docker :8082
const http = require('http');

const G4F_HOST = '127.0.0.1';
const G4F_PORT = 8082;
const PROXY_PORT = 8080;

// CADENA DE PROVEEDORES ILIMITADOS (orden de prioridad)
const PROVIDER_CHAIN = [
  // Tier A - Modelos reales ilimitados
  { id: 'CopilotSession', name: 'CopilotSession', priority: 1, 
    models: ['gpt-', 'claude-', 'deepseek-', 'o1', 'o3', 'gpt-5'] },
  
  { id: 'Perplexity', name: 'Perplexity', priority: 2,
    models: ['sonar-', 'perplexity', 'deep-research'] },
  
  { id: 'DeepInfra', name: 'DeepInfra', priority: 3,
    models: ['minimax-m2.5', 'minimax-'] },
    
  { id: 'Groq', name: 'Groq', priority: 4,
    models: ['gpt-oss-120b', 'gpt-oss-', 'llama-3.3-70b-turbo'] },
    
  { id: 'CohereForAI', name: 'CohereForAI', priority: 5,
    models: ['command-', 'command-r-plus', 'command-a'] },
  
  // Tier B - Proxy ilimitado (acepta TODOS los nombres)
  { id: 'OperaAria', name: 'OperaAria', priority: 6,
    models: ['*'] }, // comodín: cualquier modelo
    
  { id: 'Yqcloud', name: 'Yqcloud', priority: 7,
    models: ['*'] }, // fallback final
    
  // Tier C - 50 req/h (solo para imágenes/video)
  { id: 'PollinationsAI', name: 'PollinationsAI', priority: 8,
    models: ['flux', 'gpt-image', 'gemini-', 'imagen-', 'qwen-image', 'video'] }
];

// Mapeo rápido por prefijo para búsqueda eficiente
const PREFIX_MAP = {
  // GPT/OpenAI
  'gpt-': ['CopilotSession', 'OperaAria', 'Yqcloud'],
  'claude-': ['CopilotSession', 'OperaAria', 'Yqcloud'],
  'deepseek-': ['CopilotSession', 'OperaAria', 'Yqcloud'],
  'o1': ['CopilotSession', 'OperaAria', 'Yqcloud'],
  'o3': ['CopilotSession', 'OperaAria', 'Yqcloud'],
  
  // Perplexity Search
  'sonar-': ['Perplexity'],
  'perplexity': ['Perplexity'],
  
  // MiniMax
  'minimax-': ['DeepInfra', 'OperaAria', 'Yqcloud'],
  
  // Groq
  'gpt-oss-': ['Groq', 'OperaAria', 'Yqcloud'],
  
  // Cohere
  'command-': ['CohereForAI', 'OperaAria', 'Yqcloud'],
  
  // Imágenes/video (PollinationsAI primero)
  'flux': ['PollinationsAI', 'OperaAria', 'Yqcloud'],
  'gpt-image': ['PollinationsAI', 'OperaAria', 'Yqcloud'],
  'imagen-': ['PollinationsAI', 'OperaAria', 'Yqcloud'],
  'qwen-image': ['PollinationsAI', 'OperaAria', 'Yqcloud'],
  'video': ['PollinationsAI', 'OperaAria', 'Yqcloud'],
  'veo-': ['PollinationsAI', 'OperaAria', 'Yqcloud'],
  
  // Por defecto (cualquier otro modelo)
  '*': ['OperaAria', 'Yqcloud'],

  // NATI/NATASHA - Modelos sin censura (Uncensored)
  'uncensored-': ['DeepInfra', 'PollinationsAI', 'Yqcloud'],
  'flux-uncensored': ['PollinationsAI'],
  'hermes-': ['DeepInfra', 'Groq'],
  'dolphin-': ['DeepInfra', 'Yqcloud'],
  'veo-3.1-uncensored': ['PollinationsAI']
};

// Historial de fallos por proveedor (para evitar reintentar proveedores caídos)
const providerFailures = new Map();

function getProvidersForModel(modelId) {
  if (!modelId) return PREFIX_MAP['*'];
  
  const lowerModel = modelId.toLowerCase();
  
  // Buscar por prefijo específico
  for (const [prefix, providers] of Object.entries(PREFIX_MAP)) {
    if (prefix !== '*' && lowerModel.startsWith(prefix)) {
      return providers;
    }
  }
  
  // Si no coincide, usar proveedores por defecto
  return PREFIX_MAP['*'];
}

function chooseProvider(providers) {
  // Filtrar proveedores que han fallado recientemente (últimos 5 minutos)
  const now = Date.now();
  const availableProviders = providers.filter(providerId => {
    const lastFailure = providerFailures.get(providerId);
    return !lastFailure || (now - lastFailure) > 5 * 60 * 1000; // 5 minutos
  });
  
  if (availableProviders.length === 0) {
    // Si todos fallaron, resetear y usar el primero
    providerFailures.clear();
    return providers[0];
  }
  
  return availableProviders[0];
}

function markProviderFailed(providerId) {
  providerFailures.set(providerId, Date.now());
  console.log(`[provider-fail] Marcado ${providerId} como fallado temporalmente`);
}

function sanitize(messages) {
  if (!Array.isArray(messages)) return messages;
  return messages
    .filter(m => m.role !== 'tool')           // G4F no entiende tool results
    .map(m => {
      let content = m.content;
      if (content === null || content === undefined) content = '';
      else if (Array.isArray(content)) content = content.filter(p => p.type === 'text').map(p => p.text).join('\n');
      return { role: m.role, content: String(content) };
    })
    .filter(m => m.role !== 'assistant' || m.content.trim() !== ''); // quitar asistente vacío
}

const server = http.createServer((req, res) => {
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    let body = Buffer.concat(chunks).toString();
    console.log(`[proxy] ${req.method} ${req.url} (${body.length} chars)`);

    let wasStreaming = false;
    let originalModel = 'gpt-3.5-turbo';
    let selectedProvider = 'OperaAria';
    
    if (req.url?.includes('/chat/completions') && body) {
      try {
        const p = JSON.parse(body);
        originalModel = p.model || 'gpt-3.5-turbo';
        
        // Detección de Agente Nati/Natasha para forzar modelos sin censura
        const isNatiRequest = p.messages?.some(m =>
          m.content?.toLowerCase().includes('nati') ||
          m.content?.toLowerCase().includes('natasha') ||
          m.content?.toLowerCase().includes('uncensored')
        );

        if (isNatiRequest && !originalModel.startsWith('uncensored-')) {
          console.log(`[proxy-nati] Detectada petición Nati. Forzando modelo sin censura.`);
          originalModel = 'uncensored-llama-3-8b'; // Modelo base sin censura
        }

        // Obtener proveedores disponibles para este modelo
        const availableProviders = getProvidersForModel(originalModel);
        selectedProvider = chooseProvider(availableProviders);
        
        console.log(`[provider-select] ${originalModel} → ${selectedProvider} (opciones: ${availableProviders.join(', ')})`);
        
        // Configurar para G4F
        p.provider = selectedProvider;
        p.model = originalModel; // Mantener modelo original
        
        // Sanitizar mensajes
        p.messages = sanitize(p.messages);
        
        // Eliminar herramientas (G4F no las soporta)
        delete p.tools;
        delete p.tool_choice;
        
        // Deshabilitar streaming temporalmente (conversión a SSE después)
        if (p.stream) { wasStreaming = true; p.stream = false; }
        
        body = JSON.stringify(p);
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
            const responseText = Buffer.concat(chunks2).toString();
            const json = JSON.parse(responseText);
            
            // Verificar si la respuesta indica error del proveedor
            if (json.error && json.error.message && 
                (json.error.message.includes('API key') || json.error.message.includes('MissingAuth') || json.error.message.includes('rate limit'))) {
              console.log(`[provider-fail] ${selectedProvider} falló: ${json.error.message}`);
              markProviderFailed(selectedProvider);
            }
            
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Access-Control-Allow-Origin': '*'
            });
            
            // Convertir "message" a formato "delta" para streaming
            const content = json.choices?.[0]?.message?.content || '';
            const deltaChunk = {
              id: json.id || 'chatcmpl-proxy',
              object: 'chat.completion.chunk',
              created: json.created || Math.floor(Date.now() / 1000),
              model: originalModel || 'unknown',
              provider: selectedProvider,
              choices: [{
                index: 0,
                delta: { role: 'assistant', content: content },
                finish_reason: null
              }]
            };
            res.write('data: ' + JSON.stringify(deltaChunk) + '\n\n');
            
            // Enviar chunk final con finish_reason
            const doneChunk = {
              id: json.id || 'chatcmpl-proxy',
              object: 'chat.completion.chunk',
              created: json.created || Math.floor(Date.now() / 1000),
              model: originalModel || 'unknown',
              provider: selectedProvider,
              choices: [{
                index: 0,
                delta: {},
                finish_reason: 'stop'
              }],
              usage: json.usage || null
            };
            res.write('data: ' + JSON.stringify(doneChunk) + '\n\n');
            res.write('data: [DONE]\n\n');
          } catch (e) {
            console.log(`[proxy] Parse error: ${e.message}`);
            // Marcar proveedor como fallado
            markProviderFailed(selectedProvider);
            res.writeHead(502);
            res.end(JSON.stringify({ error: { message: 'proxy parse error: ' + e.message } }));
          }
          res.end();
        });
      } else {
        // Para respuestas no-streaming, pasar directamente
        const responseChunks = [];
        upstream.on('data', c => responseChunks.push(c));
        upstream.on('end', () => {
          try {
            const responseText = Buffer.concat(responseChunks).toString();
            const json = JSON.parse(responseText);
            
            // Verificar si la respuesta indica error del proveedor
            if (json.error && json.error.message && 
                (json.error.message.includes('API key') || json.error.message.includes('MissingAuth') || json.error.message.includes('rate limit'))) {
              console.log(`[provider-fail] ${selectedProvider} falló: ${json.error.message}`);
              markProviderFailed(selectedProvider);
            }
            
            // Añadir metadata del proveedor usado
            json.provider = selectedProvider;
            res.writeHead(upstream.statusCode, upstream.headers);
            res.end(JSON.stringify(json));
          } catch (e) {
            console.log(`[proxy] Non-stream parse error: ${e.message}`);
            markProviderFailed(selectedProvider);
            res.writeHead(502);
            res.end(JSON.stringify({ error: { message: 'proxy parse error: ' + e.message } }));
          }
        });
      }
    });
    
    fwd.on('error', e => { 
      console.log(`[proxy] Forward error: ${e.message}`);
      markProviderFailed(selectedProvider);
      res.writeHead(502); 
      res.end(JSON.stringify({ error: { message: 'Gateway error: ' + e.message } })); 
    });
    
    fwd.write(body);
    fwd.end();
  });
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`[g4f-proxy-intelligent-v2] :${PROXY_PORT} → :${G4F_PORT}`);
  console.log(`[g4f-proxy-intelligent-v2] Proveedores activos: CopilotSession, Perplexity, DeepInfra, Groq, CohereForAI, OperaAria, Yqcloud, PollinationsAI`);
  console.log(`[g4f-proxy-intelligent-v2] Fallback inteligente activado (múltiples proveedores ilimitados)`);
});