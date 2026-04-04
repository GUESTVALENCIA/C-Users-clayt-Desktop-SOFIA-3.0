import type { IpcMain } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { getSecret } from './settings.ipc'

export type ToolDescriptor = Record<string, any> & {
  name: string
  source?: string
  server?: string
}

export interface DynamicToolCatalogStatus {
  dynamic: boolean
  tools: number
  sources: Record<string, number>
  nativeContractRevalidated: boolean
  fallbackUsed: boolean
}

type CatalogCache = {
  tools: ToolDescriptor[]
  timestamp: number
}

type OpenRouterCatalogModel = {
  id: string
  name: string
  contextLength: number
  supportsTools: boolean
  supportsVision: boolean
  inputPricePerM: number
  outputPricePerM: number
  isFree: boolean
}

const MCP_LOCAL_URL = 'http://127.0.0.1:8100'
const PWA_BRIDGE_URL = 'http://127.0.0.1:3001'
const SUBAGENTS_URL = 'http://127.0.0.1:8089'
const G4F_URL = 'http://127.0.0.1:8082'

const PUBLIC_API_ROOT = resolve(process.cwd(), 'resources', 'public-api-library')
const PUBLIC_API_CAPABILITY_REGISTRY_PATH = resolve(PUBLIC_API_ROOT, 'public-api-capability-registry.json')

const DEFAULT_GENERATED_MEDIA_DIR = resolve(process.env.USERPROFILE || 'C:\\Users\\clayt', 'Desktop', 'generated_media')
const LEGACY_G4F_ROOT = resolve(process.env.USERPROFILE || 'C:\\Users\\clayt', 'Desktop', 'SOFÍA AI', 'sofia-ai')
const LEGACY_G4F_POLLINATIONS_FILES = [
  resolve(LEGACY_G4F_ROOT, 'g4f-data', 'har_and_cookies', 'models', '2026-03-01', 'https_gen.pollinations.ai_text_models.json'),
  resolve(LEGACY_G4F_ROOT, 'g4f-data', 'har_and_cookies', 'models', '2026-03-01', 'https_g4f.space_api_pollinations_models.json'),
  resolve(LEGACY_G4F_ROOT, 'g4f-data', 'har_and_cookies', 'models', '2026-02-28', 'https_gen.pollinations.ai_text_models.json'),
  resolve(LEGACY_G4F_ROOT, 'g4f-data', 'har_and_cookies', 'models', '2026-02-28', 'https_g4f.space_api_pollinations_models.json'),
]

const TOOL_CACHE_TTL_MS = 5000
let mcpRequestId = 1
let dynamicToolCatalogCache: CatalogCache | null = null
let openRouterCatalogCache: { models: OpenRouterCatalogModel[]; timestamp: number } | null = null

function readLocalJson<T = any>(path: string): T | null {
  try {
    return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) as T : null
  } catch {
    return null
  }
}

function summarizeRegistryPayload(payload: any, path: string, fallback: Record<string, any>) {
  return payload
    ? { ok: true, path, ...payload }
    : { ok: false, path, ...fallback }
}

function asFlag(value: unknown) {
  return value === true || value === 1 || value === '1'
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)))
}

function readLegacyPollinationsCatalog() {
  for (const file of LEGACY_G4F_POLLINATIONS_FILES) {
    const payload = readLocalJson(file)
    if (payload && (Array.isArray(payload.image_models) || Array.isArray(payload.video_models) || payload.audio_models)) {
      return payload
    }
  }

  return null
}

async function fetchG4FModelCatalog() {
  try {
    const payload = await (await fetch(`${G4F_URL}/v1/models`, { signal: AbortSignal.timeout(10000) })).json()
    return Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
  } catch {
    return []
  }
}

function parseOpenRouterPricePerM(value: unknown) {
  const numeric = Number(value || 0)
  return Number.isFinite(numeric) ? numeric * 1_000_000 : 0
}

function normalizeOpenRouterModelName(name: unknown, id: unknown) {
  const rawName = String(name || id || 'Modelo sin nombre').trim()
  return rawName.replace(/^[^:]+:\s*/, '').trim()
}

function isOpenRouterChatModel(entry: any) {
  const inputModalities = Array.isArray(entry?.architecture?.input_modalities)
    ? entry.architecture.input_modalities.map((value: unknown) => String(value))
    : []
  const outputModalities = Array.isArray(entry?.architecture?.output_modalities)
    ? entry.architecture.output_modalities.map((value: unknown) => String(value))
    : []

  const acceptsText = inputModalities.length === 0 || inputModalities.includes('text')
  const outputsText = outputModalities.length === 0 || outputModalities.includes('text')
  return acceptsText && outputsText
}

