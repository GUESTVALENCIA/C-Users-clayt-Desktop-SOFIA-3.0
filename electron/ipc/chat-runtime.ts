import { type BrowserWindow, type IpcMain } from 'electron'
import { getSecret } from './settings.ipc'
import { getOpenClawRuntimeStates, ensureValidToken, markDirectProviderStatus } from './openclaw-auth.ipc'
import { callRealTool } from './mcp.ipc'

function inferLaneFromSelection(provider: string, model: string): string {
  return `${provider}:${model}`
}

function createEmptyTurnTrace(laneId: string, provider: string, model: string, fallback: boolean) {
  return { lane: laneId, provider, model, fallbackUsed: fallback, latencyMs: 0 }
}

type AuthProvider = 'openai' | 'anthropic'
type ChatChunk = Record<string, unknown> & { type: string }
type ChatChunkEmitter = (chunk: ChatChunk) => void

type OpenAICompatToolCall = {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

type InternalChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content?: any
  tool_calls?: OpenAICompatToolCall[]
  tool_call_id?: string
  name?: string
  is_error?: boolean
}

interface ParsedToolArgs {
  args: Record<string, any>
  parseError?: string
}

interface CollectedToolCall {
  id: string
  name: string
  argsText: string
  args: Record<string, any>
  parseError?: string
}

interface ToolExecutionRecord {
  toolCallId: string
  toolName: string
  args: Record<string, any>
  ok: boolean
  artifactId: string
  summary: string
  preview: string
  reinjectedContent: string
  signature: string
}

interface LLMTurnResult {
  text: string
  toolCalls: CollectedToolCall[]
}

interface PreparedChatRoute {
  provider: string
  params: any
  laneId: string
}

interface PendingAuthContinuation {
  authProvider: AuthProvider
  provider: string
  params: any
  requiresRouting: boolean
}

interface ProviderFallbackCandidate {
  provider: string
  params: any
  reason: string
}

const PROVIDER_URLS: Record<string, string> = {
  'g4f-unlimited': 'http://localhost:8082/v1',
  openai: 'https://api.openai.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  groq: 'https://api.groq.com/openai/v1',
  deepseek: 'https://api.deepseek.com/v1',
  anthropic: 'https://api.anthropic.com',
}

// All model IDs that route through OpenAI OAuth account
const OPENAI_ACCOUNT_MODEL_IDS = new Set([
  'account-openai',
  'account-openai:gpt-5.4',
  'account-openai:gpt-5.4-mini',
  'account-openai:gpt-5.3-codex',
  'account-openai:gpt-5.2-codex',
  'account-openai:gpt-5.2',
  'account-openai:gpt-5.1-codex-max',
  'account-openai:gpt-5.1-codex-mini',
  // Legacy IDs para conversaciones guardadas
  'openclaw-account-openai',
  'openclaw-account-openai:gpt-5.4',
  'openclaw-account-openai:gpt-5.4-mini',
  'openclaw-account-openai:gpt-5.3-codex',
  'openclaw-account-openai:gpt-5.2-codex',
  'openclaw-account-openai:gpt-5.2',
  'openclaw-account-openai:gpt-5.1-codex-max',
  'openclaw-account-openai:gpt-5.1-codex-mini',
])

// All model IDs that route through Anthropic OAuth account
const ANTHROPIC_ACCOUNT_MODEL_IDS = new Set([
  'account-anthropic',
  'account-anthropic:claude-sonnet-4-6',
  'account-anthropic:claude-opus-4-6',
  'account-anthropic:claude-haiku-4-5',
  // Legacy IDs para conversaciones guardadas
  'openclaw-account-anthropic',
  'openclaw-account-anthropic:claude-sonnet-4-6',
  'openclaw-account-anthropic:claude-opus-4-6',
  'openclaw-account-anthropic:claude-haiku-4-5',
])

// account-model -> modelo real en OpenAI/Anthropic/OpenRouter
const ACCOUNT_REAL_MODEL: Record<string, string> = {
  'account-openai': 'gpt-4o',
  'account-openai:gpt-5.4': 'gpt-4o',
  'account-openai:gpt-5.4-mini': 'gpt-4o-mini',
  'account-openai:gpt-5.3-codex': 'gpt-4o',
  'account-openai:gpt-5.2-codex': 'gpt-4o',
  'account-openai:gpt-5.2': 'gpt-4o',
  'account-openai:gpt-5.1-codex-max': 'gpt-4o',
  'account-openai:gpt-5.1-codex-mini': 'gpt-4o-mini',
  // Legacy aliases
  'openclaw-account-openai': 'gpt-4o',
  'openclaw-account-openai:gpt-5.4': 'gpt-4o',
  'openclaw-account-openai:gpt-5.4-mini': 'gpt-4o-mini',
  'openclaw-account-openai:gpt-5.3-codex': 'gpt-4o',
  'openclaw-account-openai:gpt-5.2-codex': 'gpt-4o',
  'openclaw-account-openai:gpt-5.2': 'gpt-4o',
  'openclaw-account-openai:gpt-5.1-codex-max': 'gpt-4o',
  'openclaw-account-openai:gpt-5.1-codex-mini': 'gpt-4o-mini',
  'account-anthropic': 'claude-sonnet-4-5',
  'account-anthropic:claude-sonnet-4-6': 'claude-sonnet-4-5',
  'account-anthropic:claude-opus-4-6': 'claude-opus-4-5',
  'account-anthropic:claude-haiku-4-5': 'claude-haiku-4-5',
  // Legacy aliases
  'openclaw-account-anthropic': 'claude-sonnet-4-5',
  'openclaw-account-anthropic:claude-sonnet-4-6': 'claude-sonnet-4-5',
  'openclaw-account-anthropic:claude-opus-4-6': 'claude-opus-4-5',
  'openclaw-account-anthropic:claude-haiku-4-5': 'claude-haiku-4-5',
}

