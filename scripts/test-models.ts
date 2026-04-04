/**
 * SOFIA 3.0 — Full Model Test Script
 * Tests ALL configured models across all providers.
 * Run: npx tsx scripts/test-models.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'

// Load .env
const envPath = join(process.cwd(), '.env')
const envContent = readFileSync(envPath, 'utf-8')
const env: Record<string, string> = {}
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1)
}

const KEYS = {
  openrouter: env.OPENROUTER_API_KEY,
  openai: env.OPENAI_API_KEY,
  anthropic: env.ANTHROPIC_API_KEY,
  groq: env.GROQ_API_KEY,
  deepseek: env.DEEPSEEK_API_KEY,
  xai: env.XAI_API_KEY,
  gemini: env.GEMINI_API_KEY,
  kimi: env.KIMI_API_KEY,
  qwen: env.QWEN_API_KEY,
}

interface TestDef {
  name: string
  provider: string
  model: string
  type: 'openai-compat' | 'anthropic' | 'gemini'
  baseUrl?: string
  free?: boolean
}

const TESTS: TestDef[] = [
  // ── OpenRouter Free ──
  { name: 'OpenRouter Free Auto', provider: 'openrouter', model: 'openrouter/auto', type: 'openai-compat', free: true },
  { name: 'OR: Dolphin Mistral 24B', provider: 'openrouter', model: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', type: 'openai-compat', free: true },
  { name: 'OR: Llama 3.3 70B :free', provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free', type: 'openai-compat', free: true },
  { name: 'OR: NVIDIA Nemotron 120B', provider: 'openrouter', model: 'nvidia/nemotron-3-super-120b-a12b:free', type: 'openai-compat', free: true },
  { name: 'OR: Qwen3 Coder :free', provider: 'openrouter', model: 'qwen/qwen3-coder:free', type: 'openai-compat', free: true },
  { name: 'OR: Hermes 405B :free', provider: 'openrouter', model: 'nousresearch/hermes-3-llama-3.1-405b:free', type: 'openai-compat', free: true },
  // ── OpenRouter Paid ──
  { name: 'OR: Gemini 3.1 Flash Lite', provider: 'openrouter', model: 'google/gemini-3.1-flash-lite-preview', type: 'openai-compat' },
  { name: 'OR: Grok 4.1 Fast', provider: 'openrouter', model: 'x-ai/grok-4.1-fast', type: 'openai-compat' },
  { name: 'OR: GPT-5 Nano', provider: 'openrouter', model: 'openai/gpt-5-nano', type: 'openai-compat' },
  { name: 'OR: MiniMax M2.7', provider: 'openrouter', model: 'minimax/minimax-m2.7', type: 'openai-compat' },
  { name: 'OR: DeepSeek R1', provider: 'openrouter', model: 'deepseek/deepseek-r1', type: 'openai-compat' },
  // ── Direct Providers ──
  { name: 'OpenAI: GPT-4o', provider: 'openai', model: 'gpt-4o', type: 'openai-compat', baseUrl: 'https://api.openai.com/v1' },
  { name: 'OpenAI: GPT-4o-mini', provider: 'openai', model: 'gpt-4o-mini', type: 'openai-compat', baseUrl: 'https://api.openai.com/v1' },
  { name: 'Anthropic: Claude Sonnet 4.5', provider: 'anthropic', model: 'claude-sonnet-4-5', type: 'anthropic' },
  { name: 'Anthropic: Claude Haiku 4.5', provider: 'anthropic', model: 'claude-haiku-4-5-20251001', type: 'anthropic' },
  { name: 'Groq: Llama 3.3 70B', provider: 'groq', model: 'llama-3.3-70b-versatile', type: 'openai-compat', baseUrl: 'https://api.groq.com/openai/v1' },
  { name: 'Groq: Llama 4 Scout', provider: 'groq', model: 'llama-4-scout', type: 'openai-compat', baseUrl: 'https://api.groq.com/openai/v1' },
  { name: 'DeepSeek: Chat V3', provider: 'deepseek', model: 'deepseek-chat', type: 'openai-compat', baseUrl: 'https://api.deepseek.com/v1' },
  { name: 'DeepSeek: Reasoner R1', provider: 'deepseek', model: 'deepseek-reasoner', type: 'openai-compat', baseUrl: 'https://api.deepseek.com/v1' },
  { name: 'xAI: Grok 3', provider: 'xai', model: 'grok-3', type: 'openai-compat', baseUrl: 'https://api.x.ai/v1' },
  { name: 'xAI: Grok 3 Mini', provider: 'xai', model: 'grok-3-mini', type: 'openai-compat', baseUrl: 'https://api.x.ai/v1' },
  { name: 'Gemini: 2.5 Flash', provider: 'gemini', model: 'gemini-2.5-flash-preview-05-20', type: 'gemini' },
  { name: 'Gemini: 2.0 Flash', provider: 'gemini', model: 'gemini-2.0-flash', type: 'gemini' },
  { name: 'Gemini: 2.0 Flash Lite', provider: 'gemini', model: 'gemini-2.0-flash-lite', type: 'gemini' },
]

const PROMPT = 'Hola, responde con una sola frase corta.'

async function testOpenAICompat(test: TestDef): Promise<TestResult> {
  const apiKey = KEYS[test.provider as keyof typeof KEYS]
  if (!apiKey) return { status: 'SKIP', reason: 'No API key' }

  const baseUrl = test.baseUrl || 'https://openrouter.ai/api/v1'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  }
  if (test.provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://sofia.app'
    headers['X-Title'] = 'SOFIA'
  }

  const start = Date.now()
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: test.model,
      messages: [{ role: 'user', content: PROMPT }],
      stream: false,
      max_tokens: 100,
    }),
    signal: AbortSignal.timeout(30000),
  })

  const elapsed = Date.now() - start

  if (!res.ok) {
    const err = await res.text()
    return { status: 'FAIL', code: res.status, error: err.slice(0, 120), ms: elapsed }
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || ''
  return { status: 'OK', code: 200, ms: elapsed, response: content.slice(0, 80) }
}

async function testAnthropic(test: TestDef): Promise<TestResult> {
  const apiKey = KEYS.anthropic
  if (!apiKey) return { status: 'SKIP', reason: 'No API key' }

  const start = Date.now()
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: test.model,
      max_tokens: 100,
      messages: [{ role: 'user', content: PROMPT }],
    }),
    signal: AbortSignal.timeout(30000),
  })

  const elapsed = Date.now() - start

  if (!res.ok) {
    const err = await res.text()
    return { status: 'FAIL', code: res.status, error: err.slice(0, 120), ms: elapsed }
  }

  const data = await res.json()
  const content = data.content?.[0]?.text || ''
  return { status: 'OK', code: 200, ms: elapsed, response: content.slice(0, 80) }
}

async function testGemini(test: TestDef): Promise<TestResult> {
  const apiKey = KEYS.gemini
  if (!apiKey) return { status: 'SKIP', reason: 'No API key' }

  const start = Date.now()
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${test.model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: PROMPT }] }],
        generationConfig: { maxOutputTokens: 100 },
      }),
      signal: AbortSignal.timeout(30000),
    }
  )

  const elapsed = Date.now() - start

  if (!res.ok) {
    const err = await res.text()
    return { status: 'FAIL', code: res.status, error: err.slice(0, 120), ms: elapsed }
  }

  const data = await res.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return { status: 'OK', code: 200, ms: elapsed, response: content.slice(0, 80) }
}

interface TestResult {
  status: 'OK' | 'FAIL' | 'SKIP' | 'ERROR'
  code?: number
  ms?: number
  error?: string
  reason?: string
  response?: string
}

async function runTest(test: TestDef): Promise<TestResult> {
  try {
    switch (test.type) {
      case 'openai-compat': return await testOpenAICompat(test)
      case 'anthropic': return await testAnthropic(test)
      case 'gemini': return await testGemini(test)
    }
  } catch (e: any) {
    return { status: 'ERROR', error: e.message?.slice(0, 100) }
  }
}

async function main() {
  console.log('\n=== SOFIA 3.0 — Full Model Test ===\n')
  console.log(`Date: ${new Date().toISOString()}`)
  console.log(`Models to test: ${TESTS.length}`)
  console.log('='.repeat(90))
  console.log(`${'Model'.padEnd(32)} ${'Status'.padEnd(8)} ${'Code'.padEnd(6)} ${'Time'.padEnd(8)} Response`)
  console.log('-'.repeat(90))

  let ok = 0, fail = 0, skip = 0

  for (const test of TESTS) {
    const result = await runTest(test)

    const name = test.name.padEnd(32)
    const status = result.status.padEnd(8)
    const code = (result.code?.toString() || '-').padEnd(6)
    const ms = result.ms ? `${result.ms}ms`.padEnd(8) : '-'.padEnd(8)
    const detail = result.status === 'OK'
      ? result.response || ''
      : result.status === 'SKIP'
        ? `[${result.reason}]`
        : `[${result.error || ''}]`

    const icon = result.status === 'OK' ? 'OK' : result.status === 'SKIP' ? 'SKIP' : 'FAIL'
    console.log(`${name} ${icon.padEnd(8)} ${code} ${ms} ${detail.slice(0, 50)}`)

    if (result.status === 'OK') ok++
    else if (result.status === 'SKIP') skip++
    else fail++
  }

  console.log('='.repeat(90))
  console.log(`\nResults: ${ok} OK / ${fail} FAIL / ${skip} SKIP (total ${TESTS.length})`)

  // Summary of API key status
  console.log('\n--- API Key Status ---')
  for (const [name, key] of Object.entries(KEYS)) {
    console.log(`  ${name.padEnd(12)} ${key ? `SET (${key.slice(0, 8)}...)` : 'MISSING'}`)
  }
  console.log('')

  process.exit(fail > 0 ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(1) })