async function fetchOpenRouterModelCatalog() {
  const now = Date.now()
  if (openRouterCatalogCache && now - openRouterCatalogCache.timestamp < 60_000) {
    return openRouterCatalogCache.models
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      signal: AbortSignal.timeout(20_000),
      headers: { Accept: 'application/json' },
    })
    const payload = await response.json()
    const sourceModels = Array.isArray(payload?.data) ? payload.data : []

    const models: OpenRouterCatalogModel[] = sourceModels
      .filter(isOpenRouterChatModel)
      .map((entry: any) => {
        const supportedParameters = Array.isArray(entry?.supported_parameters)
          ? entry.supported_parameters.map((value: unknown) => String(value))
          : []
        const inputModalities = Array.isArray(entry?.architecture?.input_modalities)
          ? entry.architecture.input_modalities.map((value: unknown) => String(value))
          : []
        const outputModalities = Array.isArray(entry?.architecture?.output_modalities)
          ? entry.architecture.output_modalities.map((value: unknown) => String(value))
          : []
        const inputPricePerM = parseOpenRouterPricePerM(entry?.pricing?.prompt)
        const outputPricePerM = parseOpenRouterPricePerM(entry?.pricing?.completion)

        return {
          id: String(entry?.id || ''),
          name: normalizeOpenRouterModelName(entry?.name, entry?.id),
          contextLength: Number(entry?.context_length || entry?.top_provider?.context_length || 128000),
          supportsTools: supportedParameters.includes('tools') || supportedParameters.includes('tool_choice'),
          supportsVision: inputModalities.includes('image') || inputModalities.includes('video') || outputModalities.includes('image'),
          inputPricePerM,
          outputPricePerM,
          isFree: inputPricePerM === 0 && outputPricePerM === 0,
        }
      })
      .filter((entry) => entry.id)
      .sort((left, right) => {
        if (left.isFree !== right.isFree) return left.isFree ? -1 : 1
        const leftTotal = left.inputPricePerM + left.outputPricePerM
        const rightTotal = right.inputPricePerM + right.outputPricePerM
        if (leftTotal !== rightTotal) return leftTotal - rightTotal
        return left.name.localeCompare(right.name)
      })

    openRouterCatalogCache = { models, timestamp: now }
    return models
  } catch {
    return openRouterCatalogCache?.models || []
  }
}

function buildLegacyFreeMediaModels() {
  const catalog = readLegacyPollinationsCatalog()
  if (!catalog) return []

  const imageModels = uniqueStrings([
    ...(catalog.image_models ?? []),
    'flux',
    'flux-klein',
    'flux-klein-9b',
    'kontext',
    'seedream',
    'seedream-pro',
    'nanobanana',
    'nanobanana-pro',
    'imagen',
    'gpt-image',
    'gpt-image-1.5',
  ])

  const videoModels = uniqueStrings([
    ...(catalog.video_models ?? []),
    'veo-3.1-fast',
    'seedance',
    'seedance-pro',
    'wan2.6',
    'ltx2',
    'grok-imagine-video',
  ])

  const audioModels = catalog.audio_models && typeof catalog.audio_models === 'object'
    ? Object.keys(catalog.audio_models)
    : []

  const models = new Map<string, { name: string; image: boolean; video: boolean; audio: boolean; vision: boolean; providers: string[] }>()

  for (const model of imageModels) {
    models.set(model, {
      name: model,
      image: true,
      video: false,
      audio: false,
      vision: false,
      providers: ['ApiAirforce', 'Yqcloud'],
    })
  }

  for (const model of videoModels) {
    const existing = models.get(model)
    if (existing) {
      existing.video = true
    } else {
      models.set(model, {
        name: model,
        image: false,
        video: true,
        audio: false,
        vision: false,
        providers: ['ApiAirforce', 'Yqcloud'],
      })
    }
  }

  for (const model of audioModels) {
    const existing = models.get(model)
    if (existing) {
      existing.audio = true
    } else {
      models.set(model, {
        name: model,
        image: false,
        video: false,
        audio: true,
        vision: false,
        providers: ['ApiAirforce', 'Yqcloud'],
      })
    }
  }

  return Array.from(models.values())
}

