// G4F Proxy — limpia mensajes OpenClaw y fuerza Yqcloud
// OpenClaw → :8080 → (limpia) → G4F Docker :8082
const http = require('http');

const G4F_HOST = '127.0.0.1';
const G4F_PORT = 8082;
const PROXY_PORT = 8080;

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
    console.log(`[proxy] Received ${body.length} chars, url: ${req.url}`);
    console.log(`[proxy] Body: "${body.substring(0, 100)}"`);

    let wasStreaming = false;
    if (req.url?.includes('/chat/completions') && body) {
      try {
        const p = JSON.parse(body);
        console.log(`[proxy] Parsed JSON, model: ${p.model}`);
        // Si el modelo es claude-3-opus, usar OperaAria
        if (p.model && p.model.includes('claude')) {
          p.provider = 'OperaAria';
          // Mantener el modelo original (claude-3-opus)
        } else {
          p.provider = 'Yqcloud';
          // Forzar modelo gpt-3.5-turbo para Yqcloud (funciona mejor)
          p.model = 'gpt-3.5-turbo';
        }
        p.messages = sanitize(p.messages);
        delete p.tools;
        delete p.tool_choice;
        if (p.stream) { wasStreaming = true; p.stream = false; }
        body = JSON.stringify(p);
        console.log(`[proxy] Sending to G4F with provider: ${p.provider}, model: ${p.model}`);
      } catch (e) {
        console.log(`[proxy] JSON parse error: ${e.message}`);
      }
    }

    const headers = { ...req.headers, host: `${G4F_HOST}:${G4F_PORT}`, 'content-length': Buffer.byteLength(body) };

    const fwd = http.request({ hostname: G4F_HOST, port: G4F_PORT, path: req.url, method: req.method, headers }, upstream => {
      if (wasStreaming) {
        // Convert non-streaming response to SSE format for OpenClaw
        const chunks2 = [];
        upstream.on('data', c => chunks2.push(c));
        upstream.on('end', () => {
          try {
            const json = JSON.parse(Buffer.concat(chunks2).toString());
            res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
            res.write('data: ' + JSON.stringify(json) + '\n\n');
            res.write('data: [DONE]\n\n');
          } catch (e) {
            res.writeHead(502); res.end(JSON.stringify({ error: { message: 'proxy parse error' } }));
          }
          res.end();
        });
      } else {
        res.writeHead(upstream.statusCode, upstream.headers);
        upstream.pipe(res);
      }
    });
    fwd.on('error', e => { res.writeHead(502); res.end(JSON.stringify({ error: { message: e.message } })); });
    fwd.write(body);
    fwd.end();
  });
});

server.listen(PROXY_PORT, '0.0.0.0', () => console.log(`[g4f-proxy] :${PROXY_PORT} → :${G4F_PORT} (Yqcloud/gpt-3.5-turbo)`));