// Fallback via OpenRouter si no hay OAuth token disponible
const ACCOUNT_COMPAT_OPENROUTER_MODELS: Record<string, string> = {
  'account-anthropic:claude-sonnet-4-6': 'anthropic/claude-sonnet-4',
  'account-anthropic:claude-opus-4-6': 'anthropic/claude-opus-4.1',
  'account-anthropic:claude-haiku-4-5': 'anthropic/claude-sonnet-4',
  'account-openai:gpt-5.4': 'openrouter/auto',
  'account-openai:gpt-5.4-mini': 'openai/gpt-4o-mini',
  'account-openai:gpt-5.3-codex': 'openai/gpt-4o',
  'account-openai:gpt-5.2-codex': 'openai/gpt-4o',
  'account-openai:gpt-5.2': 'openrouter/auto',
  'account-openai:gpt-5.1-codex-max': 'openai/gpt-4o',
  'account-openai:gpt-5.1-codex-mini': 'openai/gpt-4o-mini',
  // Legacy aliases
  'openclaw-account-anthropic:claude-sonnet-4-6': 'anthropic/claude-sonnet-4',
  'openclaw-account-anthropic:claude-opus-4-6': 'anthropic/claude-opus-4.1',
  'openclaw-account-anthropic:claude-haiku-4-5': 'anthropic/claude-sonnet-4',
  'openclaw-account-openai:gpt-5.4': 'openrouter/auto',
  'openclaw-account-openai:gpt-5.4-mini': 'openai/gpt-4o-mini',
  'openclaw-account-openai:gpt-5.3-codex': 'openai/gpt-4o',
  'openclaw-account-openai:gpt-5.2-codex': 'openai/gpt-4o',
  'openclaw-account-openai:gpt-5.2': 'openrouter/auto',
  'openclaw-account-openai:gpt-5.1-codex-max': 'openai/gpt-4o',
  'openclaw-account-openai:gpt-5.1-codex-mini': 'openai/gpt-4o-mini',
}

const OPENAI_DIRECT_URL = 'https://api.openai.com/v1'
const OPENROUTER_DIRECT_URL = 'https://openrouter.ai/api/v1'
const DEEPSEEK_DIRECT_URL = 'https://api.deepseek.com/v1'
const G4F_LOCAL_URL = 'http://localhost:8082/v1'

const TOOL_ARTIFACT_LIMIT = 200
const toolArtifactStore = new Map<string, {
  createdAt: number
  toolName: string
  args: Record<string, any>
  result: unknown
  ok: boolean
}>()

let currentAbortController: AbortController | null = null
let pendingAuthContinuation: PendingAuthContinuation | null = null

const G4F_ALL_MODELS = [
  'gpt-5.2-pro',
  'claude-opus-4.5',
  'deepseek-v3.2-exp',
  'gpt-4o',
  'gemini-3-pro',
  'grok-4-fast',
  'qwen-3-max',
  'claude-3.7-sonnet',
  'o3',
  'llama-3.3-70b-turbo',
  'gemini-3-flash',
  'glm-4.7',
  'minimax-m2.7-highspeed',
  'kimi-k2-0905',
  'deepseek-reasoner',
  'gpt-oss-120b',
]

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const G4F_SESSION_MODELS = shuffleArray(G4F_ALL_MODELS)
const g4fProviderBackoff = new Map<string, number>()

class ChatAuthRequiredError extends Error {
  provider: AuthProvider

  constructor(provider: AuthProvider) {
    super(`__DIRECT_AUTH_REQUIRED__:${provider}`)
    this.name = 'ChatAuthRequiredError'
    this.provider = provider
  }
}

class ChatAuthRetryFailedError extends Error {
  provider: AuthProvider

  constructor(provider: AuthProvider) {
    super(`__DIRECT_AUTH_RETRY_FAILED__:${provider}`)
    this.name = 'ChatAuthRetryFailedError'
    this.provider = provider
  }
}

function cloneChatParams(params: any) {
  return {
    ...params,
    messages: JSON.parse(JSON.stringify(params.messages || [])),
  }
}

function isG4FBackoffActive(modelId: string): boolean {
  const until = g4fProviderBackoff.get(modelId) ?? 0
  if (Date.now() >= until) {
    g4fProviderBackoff.delete(modelId)
    return false
  }
  return true
}

function markG4FBackoff(modelId: string, status: number): void {
  const ms = status === 429
    ? 120_000
    : (status === 401 || status === 403)
      ? 1_800_000
      : 30_000
  g4fProviderBackoff.set(modelId, Date.now() + ms)
}

function pickBestG4FModel(excludeModel?: string): string {
  for (const model of G4F_SESSION_MODELS) {
    if (model !== excludeModel && !isG4FBackoffActive(model)) {
      return model
    }
  }
  g4fProviderBackoff.delete(G4F_SESSION_MODELS[0])
  return G4F_SESSION_MODELS[0]
}

function getInteractiveLaneMessage(model: string) {
  if (OPENAI_ACCOUNT_MODEL_IDS.has(model)) {
    return 'OpenAI (ChatGPT Plus) requiere autenticacion directa antes de responder.'
  }
  if (ANTHROPIC_ACCOUNT_MODEL_IDS.has(model)) {
    return 'Anthropic (Claude Pro) requiere autenticacion directa antes de responder.'
  }
  return 'Esta ruta requiere autenticacion directa.'
}

function mapBridgeError(provider: string, _model: string, status: number, raw: string) {
  return `${provider} ${status}: ${raw.slice(0, 200)}`
}

function getProviderHeaders(provider: string, apiKey: string, params?: any): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  }

  if (params?._oauthToken) {
    headers.Authorization = `Bearer ${params._oauthToken}`
  }

  // G4F Ilimitado — no necesita API key, solo Content-Type
  if (provider === 'g4f-unlimited' || provider === 'g4f') {
    return { 'Content-Type': 'application/json' }
  }

  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://sofia.app'
    headers['X-Title'] = 'SOFIA'
  }

  return headers
}


function getFallbackAttemptKey(provider: string, model: string) {
  return `${provider}:${model}`
}

function getFallbackHistory(params: any): string[] {
  return Array.isArray(params?._providerFallbackHistory)
    ? params._providerFallbackHistory.filter((value: unknown): value is string => typeof value === 'string')
    : []
}

function withFallbackHistory(params: any, ...entries: string[]) {
  const merged = [...new Set([...getFallbackHistory(params), ...entries])]
  return {
    ...params,
    _providerFallbackHistory: merged,
  }
}