function buildGlobalTextModels(models: any[]) {
  return models
    .filter((entry) => !asFlag(entry.provider))
    .map((entry) => ({
      name: entry.name ?? entry.id ?? 'sin-modelo',
      image: asFlag(entry.image),
      video: asFlag(entry.video),
      audio: asFlag(entry.audio),
      vision: asFlag(entry.vision),
      providers: [] as string[],
    }))
}

function isPreferredFreeProvider(providerName: string) {
  return providerName === 'ApiAirforce' || providerName === 'Yqcloud'
}

function isReserveProvider(providerName: string) {
  return providerName === 'PollinationsAI' || providerName === 'PollinationsImage'
}

function isSyntheticAutoProvider(providerName: string) {
  return providerName === 'G4F Auto'
}

function buildG4FProviders(models: any[]) {
  const providerEntries = models.filter((entry) => asFlag(entry.provider))
  const legacyMediaModels = buildLegacyFreeMediaModels()

  const providers = providerEntries.map((entry) => {
    const providerName = entry.id ?? entry.name ?? 'unknown'
    const preferredFree = isPreferredFreeProvider(providerName)
    const reserveProvider = isReserveProvider(providerName)

    return {
      name: providerName,
      label: entry.owned_by || providerName,
      live: !reserveProvider,
      image: preferredFree ? legacyMediaModels.filter((model) => model.image).length : Number(asFlag(entry.image)),
      video: preferredFree ? legacyMediaModels.filter((model) => model.video).length : 0,
      audio: preferredFree ? legacyMediaModels.filter((model) => model.audio).length : 0,
      vision: asFlag(entry.vision) || preferredFree,
    }
  })

  providers.push({
    name: 'G4F Auto',
    label: 'G4F Auto',
    live: true,
    image: legacyMediaModels.filter((model) => model.image).length,
    video: legacyMediaModels.filter((model) => model.video).length,
    audio: legacyMediaModels.filter((model) => model.audio).length,
    vision: true,
  })

  return providers.sort((left, right) => {
    if (isSyntheticAutoProvider(left.name) !== isSyntheticAutoProvider(right.name)) {
      return isSyntheticAutoProvider(left.name) ? -1 : 1
    }
    if (isPreferredFreeProvider(left.name) !== isPreferredFreeProvider(right.name)) {
      return isPreferredFreeProvider(left.name) ? -1 : 1
    }
    if (isReserveProvider(left.name) !== isReserveProvider(right.name)) {
      return isReserveProvider(left.name) ? 1 : -1
    }
    return left.label.localeCompare(right.label)
  })
}

function buildProviderScopedModels(providerName: string, models: any[]) {
  const textModels = buildGlobalTextModels(models).filter((model) => !model.image && !model.video && !model.audio)
  const legacyMediaModels = buildLegacyFreeMediaModels()
  const catalog = new Map<string, { name: string; image: boolean; video: boolean; audio: boolean; vision: boolean; providers: string[] }>()

  for (const model of textModels) {
    catalog.set(model.name, { ...model, providers: [] })
  }

  if (isPreferredFreeProvider(providerName) || isSyntheticAutoProvider(providerName)) {
    for (const model of legacyMediaModels) {
      const existing = catalog.get(model.name)
      if (!existing) {
        catalog.set(model.name, {
          ...model,
          providers: isSyntheticAutoProvider(providerName)
            ? ['G4F Auto', ...(model.providers ?? [])]
            : [...(model.providers ?? [])],
        })
        continue
      }

      existing.image = existing.image || model.image
      existing.video = existing.video || model.video
      existing.audio = existing.audio || model.audio
      existing.vision = existing.vision || model.vision
      existing.providers = uniqueStrings([
        ...(existing.providers ?? []),
        ...(isSyntheticAutoProvider(providerName) ? ['G4F Auto'] : []),
        ...(model.providers ?? []),
      ])
    }
  }

  return Array.from(catalog.values()).sort((left, right) => left.name.localeCompare(right.name))
}

function sleep(ms: number) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms))
}

function sanitizeMediaToken(value: string | null | undefined, fallback = 'media') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback
}

