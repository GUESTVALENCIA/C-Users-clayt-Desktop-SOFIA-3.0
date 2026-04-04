import { type IpcMain, type BrowserWindow, shell, app } from 'electron'
import { randomBytes, createHash } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const OAUTH_DIR = app.isPackaged
  ? join(process.resourcesPath, 'sofia-auth', 'oauth')
  : join(process.cwd(), 'resources', 'sofia-auth', 'oauth')

type OAuthProvider = 'openai' | 'anthropic'

const OPENAI_CONFIG = {
  provider: 'openai' as const,
  clientId: 'app_EMoamEEZ73f0CkXaXp7hrann',
  authorizeUrl: 'https://auth.openai.com/oauth/authorize',
  tokenUrl: 'https://auth.openai.com/oauth/token',
  redirectUri: 'http://localhost:1455/auth/callback',
  callbackPort: 1455,
  callbackPath: '/auth/callback',
  scope: 'openid profile email offline_access',
}

const ANTHROPIC_CONFIG = {
  provider: 'anthropic' as const,
  clientId: Buffer.from('OWQxYzI1MGEtZTYxYi00NGQ5LTg4ZWQtNTk0NGQxOTYyZjVl', 'base64').toString('utf8'),
  authorizeUrl: 'https://claude.ai/oauth/authorize',
  tokenUrl: 'https://platform.claude.com/v1/oauth/token',
  redirectUri: 'http://localhost:53692/callback',
  callbackPort: 53692,
  callbackPath: '/callback',
  scope: 'org:create_api_key user:profile user:inference user:sessions:claude_code user:mcp_servers user:file_upload',
}

export type DirectAuthStatus =
  | 'disconnected'
  | 'login-required'
  | 'connecting'
  | 'connected-direct'
  | 'direct-unsupported'
  | 'fallback-active'
  | 'expired'
  | 'refreshing'

export interface DirectAuthState {
  status: DirectAuthStatus
  provider: OAuthProvider
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
  accountId?: string
  lastError?: string
}

export type DirectRuntimeStatus = 'ready' | 'requires-login' | 'direct-unsupported' | 'fallback-active'

export interface DirectRuntimeState {
  provider: OAuthProvider
  authStatus: DirectAuthStatus
  runtimeStatus: DirectRuntimeStatus
  tokenLoaded: boolean
  selectable: boolean
  badge: string
  detail: string
}

interface StoredTokens {
  provider: OAuthProvider
  access: string
  refresh?: string
  expires: number
  accountId?: string
}

const authStates = new Map<OAuthProvider, DirectAuthState>()
const activeServers = new Map<string, Server>()
let mainWin: BrowserWindow | null = null

function getConfig(provider: OAuthProvider) {
  return provider === 'openai' ? OPENAI_CONFIG : ANTHROPIC_CONFIG
}

function defaultState(provider: OAuthProvider): DirectAuthState {
  return { status: 'disconnected', provider }
}

function sanitizeAuthState(state: DirectAuthState): DirectAuthState {
  const { accessToken: _a, refreshToken: _r, ...safeState } = state
  return safeState
}

function tokenFilePath(provider: OAuthProvider): string {
  return join(OAUTH_DIR, `${provider}-tokens.json`)
}

function stateFilePath(provider: OAuthProvider): string {
  return join(OAUTH_DIR, `${provider}.json`)
}

