import { type BrowserWindow, type IpcMain } from 'electron'
import { getSecret } from './settings.ipc'
import { callRealTool } from './mcp.ipc'

function inferLaneFromSelection(provider: string, model: string): string {
  return `${provider}:${model}`
}

function createEmptyTurnTrace(laneId: string, provider: string, model: string, fallback: boolean) {
  return { lane: laneId, provider, model, fallbackUsed: fallback, latencyMs: 0 }
}

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

interface ProviderFallbackCandidate {
  provider: string
  params: any
  reason: string
}

const PROVIDER_URLS: Record<string, string> = {
  'g4f-unlimited': 'http://localhost:8082/v1',
  'g4f': 'http://localhost:8080/v1', // Proxy inteligente v2
  openai: 'https://api.openai.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  groq: 'https://api.groq.com/openai/v1',
  deepseek: 'https://api.deepseek.com/v1',
  anthropic: 'https://api.anthropic.com',
}

const G4F_LOCAL_URL = 'http://localhost:8080/v1'
const OPENROUTER_DIRECT_URL = 'https://openrouter.ai/api/v1'
const DEEPSEEK_DIRECT_URL = 'https://api.deepseek.com/v1'

const TOOL_ARTIFACT_LIMIT = 200
const toolArtifactStore = new Map<string, {
  createdAt: number
  toolName: string
  args: Record<string, any>
  result: unknown
  ok: boolean
}>()

let currentAbortController: AbortController | null = null

function cloneChatParams(params: any) {
  return {
    ...params,
    messages: JSON.parse(JSON.stringify(params.messages || [])),
  }
}

function getProviderHeaders(provider: string, apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
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

function buildFallbackCandidates(params: any): ProviderFallbackCandidate[] {
  const candidates: ProviderFallbackCandidate[] = []

  if (getSecret('openrouter')) {
    candidates.push({
      provider: 'openrouter',
      params: { ...params, model: 'openrouter/auto', baseUrl: OPENROUTER_DIRECT_URL },
      reason: 'OpenRouter auto',
    })
  }

  if (getSecret('deepseek')) {
    candidates.push({
      provider: 'deepseek',
      params: { ...params, model: 'deepseek-chat', baseUrl: DEEPSEEK_DIRECT_URL },
      reason: 'DeepSeek direct',
    })
  }

  candidates.push({
    provider: 'g4f',
    params: { ...params, model: 'gpt-4o', baseUrl: G4F_LOCAL_URL },
    reason: 'G4F local',
  })

  return candidates
}

function resolveProviderFallback(provider: string, params: any, status: number, errorText: string): ProviderFallbackCandidate | null {
  const normalizedError = errorText.toLowerCase()
  const canFallback = (
    status === 429 ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    normalizedError.includes('quota') ||
    normalizedError.includes('rate limit') ||
    normalizedError.includes('insufficient')
  )
  if (!canFallback) {
    return null
  }

  const history = new Set(getFallbackHistory(params))
  const currentKey = getFallbackAttemptKey(provider, String(params?.model || ''))

  for (const candidate of buildFallbackCandidates(params)) {
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

  return null
}

function getToolSchema(tool: any) {
  const schema = tool?.parameters ?? tool?.inputSchema
  if (schema && typeof schema === 'object') return schema
  return { type: 'object', properties: {} }
}

function parseToolArgs(raw: string): ParsedToolArgs {
  const trimmed = raw.trim()
  if (!trimmed) return { args: {} }
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { args: parsed as Record<string, any> }
    }
    return { args: { value: parsed }, parseError: 'Argumentos no son un objeto.' }
  } catch (error: any) {
    return { args: { _raw: trimmed }, parseError: error?.message || 'JSON parse error.' }
  }
}

function normalizeForJson(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) return value ?? null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (depth >= 5) return '[MaxDepth]'
  if (Array.isArray(value)) return value.slice(0, 50).map(item => normalizeForJson(item, depth + 1, seen))
  if (typeof value === 'object') {
    if (seen.has(value as object)) return '[Circular]'
    seen.add(value as object)
    const out: Record<string, unknown> = {}
    for (const [key, nested] of Object.entries(value as Record<string, unknown>).slice(0, 50)) {
      out[key] = normalizeForJson(nested, depth + 1, seen)
    }
    return out
  }
  return String(value)
}

