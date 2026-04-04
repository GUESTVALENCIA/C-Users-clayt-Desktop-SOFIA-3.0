# Smoke Test OpenClaw Runtime

- startedAt: 2026-04-03T06:23:24.873Z
- finishedAt: 2026-04-03T06:23:35.451Z
- passed: 11/11
- ok: true

## Checks
- [x] runtime-bootstrap: gRPC=true worker=true supervisor=true
- [x] runtime-health: ui=true grpc=true worker=true supervisor=true
- [x] knowledge-gateway-query: Gateway Runbook | langgraph-knowledge-temporal | temporal
- [x] knowledge-memory-query: Context Window & Compaction | langgraph-knowledge-temporal | temporal
- [x] incident-query: Gateway Runbook | langgraph-incident-temporal | temporal
- [x] coverage-audit: healthy=true missing=none
- [x] refresh-workflow: ok=true durationMs=6441 capabilities=84 runbooks=440
- [x] schedule-sync: ok=true schedules=2
- [x] schedule-trigger: sofia-openclaw-coverage-schedule next=2026-04-03T12:00:00.000Z
- [x] langgraph-state: available=true route=langgraph-trigger-schedule-temporal
- [x] runtime-artifacts: last-refresh, last-audit y langgraph-state persistidos

## Runtime Snapshot
- executionMode: temporal
- temporalUiOk: true
- temporalGrpcOk: true
- workerRunning: true
- supervisorRunning: true
- coverageHealthy: true
- schedules: 2
- langGraphRoute: langgraph-trigger-schedule-temporal
