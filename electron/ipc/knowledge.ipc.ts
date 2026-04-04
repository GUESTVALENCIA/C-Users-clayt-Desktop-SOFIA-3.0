import type { IpcMain } from 'electron'

const NOT_AVAILABLE = { triggered: false, route: 'none', confidence: 0, executionMode: 'local' as const, card: null }

export function registerKnowledgeIPC(ipcMain: IpcMain) {
  ipcMain.handle('knowledge:query', async () => NOT_AVAILABLE)
  ipcMain.handle('knowledge:incident', async () => NOT_AVAILABLE)
  ipcMain.handle('knowledge:refresh', async () => ({ ok: true, startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(), durationMs: 0, steps: [], runtimeStats: { capabilities: 0, concepts: 0, runbooks: 0, errors: 0, categories: [] } }))
  ipcMain.handle('knowledge:sync-schedules', async () => ({ ok: true, syncedAt: new Date().toISOString(), schedules: [] }))
  ipcMain.handle('knowledge:list-schedules', async () => [])
  ipcMain.handle('knowledge:trigger-schedule', async () => ({ ok: false, error: 'Knowledge system not active' }))
  ipcMain.handle('knowledge:audit-coverage', async () => ({ healthy: true, generatedAt: new Date().toISOString(), totals: { capabilities: 0, concepts: 0, runbooks: 0, errors: 0 }, requirements: [], missingRequirements: [] }))
  ipcMain.handle('knowledge:get-runtime-state', async () => ({
    installed: false,
    composePath: '',
    envPath: '',
    readmePath: '',
    readmeExists: false,
    corpusReady: false,
    temporalUiOk: false,
    temporalGrpcOk: false,
    workerPid: null,
    workerRunning: false,
    supervisorPid: null,
    supervisorRunning: false,
    executionMode: 'local-fallback',
    stats: { capabilities: 0, concepts: 0, runbooks: 0, errors: 0, categories: [] },
    coverage: { healthy: true, generatedAt: new Date().toISOString(), totals: { capabilities: 0, concepts: 0, runbooks: 0, errors: 0 }, requirements: [], missingRequirements: [] },
    schedules: { ok: true, syncedAt: null, schedules: [] },
    supervisor: { startedAt: null, lastCheckedAt: null, status: 'healthy' as const, executionMode: 'local-fallback', schedulesSynced: false, workerRestartedAt: null, lastIssueKey: null, lastIncidentAt: null, checks: { temporalUiOk: false, temporalGrpcOk: false, workerRunning: false, coverageHealthy: true } },
    lastRefresh: null,
    lastAudit: null,
    lastIncident: null,
    langGraph: { available: false, lastRunAt: null, lastOperation: null, lastExecutionMode: null, lastRoute: null, lastThreadId: null, confidence: null },
  }))
}