function buildOpenAIAutoFallbackCandidates(params: any): ProviderFallbackCandidate[] {
  const candidates: ProviderFallbackCandidate[] = []

  if (getSecret('openrouter')) {
    candidates.push({
      provider: 'openrouter',
      params: { ...params, model: 'openrouter/auto', baseUrl: OPENROUTER_DIRECT_URL, _oauthToken: undefined },
      reason: 'OpenRouter auto',
    })
  }

  if (getSecret('deepseek')) {
    candidates.push({
      provider: 'deepseek',
      params: { ...params, model: 'deepseek-chat', baseUrl: DEEPSEEK_DIRECT_URL, _oauthToken: undefined },
      reason: 'DeepSeek direct',
    })
  }

  candidates.push({
    provider: 'g4f',
    params: { ...params, model: pickBestG4FModel(), baseUrl: G4F_LOCAL_URL, _oauthToken: undefined },
    reason: 'G4F local',
  })

  return candidates
}

function resolveProviderFallback(provider: string, params: any, status: number, errorText: string): ProviderFallbackCandidate | null {
  if (params?._oauthToken && (provider === 'openai' || provider === 'anthropic' || provider === 'direct-openai' || provider === 'direct-anthropic')) {
    return null
  }

  const normalizedError = errorText.toLowerCase()
  const canFallback = (
    status === 429 ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    normalizedError.includes('quota') ||
    normalizedError.includes('rate limit') ||
    normalizedError.includes('oauth') ||
    normalizedError.includes('unsupported') ||
    normalizedError.includes('insufficient')
  )
  if (!canFallback) {
    return null
  }

  const history = new Set(getFallbackHistory(params))
  const currentKey = getFallbackAttemptKey(provider, String(params?.model || ''))

  if (provider === 'openai' || provider === 'anthropic' || provider === 'direct-openai' || provider === 'direct-anthropic') {
    for (const candidate of buildOpenAIAutoFallbackCandidates(params)) {
      const candidateKey = getFallbackAttemptKey(candidate.provider, String(candidate.params?.model || ''))
      if (history.has(candidateKey) || candidateKey === currentKey) {
        continue
      }

      return {
        provider: candidate.provider,
        params: withFallbackHistory(candidate.params, currentKey, candidateKey),
        reason: candidate.reason,
      }
    }
  }

  return null
}

function getToolSchema(tool: any) {
  const schema = tool?.parameters ?? tool?.inputSchema
  if (schema && typeof schema === 'object') return schema
  return { type: 'object', properties: {} }
}

function parseToolArgs(raw: string): ParsedToolArgs {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { args: {} }
  }

  try {
    const parsed = JSON.parse(trimmed)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { args: parsed as Record<string, any> }
    }
    return {
      args: { value: parsed },
      parseError: 'La herramienta emitio argumentos JSON que no son un objeto.',
    }
  } catch (error: any) {
    return {
      args: { _raw: trimmed },
      parseError: error?.message || 'No se pudieron parsear los argumentos JSON de la herramienta.',
    }
  }
}

function normalizeForJson(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) return value ?? null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value === 'bigint') return Number(value)
  if (value instanceof Error) return { name: value.name, message: value.message }
  if (depth >= 5) return '[MaxDepth]'

  if (Array.isArray(value)) {
    return value.slice(0, 50).map(item => normalizeForJson(item, depth + 1, seen))
  }

  if (typeof value === 'object') {
    if (seen.has(value as object)) return '[Circular]'
    seen.add(value as object)

    const out: Record<string, unknown> = {}
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(0, 50)) {
      out[key] = normalizeForJson(nested, depth + 1, seen)
    }
    return out
  }

  return String(value)
}

function stableStringify(value: unknown) {
  try {
    const json = JSON.stringify(normalizeForJson(value))
    return typeof json === 'string' ? json : 'null'
  } catch {
    return JSON.stringify(String(value))
  }
}

function toPreviewString(value: unknown, maxChars = 1200) {
  const text = stableStringify(value)
  return text.length <= maxChars ? text : `${text.slice(0, maxChars)}…`
}

function summarizeToolResult(toolName: string, value: unknown, ok: boolean) {
  if (!ok) {
    if (value && typeof value === 'object' && 'error' in (value as Record<string, unknown>)) {
      return `Error en ${toolName}: ${String((value as Record<string, unknown>).error ?? 'desconocido').slice(0, 220)}`
    }
    return `Error en ${toolName}: ${String(value ?? 'desconocido').slice(0, 220)}`
  }

  if (typeof value === 'string') {
    return `${toolName}: ${value.replace(/\s+/g, ' ').slice(0, 220)}`
  }

  if (Array.isArray(value)) {
    return `${toolName}: ${value.length} elemento(s)`
  }

  if (value && typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>).slice(0, 6)
    return keys.length > 0
      ? `${toolName}: resultado estructurado (${keys.join(', ')})`
      : `${toolName}: resultado estructurado vacio`
  }

  return `${toolName}: ${String(value)}`
}

function storeToolArtifact(artifactId: string, toolName: string, args: Record<string, any>, result: unknown, ok: boolean) {
  toolArtifactStore.set(artifactId, {
    createdAt: Date.now(),
    toolName,
    args,
    result,
    ok,
  })

  while (toolArtifactStore.size > TOOL_ARTIFACT_LIMIT) {
    const oldestKey = toolArtifactStore.keys().next().value
    if (!oldestKey) break
    toolArtifactStore.delete(oldestKey)
  }
}

function buildToolExecutionRecord(toolCall: CollectedToolCall, rawResult: unknown, ok: boolean): ToolExecutionRecord {
  const artifactId = `${Date.now()}-${toolCall.id}`
  storeToolArtifact(artifactId, toolCall.name, toolCall.args, rawResult, ok)

  const summary = summarizeToolResult(toolCall.name, rawResult, ok)
  const preview = toPreviewString(rawResult)

  return {
    toolCallId: toolCall.id,
    toolName: toolCall.name,
    args: toolCall.args,
    ok,
    artifactId,
    summary,
    preview,
    reinjectedContent: JSON.stringify({
      ok,
      tool: toolCall.name,
      summary,
      artifactId,
      preview,
    }, null, 2),
    signature: stableStringify({
      toolName: toolCall.name,
      args: toolCall.args,
      ok,
      preview,
    }),
  }
}

