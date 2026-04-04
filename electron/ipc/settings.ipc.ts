import type { IpcMain } from 'electron'
import { safeStorage } from '../electron-wrapper.mjs'
import Store from 'electron-store'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const store = new Store({ projectName: 'sofia', name: 'settings' })
const secretStore = new Store({ projectName: 'sofia', name: 'secrets', encryptionKey: 'sofia-3.0-enc' })

// Load .env on first launch
function loadEnvOnFirstLaunch() {
  if (store.get('initialized')) return

  const envPath = join(process.cwd(), '.env')
  if (!existsSync(envPath)) return

  try {
    const envContent = readFileSync(envPath, 'utf-8')
    const lines = envContent.split('\n')

    const keyMap: Record<string, string> = {
      OPENAI_API_KEY: 'openai',
      ANTHROPIC_API_KEY: 'anthropic',
      OPENROUTER_API_KEY: 'openrouter',
      G4F_API_KEY: 'g4f',
      GROQ_API_KEY: 'groq',
      DEEPGRAM_API_KEY: 'deepgram',
      GEMINI_API_KEY: 'gemini',
      DEEPSEEK_API_KEY: 'deepseek',
      XAI_API_KEY: 'xai',
      KIMI_API_KEY: 'kimi',
      QWEN_API_KEY: 'qwen',
      DATABASE_URL: 'neon_url',
      NEON_API_KEY: 'neon_api',
    }

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const envKey = trimmed.slice(0, eqIdx)
      const envVal = trimmed.slice(eqIdx + 1)
      const secretKey = keyMap[envKey]
      if (secretKey && envVal) {
        if (safeStorage.isEncryptionAvailable()) {
          const encrypted = safeStorage.encryptString(envVal).toString('base64')
          secretStore.set(secretKey, encrypted)
        } else {
          secretStore.set(secretKey, envVal)
        }
      }
    }

    store.set('initialized', true)
    console.log('[Settings] Initial credentials loaded from .env')
  } catch (e) {
    console.error('[Settings] Failed to load .env:', e)
  }
}

function getSecret(key: string): string | null {
  const val = secretStore.get(key) as string | undefined
  if (!val) return null
  try {
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(Buffer.from(val, 'base64'))
    }
    return val
  } catch {
    return null
  }
}

function setSecret(key: string, value: string): void {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(value).toString('base64')
    secretStore.set(key, encrypted)
  } else {
    secretStore.set(key, value)
  }
}

export function registerSettingsIPC(ipcMain: IpcMain) {
  loadEnvOnFirstLaunch()

  ipcMain.handle('settings:get', (_e, key: string) => {
    return store.get(key) ?? null
  })

  ipcMain.handle('settings:set', (_e, key: string, value: any) => {
    store.set(key, value)
  })

  ipcMain.handle('settings:get-secret', (_e, key: string) => {
    return getSecret(key)
  })

  ipcMain.handle('settings:set-secret', (_e, key: string, value: string) => {
    setSecret(key, value)
  })

  ipcMain.handle('settings:get-all-keys', () => {
    const keys = ['openai', 'anthropic', 'openrouter', 'g4f', 'groq', 'deepgram', 'gemini',
      'deepseek', 'neon_url', 'neon_api']
    const result: Record<string, boolean> = {}
    for (const k of keys) {
      result[k] = !!getSecret(k)
    }
    return result
  })

  ipcMain.handle('settings:get-all', () => {
    return store.store
  })

  ipcMain.handle('settings:reset-keys', () => {
    store.delete('initialized')
    loadEnvOnFirstLaunch()
    return true
  })
}

// Export for use in other IPC modules
export { getSecret, setSecret, store }
