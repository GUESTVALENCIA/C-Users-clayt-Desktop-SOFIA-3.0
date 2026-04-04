import { createHash, randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { exec } from 'node:child_process'

const OAUTH_DIR = join(process.cwd(), 'resources', 'openclaw-control', 'oauth')
mkdirSync(OAUTH_DIR, { recursive: true })

const OPENAI = {
  provider: 'openai-codex',
  clientId: 'app_EMoamEEZ73f0CkXaXp7hrann',
  authorizeUrl: 'https://auth.openai.com/oauth/authorize',
  tokenUrl: 'https://auth.openai.com/oauth/token',
  redirectUri: 'http://localhost:1455/auth/callback',
  scope: 'openid profile email offline_access',
}

const ANTHROPIC = {
  provider: 'anthropic',
  clientId: Buffer.from('OWQxYzI1MGEtZTYxYi00NGQ5LTg4ZWQtNTk0NGQxOTYyZjVl', 'base64').toString('utf8'),
  authorizeUrl: 'https://claude.ai/oauth/authorize',
  tokenUrl: 'https://platform.claude.com/v1/oauth/token',
  redirectUri: 'http://localhost:53692/callback',
  scope: 'org:create_api_key user:profile user:inference user:sessions:claude_code user:mcp_servers user:file_upload',
}

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function sha256Base64Url(value) {
  return createHash('sha256').update(value).digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function createPKCE() {
  const verifier = base64Url(randomBytes(32))
  const challenge = sha256Base64Url(verifier)
  return { verifier, challenge }
}

function getStateFile(name) {
  return join(OAUTH_DIR, `${name}.json`)
}

function saveState(name, payload) {
  writeFileSync(getStateFile(name), JSON.stringify(payload, null, 2), 'utf8')
}

function loadState(name) {
  const file = getStateFile(name)
  if (!existsSync(file)) {
    throw new Error(`Missing OAuth state file for ${name}: ${file}`)
  }
  return JSON.parse(readFileSync(file, 'utf8'))
}

function parseRedirectInput(input) {
  const raw = String(input || '').trim()
  const url = new URL(raw)
  return {
    code: url.searchParams.get('code') || '',
    state: url.searchParams.get('state') || '',
  }
}

function openSystemBrowser(url) {
  const escaped = url.replace(/&/g, '^&')
  const cmd = process.platform === 'win32'
    ? `start "" "${escaped}"`
    : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`
  exec(cmd)
}

function waitForRedirect({ port, pathName, expectedState, timeoutMs = 240000 }) {
  return new Promise((resolve, reject) => {
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      try { server.close() } catch {}
      reject(new Error(`OAuth timeout on localhost:${port}${pathName}`))
    }, timeoutMs)

    const server = createServer((req, res) => {
      try {
        const url = new URL(req.url || '', `http://localhost:${port}`)
        if (url.pathname !== pathName) {
          res.statusCode = 404
          res.end('Not found')
          return
        }
        const code = url.searchParams.get('code') || ''
        const state = url.searchParams.get('state') || ''
        if (expectedState && state !== expectedState) {
          res.statusCode = 400
          res.end('State mismatch')
          return
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end('<html><body><p>Autenticación correcta. Puedes volver.</p></body></html>')
        if (!settled) {
          settled = true
          clearTimeout(timer)
          server.close()
          resolve({ code, state, redirectUrl: `http://localhost:${port}${req.url || ''}` })
        }
      } catch (error) {
        res.statusCode = 500
        res.end('Internal error')
        if (!settled) {
          settled = true
          clearTimeout(timer)
          try { server.close() } catch {}
          reject(error)
        }
      }
    })

    server.listen(port, '127.0.0.1')
  })
}

function decodeJwtPayload(token) {
  const parts = String(token || '').split('.')
  if (parts.length !== 3) return null
  const payload = parts[1]
  if (!payload) return null
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  return JSON.parse(Buffer.from(normalized + pad, 'base64').toString('utf8'))
}

async function openaiStart() {
  const { verifier, challenge } = createPKCE()
  const state = randomBytes(16).toString('hex')
  const url = new URL(OPENAI.authorizeUrl)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', OPENAI.clientId)
  url.searchParams.set('redirect_uri', OPENAI.redirectUri)
  url.searchParams.set('scope', OPENAI.scope)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('state', state)
  url.searchParams.set('id_token_add_organizations', 'true')
  url.searchParams.set('codex_cli_simplified_flow', 'true')
  url.searchParams.set('originator', 'pi')
  saveState('openai', { provider: OPENAI.provider, verifier, state, redirectUri: OPENAI.redirectUri, createdAt: Date.now() })
  process.stdout.write(JSON.stringify({ ok: true, provider: 'openai', url: url.toString(), stateFile: getStateFile('openai') }, null, 2))
}

