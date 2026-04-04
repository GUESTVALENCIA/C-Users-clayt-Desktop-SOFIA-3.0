# SOFIA 3.0 — Agente de Voz e IA Hiperrealista

Aplicación de escritorio (Electron + React) para la orquestación de **Sofía**, un agente de voz proactivo especializado en la generación de contenido viral hiperrealista.

## Estado dinámico
- Última actualización: 2026-04-03
- Versión app: 3.0.0
- Motor LLM: G4F (Ilimitado) + OpenRouter
- Motor Voz: Deepgram (Aura-2 Karina-ES)
- Memoria: Neon PostgreSQL (Persistente)
- Pipeline: Generación de Avatar (Imagen a Vídeo)

## Prioridad de consulta
1. G4F (Modelos gratuitos y estables)
2. OpenRouter (Modelos de alta calidad)
3. Biblioteca RAG RACK de prompts cinematográficos
4. Memoria persistente Neon

## Snapshot operativo
- Agente principal: Sofia
- Pipeline de medios: G4F Media Pipeline (Imágenes + Vídeos)
- Integración de Voz: Deepgram con soporte para interrupción (Barge-in)
- Modo Worker: Automatización de tareas repetitivas de producción

## Comandos
```bash
npm run dev
npm run build
npm run sync:public-apis
npm run sync:docs
```

## Política de integración
- **Sofía** es el único nombre oficial y la identidad principal del sistema.
- Se prioriza el realismo cinematográfico y la interconexión total entre voz, imagen y vídeo.
- No OpenClaw: El sistema es independiente de OpenClaw y utiliza G4F nativo.
- Todo lo visible debe estar conectado al estado real o marcado adecuadamente.
