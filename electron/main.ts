import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'fs'
import { createServer } from 'http'
import { exec } from 'child_process'
import { promisify } from 'util'
import { dirname as pathDirname } from 'path'
import type { Server } from 'http'

const execAsync = promisify(exec)
import { app, BrowserWindow, ipcMain, session, shell } from './electron-wrapper.mjs'
import { registerChatIPC } from './ipc/chat.ipc'
import { registerVoiceIPC } from './ipc/voice.ipc'
import { registerMemoryIPC } from './ipc/memory.ipc'
import { registerSettingsIPC } from './ipc/settings.ipc'
import {
  registerMcpIPC,
  callRealTool,
  OPENCLAW_TOOLS_KNOWN,
  fetchDynamicToolCatalog,
  getDynamicToolCatalogStatus,
} from './ipc/mcp.ipc'
import { registerKnowledgeIPC } from './ipc/knowledge.ipc'
import { registerWorkerIPC } from './ipc/worker.ipc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow: BrowserWindow | null = null
let electronMcpServer: Server | null = null

// ── .env.local loader (para pasar variables al gateway spawneado) ────────────
function loadDotEnv(envPath: string): Record<string, string> {
  try {
    const content = readFileSync(envPath, 'utf8')
    const result: Record<string, string> = {}
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq < 0) continue
      result[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    }
    return result
  } catch { return {} }
}

// ── electron-mcp HTTP server (:19875) ───────────────────────────────────────
function startElectronMcpServer(): void {
  const server = createServer((req, res) => {
    const headers = { 'Content-Type': 'application/json' }

    if (req.method === 'GET' && req.url === '/status') {
      void (async () => {
        try {
          const status = await getDynamicToolCatalogStatus()
          res.writeHead(200, headers)
          res.end(JSON.stringify({ status: 'online', name: 'electron-mcp', ...status }))
        } catch {
          res.writeHead(200, headers)
          res.end(JSON.stringify({
            status: 'online',
            name: 'electron-mcp',
            tools: OPENCLAW_TOOLS_KNOWN.length,
            dynamic: false,
            sources: { 'electron-local': OPENCLAW_TOOLS_KNOWN.length },
            nativeContractRevalidated: false,
            fallbackUsed: true,
          }))
        }
      })()
      return
    }

    if (req.method === 'GET' && req.url === '/list-tools') {
      void (async () => {
        try {
          const tools = await fetchDynamicToolCatalog()
          res.writeHead(200, headers)
          res.end(JSON.stringify({ tools }))
        } catch {
          res.writeHead(200, headers)
          res.end(JSON.stringify({ tools: OPENCLAW_TOOLS_KNOWN, _fallback: true }))
        }
      })()
      return
    }

    if (req.method === 'POST' && req.url === '/execute') {
      let body = ''
      req.on('data', (chunk: Buffer) => { body += chunk.toString() })
      req.on('end', () => {
        ;(async () => {
          try {
            const { tool, arguments: args } = JSON.parse(body)
            const result = await executeElectronTool(tool as string, (args as Record<string, any>) || {})
            res.writeHead(200, headers)
            res.end(JSON.stringify({ result }))
          } catch (e: any) {
            res.writeHead(500, headers)
            res.end(JSON.stringify({ error: e.message }))
          }
        })()
      })
      return
    }

    res.writeHead(404)
    res.end()
  })

  server.listen(19875, '127.0.0.1', () => {
    console.log('[electron-mcp] ✅ HTTP server on :19875')
  })
  server.on('error', (err: Error) => {
    console.warn('[electron-mcp] ⚠️ Server error:', err.message)
  })
  electronMcpServer = server
}

