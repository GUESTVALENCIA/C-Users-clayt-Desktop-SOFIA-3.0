const { existsSync, readFileSync } = require('fs')
const { resolve } = require('path')
const net = require('net')

const PID_FILE = resolve(process.cwd(), 'resources', 'orchestration', 'temporal', 'runtime', 'worker.pid')
const SUPERVISOR_PID_FILE = resolve(process.cwd(), 'resources', 'orchestration', 'temporal', 'runtime', 'supervisor.pid')

function isRunning(pid) {
  if (!pid) return false
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function tcpCheck(host, port, timeoutMs = 3000) {
  return new Promise(resolvePromise => {
    const socket = net.createConnection({ host, port })
    const done = ok => {
      socket.removeAllListeners()
      socket.destroy()
      resolvePromise(ok)
    }
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => done(true))
    socket.once('timeout', () => done(false))
    socket.once('error', () => done(false))
  })
}

async function main() {
  let uiOk = false
  try {
    const response = await fetch('http://127.0.0.1:8233', { signal: AbortSignal.timeout(3000) })
    uiOk = response.ok
  } catch {}

  const grpcOk = await tcpCheck('127.0.0.1', 7233)
  const workerPid = existsSync(PID_FILE) ? Number(readFileSync(PID_FILE, 'utf8')) : null
  const supervisorPid = existsSync(SUPERVISOR_PID_FILE) ? Number(readFileSync(SUPERVISOR_PID_FILE, 'utf8')) : null

  const payload = {
    temporalUiOk: uiOk,
    temporalGrpcOk: grpcOk,
    workerPid,
    workerRunning: isRunning(workerPid),
    supervisorPid,
    supervisorRunning: isRunning(supervisorPid),
  }

  console.log(JSON.stringify(payload, null, 2))
  process.exit(payload.temporalUiOk && payload.temporalGrpcOk && payload.workerRunning ? 0 : 1)
}

main()