function base64Url(input: Buffer): string {
  return input.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function sha256Base64Url(value: string): string {
  return createHash('sha256').update(value).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function createPKCE() {
  const verifier = base64Url(randomBytes(32))
  const challenge = sha256Base64Url(verifier)
  return { verifier, challenge }
}

function decodeJwtPayload(token: string): any | null {
  const parts = String(token || '').split('.')
  if (parts.length !== 3 || !parts[1]) return null
  const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  try {
    return JSON.parse(Buffer.from(normalized + pad, 'base64').toString('utf8'))
  } catch {
    return null
  }
}

function saveTokens(provider: OAuthProvider, tokens: StoredTokens) {
  mkdirSync(OAUTH_DIR, { recursive: true })
  writeFileSync(tokenFilePath(provider), JSON.stringify(tokens, null, 2), 'utf8')
}

function loadTokens(provider: OAuthProvider): StoredTokens | null {
  const file = tokenFilePath(provider)
  if (!existsSync(file)) return null
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function saveOAuthState(provider: OAuthProvider, state: any) {
  mkdirSync(OAUTH_DIR, { recursive: true })
  writeFileSync(stateFilePath(provider), JSON.stringify(state, null, 2), 'utf8')
}

function removeOAuthState(provider: OAuthProvider) {
  const file = stateFilePath(provider)
  if (existsSync(file)) {
    try { rmSync(file, { force: true }) } catch {}
  }
}

function computeRuntimeState(provider: OAuthProvider): DirectRuntimeState {
  const state = authStates.get(provider) ?? defaultState(provider)
  const tokenLoaded = !!state.accessToken

  if (state.status === 'connected-direct') {
    return {
      provider,
      authStatus: state.status,
      runtimeStatus: 'ready',
      tokenLoaded,
      selectable: true,
      badge: 'Directo',
      detail: provider === 'openai'
        ? 'ChatGPT Plus listo en modo directo.'
        : 'Claude Pro listo en modo directo.',
    }
  }

  if (state.status === 'fallback-active') {
    return {
      provider,
      authStatus: state.status,
      runtimeStatus: 'fallback-active',
      tokenLoaded,
      selectable: true,
      badge: 'Fallback activo',
      detail: state.lastError || 'El acceso directo falló y se activó la ruta de compatibilidad.',
    }
  }

  if (state.status === 'direct-unsupported') {
    return {
      provider,
      authStatus: state.status,
      runtimeStatus: 'direct-unsupported',
      tokenLoaded,
      selectable: true,
      badge: 'Compat',
      detail: state.lastError || 'La cuenta no admite esta ruta directa y usará compatibilidad.',
    }
  }

  return {
    provider,
    authStatus: state.status,
    runtimeStatus: 'requires-login',
    tokenLoaded,
    selectable: false,
    badge: 'Conectar',
    detail: provider === 'openai'
      ? 'Conecta tu cuenta ChatGPT Plus para usar el modo directo.'
      : 'Conecta tu cuenta Claude Pro para usar el modo directo.',
  }
}

export function getDirectAuthState(provider: string): DirectAuthState {
  return authStates.get(provider as OAuthProvider) ?? defaultState(provider as OAuthProvider)
}

export function getAllDirectAuthStates(): Record<string, DirectAuthState> {
  return {
    openai: sanitizeAuthState(authStates.get('openai') ?? defaultState('openai')),
    anthropic: sanitizeAuthState(authStates.get('anthropic') ?? defaultState('anthropic')),
  }
}

export function getDirectRuntimeStates(): Record<string, DirectRuntimeState> {
  return {
    openai: computeRuntimeState('openai'),
    anthropic: computeRuntimeState('anthropic'),
  }
}

function emitStateChanged() {
  const authState = getAllDirectAuthStates()
  mainWin?.webContents.send('direct:auth-state-changed', authState)
}

function updateState(provider: OAuthProvider, patch: Partial<DirectAuthState>) {
  const current = authStates.get(provider) ?? defaultState(provider)
  authStates.set(provider, { ...current, ...patch })
  emitStateChanged()
}

export function markDirectProviderStatus(
  provider: OAuthProvider,
  status: Extract<DirectAuthStatus, 'connected-direct' | 'direct-unsupported' | 'fallback-active'>,
  lastError?: string,
) {
  updateState(provider, { status, lastError })
}

function initializeStates() {
  const now = Date.now()

  for (const provider of ['openai', 'anthropic'] as const) {
    const stored = loadTokens(provider)
    if (!stored?.access) {
      authStates.set(provider, defaultState(provider))
      continue
    }

    const status: DirectAuthStatus = stored.expires > now ? 'connected-direct' : 'expired'
    authStates.set(provider, {
      provider,
      status,
      accessToken: stored.access,
      refreshToken: stored.refresh,
      expiresAt: stored.expires,
      accountId: stored.accountId,
    })

    if (status === 'expired' && stored.refresh) {
      void refreshTokens(provider)
    }
  }
}

function waitForCallback(port: number, pathName: string, expectedState: string, timeoutMs = 240_000): Promise<{ code: string; state: string }> {
  return new Promise((resolve, reject) => {
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      try { server.close() } catch {}
      activeServers.delete(String(port))
      reject(new Error(`OAuth timeout en localhost:${port}${pathName}`))
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

        if (!code) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end('<!DOCTYPE html><html><body style="background:#0b0d10;color:#e2e8f0;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h2 style="color:#7dd3fc">SOFIA 3.0</h2><p>Autorizando...</p></div></body></html>')
          return
        }

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end('<!DOCTYPE html><html><body style="background:#0b0d10;color:#e2e8f0;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h2 style="color:#7dd3fc">SOFIA 3.0</h2><p>Autenticacion correcta. Puedes cerrar esta ventana.</p></div></body></html>')

        if (!settled) {
          settled = true
          clearTimeout(timer)
          server.close()
          activeServers.delete(String(port))
          resolve({ code, state })
        }
      } catch (error) {
        res.statusCode = 500
        res.end('Internal error')
        if (!settled) {
          settled = true
          clearTimeout(timer)
          try { server.close() } catch {}
          activeServers.delete(String(port))
          reject(error)
        }
      }
    })

    const prev = activeServers.get(String(port))
    if (prev) {
      try { prev.close() } catch {}
    }
    activeServers.set(String(port), server)

    server.on('error', (err: any) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      activeServers.delete(String(port))
      reject(new Error(`Puerto ${port} ocupado: ${err.message}`))
    })

    server.listen(port, '127.0.0.1')
  })
}