function guessExtensionFromUrl(url: string, fallback: string) {
  return String(url || '').match(/\.([a-z0-9]{2,5})(?:[?#].*)?$/i)?.[1]?.toLowerCase() || fallback
}

function buildMediaFilename(kind: string, model: string, extension: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `${kind}-${sanitizeMediaToken(model, 'auto')}-${stamp}.${extension}`
}

async function fetchJson(url: string, init: RequestInit, timeoutMs: number) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
  const text = await response.text()
  let data: any = null

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  return { ok: response.ok, status: response.status, data, text }
}

async function downloadMediaFile(url: string, targetDir: string, filename: string) {
  mkdirSync(targetDir, { recursive: true })

  const response = await fetch(url, { signal: AbortSignal.timeout(300000) })
  if (!response.ok) {
    throw new Error(`Download failed with HTTP ${response.status}`)
  }

  const outputPath = join(targetDir, filename)
  writeFileSync(outputPath, Buffer.from(await response.arrayBuffer()))
  return outputPath
}

function buildProviderAttempts(provider: string | null | undefined) {
  const preferredProvider = String(provider || '').trim()
  const seen = new Set<string>()
  const attempts: Array<string | null> = []

  const addAttempt = (candidate: string | null) => {
    const key = candidate || '__auto__'
    if (seen.has(key)) return
    seen.add(key)
    attempts.push(candidate)
  }

  if (preferredProvider && preferredProvider.toLowerCase() !== 'auto') {
    addAttempt(preferredProvider)
  }

  addAttempt(null)

  if (preferredProvider === 'ApiAirforce') addAttempt('Yqcloud')
  if (preferredProvider === 'Yqcloud') addAttempt('ApiAirforce')

  return attempts
}

function buildImageFallbackUrl(prompt: string, model: string | null | undefined) {
  const normalizedModel = sanitizeMediaToken(model, '')
  const reserveModel = uniqueStrings([
    normalizedModel === 'nanobanana' || normalizedModel === 'seedream' || normalizedModel === 'flux-pro'
      ? model
      : null,
    'nanobanana',
    'seedream',
    'flux-pro',
  ])[0] || 'nanobanana'

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=${encodeURIComponent(reserveModel)}&width=1024&height=1024&nologo=true`
}

async function generateImageWithG4F(args: Record<string, any>) {
  const prompt = String(args.prompt || args.description || '').trim()
  if (!prompt) {
    return { success: false, error: 'Missing prompt' }
  }

  const targetDir = String(args.targetDir || DEFAULT_GENERATED_MEDIA_DIR)
  const model = String(args.model || 'flux')
  const attempts = buildProviderAttempts(args.provider)
  const notes: string[] = []

  // Priorizar G4F Proxy v2 en :8080 si G4F_URL apunta ahí, o usar :8080 directamente
  const IMAGE_API = `http://127.0.0.1:8080/v1/images/generations`

  for (const provider of attempts) {
    try {
      const payload: Record<string, any> = {
        prompt,
        model,
        response_format: 'url',
      }

      if (provider) {
        payload.provider = provider
      }

      const response = await fetchJson(IMAGE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, 180000)

      if (!response.ok) {
        notes.push(`${provider || 'auto'}:${response.data?.error?.message || response.text || response.status}`)
        continue
      }

      const mediaUrl = response.data?.data?.[0]?.url || response.data?.url
      if (!mediaUrl) {
        notes.push(`${provider || 'auto'}:media-without-url`)
        continue
      }

      const filename = buildMediaFilename('image', model, guessExtensionFromUrl(mediaUrl, 'webp'))
      const savedPath = await downloadMediaFile(mediaUrl, targetDir, filename)

      return {
        success: true,
        kind: 'image',
        prompt,
        provider: response.data?.provider || provider || 'auto',
        model: response.data?.model || model,
        url: mediaUrl,
        savedPath,
        filename,
      }
    } catch (error: any) {
      notes.push(`${provider || 'auto'}:${error.message}`)
    }
  }

  try {
    const reserveUrl = buildImageFallbackUrl(prompt, model)
    const filename = buildMediaFilename('image', model || 'nanobanana', guessExtensionFromUrl(reserveUrl, 'png'))
    const savedPath = await downloadMediaFile(reserveUrl, targetDir, filename)

    return {
      success: true,
      kind: 'image',
      prompt,
      provider: 'PollinationsAI',
      model: model || 'nanobanana',
      url: reserveUrl,
      savedPath,
      filename,
      degraded: true,
      note: notes.join(' | '),
    }
  } catch (error: any) {
    notes.push(`reserve:${error.message}`)
  }

  return { success: false, error: `G4F image pipeline failed: ${notes.join(' | ') || 'no-response'}` }
}

async function generateVideoWithG4F(args: Record<string, any>) {
  const prompt = String(args.prompt || args.description || '').trim()
  if (!prompt) {
    return { success: false, error: 'Missing prompt' }
  }

  const targetDir = String(args.targetDir || DEFAULT_GENERATED_MEDIA_DIR)
  const model = String(args.model || 'veo-3.1-fast')
  const attempts = buildProviderAttempts(args.provider)
  const notes: string[] = []

  // Usar G4F Proxy v2 en :8080
  const VIDEO_API = `http://127.0.0.1:8080/v1/media/generate`

  for (const provider of attempts) {
    try {
      const payload: Record<string, any> = {
        prompt,
        model,
        response_format: 'url',
      }

      if (provider) {
        payload.provider = provider
      }

      const response = await fetchJson(VIDEO_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, 300000)

      if (!response.ok) {
        notes.push(`${provider || 'auto'}:${response.data?.error?.message || response.text || response.status}`)
        continue
      }

      const mediaUrl = response.data?.data?.[0]?.url || response.data?.video?.url || response.data?.url
      if (!mediaUrl) {
        notes.push(`${provider || 'auto'}:media-without-url`)
        continue
      }

      const filename = buildMediaFilename('video', model, guessExtensionFromUrl(mediaUrl, 'mp4'))
      const savedPath = await downloadMediaFile(mediaUrl, targetDir, filename)

      return {
        success: true,
        kind: 'video',
        prompt,
        provider: response.data?.provider || provider || 'auto',
        model: response.data?.model || model,
        url: mediaUrl,
        savedPath,
        filename,
      }
    } catch (error: any) {
      notes.push(`${provider || 'auto'}:${error.message}`)
    }
  }

  return { success: false, error: `G4F video pipeline failed: ${notes.join(' | ') || 'no-response'}` }
}

async function generateAudioWithDeepgram(args: Record<string, any>) {
  const text = String(args.text || args.input || args.prompt || '').trim()
  if (!text) {
    return { success: false, error: 'Missing text' }
  }

  const apiKey = getSecret('deepgram')
  if (!apiKey) {
    return { success: false, error: 'Deepgram key not configured' }
  }

  const voice = String(args.voice || 'aura-2-carina-es')
  const targetDir = String(args.targetDir || DEFAULT_GENERATED_MEDIA_DIR)

  try {
    const response = await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voice)}&encoding=mp3`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      return { success: false, error: `Deepgram TTS failed with HTTP ${response.status}` }
    }

    mkdirSync(targetDir, { recursive: true })
    const filename = buildMediaFilename('audio', voice, 'mp3')
    const savedPath = join(targetDir, filename)
    writeFileSync(savedPath, Buffer.from(await response.arrayBuffer()))

    return {
      success: true,
      kind: 'audio',
      voice,
      text,
      savedPath,
      filename,
      provider: 'Deepgram',
      model: voice,
    }
  } catch (error: any) {
    return { success: false, error: `Deepgram TTS error: ${error.message}` }
  }
}

async function mcpRequest(method: string, params?: Record<string, any>) {
  const id = mcpRequestId++

  try {
    const response = await fetch(`${MCP_LOCAL_URL}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) return null

    const payload = await response.json()
    return payload.result ?? null
  } catch {
    return null
  }
}