async function openaiLogin() {
  const { verifier, challenge } = createPKCE()
  const state = randomBytes(16).toString('hex')
  const url = new URL(OPENAI.authorizeUrl)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', OPENAI.clientId)
  url.searchParams.set('redirect_uri', OPENAI.redirectUri)
  url.searchParams.set('scope', OPENAI.scope)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('state', state)
  url.searchParams.set('id_token_add_organizations', 'true')
  url.searchParams.set('codex_cli_simplified_flow', 'true')
  url.searchParams.set('originator', 'pi')
  saveState('openai', { provider: OPENAI.provider, verifier, state, redirectUri: OPENAI.redirectUri, createdAt: Date.now() })
  openSystemBrowser(url.toString())
  const result = await waitForRedirect({ port: 1455, pathName: '/auth/callback', expectedState: state })
  await openaiFinish(result.redirectUrl)
}

async function openaiFinish(redirectUrl) {
  const saved = loadState('openai')
  const { code, state } = parseRedirectInput(redirectUrl)
  if (!code) throw new Error('Missing code in redirect URL')
  if (state !== saved.state) throw new Error('OpenAI OAuth state mismatch')

  const res = await fetch(OPENAI.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: OPENAI.clientId,
      code,
      code_verifier: saved.verifier,
      redirect_uri: OPENAI.redirectUri,
    }),
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`OpenAI token exchange failed: ${res.status} ${text}`)
  const json = JSON.parse(text)
  const payload = decodeJwtPayload(json.access_token)
  const authClaim = payload?.['https://api.openai.com/auth']
  const accountId = authClaim?.chatgpt_account_id || null
  const tokens = {
    provider: OPENAI.provider,
    access: json.access_token,
    refresh: json.refresh_token,
    expires: Date.now() + (Number(json.expires_in) * 1000),
    accountId,
  }
  saveState('openai-tokens', tokens)
  process.stdout.write(JSON.stringify({ ok: true, provider: 'openai', accountId, tokenFile: getStateFile('openai-tokens') }, null, 2))
}

async function anthropicStart() {
  const { verifier, challenge } = createPKCE()
  const url = new URL(ANTHROPIC.authorizeUrl)
  url.searchParams.set('code', 'true')
  url.searchParams.set('client_id', ANTHROPIC.clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', ANTHROPIC.redirectUri)
  url.searchParams.set('scope', ANTHROPIC.scope)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('state', verifier)
  saveState('anthropic', { provider: ANTHROPIC.provider, verifier, redirectUri: ANTHROPIC.redirectUri, createdAt: Date.now() })
  process.stdout.write(JSON.stringify({ ok: true, provider: 'anthropic', url: url.toString(), stateFile: getStateFile('anthropic') }, null, 2))
}

async function anthropicLogin() {
  const { verifier, challenge } = createPKCE()
  const url = new URL(ANTHROPIC.authorizeUrl)
  url.searchParams.set('code', 'true')
  url.searchParams.set('client_id', ANTHROPIC.clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', ANTHROPIC.redirectUri)
  url.searchParams.set('scope', ANTHROPIC.scope)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('state', verifier)
  saveState('anthropic', { provider: ANTHROPIC.provider, verifier, redirectUri: ANTHROPIC.redirectUri, createdAt: Date.now() })
  openSystemBrowser(url.toString())
  const result = await waitForRedirect({ port: 53692, pathName: '/callback', expectedState: verifier })
  await anthropicFinish(result.redirectUrl)
}

async function anthropicFinish(redirectUrl) {
  const saved = loadState('anthropic')
  const { code, state } = parseRedirectInput(redirectUrl)
  if (!code) throw new Error('Missing code in redirect URL')
  if (state !== saved.verifier) throw new Error('Anthropic OAuth state mismatch')

  const res = await fetch(ANTHROPIC.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: ANTHROPIC.clientId,
      code,
      state,
      redirect_uri: ANTHROPIC.redirectUri,
      code_verifier: saved.verifier,
    }),
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`Anthropic token exchange failed: ${res.status} ${text}`)
  const json = JSON.parse(text)
  const tokens = {
    provider: ANTHROPIC.provider,
    access: json.access_token,
    refresh: json.refresh_token,
    expires: Date.now() + (Number(json.expires_in) * 1000) - (5 * 60 * 1000),
  }
  saveState('anthropic-tokens', tokens)
  process.stdout.write(JSON.stringify({ ok: true, provider: 'anthropic', tokenFile: getStateFile('anthropic-tokens') }, null, 2))
}

const mode = process.argv[2]
const arg = process.argv[3]

try {
  if (mode === 'openai-start') {
    await openaiStart()
  } else if (mode === 'openai-login') {
    await openaiLogin()
  } else if (mode === 'openai-finish') {
    await openaiFinish(arg)
  } else if (mode === 'anthropic-start') {
    await anthropicStart()
  } else if (mode === 'anthropic-login') {
    await anthropicLogin()
  } else if (mode === 'anthropic-finish') {
    await anthropicFinish(arg)
  } else {
    throw new Error('Usage: node scripts/openclaw-oauth.mjs <openai-start|openai-login|openai-finish|anthropic-start|anthropic-login|anthropic-finish> [redirectUrl]')
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