async function loginOpenAI(): Promise<{ ok: boolean; error?: string }> {
  const cfg = OPENAI_CONFIG
  const { verifier, challenge } = createPKCE()
  const state = randomBytes(16).toString('hex')
  const url = new URL(cfg.authorizeUrl)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', cfg.clientId)
  url.searchParams.set('redirect_uri', cfg.redirectUri)
  url.searchParams.set('scope', cfg.scope)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('state', state)
  url.searchParams.set('id_token_add_organizations', 'true')
  url.searchParams.set('codex_cli_simplified_flow', 'true')
  url.searchParams.set('originator', 'pi')

  saveOAuthState('openai', { verifier, state, redirectUri: cfg.redirectUri, createdAt: Date.now() })
  updateState('openai', { status: 'connecting', lastError: undefined })
  await shell.openExternal(url.toString())

  const result = await waitForCallback(cfg.callbackPort, cfg.callbackPath, state)
  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: cfg.clientId,
      code: result.code,
      code_verifier: verifier,
      redirect_uri: cfg.redirectUri,
    }),
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`OpenAI token exchange ${res.status}: ${text.slice(0, 300)}`)

  const json = JSON.parse(text)
  const payload = decodeJwtPayload(json.access_token)
  const authClaim = payload?.['https://api.openai.com/auth']
  const accountId = authClaim?.chatgpt_account_id || undefined
  const expiresAt = Date.now() + (Number(json.expires_in) * 1000)

  saveTokens('openai', {
    provider: 'openai',
    access: json.access_token,
    refresh: json.refresh_token,
    expires: expiresAt,
    accountId,
  })

  removeOAuthState('openai')
  updateState('openai', {
    status: 'connected-direct',
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt,
    accountId,
    lastError: undefined,
  })

  return { ok: true }
}

async function loginAnthropic(): Promise<{ ok: boolean; error?: string }> {
  const cfg = ANTHROPIC_CONFIG
  const { verifier, challenge } = createPKCE()
  const url = new URL(cfg.authorizeUrl)
  url.searchParams.set('code', 'true')
  url.searchParams.set('client_id', cfg.clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', cfg.redirectUri)
  url.searchParams.set('scope', cfg.scope)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('state', verifier)

  saveOAuthState('anthropic', { verifier, redirectUri: cfg.redirectUri, createdAt: Date.now() })
  updateState('anthropic', { status: 'connecting', lastError: undefined })
  await shell.openExternal(url.toString())

  const result = await waitForCallback(cfg.callbackPort, cfg.callbackPath, verifier)
  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: cfg.clientId,
      code: result.code,
      state: result.state,
      redirect_uri: cfg.redirectUri,
      code_verifier: verifier,
    }),
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`Anthropic token exchange ${res.status}: ${text.slice(0, 300)}`)

  const json = JSON.parse(text)
  const expiresAt = Date.now() + (Number(json.expires_in) * 1000) - 300_000

  saveTokens('anthropic', {
    provider: 'anthropic',
    access: json.access_token,
    refresh: json.refresh_token,
    expires: expiresAt,
  })

  removeOAuthState('anthropic')
  updateState('anthropic', {
    status: 'connected-direct',
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt,
    lastError: undefined,
  })

  return { ok: true }
}

