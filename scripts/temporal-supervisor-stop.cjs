const { existsSync, readFileSync, unlinkSync } = require('fs')
const { resolve } = require('path')

const PID_FILE = resolve(process.cwd(), 'resources', 'orchestration', 'temporal', 'runtime', 'supervisor.pid')

if (!existsSync(PID_FILE)) {
  console.log('Temporal supervisor is not running')
  process.exit(0)
}

const pid = Number(readFileSync(PID_FILE, 'utf8'))

try {
  process.kill(pid)
  console.log(`Temporal supervisor stopped (pid ${pid})`)
} catch (error) {
  console.log(`Temporal supervisor stop warning: ${error.message}`)
}

try {
  unlinkSync(PID_FILE)
} catch {}