// ── electron-mcp direct tool execution (no gateway loop) ────────────────────
async function executeElectronTool(toolName: string, args: Record<string, any>): Promise<any> {
  switch (toolName) {
    // ── File system ──────────────────────────────────────────────────────────
    case 'read_file':
      return { content: readFileSync(args.path, 'utf8') }

    case 'write_file': {
      const dir = pathDirname(args.path)
      mkdirSync(dir, { recursive: true })
      writeFileSync(args.path, args.content, 'utf8')
      return { success: true, path: args.path }
    }

    case 'list_files': {
      const entries = readdirSync(args.path, { withFileTypes: true })
      const filter = args.filter ? new RegExp(args.filter, 'i') : null
      const files = entries
        .filter(e => !filter || filter.test(e.name))
        .map(e => ({ name: e.name, isDirectory: e.isDirectory() }))
      return { files, path: args.path }
    }

    case 'delete_file':
      rmSync(args.path, { recursive: true, force: true })
      return { success: true }

    case 'search_files': {
      const { stdout } = await execAsync(
        `powershell -Command "Get-ChildItem -Path '${args.path || '.'}' -Recurse | Select-String -Pattern '${args.pattern}' | Select-Object -First 50 -ExpandProperty Path"`,
        { timeout: 15000 }
      ).catch(() => ({ stdout: '' }))
      return { matches: stdout.split('\n').map(l => l.trim()).filter(Boolean) }
    }

    // ── Execution ─────────────────────────────────────────────────────────────
    case 'execute_command': {
      const { stdout, stderr } = await execAsync(args.command, {
        cwd: args.cwd || process.cwd(),
        timeout: 30000,
      }).catch((e: any) => ({ stdout: e.stdout || '', stderr: e.stderr || e.message }))
      return { stdout, stderr }
    }

    case 'execute_code': {
      const lang = (args.language || 'powershell').toLowerCase()
      const code = args.code as string
      let cmd: string
      if (lang === 'python') cmd = `python -c ${JSON.stringify(code)}`
      else if (lang === 'javascript') cmd = `node -e ${JSON.stringify(code)}`
      else if (lang === 'bash') cmd = `bash -c ${JSON.stringify(code)}`
      else cmd = `powershell -Command ${JSON.stringify(code)}`
      const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 })
        .catch((e: any) => ({ stdout: '', stderr: e.message }))
      return { stdout, stderr, language: lang }
    }

    // ── Computer Use ──────────────────────────────────────────────────────────
    case 'capture_screen': {
      const tmpScript = require('path').join(require('os').tmpdir(), `ss_${Date.now()}.ps1`)
      const tmpImg = require('path').join(require('os').tmpdir(), `ss_${Date.now()}.png`)
      const script = [
        'Add-Type -AssemblyName System.Windows.Forms',
        'Add-Type -AssemblyName System.Drawing',
        '$b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds',
        '$bmp = New-Object System.Drawing.Bitmap($b.Width, $b.Height)',
        '$g = [System.Drawing.Graphics]::FromImage($bmp)',
        '$g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size)',
        '$g.Dispose()',
        '$bmp.Save("' + tmpImg.replace(/\\/g, '\\\\') + '")',
        '$bmp.Dispose()',
        '[Convert]::ToBase64String([IO.File]::ReadAllBytes("' + tmpImg.replace(/\\/g, '\\\\') + '"))',
      ].join('\n')
      writeFileSync(tmpScript, script, 'utf8')
      const { stdout, stderr } = await execAsync(`powershell -ExecutionPolicy Bypass -File "${tmpScript}"`, { timeout: 20000 })
        .catch((e: any) => ({ stdout: '', stderr: e.message }))
      try { rmSync(tmpScript); rmSync(tmpImg) } catch { /* ok */ }
      if (!stdout.trim()) return { error: stderr || 'capture failed' }
      return { screenshot: `data:image/png;base64,${stdout.trim()}`, format: 'png' }
    }

    case 'execute_desktop': {
      // action: 'click' | 'move' | 'double_click' | 'right_click' | 'type' | 'key' | 'scroll'
      const action = args.action as string
      let ps: string

      if (['click', 'move', 'double_click', 'right_click'].includes(action)) {
        const x = args.x as number
        const y = args.y as number
        const clickEvents = action === 'right_click'
          ? '[WinAPI]::mouse_event(0x8, 0, 0, 0, 0); [WinAPI]::mouse_event(0x10, 0, 0, 0, 0)'
          : action === 'double_click'
          ? '[WinAPI]::mouse_event(0x2, 0, 0, 0, 0); [WinAPI]::mouse_event(0x4, 0, 0, 0, 0); [System.Threading.Thread]::Sleep(50); [WinAPI]::mouse_event(0x2, 0, 0, 0, 0); [WinAPI]::mouse_event(0x4, 0, 0, 0, 0)'
          : action === 'click'
          ? '[WinAPI]::mouse_event(0x2, 0, 0, 0, 0); [WinAPI]::mouse_event(0x4, 0, 0, 0, 0)'
          : ''
        ps = `Add-Type @"
  using System; using System.Runtime.InteropServices;
  public class WinAPI {
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] public static extern void mouse_event(int f, int dx, int dy, int c, int e);
  }
"@
[WinAPI]::SetCursorPos(${x}, ${y})
[System.Threading.Thread]::Sleep(80)
${clickEvents}
Write-Output "ok"`
      } else if (action === 'type') {
        const text = (args.text as string).replace(/'/g, "''")
        ps = `Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('${text}')
Write-Output "ok"`
      } else if (action === 'key') {
        const key = (args.key as string).replace(/'/g, "''")
        ps = `Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('${key}')
Write-Output "ok"`
      } else if (action === 'scroll') {
        const delta = ((args.delta || 3) as number) * 120
        ps = `Add-Type @"
  using System; using System.Runtime.InteropServices;
  public class WinAPI3 { [DllImport("user32.dll")] public static extern void mouse_event(int f, int dx, int dy, int c, int e); }
"@
[WinAPI3]::mouse_event(0x0800, 0, 0, ${delta}, 0)
Write-Output "ok"`
      } else {
        return { error: `Unknown desktop action: ${action}. Use: click, move, type, key, scroll, double_click, right_click` }
      }

      const tmpScript = require('path').join(require('os').tmpdir(), `desk_${Date.now()}.ps1`)
      writeFileSync(tmpScript, ps, 'utf8')
      const { stdout, stderr } = await execAsync(`powershell -ExecutionPolicy Bypass -File "${tmpScript}"`, { timeout: 10000 })
        .catch((e: any) => ({ stdout: '', stderr: e.message }))
      try { rmSync(tmpScript) } catch { /* ok */ }
      return { success: stdout.includes('ok'), action, stdout: stdout.trim(), stderr: stderr.trim() || undefined }
    }

    // ── Web ───────────────────────────────────────────────────────────────────
    case 'fetch_url': {
      const res = await fetch(args.url, {
        method: args.method || 'GET',
        headers: args.headers as Record<string, string> | undefined,
        body: args.body,
        signal: AbortSignal.timeout(15000),
      })
      const text = await res.text()
      return { status: res.status, body: text.slice(0, 8000) }
    }

    case 'web_search': {
      // DuckDuckGo Instant Answer — no API key required
      const q = encodeURIComponent(args.query as string)
      const res = await fetch(
        `https://api.duckduckgo.com/?q=${q}&format=json&no_html=1&skip_disambig=1`,
        { signal: AbortSignal.timeout(10000) }
      )
      const data = await res.json() as any
      const related = (data.RelatedTopics || [])
        .slice(0, args.maxResults || 5)
        .map((t: any) => ({ text: t.Text, url: t.FirstURL }))
        .filter((t: any) => t.text)
      return {
        query: args.query,
        abstract: data.AbstractText || '',
        source: data.AbstractSource || '',
        url: data.AbstractURL || '',
        results: related,
      }
    }

    // ── Diagnostics ───────────────────────────────────────────────────────────
    case 'check_system_health': {
      try {
        const g4fRes = await fetch('http://127.0.0.1:8082/v1/models', { signal: AbortSignal.timeout(3000) })
        return { status: g4fRes.ok ? 'online' : 'g4f_offline', g4f: g4fRes.ok }
      } catch { return { status: 'g4f_offline', g4f: false } }
    }

    case 'check_providers': {
      const g4fOk = await fetch('http://127.0.0.1:8082/v1/models', { signal: AbortSignal.timeout(3000) }).then(r => r.ok).catch(() => false)
      return { g4f: g4fOk ? 'online' : 'offline' }
    }

    // ── Git / Dev ─────────────────────────────────────────────────────────────
    case 'git_status': {
      const { stdout } = await execAsync('git status --short', { cwd: args.path || process.cwd() })
        .catch((e: any) => ({ stdout: e.message }))
      return { status: stdout }
    }

    case 'git_commit': {
      const { stdout } = await execAsync(`git add -A && git commit -m ${JSON.stringify(args.message)}`, {
        cwd: args.path || process.cwd(),
      }).catch((e: any) => ({ stdout: e.message }))
      return { output: stdout }
    }

    case 'npm_run': {
      const { stdout, stderr } = await execAsync(`npm run ${args.script}`, {
        cwd: args.cwd || process.cwd(),
        timeout: 120000,
      }).catch((e: any) => ({ stdout: '', stderr: e.message }))
      return { stdout, stderr }
    }

    // ── Multimedia ────────────────────────────────────────────────────────────
    case 'generate_image': {
      try {
        const res = await fetch('http://127.0.0.1:8082/v1/images/generations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: args.prompt, size: args.size || '1024x1024' }),
          signal: AbortSignal.timeout(60000),
        })
        return await res.json()
      } catch (e: any) { return { error: e.message } }
    }

    // ── Email ─────────────────────────────────────────────────────────────────
    case 'manage_email': {
      return { available: false, reason: 'Email management not available in this version' }
    }

    case 'memory_store':
    case 'memory_get':
    case 'memory_search': {
      return { error: 'Memory tool not available — use window.sofia.memory API instead' }
    }

    default:
      // Forward unknown tools to sofia-mcp-local (only to that server, not back to gateway)
      try {
        const res = await fetch('http://127.0.0.1:8100/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: toolName, arguments: args }),
          signal: AbortSignal.timeout(15000),
        })
        return res.ok ? await res.json() : { error: `sofia-mcp-local: ${res.status}` }
      } catch {
        return { error: `Tool '${toolName}' not implemented in electron-mcp and sofia-mcp-local unreachable` }
      }
  }
}