function stableStringify(value: unknown) {
  try { return JSON.stringify(normalizeForJson(value)) } catch { return JSON.stringify(String(value)) }
}

function toPreviewString(value: unknown, maxChars = 1200) {
  const text = stableStringify(value)
  return text.length <= maxChars ? text : `${text.slice(0, maxChars)}…`
}

function summarizeToolResult(toolName: string, value: unknown, ok: boolean) {
  if (!ok) return `Error en ${toolName}: ${String(value).slice(0, 220)}`
  if (typeof value === 'string') return `${toolName}: ${value.replace(/\s+/g, ' ').slice(0, 220)}`
  return `${toolName}: resultado exitoso`
}

function storeToolArtifact(artifactId: string, toolName: string, args: Record<string, any>, result: unknown, ok: boolean) {
  toolArtifactStore.set(artifactId, { createdAt: Date.now(), toolName, args, result, ok })
  if (toolArtifactStore.size > TOOL_ARTIFACT_LIMIT) {
    const oldestKey = toolArtifactStore.keys().next().value
    if (oldestKey) toolArtifactStore.delete(oldestKey)
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
    reinjectedContent: JSON.stringify({ ok, tool: toolCall.name, summary, artifactId, preview }, null, 2),
    signature: stableStringify({ toolName: toolCall.name, args: toolCall.args, ok, preview }),
  }
}

function finalizeOpenAIToolCalls(
  toolCallsByIndex: Record<number, { id: string; name: string; args: string }>,
  emitChunk: ChatChunkEmitter
) {
  return Object.keys(toolCallsByIndex)
    .map(Number)
    .sort((a, b) => a - b)
    .map(index => {
      const toolCall = toolCallsByIndex[index]
      const parsed = parseToolArgs(toolCall.args)
      emitChunk({ type: 'tool_call_end', toolCallId: toolCall.id, toolArgs: parsed.args })
      return { id: toolCall.id, name: toolCall.name, argsText: toolCall.args, args: parsed.args, parseError: parsed.parseError } as CollectedToolCall
    })
}

async function executeOneTool(toolCall: CollectedToolCall, emitChunk: ChatChunkEmitter, signal: AbortSignal) {
  if (signal.aborted) throw new Error('Aborted')
  if (toolCall.parseError) {
    const record = buildToolExecutionRecord(toolCall, { error: toolCall.parseError }, false)
    emitChunk({ type: 'tool_result', toolCallId: toolCall.id, toolName: toolCall.name, toolStatus: 'error', toolSummary: record.summary, toolResultPreview: record.preview, toolArtifactId: record.artifactId })
    return record
  }
  try {
    const rawResult = await callRealTool(toolCall.name, toolCall.args)
    const ok = !(rawResult && typeof rawResult === 'object' && 'error' in rawResult)
    const record = buildToolExecutionRecord(toolCall, rawResult, ok)
    emitChunk({ type: 'tool_result', toolCallId: toolCall.id, toolName: toolCall.name, toolStatus: ok ? 'done' : 'error', toolSummary: record.summary, toolResultPreview: record.preview, toolArtifactId: record.artifactId })
    return record
  } catch (error: any) {
    const record = buildToolExecutionRecord(toolCall, { error: error?.message || 'Tool execution error' }, false)
    emitChunk({ type: 'tool_result', toolCallId: toolCall.id, toolName: toolCall.name, toolStatus: 'error', toolSummary: record.summary, toolResultPreview: record.preview, toolArtifactId: record.artifactId })
    return record
  }
}

