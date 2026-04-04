import { existsSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import {
  auditOpenClawCoverageViaLangGraph,
  queryOpenClawIncidentViaLangGraph,
  queryOpenClawKnowledgeViaLangGraph,
  refreshOpenClawKnowledgeViaLangGraph,
  syncOpenClawSchedulesViaLangGraph,
  triggerOpenClawScheduleViaLangGraph,
} from '../src/core/knowledge-trigger/langgraph-runtime'
import { ensureKnowledgeRuntimeStarted } from '../src/core/knowledge-trigger/runtime-bootstrap'
import { getKnowledgeRuntimeSnapshot } from '../src/core/knowledge-trigger/runtime-observer'
import {
  TEMPORAL_COVERAGE_SCHEDULE_ID,
} from '../src/core/knowledge-trigger/temporal-contract'
import {
  TEMPORAL_LANGGRAPH_STATE_PATH,
  TEMPORAL_LAST_AUDIT_PATH,
  TEMPORAL_LAST_REFRESH_PATH,
  TEMPORAL_RUNTIME_ROOT,
} from '../src/core/knowledge-trigger/runtime-state'

type SmokeCheck = {
  id: string
  ok: boolean
  detail: string
}

function record(checks: SmokeCheck[], id: string, ok: boolean, detail: string) {
  checks.push({ id, ok, detail })
}

async function main() {
  const startedAt = new Date().toISOString()
  const checks: SmokeCheck[] = []

  const bootstrap = await ensureKnowledgeRuntimeStarted()
  record(
    checks,
    'runtime-bootstrap',
    bootstrap.temporalGrpcOk && bootstrap.workerRunning && bootstrap.supervisorRunning,
    `gRPC=${bootstrap.temporalGrpcOk} worker=${bootstrap.workerRunning} supervisor=${bootstrap.supervisorRunning}`,
  )

  const runtime = await getKnowledgeRuntimeSnapshot()
  record(
    checks,
    'runtime-health',
    runtime.temporalUiOk && runtime.temporalGrpcOk && runtime.workerRunning && runtime.supervisorRunning,
    `ui=${runtime.temporalUiOk} grpc=${runtime.temporalGrpcOk} worker=${runtime.workerRunning} supervisor=${runtime.supervisorRunning}`,
  )

  const gatewayKnowledge = await queryOpenClawKnowledgeViaLangGraph('Como funciona el gateway de OpenClaw y sus sesiones?')
  record(
    checks,
    'knowledge-gateway-query',
    Boolean(
      gatewayKnowledge.triggered &&
      gatewayKnowledge.card &&
      (
        /gateway/i.test(gatewayKnowledge.card.title) ||
        /\/gateway/i.test(gatewayKnowledge.card.sourceUrl)
      ),
    ),
    gatewayKnowledge.card
      ? `${gatewayKnowledge.card.title} | ${gatewayKnowledge.route} | ${gatewayKnowledge.executionMode || 'unknown'}`
      : 'Sin tarjeta de conocimiento',
  )

  const memoryKnowledge = await queryOpenClawKnowledgeViaLangGraph('Como maneja OpenClaw la memoria, el contexto y la compaction?')
  record(
    checks,
    'knowledge-memory-query',
    Boolean(
      memoryKnowledge.triggered &&
      memoryKnowledge.card &&
      (
        /memory|context|session|compaction/i.test(memoryKnowledge.card.title) ||
        /concepts\/(memory|context|session|compaction)/i.test(memoryKnowledge.card.sourceUrl)
      ),
    ),
    memoryKnowledge.card
      ? `${memoryKnowledge.card.title} | ${memoryKnowledge.route} | ${memoryKnowledge.executionMode || 'unknown'}`
      : 'Sin tarjeta de conocimiento',
  )

  const incident = await queryOpenClawIncidentViaLangGraph('unauthorized during connect to the OpenClaw gateway')
  record(
    checks,
    'incident-query',
    Boolean(incident.triggered && incident.card && /incident|troubleshooting|gateway|auth/i.test(`${incident.card.title} ${incident.card.sourceUrl}`)),
    incident.card
      ? `${incident.card.title} | ${incident.route} | ${incident.executionMode || 'unknown'}`
      : 'Sin tarjeta de incidencia',
  )

  const audit = await auditOpenClawCoverageViaLangGraph()
  record(
    checks,
    'coverage-audit',
    audit.healthy && audit.missingRequirements.length === 0,
    `healthy=${audit.healthy} missing=${audit.missingRequirements.join(',') || 'none'}`,
  )

  const refresh = await refreshOpenClawKnowledgeViaLangGraph()
  record(
    checks,
    'refresh-workflow',
    refresh.ok && refresh.runtimeStats.capabilities > 0 && refresh.runtimeStats.runbooks > 0,
    `ok=${refresh.ok} durationMs=${refresh.durationMs} capabilities=${refresh.runtimeStats.capabilities} runbooks=${refresh.runtimeStats.runbooks}`,
  )

  const schedules = await syncOpenClawSchedulesViaLangGraph()
  record(
    checks,
    'schedule-sync',
    schedules.ok && schedules.schedules.length >= 2,
    `ok=${schedules.ok} schedules=${schedules.schedules.length}`,
  )

  let finalRuntime = await getKnowledgeRuntimeSnapshot()
  const executionMode = finalRuntime.executionMode
  if (executionMode === 'temporal') {
    const triggeredSchedule = await triggerOpenClawScheduleViaLangGraph(TEMPORAL_COVERAGE_SCHEDULE_ID)
    record(
      checks,
      'schedule-trigger',
      triggeredSchedule.scheduleId === TEMPORAL_COVERAGE_SCHEDULE_ID,
      `${triggeredSchedule.scheduleId} next=${triggeredSchedule.nextActionAt || 'n/a'}`,
    )
    finalRuntime = await getKnowledgeRuntimeSnapshot()
  } else {
    record(
      checks,
      'schedule-trigger',
      true,
      `omitido en modo ${executionMode || 'local-fallback'}`,
    )
  }
  record(
    checks,
    'langgraph-state',
    Boolean(finalRuntime.langGraph?.available && finalRuntime.langGraph?.lastRoute),
    `available=${finalRuntime.langGraph?.available} route=${finalRuntime.langGraph?.lastRoute || 'none'}`,
  )

  record(
    checks,
    'runtime-artifacts',
    [TEMPORAL_LAST_REFRESH_PATH, TEMPORAL_LAST_AUDIT_PATH, TEMPORAL_LANGGRAPH_STATE_PATH].every(targetPath => existsSync(targetPath)),
    'last-refresh, last-audit y langgraph-state persistidos',
  )

  const finishedAt = new Date().toISOString()
  const passed = checks.filter(check => check.ok).length
  const failed = checks.filter(check => !check.ok)
  const report = {
    startedAt,
    finishedAt,
    ok: failed.length === 0,
    passed,
    total: checks.length,
    checks,
    runtime: {
      executionMode: finalRuntime.executionMode,
      temporalUiOk: finalRuntime.temporalUiOk,
      temporalGrpcOk: finalRuntime.temporalGrpcOk,
      workerRunning: finalRuntime.workerRunning,
      supervisorRunning: finalRuntime.supervisorRunning,
      coverageHealthy: finalRuntime.coverage.healthy,
      schedules: finalRuntime.schedules?.schedules?.length || 0,
      langGraphRoute: finalRuntime.langGraph?.lastRoute || null,
    },
  }

  const jsonPath = resolve(TEMPORAL_RUNTIME_ROOT, 'smoke-test-report.json')
  const mdPath = resolve(TEMPORAL_RUNTIME_ROOT, 'smoke-test-report.md')
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8')

  const markdown = [
    '# Smoke Test OpenClaw Runtime',
    '',
    `- startedAt: ${startedAt}`,
    `- finishedAt: ${finishedAt}`,
    `- passed: ${passed}/${checks.length}`,
    `- ok: ${report.ok}`,
    '',
    '## Checks',
    ...checks.map(check => `- [${check.ok ? 'x' : ' '}] ${check.id}: ${check.detail}`),
    '',
    '## Runtime Snapshot',
    `- executionMode: ${report.runtime.executionMode}`,
    `- temporalUiOk: ${report.runtime.temporalUiOk}`,
    `- temporalGrpcOk: ${report.runtime.temporalGrpcOk}`,
    `- workerRunning: ${report.runtime.workerRunning}`,
    `- supervisorRunning: ${report.runtime.supervisorRunning}`,
    `- coverageHealthy: ${report.runtime.coverageHealthy}`,
    `- schedules: ${report.runtime.schedules}`,
    `- langGraphRoute: ${report.runtime.langGraphRoute}`,
  ].join('\n')
  writeFileSync(mdPath, `${markdown}\n`, 'utf8')

  console.log(markdown)

  if (!report.ok) {
    process.exitCode = 1
  }
}

main().catch(error => {
  console.error('[smoke-test-openclaw-runtime] fatal:', error)
  process.exitCode = 1
})
