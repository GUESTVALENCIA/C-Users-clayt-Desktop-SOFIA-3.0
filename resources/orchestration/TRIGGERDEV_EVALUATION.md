# Trigger.dev Evaluation

Fecha: 2026-03-27

## Resultado

Trigger.dev queda instalado como rival open source de Temporal en:

- `C:\Users\clayt\Desktop\SOFÍA 3.0\resources\orchestration\triggerdev`
- `C:\Users\clayt\Desktop\SOFÍA 3.0\resources\orchestration\triggerdev-docker`

## Criterio de selección

- Open source real
- Self-hosted
- Buen encaje con stack TypeScript/Node/Electron
- Mejor ajuste al sistema de disparador que opciones más genéricas como Kestra

## Estado de la prueba

Se probó el self-host oficial Docker de Trigger.dev v4.

Infraestructura levantada correctamente:

- Postgres
- Redis
- ClickHouse
- MinIO
- Registry
- Docker proxy
- Supervisor

## Incidencia upstream detectada

La instalación oficial actual no quedó usable de extremo a extremo por un problema en el bootstrap de la imagen webapp:

1. El `entrypoint.sh` de Docker fuerza `?secure=true` en `GOOSE_DBSTRING`.
2. Con `CLICKHOUSE_URL=http://default:password@clickhouse:8123`, el bootstrap de Goose falla con:
   - `clickhouse [dsn parse]: http with TLS specify`
3. Con `?secure=false`, otra parte del stack falla con:
   - `Unknown URL parameters: secure`

Esto deja el `webapp` en reinicio y evita la generación del archivo:

- `/home/node/shared/worker_token`

Como consecuencia, el `supervisor` también reinicia porque no encuentra ese token.

## Evidencia útil

- Fuente oficial del self-host Docker:
  - [https://trigger.dev/docs/open-source-self-hosting](https://trigger.dev/docs/open-source-self-hosting)
  - [https://trigger.dev/docs/self-hosting/docker](https://trigger.dev/docs/self-hosting/docker)
- Repo oficial:
  - [https://github.com/triggerdotdev/trigger.dev](https://github.com/triggerdotdev/trigger.dev)
- Nota interna del repo que apunta al bug relacionado:
  - `.server-changes/fix-clickhouse-query-client-secure-param.md`

## Ajustes realizados durante la prueba

- Se clonó el repo oficial.
- Se configuró `hosting/docker/.env`.
- Se probó con `v4-beta`.
- Se corrigió localmente `CLICKHOUSE_URL`.
- Se actualizó la imagen a `v4.1.2`.
- Se volvió a probar el stack completo.

## Conclusión

Trigger.dev es viable como candidato arquitectónico, pero el self-host oficial probado hoy no queda suficientemente estable para adoptarlo como base principal del core de Sofía sin parchear imagen o mantener fork propio.

## Recomendación

- Mantener Trigger.dev como candidato secundario.
- Mantener Temporal OSS como referencia fuerte de durabilidad.
- Si se quiere seguir con rival open source gratis y más operable hoy, comparar ahora con otra alternativa open source seria antes de adoptarla como motor principal.