async function checkPort(url: string, path = '/health') {
  try {
    return (await fetch(`${url}${path}`, { signal: AbortSignal.timeout(2000) })).ok
  } catch {
    try {
      return (await fetch(url, { signal: AbortSignal.timeout(2000) })).status < 500
    } catch {
      return false
    }
  }
}

function normalizeToolPayload(payload: any): ToolDescriptor[] {
  if (!payload) return []
  if (Array.isArray(payload.tools)) return payload.tools as ToolDescriptor[]
  if (Array.isArray(payload)) return payload as ToolDescriptor[]
  return []
}


const LOCAL_RUNTIME_TOOLS: ToolDescriptor[] = [
  {
    name: 'capture_screen',
    description: 'Capturar screenshot de la pantalla actual',
    inputSchema: { type: 'object', properties: { region: { type: 'object' } } },
  },
  {
    name: 'execute_desktop',
    description: 'Controlar raton y teclado del equipo (Computer Use)',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['click', 'move', 'type', 'key', 'scroll', 'drag'] },
        x: { type: 'number' },
        y: { type: 'number' },
        text: { type: 'string' },
        key: { type: 'string' },
      },
      required: ['action'],
    },
  },
  {
    name: 'execute_command',
    description: 'Ejecutar comando de sistema/shell',
    inputSchema: {
      type: 'object',
      properties: { command: { type: 'string' }, cwd: { type: 'string' } },
      required: ['command'],
    },
  },
  {
    name: 'execute_code',
    description: 'Ejecutar codigo Python, Bash o PowerShell',
    inputSchema: {
      type: 'object',
      properties: {
        language: { type: 'string', enum: ['python', 'bash', 'powershell', 'javascript'] },
        code: { type: 'string' },
      },
      required: ['language', 'code'],
    },
  },
  {
    name: 'generate_image',
    description: 'Generar imagen desde texto (G4F)',
    inputSchema: {
      type: 'object',
      properties: { prompt: { type: 'string' }, size: { type: 'string' } },
      required: ['prompt'],
    },
  },
  {
    name: 'generate_video',
    description: 'Generar video desde texto',
    inputSchema: {
      type: 'object',
      properties: { prompt: { type: 'string' } },
      required: ['prompt'],
    },
  },
  {
    name: 'generate_audio',
    description: 'Sintesis de voz (TTS)',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string' }, voice: { type: 'string' } },
      required: ['text'],
    },
  },
  {
    name: 'avatar_call',
    description: 'Inicia el pipeline completo de avatar: genera imagen estatica y luego video con transicion fluida.',
    inputSchema: {
      type: 'object',
      properties: { prompt: { type: 'string', description: 'Descripcion del entorno y apariencia del avatar' } },
      required: ['prompt'],
    },
  },
]