async function refreshTokens(provider: OAuthProvider): Promise<{ ok: boolean; error?: string }> {
  const state = authStates.get(provider)
  if (!state?.refreshToken) {
    updateState(provider, { status: 'login-required', lastError: 'No refresh token available' })
    return { ok: false, error: 'No refresh token available' }
  }

  const cfg = getConfig(provider)
  updateState(provider, { status: 'refreshing' })

  try {
    const body = provider === 'openai'
      ? new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: cfg.clientId,
          refresh_token: state.refreshToken,
        }).toString()
      : JSON.stringify({
          grant_type: 'refresh_token',
          client_id: cfg.clientId,
          refresh_token: state.refreshToken,
        })

    const headers: Record<string, string> = provider === 'openai'
      ? { 'Content-Type': 'application/x-www-form-urlencoded' }
      : { 'Content-Type': 'application/json', Accept: 'application/json' }

    const res = await fetch(cfg.tokenUrl, { method: 'POST', headers, body })
    const text = await res.text()
    if (!res.ok) {
      updateState(provider, { status: 'login-required', lastError: `Refresh failed: ${res.status}` })
      return { ok: false, error: `Refresh failed: ${res.status}` }
    }

    const json = JSON.parse(text)
    const expiresAt = Date.now() + (Number(json.expires_in) * 1000) - (provider === 'anthropic' ? 300_000 : 0)

    saveTokens(provider, {
      provider,
      access: json.access_token,
      refresh: json.refresh_token ?? state.refreshToken,
      expires: expiresAt,
      accountId: state.accountId,
    })

    updateState(provider, {
      status: 'connected-direct',
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? state.refreshToken,
      expiresAt,
      lastError: undefined,
    })

    return { ok: true }
  } catch (err: any) {
    updateState(provider, { status: 'login-required', lastError: err.message })
    return { ok: false, error: err.message }
  }
}

export async function ensureValidToken(provider: OAuthProvider): Promise<string | null> {
  const state = authStates.get(provider)
  if (!state || state.status === 'disconnected' || state.status === 'login-required') return null

  if (state.expiresAt && state.expiresAt < Date.now() + 120_000) {
    if (!state.refreshToken) {
      updateState(provider, { status: 'expired' })
      return null
    }
    const result = await refreshTokens(provider)
    if (!result.ok) return null
    return authStates.get(provider)?.accessToken ?? null
  }

  return state.accessToken ?? null
}

function clearProvider(provider: OAuthProvider) {
  authStates.set(provider, defaultState(provider))
  const tokenFile = tokenFilePath(provider)
  if (existsSync(tokenFile)) {
    try { rmSync(tokenFile, { force: true }) } catch {}
  }
  removeOAuthState(provider)
  emitStateChanged()
}

export function registerDirectAuthIPC(ipcMain: IpcMain, win: BrowserWindow) {
  mainWin = win
  initializeStates()

  ipcMain.handle('direct:login', async (_e, params: { provider: OAuthProvider }) => {
    try {
      return params.provider === 'openai' ? await loginOpenAI() : await loginAnthropic()
    } catch (err: any) {
      updateState(params.provider, { status: 'login-required', lastError: err.message })
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('direct:refresh', async (_e, params: { provider: OAuthProvider }) => {
    return refreshTokens(params.provider)
  })

  ipcMain.handle('direct:get-auth-state', () => getAllDirectAuthStates())
  ipcMain.handle('direct:get-runtime-state', () => getDirectRuntimeStates())

  ipcMain.handle('direct:logout', (_e, params: { provider: OAuthProvider }) => {
    clearProvider(params.provider)
    return { ok: true }
  })
}

export const registerOpenClawAuthIPC = registerDirectAuthIPC
export const getOpenClawAuthState = getDirectAuthState
export const getAllOpenClawAuthStates = getAllDirectAuthStates
export const getOpenClawRuntimeStates = getDirectRuntimeStates
