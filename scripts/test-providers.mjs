#!/usr/bin/env node
/**
 * Script de diagnóstico rápido para verificar conectividad de proveedores
 * Uso: node scripts/test-providers.mjs
 */

const PROVIDERS = [
  { name: 'OpenClaw Gateway', url: 'http://localhost:8098/health', type: 'health' },
  { name: 'G4F Server', url: 'http://localhost:8080/v1/models', type: 'models' },
  { name: 'OpenAI', url: 'https://api.openai.com/v1/models', type: 'api', requiresAuth: true },
  { name: 'Anthropic', url: 'https://api.anthropic.com/v1/messages', type: 'api', requiresAuth: true },
  { name: 'DeepSeek', url: 'https://api.deepseek.com/v1/models', type: 'api', requiresAuth: true },
  { name: 'OpenRouter', url: 'https://openrouter.ai/api/v1/models', type: 'api', requiresAuth: false },
]

async function testProvider(provider) {
  const start = Date.now()
  try {
    const res = await fetch(provider.url, {
      signal: AbortSignal.timeout(5000),
      headers: provider.requiresAuth ? {} : { 'Accept': 'application/json' }
    })
    const elapsed = Date.now() - start

    if (res.ok) {
      let info = ''
      if (provider.type === 'health') {
        const data = await res.json()
        info = ` (v${data.version || '?'}, g4f: ${data.g4f || 'unknown'})`
      } else if (provider.type === 'models') {
        const data = await res.json()
        info = ` (${data.data?.length || 0} models)`
      }
      console.log(`✅ ${provider.name.padEnd(20)} | ${elapsed}ms | ${res.status}${info}`)
      return true
    } else {
      console.log(`❌ ${provider.name.padEnd(20)} | ${elapsed}ms | HTTP ${res.status}`)
      return false
    }
  } catch (err) {
    const elapsed = Date.now() - start
    console.log(`❌ ${provider.name.padEnd(20)} | ${elapsed}ms | ${err.message}`)
    return false
  }
}

console.log('\n🔍 Diagnóstico de Proveedores SOFÍA 3.0\n')
console.log('━'.repeat(60))

let results = []
for (const provider of PROVIDERS) {
  const ok = await testProvider(provider)
  results.push({ name: provider.name, ok })
}

console.log('━'.repeat(60))
const online = results.filter(r => r.ok).length
const total = results.length
console.log(`\n📊 Resumen: ${online}/${total} servicios online`)

if (online < total) {
  console.log('\n⚠️  Servicios offline:')
  results.filter(r => !r.ok).forEach(r => {
    console.log(`   • ${r.name}`)
  })
}

console.log('\n💡 Servicios críticos:')
console.log('   • OpenClaw Gateway: http://localhost:8098')
console.log('   • G4F Server: http://localhost:8080')
console.log('\n')

process.exit(online === total ? 0 : 1)
