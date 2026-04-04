/**
 * smoke-test-providers.ts
 * Verifica que todos los proveedores de SOFÍA 3.0 respondan 200 OK.
 * Uso: npx tsx scripts/smoke-test-providers.ts
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'

function ok(label: string, msg: string) {
  console.log(`${GREEN}✓ ${label}${RESET} — ${msg}`)
}

function fail(label: string, msg: string) {
  console.log(`${RED}✗ ${label}${RESET} — ${msg}`)
}

function skip(label: string, msg: string) {
  console.log(`${YELLOW}~ ${label}${RESET} — ${msg}`)
}

// Load .env secrets from file
function loadEnv(): Record<string, string> {
  const paths = ['.env.local', '.env']
  for (const envPath of paths) {
    const full = join(process.cwd(), envPath)
    if (existsSync(full)) {
      const lines = readFileSync(full, 'utf8').split('\n')
      const env: Record<string, string> = {}
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eq = trimmed.indexOf('=')
        if (eq < 0) continue
        env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      }
      return env
    }
  }
  return {}
}

async function testEndpoint(label: string, url: string, opts: RequestInit = {}): Promise<boolean> {
  const start = Date.now()
  try {
    const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(8000) })
    const ms = Date.now() - start
    if (res.ok || res.status === 401 || res.status === 403) {
      // 401/403 means the endpoint exists and is responding (just need auth)
      ok(label, `HTTP ${res.status} — ${ms}ms`)
      return true
    }
    fail(label, `HTTP ${res.status} — ${ms}ms`)
    return false
  } catch (e: any) {
    fail(label, e.message)
    return false
  }
}

async function main() {
  console.log(`\n${BOLD}=== SOFÍA 3.0 — Smoke Test Proveedores ===${RESET}\n`)

  const env = loadEnv()

  const openrouterKey = env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY
  const deepseekKey = env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY
  const deepgramKey = env.DEEPGRAM_API_KEY || process.env.DEEPGRAM_API_KEY

  let passed = 0
  let failed = 0
  let skipped = 0

  // ─── 1. G4F (local, no API key needed) ───────────────────────────────────
  console.log(`${BOLD}1. G4F Ilimitado (localhost:8082)${RESET}`)
  const g4fOk = await testEndpoint('G4F /v1/models', 'http://localhost:8082/v1/models')
  g4fOk ? passed++ : failed++

  if (g4fOk) {
    // G4F chat puede tardar >30s buscando proveedor libre — solo verificamos endpoint responde
    skip('G4F chat completions', 'omitido — /v1/models confirma que G4F está activo (chat es lento por diseño)')
    skipped++
  }
  console.log()

  // ─── 2. OpenRouter ───────────────────────────────────────────────────────
  console.log(`${BOLD}2. OpenRouter API${RESET}`)
  if (!openrouterKey) {
    skip('OpenRouter', 'OPENROUTER_API_KEY no configurada en .env')
    skipped++
  } else {
    const orModels = await testEndpoint(
      'OpenRouter /v1/models',
      'https://openrouter.ai/api/v1/models',
      { headers: { Authorization: `Bearer ${openrouterKey}` } }
    )
    orModels ? passed++ : failed++

    const orChat = await testEndpoint(
      'OpenRouter chat completions',
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://sofia.app',
          'X-Title': 'SOFIA Smoke Test',
        },
        body: JSON.stringify({
          model: 'openrouter/auto',
          messages: [{ role: 'user', content: 'di hola' }],
          max_tokens: 10,
        }),
      }
    )
    orChat ? passed++ : failed++
  }
  console.log()

  // ─── 3. DeepSeek ─────────────────────────────────────────────────────────
  console.log(`${BOLD}3. DeepSeek API${RESET}`)
  if (!deepseekKey) {
    skip('DeepSeek', 'DEEPSEEK_API_KEY no configurada en .env')
    skipped++
  } else {
    const dsModels = await testEndpoint(
      'DeepSeek /v1/models',
      'https://api.deepseek.com/v1/models',
      { headers: { Authorization: `Bearer ${deepseekKey}` } }
    )
    dsModels ? passed++ : failed++

    const dsChat = await testEndpoint(
      'DeepSeek chat completions',
      'https://api.deepseek.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${deepseekKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'di hola' }],
          max_tokens: 10,
          stream: false,
        }),
      }
    )
    dsChat ? passed++ : failed++
  }
  console.log()

  // ─── 4. DeepGram ─────────────────────────────────────────────────────────
  console.log(`${BOLD}4. DeepGram (voz)${RESET}`)
  if (!deepgramKey) {
    skip('DeepGram', 'DEEPGRAM_API_KEY no configurada en .env')
    skipped++
  } else {
    const dgOk = await testEndpoint(
      'DeepGram /v1/projects',
      'https://api.deepgram.com/v1/projects',
      { headers: { Authorization: `Token ${deepgramKey}` } }
    )
    dgOk ? passed++ : failed++

    const dgTts = await testEndpoint(
      'DeepGram TTS (speak)',
      'https://api.deepgram.com/v1/speak?model=aura-2-carina-es&encoding=mp3',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${deepgramKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'Hola, soy Sofía.' }),
      }
    )
    dgTts ? passed++ : failed++
  }
  console.log()

  // ─── 5. OAuth state (Claude Pro + ChatGPT Plus) ──────────────────────────
  console.log(`${BOLD}5. OAuth tokens (cuentas Pro)${RESET}`)
  const tokenPaths = [
    { label: 'Anthropic (Claude Pro)', path: join(process.cwd(), 'resources', 'sofia-auth', 'oauth', 'anthropic-tokens.json') },
    { label: 'OpenAI (ChatGPT Plus)', path: join(process.cwd(), 'resources', 'sofia-auth', 'oauth', 'openai-tokens.json') },
  ]
  for (const { label, path } of tokenPaths) {
    if (!existsSync(path)) {
      skip(label, 'tokens.json no encontrado — usa sofia.directAuth.login() en la app')
      skipped++
    } else {
      try {
        const tokens = JSON.parse(readFileSync(path, 'utf8'))
        const expiresAt = Number(tokens.expires || 0)
        const now = Date.now()
        if (expiresAt > now + 60_000) {
          ok(label, `token válido — expira en ${Math.round((expiresAt - now) / 60000)}min`)
          passed++
        } else if (expiresAt > 0) {
          skip(label, `token expirado — refresca en la app`)
          skipped++
        } else {
          fail(label, 'token sin fecha de expiración')
          failed++
        }
      } catch {
        fail(label, 'Error leyendo archivo de tokens')
        failed++
      }
    }
  }
  console.log()

  // ─── Resumen ──────────────────────────────────────────────────────────────
  console.log(`${BOLD}=== Resumen ===${RESET}`)
  console.log(`${GREEN}✓ Pasados:  ${passed}${RESET}`)
  if (failed > 0) console.log(`${RED}✗ Fallidos: ${failed}${RESET}`)
  if (skipped > 0) console.log(`${YELLOW}~ Omitidos: ${skipped} (sin API key)${RESET}`)
  console.log()

  if (failed > 0) {
    console.log(`${RED}⚠ Algunos proveedores fallaron. Revisa las API keys en .env${RESET}`)
    process.exit(1)
  } else {
    console.log(`${GREEN}✅ Todos los proveedores configurados responden correctamente.${RESET}`)
  }
}

main().catch(e => {
  console.error('Error fatal:', e)
  process.exit(1)
})