async function streamOpenAICompatTurn(
  provider: string,
  params: any,
  emitChunk: ChatChunkEmitter,
  signal: AbortSignal
): Promise<LLMTurnResult> {
  const apiKey = getSecret(provider)
  const baseUrl = params.baseUrl || PROVIDER_URLS[provider] || PROVIDER_URLS.openai
  const headers = getProviderHeaders(provider, apiKey || '')

  const body: any = {
    model: params.model,
    messages: params.messages,
    stream: true,
    max_tokens: params.maxTokens || 4096,
  }

  if (params.tools?.length) {
    body.tools = params.tools.map((tool: any) => ({
      type: 'function',
      function: { name: tool.name, description: tool.description, parameters: getToolSchema(tool) },
    }))
    body.tool_choice = 'auto'
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    const errorText = await res.text()
    const fallback = resolveProviderFallback(provider, params, res.status, errorText)
    if (fallback) {
      emitChunk({ type: 'provider_fallback', fromProvider: provider, fromModel: String(params.model), toProvider: fallback.provider, toModel: String(fallback.params.model), fallbackReason: fallback.reason })
      return streamOpenAICompatTurn(fallback.provider, fallback.params, emitChunk, signal)
    }
    throw new Error(`${provider} ${res.status}: ${errorText.slice(0, 200)}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('No reader')
  const decoder = new TextDecoder()
  let buffer = '', text = ''
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
      if (data === '[DONE]') break
      try {
        const event = JSON.parse(data)
        const delta = event.choices?.[0]?.delta
        if (delta?.content) {
          text += delta.content
          emitChunk({ type: 'text', text: delta.content })
        }
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0
            if (!toolCallsByIndex[idx]) {
              toolCallsByIndex[idx] = { id: tc.id || `tc_${idx}`, name: tc.function?.name || '', args: '' }
              emitChunk({ type: 'tool_call_start', toolCallId: toolCallsByIndex[idx].id, toolName: toolCallsByIndex[idx].name })
            } else if (!toolCallsByIndex[idx].name && tc.function?.name) {
              toolCallsByIndex[idx].name = tc.function.name
              // Update name in renderer too
              emitChunk({ type: 'tool_call_start', toolCallId: toolCallsByIndex[idx].id, toolName: tc.function.name })
            }

            if (tc.function?.arguments) {
              toolCallsByIndex[idx].args += tc.function.arguments
              emitChunk({ type: 'tool_call_delta', toolCallId: toolCallsByIndex[idx].id, toolArgsDelta: tc.function.arguments })
            }
          }
        }
      } catch {}
    }
  }

  return { text, toolCalls: finalizeOpenAIToolCalls(toolCallsByIndex, emitChunk) }
}

export async function runAgenticLoop(provider: string, params: any, emitChunk: ChatChunkEmitter, signal: AbortSignal) {
  params.messages = Array.isArray(params.messages) ? params.messages : []
  let turns = 0
  const MAX_TURNS = 10
  let previousLoopSignature: string | null = null

  while (turns < MAX_TURNS) {
    turns++
    const turn = await streamOpenAICompatTurn(provider, params, emitChunk, signal)

    if (turn.toolCalls.length === 0) return

    params.messages.push({
      role: 'assistant',
      content: turn.text || '',
      tool_calls: turn.toolCalls.map(tc => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: tc.argsText }
      }))
    })

    const results = []
    for (const tc of turn.toolCalls) {
      const res = await executeOneTool(tc, emitChunk, signal)
      results.push(res)
      params.messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        name: tc.name,
        content: res.reinjectedContent
      })
    }

    // Loop detection
    const currentSignature = JSON.stringify(turn.toolCalls.map(tc => ({ n: tc.name, a: tc.args })))
    if (!turn.text && currentSignature === previousLoopSignature) {
      emitChunk({ type: 'text', text: '\n[Bucle detectado - Deteniendo ejecución autónoma]' })
      return
    }
    previousLoopSignature = turn.text ? null : currentSignature
  }

  if (turns >= MAX_TURNS) {
    emitChunk({ type: 'text', text: '\n[Límite de turnos alcanzado]' })
  }
}

export function attachChatRuntimeHandlers(ipcMain: IpcMain, win: BrowserWindow) {
  const emitChunk: ChatChunkEmitter = (chunk) => win.webContents.send('chat:chunk', chunk)
  ipcMain.handle('chat:send', async (_e, params: any) => {
    currentAbortController = new AbortController()
    try {
      const provider = params.provider || 'g4f'
      const laneId = inferLaneFromSelection(provider, params.model)
      emitChunk({ type: 'turn_trace', ...createEmptyTurnTrace(laneId, provider, String(params.model), false) })
      await runAgenticLoop(provider, cloneChatParams(params), emitChunk, currentAbortController.signal)
      emitChunk({ type: 'done' })
    } catch (error: any) {
      if (error?.name !== 'AbortError') emitChunk({ type: 'error', error: error?.message || 'Chat error' })
    } finally { currentAbortController = null }
  })
  ipcMain.handle('chat:abort', () => {
    currentAbortController?.abort()
    currentAbortController = null
  })
}