app.whenReady().then(() => {
  // Allow microphone access for voice calls
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === 'media' || permission === 'mediaKeySystem')
  })
  startElectronMcpServer()
  createWindow()
})
app.on('window-all-closed', () => {
  if (electronMcpServer) { electronMcpServer.close(); electronMcpServer = null }
  app.quit()
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

function createWindow() {
  // GPU cache fix for Windows — unique cache dir per process
  app.commandLine.appendSwitch('disk-cache-dir', join(app.getPath('temp'), `sofia-gpu-${process.pid}`))

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: true,
    webPreferences: {
      preload: join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    backgroundColor: '#0b0d10',
    show: false,
    icon: join(__dirname, '../resources/icon.ico'),
  })

  // Show when ready — fast startup (max 1.5s wait)
  let shown = false
  const showOnce = () => { if (!shown) { shown = true; mainWindow?.show() } }
  mainWindow.once('ready-to-show', showOnce)
  setTimeout(showOnce, 1500)

  // Load app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  // Window controls IPC
  ipcMain.handle('window:minimize', () => mainWindow?.minimize())
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.handle('window:close', () => mainWindow?.close())
  ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false)
  ipcMain.handle('desktop:open-path', async (_event, targetPath: string) => {
    const error = await shell.openPath(targetPath)
    return { ok: error === '', error }
  })
  ipcMain.handle('desktop:open-external', async (_event, url: string) => {
    await shell.openExternal(url)
    return { ok: true }
  })

  mainWindow.on('maximize', () => mainWindow?.webContents.send('window:maximized-changed', true))
  mainWindow.on('unmaximize', () => mainWindow?.webContents.send('window:maximized-changed', false))

  // Register IPC handlers
  registerSettingsIPC(ipcMain)
  registerChatIPC(ipcMain, mainWindow)
  registerVoiceIPC(ipcMain, mainWindow)
  registerMemoryIPC(ipcMain)
  registerMcpIPC(ipcMain)
  registerKnowledgeIPC(ipcMain)
  if (mainWindow) registerWorkerIPC(ipcMain, mainWindow)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}
