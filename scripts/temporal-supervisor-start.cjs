const { existsSync, mkdirSync, readFileSync, writeFileSync, openSync } = require('fs')
const { resolve } = require('path')
const { spawn } = require('child_process')

const ROOT = process.cwd()
const RUNTIME_DIR = resolve(ROOT, 'resources', 'orchestration', 'temporal', 'runtime')
const LOG_DIR = resolve(ROOT, 'resources', 'orchestration', 'temporal', 'logs')
const PID_FILE = resolve(RUNTIME_DIR, 'supervisor.pid')
const OUT_LOG = resolve(LOG_DIR, 'supervisor.out.log')
const ERR_LOG = resolve(LOG_DIR, 'supervisor.err.log')
const TSX_CLI = resolve(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs')
const SUPERVISOR_ENTRY = resolve(ROOT, 'src', 'core', 'knowledge-trigger', 'temporal-supervisor.ts')

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

function readPid() {
  try {
    return Number(readFileSync(PID_FILE, 'utf8'))
  } catch {
    return null
  }
}

ensureDir(RUNTIME_DIR)
ensureDir(LOG_DIR)

const currentPid = readPid()
if (isRunning(currentPid)) {
  console.log(`Temporal supervisor already running (pid ${currentPid})`)
  process.exit(0)
}

const out = openSync(OUT_LOG, 'a')
const err = openSync(ERR_LOG, 'a')

const child = spawn(process.execPath, [TSX_CLI, SUPERVISOR_ENTRY], {
  cwd: ROOT,
  detached: true,
  windowsHide: true,
  stdio: ['ignore', out, err],
})

child.unref()
writeFileSync(PID_FILE, String(child.pid), 'utf8')

console.log(`Temporal supervisor started (pid ${child.pid})`)
console.log(`stdout: ${OUT_LOG}`)
console.log(`stderr: ${ERR_LOG}`)
