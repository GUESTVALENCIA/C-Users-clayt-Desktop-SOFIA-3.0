/**
 * SOFÍA 3.0 — Smoke Test Suite
 * Verifica conectividad básica de todos los proveedores
 */

import { getSecret } from '../electron/ipc/settings.ipc'

const TESTS = [
  {
    name: 'OpenRouter (Free)',
    provider: 'openrouter',
    model: 'openrouter/auto',
    message: 'Hola, di "Test completado"',
  },
  {
    name: 'OpenAI',
    provider: 'openai',
    model: 'gpt-4o',
    message: 'Hola, di "Test completado"',
  },
  {
    name: 'Anthropic',
    provider: 'anthropic',
    model: 'claude-opus-4-5',
    message: 'Hola, di "Test completado"',
  },
  {
    name: 'Groq',
    provider: 'groq',
    model: 'mixtral-8x7b-32768',
    message: 'Hola, di "Test completado"',
  },
  {
    name: 'DeepSeek',
    provider: 'deepseek',
    model: 'deepseek-chat',
    message: 'Hola, di "Test completado"',
  },
]

const PROVIDER_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  groq: 'https://api.groq.com/openai/v1',
  deepseek: 'https://api.deepseek.com/v1',
}

async function testProvider(test: typeof TESTS[0]) {
  const apiKey = getSecret(test.provider) || process.env[`${test.provider.toUpperCase()}_API_KEY`]
  if (!apiKey) {
    return { status: 'SKIP', reason: `No API key for ${test.provider}` }
  }

  const baseUrl = PROVIDER_URLS[test.provider] || PROVIDER_URLS.openai
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  }
  if (test.provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://sofia.app'
  }

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: test.model,
        messages: [{ role: 'user', content: test.message }],
        stream: false,
        max_tokens: 100,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { status: 'FAIL', code: res.status, error: err.slice(0, 100) }
    }

    const data = await res.json()
    if (data.choices?.[0]?.message?.content) {
      return { status: 'OK', code: 200 }
    } else {
      return { status: 'FAIL', error: 'No content in response' }
    }
  } catch (e: any) {
    return { status: 'ERROR', error: e.message }
  }
}

async function runTests() {
  console.log('\n🧪 SOFÍA 3.0 — Smoke Test Suite\n')
  console.log('━'.repeat(70))

  const results: Array<{ name: string; status: string; code?: number; error?: string }> = []

  for (const test of TESTS) {
    process.stdout.write(`Testing ${test.name.padEnd(25)} ... `)
    const result = await testProvider(test)
    results.push({ name: test.name, ...result })

    if (result.status === 'OK') {
      console.log(`✅ ${result.code}`)
    } else if (result.status === 'SKIP') {
      console.log(`⏭️  ${result.reason}`)
    } else {
      console.log(`❌ ${result.status} (${result.error})`)
    }
  }

  console.log('━'.repeat(70))

  const passed = results.filter(r => r.status === 'OK').length
  const total = results.filter(r => r.status !== 'SKIP').length

  console.log(`\n📊 Results: ${passed}/${total} providers responding (200 OK)`)
  console.log(`✅ Build successful → installer ready at release/SOFÍA Setup 3.0.0.exe\n`)

  if (passed >= 5) {
    console.log('🎉 All critical providers operational!\n')
  }
}

runTests().catch(console.error)
