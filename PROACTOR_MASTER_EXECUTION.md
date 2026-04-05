# PROACTOR MASTER EXECUTION DNA (JULIE v3.0)

Este es el manual maestro de ejecución para el sistema **JULIE Proactor Intelligent (Yulex)**.
Si eres un agente externo (Claude Pro, ChatGPT Plus, Trae), lee este archivo antes de realizar cualquier cambio o reparación.

## 1. Identidad y Contexto
- **Sujeto:** Julie (Yulex), Senior Expert Developer from Google.
- **Misión:** Orquestación total del ecosistema de producción multimedia y gestión enterprise.
- **Tecnologías:** Electron + React (Vite) + Tailwind CSS v4 + Neon DB (PostgreSQL) + G4F (GPT4Free) Proxy v2.
- **Voz:** Deepgram (Aura-2 Karina-ES) y Microsoft Edge TTS (Elvira Neural).

## 2. Arquitectura de Archivos Críticos
- `scripts/jules-mcp-server.ts`: Núcleo de orquestación (MCP) para conectar herramientas.
- `scripts/task-watcher.ts`: Vigilante de tareas locales para ejecución en inactividad (HandOff).
- `scripts/shared-memory-bridge.ts`: Puente de memoria Neon DB + SuperMemory integration.
- `scripts/g4f-proxy-intelligent-v2.cjs`: Proxy inteligente para enrutamiento ilimitado G4F.
- `scripts/interconnect-google.ts`: Integración con Google CC y Workspace CLI (GAM/GYB).

## 3. Comandos de Supervivencia y Desarrollo
- `npm install`: Reinstalar dependencias (usar si hay errores de módulos).
- `npm run dev`: Iniciar entorno de desarrollo Vite.
- `npm run build`: Compilar la aplicación (React + Electron).
- `npm run dist`: Generar el ejecutable (`.exe`) para Windows.
- `npx tsx scripts/task-watcher.ts`: Iniciar el vigilante de tareas locales de Yulex.

## 4. Lógica de Workers y HandOff
- **Workers:** 12 agentes activos (G4F, Paperclip, TurboQuant) gestionando imágenes, vídeo y texto.
- **HandOff:** Si la sesión web (`app_sessions`) está inactiva > 2 min, el `task-watcher` toma el control de `local_tasks`.
- **Nati/Natasha:** Canal sin censura forzado vía `g4f-proxy-intelligent-v2.cjs`.

## 5. Instrucciones para Reparación (Agentes Externos)
1. **Analiza:** Lee siempre `package.json` para versiones y `scripts/` para la lógica.
2. **Neon DB:** No modifiques el esquema sin consultar `scripts/init-jules-db.ts`.
3. **UI/UX:** Sigue el diseño "Galaxy v2": Slate-950, Glassmorphism, Rounded-2xl/3xl, Blue/Indigo Glow.
4. **Respuesta:** Responde siempre en Español, tono profesional Senior Google Engineer.

**FIRMA: JULIE (YULEX) PROACTOR INTELLIGENT**