function finalizeOpenAIToolCalls(
  toolCallsByIndex: Record<number, { id: string; name: string; args: string }>,
  emitChunk: ChatChunkEmitter
) {
  return Object.keys(toolCallsByIndex)
    .map(Number)
    .sort((left, right) => left - right)
    .map(index => {
      const toolCall = toolCallsByIndex[index]
      const parsed = parseToolArgs(toolCall.args)
      emitChunk({
        type: 'tool_call_end',
        toolCallId: toolCall.id,
        toolArgs: parsed.args,
      })
      return {
        id: toolCall.id,
        name: toolCall.name,
        argsText: toolCall.args,
        args: parsed.args,
        parseError: parsed.parseError,
      } as CollectedToolCall
    })
}

function isParallelizableTool(toolName: string) {
  const normalized = toolName.toLowerCase()
  const mutatingPattern = /(create|update|delete|remove|move|write|edit|save|deploy|push|commit|run|execute|open|send|reply|login|logout|refresh|connect|disconnect|queue|trigger|abort|restore|start|stop|append)/
  if (mutatingPattern.test(normalized)) return false

  const readOnlyPattern = /(get|list|search|fetch|query|read|view|inspect|status|check|capture|analyze|audit|extract)/
  return readOnlyPattern.test(normalized)
}

function groupToolCalls(toolCalls: CollectedToolCall[]) {
  const groups: Array<{ parallel: boolean; calls: CollectedToolCall[] }> = []

  for (const toolCall of toolCalls) {
    const parallel = isParallelizableTool(toolCall.name)
    const lastGroup = groups[groups.length - 1]

    if (parallel && lastGroup?.parallel) {
      lastGroup.calls.push(toolCall)
      continue
    }

    groups.push({ parallel, calls: [toolCall] })
  }

  return groups
}

function extractToolError(rawResult: unknown) {
  if (rawResult && typeof rawResult === 'object' && 'error' in (rawResult as Record<string, unknown>)) {
    return String((rawResult as Record<string, unknown>).error ?? 'Error desconocido')
  }
  return null
}

function throwAbortError() {
  const error = new Error('Aborted')
  error.name = 'AbortError'
  throw error
}

async function executeOneTool(toolCall: CollectedToolCall, emitChunk: ChatChunkEmitter, signal: AbortSignal) {
  if (signal.aborted) throwAbortError()

  if (toolCall.parseError) {
    const record = buildToolExecutionRecord(
      toolCall,
      { error: toolCall.parseError, rawArgs: toolCall.argsText },
      false
    )

    emitChunk({
      type: 'tool_result',
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      toolStatus: 'error',
      toolSummary: record.summary,
      toolResultPreview: record.preview,
      toolArtifactId: record.artifactId,
    })

    return record
  }

  try {
    const rawResult = await callRealTool(toolCall.name, toolCall.args)
    const ok = !extractToolError(rawResult)
    const record = buildToolExecutionRecord(toolCall, rawResult, ok)

    emitChunk({
      type: 'tool_result',
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      toolStatus: ok ? 'done' : 'error',
      toolSummary: record.summary,
      toolResultPreview: record.preview,
      toolArtifactId: record.artifactId,
    })

    return record
  } catch (error: any) {
    const record = buildToolExecutionRecord(
      toolCall,
      { error: error?.message || 'Error ejecutando la herramienta.' },
      false
    )

    emitChunk({
      type: 'tool_result',
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      toolStatus: 'error',
      toolSummary: record.summary,
      toolResultPreview: record.preview,
      toolArtifactId: record.artifactId,
    })

    return record
  }
}

async function executeToolBatch(toolCalls: CollectedToolCall[], emitChunk: ChatChunkEmitter, signal: AbortSignal) {
  const results: ToolExecutionRecord[] = []

  for (const group of groupToolCalls(toolCalls)) {
    if (group.parallel) {
      const parallelResults = await Promise.all(group.calls.map(toolCall => executeOneTool(toolCall, emitChunk, signal)))
      results.push(...parallelResults)
      continue
    }

    for (const toolCall of group.calls) {
      results.push(await executeOneTool(toolCall, emitChunk, signal))
    }
  }

  return results
}

function appendAssistantToolTurn(messages: InternalChatMessage[], text: string, toolCalls: CollectedToolCall[]) {
  return [
    ...messages,
    {
      role: 'assistant',
      content: text || '',
      tool_calls: toolCalls.map(toolCall => ({
        id: toolCall.id,
        type: 'function',
        function: {
          name: toolCall.name,
          arguments: toolCall.argsText || JSON.stringify(toolCall.args || {}),
        },
      })),
    } satisfies InternalChatMessage,
  ]
}

function appendToolResults(messages: InternalChatMessage[], toolResults: ToolExecutionRecord[]) {
  return [
    ...messages,
    ...toolResults.map(toolResult => ({
      role: 'tool',
      tool_call_id: toolResult.toolCallId,
      name: toolResult.toolName,
      content: toolResult.reinjectedContent,
      is_error: !toolResult.ok,
    } satisfies InternalChatMessage)),
  ]
}

function buildLoopSignature(toolCalls: CollectedToolCall[], toolResults: ToolExecutionRecord[]) {
  return stableStringify({
    toolCalls: toolCalls.map(toolCall => ({
      name: toolCall.name,
      args: toolCall.args,
      parseError: toolCall.parseError || null,
    })),
    toolResults: toolResults.map(toolResult => ({
      toolName: toolResult.toolName,
      ok: toolResult.ok,
      signature: toolResult.signature,
    })),
  })
}

function toTextContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content.map(part => {
      if (part?.type === 'text') return String(part.text || '')
      return stableStringify(part)
    }).join('\n')
  }
  return stableStringify(content)
}

function dataUrlToAnthropicImage(url: string) {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(url)
  if (!match) return null
  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: match[1],
      data: match[2],
    },
  }
}

function convertMultimodalContentToAnthropicBlocks(content: unknown) {
  if (!Array.isArray(content)) {
    return [{ type: 'text', text: toTextContent(content) }]
  }

  const blocks: any[] = []
  for (const part of content) {
    if (part?.type === 'text') {
      blocks.push({ type: 'text', text: String(part.text || '') })
      continue
    }

    if (part?.type === 'image_url' && typeof part.image_url?.url === 'string') {
      const imageBlock = dataUrlToAnthropicImage(part.image_url.url)
      if (imageBlock) {
        blocks.push(imageBlock)
        continue
      }
    }

    blocks.push({ type: 'text', text: stableStringify(part) })
  }

  return blocks
}

