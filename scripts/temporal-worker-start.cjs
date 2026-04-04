const { existsSync, mkdirSync, readFileSync, writeFileSync, openSync } = require('fs')
const { resolve, dirname } = require('path')
const { spawn } = require('child_process')

const ROOT = process.cwd()
const RUNTIME_DIR = resolve(ROOT, 'resources', 'orchestration', 'temporal', 'runtime')
const LOG_DIR = resolve(ROOT, 'resources', 'orchestration', 'temporal', 'logs')
const PID_FILE = resolve(RUNTIME_DIR, 'worker.pid')
const OUT_LOG = resolve(LOG_DIR, 'worker.out.log')
const ERR_LOG = resolve(LOG_DIR, 'worker.err.log')
const TSX_CLI = resolve(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs')
const WORKER_ENTRY = resolve(ROOT, 'src', 'core', 'knowledge-trigger', 'temporal-worker.ts')

function ensureDir(path) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true })
}

function isRunning(pid) {
  if (!pid) return false
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

ensureDir(RUNTIME_DIR)
ensureDir(LOG_DIR)

if (existsSync(PID_FILE)) {
  const pid = Number(readFileSync(PID_FILE, 'utf8'))
  if (isRunning(pid)) {
    console.log(`Temporal worker already running (pid ${pid})`)
    process.exit(0)
  }
}

const out = openSync(OUT_LOG, 'a')
const err = openSync(ERR_LOG, 'a')

const child = spawn(process.execPath, [TSX_CLI, WORKER_ENTRY], {
  cwd: ROOT,
  detached: true,
  windowsHide: true,
  stdio: ['ignore', out, err],
})

child.unref()
writeFileSync(PID_FILE, String(child.pid), 'utf8')

console.log(`Temporal worker started (pid ${child.pid})`)
console.log(`stdout: ${OUT_LOG}`)
console.log(`stderr: ${ERR_LOG}`)
