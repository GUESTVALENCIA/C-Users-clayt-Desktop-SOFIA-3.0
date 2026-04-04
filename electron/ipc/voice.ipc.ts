import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { basename, extname, join, resolve } from 'path'
import { pathToFileURL } from 'url'
import { type IpcMain, type BrowserWindow } from 'electron'
import { getSecret } from './settings.ipc'

let voiceAbortController: AbortController | null = null
const GENERATED_MEDIA_DIR = resolve(process.env.USERPROFILE || 'C:\\Users\\clayt', 'Desktop', 'generated_media')
const CALLBACK_QUEUE_FILE = join(GENERATED_MEDIA_DIR, 'voice-callback-queue.json')
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp'])
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.mkv'])

function ensureGeneratedMediaDir() {
  if (!existsSync(GENERATED_MEDIA_DIR)) {
    mkdirSync(GENERATED_MEDIA_DIR, { recursive: true })
  }
}

function safeJsonRead<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as T
  } catch {
    return fallback
  }
}

function safeJsonWrite(filePath: string, value: unknown) {
  ensureGeneratedMediaDir()
  writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8')
}

function readCallbackQueue() {
  ensureGeneratedMediaDir()
  return safeJsonRead<any[]>(CALLBACK_QUEUE_FILE, [])
}

function writeCallbackQueue(queue: any[]) {
  safeJsonWrite(CALLBACK_QUEUE_FILE, queue)
}

function toFileUrl(filePath: string) {
  return pathToFileURL(filePath).href
}

function scanGeneratedMediaFiles() {
  ensureGeneratedMediaDir()
  return readdirSync(GENERATED_MEDIA_DIR)
    .map(name => {
      const filePath = join(GENERATED_MEDIA_DIR, name)
      const stats = statSync(filePath)
      return {
        name,
        filePath,
        extension: extname(name).toLowerCase(),
        lastModified: stats.mtimeMs,
        size: stats.size,
        isFile: stats.isFile(),
      }
    })
    .filter(entry => entry.isFile)
    .sort((a, b) => b.lastModified - a.lastModified)
}

function listAvatarScenes() {
  const files = scanGeneratedMediaFiles()
  const images = files.filter(file => IMAGE_EXTENSIONS.has(file.extension))
  const videos = files.filter(file => VIDEO_EXTENSIONS.has(file.extension))
  const scenes: any[] = []
  const usedImages = new Set<string>()

  for (const video of videos.slice(0, 8)) {
    const pair = images.find(image => !usedImages.has(image.filePath)) || images[0]
    if (pair) usedImages.add(pair.filePath)
    scenes.push({
      id: `scene-${basename(video.name, video.extension)}`,
      label: basename(video.name, video.extension),
      imagePath: pair?.filePath ?? null,
      imageUrl: pair ? toFileUrl(pair.filePath) : null,
      videoPath: video.filePath,
      videoUrl: toFileUrl(video.filePath),
      updatedAt: Math.max(video.lastModified, pair?.lastModified ?? 0),
      source: 'generated_media',
    })
  }

  if (scenes.length === 0 && images.length > 0) {
    const image = images[0]
    scenes.push({
      id: `scene-${basename(image.name, image.extension)}`,
      label: basename(image.name, image.extension),
      imagePath: image.filePath,
      imageUrl: toFileUrl(image.filePath),
      videoPath: null,
      videoUrl: null,
      updatedAt: image.lastModified,
      source: 'generated_media',
    })
  }

  return scenes.sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt))
}

async function fetchGatewayHealth() {
  try {
    const res = await fetch('http://127.0.0.1:8082/v1/models', { signal: AbortSignal.timeout(2000) })
    return { online: res.ok, details: res.ok ? 'g4f-online' : `g4f-${res.status}` }
  } catch (error: any) {
    return { online: false, details: error?.message || 'g4f-offline' }
  }
}

function normalizeCallback(entry: any) {
  return {
    id: String(entry?.id || `callback-${Date.now()}`),
    actor: String(entry?.actor || 'sandra').toLowerCase() === 'sofia' ? 'sofia' : 'sandra',
    mode: String(entry?.mode || 'voice').toLowerCase() === 'avatar' ? 'avatar' : 'voice',
    reason: String(entry?.reason || entry?.description || 'Seguimiento pendiente').trim(),
    sceneId: entry?.sceneId ? String(entry.sceneId) : null,
    source: String(entry?.source || 'manual'),
    voiceSessionId: entry?.voiceSessionId ? String(entry.voiceSessionId) : null,
    status: String(entry?.status || 'pending'),
    createdAt: Number(entry?.createdAt || Date.now()),
    readyAt: Number(entry?.readyAt || Date.now()),
  }
}