function buildAnthropicPayload(params: any) {
  const systemMessage = params.messages.find((message: InternalChatMessage) => message.role === 'system')
  const anthropicMessages: Array<{ role: 'user' | 'assistant'; content: any }> = []
  let pendingToolResults: any[] = []

  const flushPendingToolResults = () => {
    if (pendingToolResults.length === 0) return
    anthropicMessages.push({
      role: 'user',
      content: pendingToolResults,
    })
    pendingToolResults = []
  }

  for (const message of params.messages as InternalChatMessage[]) {
    if (message.role === 'system') continue

    if (message.role === 'tool') {
      pendingToolResults.push({
        type: 'tool_result',
        tool_use_id: message.tool_call_id,
        content: typeof message.content === 'string' ? message.content : stableStringify(message.content),
        is_error: Boolean(message.is_error),
      })
      continue
    }

    flushPendingToolResults()

    if (message.role === 'assistant' && Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
      const contentBlocks: any[] = []
      const textContent = toTextContent(message.content).trim()

      if (textContent) {
        contentBlocks.push({ type: 'text', text: textContent })
      }

      for (const toolCall of message.tool_calls) {
        const parsed = parseToolArgs(toolCall.function.arguments)
        contentBlocks.push({
          type: 'tool_use',
          id: toolCall.id,
          name: toolCall.function.name,
          input: parsed.args,
        })
      }

      anthropicMessages.push({
        role: 'assistant',
        content: contentBlocks.length > 0 ? contentBlocks : [{ type: 'text', text: '' }],
      })
      continue
    }

    anthropicMessages.push({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: Array.isArray(message.content)
        ? convertMultimodalContentToAnthropicBlocks(message.content)
        : toTextContent(message.content),
    })
  }

  flushPendingToolResults()

  const body: any = {
    model: params.model,
    max_tokens: params.maxTokens || 4096,
    messages: anthropicMessages,
    stream: true,
  }

  if (systemMessage?.content) {
    body.system = toTextContent(systemMessage.content)
  }

  if (params.tools?.length) {
    body.tools = params.tools.map((tool: any) => ({
      name: tool.name,
      description: tool.description,
      input_schema: getToolSchema(tool),
    }))
  }

  return body
}

