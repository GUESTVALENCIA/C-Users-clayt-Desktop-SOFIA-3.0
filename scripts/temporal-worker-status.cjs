const { existsSync, readFileSync } = require('fs')
const { resolve } = require('path')

const PID_FILE = resolve(process.cwd(), 'resources', 'orchestration', 'temporal', 'runtime', 'worker.pid')

function isRunning(pid) {
  if (!pid) return false
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

if (!existsSync(PID_FILE)) {
  console.log('Temporal worker status: stopped')
  process.exit(0)
}

const pid = Number(readFileSync(PID_FILE, 'utf8'))
console.log(`Temporal worker status: ${isRunning(pid) ? 'running' : 'stale'} (pid ${pid})`)