function attachSource(tools: ToolDescriptor[], source: string) {
  return tools.map((tool) => ({
    ...tool,
    source: tool?.source || source,
  }))
}

function mergeToolCatalogs(...catalogs: ToolDescriptor[][]) {
  const merged: ToolDescriptor[] = []
  const seen = new Set<string>()

  for (const catalog of catalogs) {
    for (const tool of catalog) {
      const name = String(tool?.name || tool?.id || '').trim()
      if (!name) continue
      const server = String(tool?.server || '').trim()
      const source = String(tool?.source || '').trim()
      const fingerprint = `${server || source || 'unknown'}::${name}`
      if (seen.has(fingerprint)) continue
      seen.add(fingerprint)
      merged.push(tool)
    }
  }

  return merged
}

function isRecursiveElectronTool(tool: ToolDescriptor) {
  const server = String(tool?.server || '').trim().toLowerCase()
  const source = String(tool?.source || '').trim().toLowerCase()
  return server === 'electron-mcp' || source === 'electron-local'
}

async function fetchMcpLocalTools() {
  try {
    const response = await fetchJson(`${MCP_LOCAL_URL}/list-tools`, {}, 3000)
    if (!response.ok || !response.data) return []
    return normalizeToolPayload(response.data)
  } catch {
    return []
  }
}

async function fetchRealTools() {
  const mcpLocalTools = await fetchMcpLocalTools()

  const mergedTools = mergeToolCatalogs(
    attachSource(mcpLocalTools, 'mcp-8100'),
    attachSource(LOCAL_RUNTIME_TOOLS, 'electron-local'),
  )

  return mergedTools.length > 0
    ? mergedTools
    : attachSource(LOCAL_RUNTIME_TOOLS, 'electron-local')
}

function summarizeToolsBySource(tools: ToolDescriptor[]) {
  const counts: Record<string, number> = {}

  for (const tool of tools) {
    const source = String(tool?.source || tool?.server || 'unknown')
    counts[source] = (counts[source] || 0) + 1
  }

  return counts
}

function isLocalOnlyCatalog(tools: ToolDescriptor[]) {
  const sources = Object.keys(summarizeToolsBySource(tools))
  return sources.length === 0 || sources.every((source) => source === 'electron-local')
}

export async function fetchDynamicToolCatalog(): Promise<ToolDescriptor[]> {
  if (dynamicToolCatalogCache && Date.now() - dynamicToolCatalogCache.timestamp < TOOL_CACHE_TTL_MS) {
    return dynamicToolCatalogCache.tools
  }

  const tools = await fetchRealTools()
  dynamicToolCatalogCache = { tools, timestamp: Date.now() }
  return tools
}

export async function getDynamicToolCatalogStatus(): Promise<DynamicToolCatalogStatus> {
  try {
    const tools = await fetchDynamicToolCatalog()
    const sources = summarizeToolsBySource(tools)
    const fallbackUsed = isLocalOnlyCatalog(tools)
    return {
      dynamic: !fallbackUsed,
      tools: tools.length,
      sources,
      nativeContractRevalidated: false,
      fallbackUsed,
    }
  } catch {
    return {
      dynamic: false,
      tools: LOCAL_RUNTIME_TOOLS.length,
      sources: { 'electron-local': LOCAL_RUNTIME_TOOLS.length },
      nativeContractRevalidated: false,
      fallbackUsed: true,
    }
  }
}