async function streamOpenAICompatTurn(
  provider: string,
  params: any,
  emitChunk: ChatChunkEmitter,
  signal: AbortSignal
): Promise<LLMTurnResult> {
  const secretKey = provider === 'openclaw' ? 'openclaw' : provider
  const apiKey = getSecret(secretKey)
  if (!apiKey && provider !== 'openclaw' && provider !== 'openclaw-native' && provider !== 'g4f' && provider !== 'g4f-unlimited' && !params._oauthToken) {
    throw new Error(`Sin clave API para ${provider}`)
  }

  const baseUrl = params.baseUrl || PROVIDER_URLS[provider] || PROVIDER_URLS.openai
  const headers = getProviderHeaders(provider, apiKey || '', params)
  const body: any = {
    model: params.model,
    messages: params.messages,
    stream: true,
    max_tokens: params.maxTokens || 4096,
  }

  // G4F Ilimitado: el proxy inteligente en :8082 se encarga del mapeo de proveedor y sanitización
  // Tools se envían al proxy — el proxy inyecta tool schemas en system prompt
  // y parsea tool_calls JSON de la respuesta (ToolSupportProvider emulation)
  if (provider === 'g4f-unlimited' || provider === 'g4f') {
    // No forzar proveedor — el proxy mapea automáticamente según modelo
    // Tools se mantienen — el proxy los convierte a system prompt injection
  }

  if (provider === 'openclaw') {
    const normalizedModel = String(params.model || '').toLowerCase()
    const forcedProvider = String(params._openclawProvider || '').toLowerCase()
    if (forcedProvider === 'deepseek' || normalizedModel.startsWith('deepseek-')) {
      body.provider = 'deepseek'
      body._source = 'conversational'
    } else if (forcedProvider === 'openrouter' || normalizedModel === 'openrouter/auto' || normalizedModel.startsWith('openrouter/')) {
      body.provider = 'openrouter'
    }
  }

  if (params.tools?.length) {
    body.tools = params.tools.map((tool: any) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: getToolSchema(tool),
      },
    }))
    body.tool_choice = 'auto'
  }

  if (params.temperature !== undefined) {
    body.temperature = params.temperature
  }

  const fetchSignal = (provider === 'openclaw' && params._openclawLane)
    ? AbortSignal.any([signal, AbortSignal.timeout(20_000)])
    : signal

  try {
    console.log(`\n[chat:${provider}] Sending request to ${baseUrl}/chat/completions`)
    console.log(`[chat:${provider}] Model: ${params.model}`)
    console.log(`[chat:${provider}] Messages count: ${params.messages.length}`)
    console.log(`[chat:${provider}] Headers: ${Object.keys(headers).join(', ')}`)

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: fetchSignal,
    })

    const openRouterResolvedModel =
      res.headers.get('x-openrouter-model')
      || res.headers.get('x-model')
      || ''
    const openRouterResolvedProvider =
      res.headers.get('x-openrouter-provider')
      || res.headers.get('x-provider')
      || ''

    if (provider === 'openrouter' && String(params.model || '').toLowerCase() === 'openrouter/auto') {
      console.log(
        `[chat:openrouter] auto resolved -> provider=${openRouterResolvedProvider || 'n/a'} model=${openRouterResolvedModel || 'n/a'}`
      )
      emitChunk({
        type: 'text',
        text: `Ruta PRO: OpenRouter auto -> ${openRouterResolvedProvider ? `${openRouterResolvedProvider}/` : ''}${openRouterResolvedModel || 'modelo-no-reportado'}`,
      })
    }

    if (!res.ok) {
      const errorText = await res.text()
      console.error(`[chat:${provider}] HTTP ${res.status} -> ${baseUrl}/chat/completions\n`, errorText.slice(0, 300))

      const lane = params._openclawLane as string | undefined
      if (provider === 'openclaw' && lane) {
        const authMarker = errorText.includes('NoValidHarFileError') || errorText.includes('MissingAuthError')
        if ((res.status === 401 || res.status === 403 || authMarker) && OPENAI_ACCOUNT_MODEL_IDS.has(lane)) {
          throw new ChatAuthRequiredError('openai')
        }
        if ((res.status === 401 || res.status === 403 || authMarker) && ANTHROPIC_ACCOUNT_MODEL_IDS.has(lane)) {
          throw new ChatAuthRequiredError('anthropic')
        }
        throw new Error(mapBridgeError(provider, params.model, res.status, errorText))
      }

      if (provider === 'openai' && params._oauthToken) {
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          markDirectProviderStatus('openai', 'direct-unsupported', `OpenAI directo rechazo el token OAuth (${res.status}).`)
          throw new Error(`OpenAI directo ${res.status}: el token de ChatGPT Plus no ha sido aceptado por la API oficial.`)
        }
        if (res.status === 429) {
          markDirectProviderStatus('openai', 'direct-unsupported', 'OpenAI directo devolvio quota/rate limit con token OAuth.')
          throw new Error('OpenAI directo 429: la API oficial no ha aceptado este acceso de ChatGPT Plus para uso directo.')
        }
      }

      if ((provider === 'g4f' || provider === 'g4f-unlimited') && res.status !== 400) {
        const failedModel = params.model as string
        markG4FBackoff(failedModel, res.status)
        const nextModel = pickBestG4FModel(failedModel)
        console.warn(`[G4F Router] ${failedModel} -> backoff ${res.status} -> rotando a ${nextModel}`)
        if (nextModel !== failedModel) {
          return streamOpenAICompatTurn('g4f-unlimited', { ...params, model: nextModel, baseUrl: G4F_LOCAL_URL }, emitChunk, signal)
        }
      }

      const providerFallback = resolveProviderFallback(provider, params, res.status, errorText)
      if (providerFallback) {
        console.warn(`[chat:${provider}] ${res.status} -> fallback automatico a ${providerFallback.provider} (${providerFallback.reason})`)
        emitChunk({
          type: 'provider_fallback',
          fromProvider: provider,
          fromModel: String(params.model || ''),
          toProvider: providerFallback.provider,
          toModel: String(providerFallback.params?.model || ''),
          fallbackReason: providerFallback.reason,
        })
        return streamProviderTurn(providerFallback.provider, providerFallback.params, emitChunk, signal)
      }

      throw new Error(mapBridgeError(provider, params.model, res.status, errorText))
    }

    const reader = res.body?.getReader()
    if (!reader) {
      throw new Error(`Respuesta sin cuerpo de ${provider}`)
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let text = ''
    const toolCallsByIndex: Record<number, { id: string; name: string; args: string }> = {}

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (!data) continue

        if (data === '[DONE]') {
          return {
            text,
            toolCalls: finalizeOpenAIToolCalls(toolCallsByIndex, emitChunk),
          }
        }

        try {
          const event = JSON.parse(data)
          const delta = event.choices?.[0]?.delta
          if (!delta) continue

          if (typeof delta.content === 'string' && delta.content.length > 0) {
            text += delta.content
            emitChunk({ type: 'text', text: delta.content })
          }

          if (!Array.isArray(delta.tool_calls)) continue

          for (const toolCallDelta of delta.tool_calls) {
            const index = toolCallDelta.index ?? 0
            const existing = toolCallsByIndex[index]

            if (!existing) {
              toolCallsByIndex[index] = {
                id: toolCallDelta.id ?? `tc_${index}`,
                name: toolCallDelta.function?.name ?? '',
                args: '',
              }
              emitChunk({
                type: 'tool_call_start',
                toolCallId: toolCallsByIndex[index].id,
                toolName: toolCallsByIndex[index].name,
              })
            } else if (!existing.name && toolCallDelta.function?.name) {
              existing.name = toolCallDelta.function.name
            }

            if (toolCallDelta.function?.arguments) {
              toolCallsByIndex[index].args += toolCallDelta.function.arguments
              emitChunk({
                type: 'tool_call_delta',
                toolCallId: toolCallsByIndex[index].id,
                toolArgsDelta: toolCallDelta.function.arguments,
              })
            }
          }
        } catch {}
      }
    }

    return {
      text,
      toolCalls: finalizeOpenAIToolCalls(toolCallsByIndex, emitChunk),
    }
  } catch (error: any) {
    if (error?.name === 'AbortError' && signal.aborted) throw error
    if (error instanceof ChatAuthRequiredError) throw error

    const isClosed = (error?.cause as any)?.code === 'ECONNREFUSED' || error?.message?.includes('ECONNREFUSED')
    if (isClosed) {
      throw new Error(`[${provider}] Servidor local no responde en ${baseUrl} - revisa si el servicio esta corriendo.`)
    }
    throw error
  }
}

