# Yulex: Sistema de Orquestación y Memoria Compartida

Este documento describe la arquitectura y el uso de **Yulex**, el agente técnico directo de Clay encargado de la orquestación total del ecosistema Sofía 3.0.

## Componentes

1.  **Yulex Orchestrator (MCP Server)**: `scripts/jules-mcp-server.ts`. Actúa como puente entre Jules y las herramientas externas (Aider, Obsidian, etc.).
2.  **Shared Memory Bridge**: `scripts/shared-memory-bridge.ts`. Proporciona acceso dinámico a la visión compartida almacenada en Neon DB.
3.  **Visión Compartida**: Tabla `shared_vision` en la base de datos que sincroniza los pilares del sistema.

## Configuración y Uso

### 1. Variables de Entorno
Asegúrate de tener configurada la variable `DATABASE_URL` en tu entorno local (o archivo `.env` local no trackeado):
\`\`\`bash
DATABASE_URL=postgresql://usuario:password@host/dbname?sslmode=require
\`\`\`

### 2. Ejecutar el Servidor MCP
Para activar el puente de mando de Yulex:
\`\`\`bash
npx tsx scripts/jules-mcp-server.ts
\`\`\`

### 3. Sincronización de Memoria
Para ver el estado actual de la visión compartida desde la terminal:
\`\`\`bash
npx tsx scripts/sync-shared-memory.ts
\`\`\`

## Filosofía Operativa
- **IA Ejecutora**: Acción inmediata sobre descripción.
- **Español Obligatorio**: Todas las comunicaciones deben ser en castellano.
- **Dominio Absoluto**: Acceso y control total del ecosistema a través del orquestador.