async function getRuntimeHealthSnapshot() {
  const [g4fAlive, tools] = await Promise.all([
    checkPort(G4F_URL, '/v1/models'),
    fetchDynamicToolCatalog(),
  ])

  return {
    generatedAt: new Date().toISOString(),
    g4f: { alive: g4fAlive, url: G4F_URL },
    tools: {
      total: tools.length,
      bySource: summarizeToolsBySource(tools),
      sample: tools.slice(0, 24).map((tool) => ({
        name: String(tool?.name || 'unknown'),
        source: String(tool?.source || tool?.server || 'unknown'),
      })),
    },
  }
}

export async function callRealTool(toolName: string, args: Record<string, any>) {
  if (toolName === 'avatar_call') {
    // Pipeline automático: Imagen -> Video
    const imageResult = await generateImageWithG4F({
      prompt: args.prompt || 'Professional woman in a minimalist office, hyperrealistic',
      model: 'flux'
    })

    if (!imageResult.success) return imageResult

    const videoResult = await generateVideoWithG4F({
      prompt: `Zoom into the image, natural movement, ${args.prompt}`,
      model: 'veo-3.1-fast'
    })

    return {
      success: videoResult.success,
      image: imageResult.savedPath,
      video: videoResult.savedPath,
      kind: 'avatar_scene'
    }
  }

  if (toolName === 'generate_image') {
    return generateImageWithG4F(args)
  }

  if (toolName === 'generate_video') {
    return generateVideoWithG4F(args)
  }

  if (toolName === 'generate_audio') {
    return generateAudioWithDeepgram(args)
  }

  const mcpResult = await mcpRequest('tools/call', { name: toolName, arguments: args })
  if (mcpResult) {
    return mcpResult?.result ?? mcpResult?.structuredContent ?? mcpResult
  }

  return { error: `Tool '${toolName}' not available` }
}

export const OPENCLAW_TOOLS_KNOWN = [...LOCAL_RUNTIME_TOOLS]