async function streamAnthropicTurn(
  params: any,
  useOAuth: boolean,
  emitChunk: ChatChunkEmitter,
  signal: AbortSignal
): Promise<LLMTurnResult> {
  const apiKey = useOAuth ? params._oauthToken : getSecret('anthropic')
  if (!apiKey) {
    if (useOAuth) throw new ChatAuthRequiredError('anthropic')
    throw new Error('Sin clave API de Anthropic')
  }

  const body = buildAnthropicPayload(params)
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(useOAuth ? { Authorization: `Bearer ${apiKey}` } : { 'x-api-key': apiKey }),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    const errorText = await res.text()
    if (useOAuth) {
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        markDirectProviderStatus('anthropic', 'direct-unsupported', `Anthropic directo rechazo el token OAuth (${res.status}).`)
        throw new Error(`Anthropic directo ${res.status}: el token de Claude Pro no ha sido aceptado por la API oficial.`)
      }
      if (res.status === 429) {
        markDirectProviderStatus('anthropic', 'direct-unsupported', 'Anthropic directo devolvio rate limit con token OAuth.')
        throw new Error('Anthropic directo 429: la API oficial no ha aceptado este acceso de Claude Pro para uso directo.')
      }
    }
    throw new Error(`${useOAuth ? 'Claude Pro directo' : 'Anthropic'} ${res.status}: ${errorText.slice(0, 220)}`)
  }

  const reader = res.body?.getReader()
  if (!reader) {
    throw new Error('Respuesta sin cuerpo de Anthropic')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let text = ''
  const toolCallOrder: string[] = []
  const toolCallsById: Record<string, { name: string; argsText: string }> = {}

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (!data) continue

      try {
        const event = JSON.parse(data)

        if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
          const { id, name } = event.content_block
          toolCallOrder[event.index ?? toolCallOrder.length] = id
          toolCallsById[id] = { name, argsText: '' }
          emitChunk({ type: 'tool_call_start', toolCallId: id, toolName: name })
          continue
        }

        if (event.type === 'content_block_delta') {
          if (event.delta?.type === 'text_delta') {
            text += event.delta.text
            emitChunk({ type: 'text', text: event.delta.text })
            continue
          }

          if (event.delta?.type === 'input_json_delta') {
            const toolCallId = toolCallOrder[event.index] ?? toolCallOrder[toolCallOrder.length - 1]
            if (!toolCallId) continue
            toolCallsById[toolCallId].argsText += event.delta.partial_json
            emitChunk({
              type: 'tool_call_delta',
              toolCallId,
              toolArgsDelta: event.delta.partial_json,
            })
            continue
          }
        }

        if (event.type === 'content_block_stop') {
          const toolCallId = toolCallOrder[event.index] ?? toolCallOrder[toolCallOrder.length - 1]
          if (!toolCallId || !toolCallsById[toolCallId]) continue
          const parsed = parseToolArgs(toolCallsById[toolCallId].argsText)
          emitChunk({
            type: 'tool_call_end',
            toolCallId,
            toolArgs: parsed.args,
          })
          continue
        }

        if (event.type === 'message_stop') {
          return {
            text,
            toolCalls: toolCallOrder
              .filter(Boolean)
              .map(toolCallId => {
                const stored = toolCallsById[toolCallId]
                const parsed = parseToolArgs(stored.argsText)
                return {
                  id: toolCallId,
                  name: stored.name,
                  argsText: stored.argsText,
                  args: parsed.args,
                  parseError: parsed.parseError,
                } as CollectedToolCall
              }),
          }
        }
      } catch {}
    }
  }

  return {
    text,
    toolCalls: toolCallOrder
      .filter(Boolean)
      .map(toolCallId => {
        const stored = toolCallsById[toolCallId]
        const parsed = parseToolArgs(stored.argsText)
        return {
          id: toolCallId,
          name: stored.name,
          argsText: stored.argsText,
          args: parsed.args,
          parseError: parsed.parseError,
        } as CollectedToolCall
      }),
  }
}

