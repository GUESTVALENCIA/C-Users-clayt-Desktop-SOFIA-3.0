# Temporal OSS para Sofía

Instalacion self-hosted basada en las referencias oficiales de Temporal OSS y el compose oficial de `temporalio/docker-compose`, adaptada a puertos que no colisionan con el stack actual de Sofía.

## Servicios

- Temporal gRPC: `127.0.0.1:7233`
- Temporal UI: `http://127.0.0.1:8233`
- PostgreSQL interno de Temporal: `127.0.0.1:5434`

## Comandos

```powershell
docker compose --env-file .env -f resources/orchestration/temporal/docker-compose.yml up -d
docker compose --env-file .env -f resources/orchestration/temporal/docker-compose.yml ps
docker compose --env-file .env -f resources/orchestration/temporal/docker-compose.yml down
npm run temporal:worker:start
npm run temporal:worker:status
npm run temporal:worker:stop
npm run temporal:supervisor:start
npm run temporal:supervisor:status
npm run temporal:supervisor:stop
npm run temporal:health
```

## Rol dentro de Sofía

- motor durable para workflows del disparador interno;
- retries, reanudacion y trazabilidad de ejecucion;
- base para `knowledge_trigger_workflow`, `knowledge_refresh_workflow`, `incident_response_workflow` y `coverage_audit_workflow`;
- schedules durables para refresh y auditoria de cobertura;
- supervisor local que cambia a fallback controlado si Temporal o el worker se degradan.

## Worker activo en esta fase

- task queue: `sofia-openclaw-knowledge`
- workflow real: `openclawKnowledgeTriggerWorkflow`
- activity real: `resolveOpenClawKnowledge`
- schedules:
  - `sofia-openclaw-refresh-schedule`
  - `sofia-openclaw-coverage-schedule`
- supervisor:
  - `src/core/knowledge-trigger/temporal-supervisor.ts`
- logs del worker:
  - `resources/orchestration/temporal/logs/worker.out.log`
  - `resources/orchestration/temporal/logs/worker.err.log`
- logs del supervisor:
  - `resources/orchestration/temporal/logs/supervisor.out.log`
  - `resources/orchestration/temporal/logs/supervisor.err.log`

## Fuente

- Temporal OSS: https://docs.temporal.io/
- Compose oficial de referencia: https://github.com/temporalio/docker-compose