export function registerMcpIPC(ipcMain: IpcMain) {
  ipcMain.handle('mcp:get-servers', async () => {
    const [g4f] = await Promise.allSettled([
      checkPort(G4F_URL, '/v1/models'),
    ])

    const toStatus = (result: PromiseSettledResult<boolean>) => (
      result.status === 'fulfilled' && result.value ? 'connected' : 'disconnected'
    )

    return {
      servers: [
        { id: 'g4f', name: 'G4F (modelos libres)', url: G4F_URL, status: toStatus(g4f), type: 'llm' },
      ],
    }
  })

  ipcMain.handle('mcp:get-tools', async () => {
    const tools = await fetchDynamicToolCatalog()
    return { tools, count: tools.length }
  })

  ipcMain.handle('mcp:get-runtime-health', async () => getRuntimeHealthSnapshot())

  ipcMain.handle('mcp:get-editor-inventory', async () => ({ ok: false, summary: { configsFound: 0, configsScanned: 0, totalServers: 0, context7Detected: [] }, configs: [], servers: [] }))
  ipcMain.handle('mcp:get-openclaw-library', async () => ({ ok: false, generatedAt: null, notes: [], inventory: null, sources: {} }))
  ipcMain.handle('mcp:get-memory-policy', async () => ({ ok: false, generatedAt: null, state: 'missing', lanes: [], forbiddenSharing: [], adapters: [] }))
  ipcMain.handle('mcp:get-openclaw-capability-registry', async () => ({ ok: false, generatedAt: null, summary: { totalCapabilities: 0, activeCount: 0, configuredCount: 0, blockedCount: 0, degradedCount: 0, categories: {} }, entries: [] }))

  ipcMain.handle('mcp:get-public-api-capability-registry', async () => {
    const registry = readLocalJson(PUBLIC_API_CAPABILITY_REGISTRY_PATH)
    return registry
      ? {
          ok: true,
          path: PUBLIC_API_CAPABILITY_REGISTRY_PATH,
          generatedAt: registry.generatedAt,
          preferredMcpServer: registry.preferredMcpServer || null,
          summary: registry.summary || {},
          sampleEntries: Array.isArray(registry.entries) ? registry.entries.slice(0, 12) : [],
        }
      : {
          ok: false,
          path: PUBLIC_API_CAPABILITY_REGISTRY_PATH,
          generatedAt: null,
          preferredMcpServer: null,
          summary: {
            totalEntries: 0,
            usableEntries: 0,
            blockedEntries: 0,
            noiseEntries: 0,
            byClassification: {},
            byCategory: {},
            bySource: {},
            topDomains: [],
          },
          sampleEntries: [],
        }
  })

  ipcMain.handle('mcp:get-knowledge-routing-policy', async () => ({ ok: false, generatedAt: null, identity: 'Sofia', summary: { defaultOrder: [], primaryDataSurface: null, primaryMcpServer: null }, consultationOrder: [], selectionCriteria: [], hardRules: [], intentRules: [] }))
  ipcMain.handle('mcp:get-tool-priority-map', async () => ({ ok: false, generatedAt: null, summary: { preferredServer: null, onlineServers: 0, mappedIntents: 0 }, servers: [], intents: [] }))
  ipcMain.handle('mcp:get-teaching-manifest', async () => ({ ok: false, generatedAt: null, identity: 'Sofia', summary: { promptSections: 0, examples: 0 }, consultationOrder: [], surfaces: {}, examples: [] }))

  ipcMain.handle('mcp:call-tool', async (_event, toolName, args) => callRealTool(toolName, args))
  ipcMain.handle('mcp:connect', async (_event, params) => {
    console.log('[MCP] Connect request:', params)
    return true
  })
  ipcMain.handle('mcp:disconnect', async (_event, params) => {
    console.log('[MCP] Disconnect request:', params)
    return true
  })
  ipcMain.handle('mcp:check-health', async () => {
    const [g4f] = await Promise.allSettled([
      checkPort(G4F_URL, '/v1/models'),
    ])
    return {
      g4f: g4f.status === 'fulfilled' && g4f.value,
      timestamp: new Date().toISOString(),
    }
  })

  ipcMain.handle('g4f:list-providers', async () => {
    try {
      const models = await fetchG4FModelCatalog()
      return { providers: buildG4FProviders(models) }
    } catch {
      return { providers: [] }
    }
  })

  ipcMain.handle('g4f:list-provider-models', async (_event, providerName) => {
    try {
      const models = await fetchG4FModelCatalog()
      return { models: buildProviderScopedModels(providerName, models) }
    } catch {
      return { models: [] }
    }
  })

  ipcMain.handle('g4f:test-providers', async () => {
    const candidates = [
      { provider: 'ApiAirforce', model: 'gpt-4o' },
      { provider: 'Yqcloud', model: 'gpt-4o' },
      { provider: 'OperaAria', model: 'gpt-4o' },
      { provider: 'Perplexity', model: 'gpt-4o' },
      { provider: 'Cerebras', model: 'llama-3.3-70b' },
      { provider: 'DeepInfra', model: 'meta-llama/Meta-Llama-3.1-70B-Instruct' },
      { provider: 'PollinationsAI', model: 'openai' },
      { provider: 'PollinationsAI', model: 'openai-fast' },
    ]

    const results = []

    for (const { provider, model } of candidates) {
      const startedAt = Date.now()
      try {
        const response = await fetch(`${G4F_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            provider,
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 10,
            stream: false,
          }),
          signal: AbortSignal.timeout(15000),
        })

        let snippet = ''
        try {
          snippet = (await response.json())?.choices?.[0]?.message?.content?.slice(0, 60) ?? ''
        } catch {
          snippet = ''
        }

        results.push({
          provider,
          model,
          status: response.status,
          ok: response.ok,
          latencyMs: Date.now() - startedAt,
          response: snippet,
        })
      } catch (error: any) {
        results.push({
          provider,
          model,
          status: 0,
          ok: false,
          error: error.message,
          latencyMs: Date.now() - startedAt,
        })
      }
    }

    return results
  })

  ipcMain.handle('g4f:list-models', async () => {
    try {
      const payload = await (await fetch(`${G4F_URL}/v1/models`, { signal: AbortSignal.timeout(10000) })).json()
      return { models: payload.data ?? payload ?? [] }
    } catch {
      return { models: [] }
    }
  })

  ipcMain.handle('openrouter:list-models', async () => {
    try {
      const models = await fetchOpenRouterModelCatalog()
      return { models }
    } catch {
      return { models: [] }
    }
  })
}