async function streamGeminiTurn(
  params: any,
  emitChunk: ChatChunkEmitter,
  signal: AbortSignal
): Promise<LLMTurnResult> {
  const apiKey = getSecret('gemini')
  if (!apiKey) throw new Error('Sin clave API de Gemini')

  const contents = params.messages
    .filter((message: InternalChatMessage) => message.role !== 'system')
    .map((message: InternalChatMessage) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: toTextContent(message.content) }],
    }))

  const systemMessage = params.messages.find((message: InternalChatMessage) => message.role === 'system')
  const body: any = { contents }
  if (systemMessage) {
    body.systemInstruction = { parts: [{ text: toTextContent(systemMessage.content) }] }
  }
  body.generationConfig = { maxOutputTokens: params.maxTokens || 4096 }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    }
  )

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Gemini ${res.status}: ${errorText}`)
  }

  const reader = res.body?.getReader()
  if (!reader) {
    throw new Error('Respuesta sin cuerpo de Gemini')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let text = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const event = JSON.parse(line.slice(6))
        const chunkText = event.candidates?.[0]?.content?.parts?.[0]?.text
        if (!chunkText) continue
        text += chunkText
        emitChunk({ type: 'text', text: chunkText })
      } catch {}
    }
  }

  return { text, toolCalls: [] }
}

async function streamProviderTurn(
  provider: string,
  params: any,
  emitChunk: ChatChunkEmitter,
  signal: AbortSignal
) {
  if (provider === '__openclaw-anthropic-fallback__') {
    return streamAnthropicTurn(params, true, emitChunk, signal)
  }
  if (provider === 'anthropic') {
    return streamAnthropicTurn(params, !!params._oauthToken, emitChunk, signal)
  }
  if (provider === 'gemini') {
    return streamGeminiTurn(params, emitChunk, signal)
  }
  return streamOpenAICompatTurn(provider, params, emitChunk, signal)
}

async function resolveDirectChatRoute(params: any): Promise<PreparedChatRoute> {
  const provider = params.provider
  const nextParams = cloneChatParams(params)
  const laneId = inferLaneFromSelection(provider, params.model)
  const originalModel = String(params.model || '')

  if (provider === 'g4f-unlimited' || provider === 'g4f') {
    return {
      provider: 'g4f-unlimited',
      params: { ...nextParams, baseUrl: G4F_LOCAL_URL, _resolvedLaneId: laneId },
      laneId,
    }
  }

  if (provider === 'openrouter') {
    // Mapear IDs de modelos de cuenta a modelos reales de OpenRouter
    const mappedModel = ACCOUNT_COMPAT_OPENROUTER_MODELS[originalModel] || originalModel
    return {
      provider: 'openrouter',
      params: { ...nextParams, model: mappedModel, baseUrl: OPENROUTER_DIRECT_URL, _resolvedLaneId: laneId },
      laneId,
    }
  }

  if (provider === 'deepseek') {
    return {
      provider: 'deepseek',
      params: { ...nextParams, baseUrl: DEEPSEEK_DIRECT_URL, _resolvedLaneId: laneId },
      laneId,
    }
  }

  // Compatibilidad con conversaciones antiguas que tenían provider openclaw*
  if (provider === 'openclaw' || provider === 'openclaw-native') {
    if (originalModel === 'openrouter/auto' || originalModel.startsWith('openrouter/')) {
      return {
        provider: 'openrouter',
        params: { ...nextParams, baseUrl: OPENROUTER_DIRECT_URL, _resolvedLaneId: laneId },
        laneId,
      }
    }
    if (originalModel === 'deepseek-chat' || originalModel === 'deepseek-reasoner' || originalModel.startsWith('deepseek-')) {
      return {
        provider: 'deepseek',
        params: { ...nextParams, baseUrl: DEEPSEEK_DIRECT_URL, _resolvedLaneId: laneId },
        laneId,
      }
    }
    // Modelos de cuenta → intento OAuth directo
  }

  // Cuentas Claude Pro y ChatGPT Plus — OAuth directo o fallback OpenRouter
  const isOpenAIModel = OPENAI_ACCOUNT_MODEL_IDS.has(originalModel)
  const isAnthropicModel = ANTHROPIC_ACCOUNT_MODEL_IDS.has(originalModel)

  if (isOpenAIModel) {
    const token = await ensureValidToken('openai')
    if (!token) throw new ChatAuthRequiredError('openai')
    const realModel = ACCOUNT_REAL_MODEL[originalModel] || 'gpt-4o'
    return {
      provider: 'openai',
      params: { ...nextParams, model: realModel, baseUrl: OPENROUTER_DIRECT_URL, _oauthToken: token, _resolvedLaneId: laneId },
      laneId,
    }
  }

  if (isAnthropicModel) {
    const token = await ensureValidToken('anthropic')
    if (!token) throw new ChatAuthRequiredError('anthropic')
    const realModel = ACCOUNT_REAL_MODEL[originalModel] || 'claude-sonnet-4-5'
    return {
      provider: 'anthropic',
      params: { ...nextParams, model: realModel, _oauthToken: token, _resolvedLaneId: laneId },
      laneId,
    }
  }

  return { provider, params: { ...nextParams, _resolvedLaneId: laneId }, laneId }
}

async function runAgenticLoop(
  provider: string,
  params: any,
  emitChunk: ChatChunkEmitter,
  signal: AbortSignal
) {
  let executedAnyTools = false
  let previousNoProgressSignature: string | null = null

  params.messages = Array.isArray(params.messages) ? params.messages : []

  while (true) {
    const turn = await streamProviderTurn(provider, params, emitChunk, signal)
    const assistantText = turn.text
    const assistantProducedVisibleText = assistantText.trim().length > 0

    if (turn.toolCalls.length === 0) {
      if (!assistantProducedVisibleText && executedAnyTools) {
        emitChunk({
          type: 'text',
          text: 'He ejecutado herramientas, pero el proveedor no emitio una redaccion final. Revisa los resultados visibles de las tools o dime como quieres que continue.',
        })
      }
      return
    }

    params.messages = appendAssistantToolTurn(params.messages as InternalChatMessage[], assistantText, turn.toolCalls)
    const toolResults = await executeToolBatch(turn.toolCalls, emitChunk, signal)
    const loopSignature = buildLoopSignature(turn.toolCalls, toolResults)
    executedAnyTools = true

    if (!assistantProducedVisibleText && previousNoProgressSignature === loopSignature) {
      emitChunk({
        type: 'text',
        text: 'He detectado un bucle exacto sin progreso en las herramientas. Detengo este turno para evitar que el chat quede colgado.',
      })
      return
    }

    previousNoProgressSignature = assistantProducedVisibleText ? null : loopSignature
    params.messages = appendToolResults(params.messages as InternalChatMessage[], toolResults)
  }
}

export function attachChatRuntimeHandlers(ipcMain: IpcMain, win: BrowserWindow) {
  const emitChunk: ChatChunkEmitter = (chunk) => {
    win.webContents.send('chat:chunk', chunk)
  }

  ipcMain.handle('chat:send', async (_e, params: any) => {
    currentAbortController = new AbortController()
    pendingAuthContinuation = null

    let resolvedProvider: string | null = null
    let resolvedParams: any = null

    try {
      const resolved = await resolveDirectChatRoute(params)
      resolvedProvider = resolved.provider
      resolvedParams = cloneChatParams(resolved.params)
      emitChunk({
        type: 'turn_trace',
        ...createEmptyTurnTrace(
          resolved.laneId,
          resolvedProvider,
          String(resolvedParams.model || ''),
          false,
        ),
      })
      await runAgenticLoop(resolvedProvider, resolvedParams, emitChunk, currentAbortController!.signal)

      if (!currentAbortController!.signal.aborted) {
        emitChunk({ type: 'done' })
      }
    } catch (error: any) {
      if (error instanceof ChatAuthRequiredError) {
        pendingAuthContinuation = resolvedProvider && resolvedParams
          ? {
              authProvider: error.provider,
              provider: resolvedProvider,
              params: resolvedParams,
              requiresRouting: false,
            }
          : {
              authProvider: error.provider,
              provider: params.provider,
              params: cloneChatParams(params),
              requiresRouting: true,
            }

        emitChunk({ type: 'error', error: `__DIRECT_AUTH_REQUIRED__:${error.provider}` })
        return
      }

      if (error?.name === 'AbortError' && currentAbortController?.signal.aborted) {
        return
      }

      emitChunk({ type: 'error', error: error?.message || 'Error desconocido en el chat.' })
    } finally {
      currentAbortController = null
    }
  })

  ipcMain.handle('chat:resume-after-auth', async (_e, provider: AuthProvider) => {
    const pending = pendingAuthContinuation
    if (!pending || pending.authProvider !== provider) {
      return { resumed: false }
    }

    currentAbortController = new AbortController()

    try {
      let resumedProvider = pending.provider
      let resumedParams = cloneChatParams(pending.params)

      if (pending.requiresRouting) {
        const resolved = await resolveDirectChatRoute(pending.params)
        resumedProvider = resolved.provider
        resumedParams = cloneChatParams(resolved.params)
      } else {
        const token = await ensureValidToken(pending.authProvider)
        if (!token) {
          throw new ChatAuthRequiredError(pending.authProvider)
        }
        resumedParams = {
          ...resumedParams,
          _oauthToken: token,
        }
      }

      await runAgenticLoop(resumedProvider, resumedParams, emitChunk, currentAbortController!.signal)
      pendingAuthContinuation = null

      if (!currentAbortController!.signal.aborted) {
        emitChunk({ type: 'done' })
      }

      return { resumed: true }
    } catch (error: any) {
      if (error instanceof ChatAuthRequiredError) {
        pendingAuthContinuation = null
        const retryFailed = new ChatAuthRetryFailedError(error.provider)
        emitChunk({ type: 'error', error: retryFailed.message })
        return { resumed: false, error: retryFailed.message }
      }

      if (error?.name === 'AbortError' && currentAbortController?.signal.aborted) {
        return { resumed: false }
      }

      emitChunk({ type: 'error', error: error?.message || 'Error reanudando el turno tras OAuth.' })
      return { resumed: false, error: error?.message || 'Error reanudando el turno tras OAuth.' }
    } finally {
      currentAbortController = null
    }
  })

  ipcMain.handle('chat:abort', () => {
    currentAbortController?.abort()
    currentAbortController = null
    pendingAuthContinuation = null
  })
}