export function registerVoiceIPC(ipcMain: IpcMain, win: BrowserWindow) {
  // Proporcionar clave Deepgram al renderer para STT
  ipcMain.handle('voice:get-deepgram-key', () => {
    return getSecret('deepgram')
  })
  ipcMain.handle('voice:get-runtime-state', async () => {
    const gateway = await fetchGatewayHealth()
    const callbackQueue = readCallbackQueue().map(normalizeCallback)
    const scenes = listAvatarScenes()
    return {
      gatewayOnline: gateway.online,
      gateway: gateway.details,
      deepgramConfigured: Boolean(getSecret('deepgram')),
      generatedMediaDir: GENERATED_MEDIA_DIR,
      callbackQueueSize: callbackQueue.filter(item => item.status !== 'completed' && item.status !== 'dismissed').length,
      avatarSceneCount: scenes.length,
      latestScene: scenes[0] ?? null,
    }
  })

  ipcMain.handle('voice:list-avatar-scenes', async () => {
    return { scenes: listAvatarScenes() }
  })

  ipcMain.handle('voice:list-callbacks', async () => {
    return { callbacks: readCallbackQueue().map(normalizeCallback).sort((a, b) => b.createdAt - a.createdAt) }
  })

  ipcMain.handle('voice:queue-callback', async (_e, request: any) => {
    const queue = readCallbackQueue().map(normalizeCallback)
    const entry = normalizeCallback({
      ...request,
      id: request?.id || `callback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'pending',
      createdAt: Date.now(),
      readyAt: Date.now() + Number(request?.delayMs || 4000),
    })
    queue.unshift(entry)
    writeCallbackQueue(queue)
    return entry
  })

  ipcMain.handle('voice:dequeue-ready-callback', async () => {
    const queue = readCallbackQueue().map(normalizeCallback)
    const next = queue.find(item => item.status === 'pending' && item.readyAt <= Date.now())
    if (!next) return null
    next.status = 'ringing'
    writeCallbackQueue(queue)
    return next
  })

  ipcMain.handle('voice:update-callback-status', async (_e, payload: { id: string; status: string }) => {
    const queue = readCallbackQueue().map(normalizeCallback)
    const target = queue.find(item => item.id === payload.id)
    if (!target) return false
    target.status = String(payload.status || 'completed')
    writeCallbackQueue(queue)
    return true
  })

  // Llamada a LLM para voz — ahora integrada con el motor de agentes y herramientas
  ipcMain.handle('voice:send-to-llm', async (_e, params: any) => {
    voiceAbortController = new AbortController()

    const provider = params.provider || 'g4f'
    const model = params.model || 'gpt-4o'

    const emitChunk = (chunk: any) => {
      win.webContents.send('voice:llm-chunk', chunk)
    }

    try {
      // Inyectar herramientas en la llamada de voz si no están presentes
      if (!params.tools) {
        const { fetchDynamicToolCatalog } = await import('./mcp.ipc')
        params.tools = await fetchDynamicToolCatalog()
      }

      // Reutilizar la lógica de bucle de agentes de chat-runtime
      const { runAgenticLoop } = await import('./chat-runtime')

      // Mapeo de URL base para G4F
      if (provider === 'g4f') {
        params.baseUrl = 'http://localhost:8080/v1'
      }

      await runAgenticLoop(provider, params, emitChunk, voiceAbortController.signal)
      win.webContents.send('voice:llm-chunk', { type: 'done' })
    } catch (e: any) {
      if (e.name === 'AbortError') return
      win.webContents.send('voice:llm-chunk', { type: 'error', error: e.message })
    } finally {
      voiceAbortController = null
    }
  })

  ipcMain.handle('voice:abort-llm', () => {
    voiceAbortController?.abort()
    voiceAbortController = null
  })

  // TTS vía proceso principal (evita 403 desde renderer)
  ipcMain.handle('voice:tts', async (_e, { text }: { text: string }) => {
    const dgKey = getSecret('deepgram')
    if (!dgKey) return null
    try {
      const res = await fetch(
        'https://api.deepgram.com/v1/speak?model=aura-2-carina-es&encoding=mp3',
        {
          method: 'POST',
          headers: { Authorization: `Token ${dgKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        }
      )
      if (!res.ok) {
        console.error(`[TTS] ${res.status}: ${await res.text()}`)
        return null
      }
      const buf = await res.arrayBuffer()
      return Buffer.from(buf).toString('base64')
    } catch (e: any) {
      console.error('[TTS] Error:', e.message)
      return null
    }
  })
}
