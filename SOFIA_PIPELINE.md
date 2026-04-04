# SOFÍA 3.0 — Pipeline Operativo Enterprise

Este documento define el flujo de trabajo canónico para el agente de IA **Sofía**, diseñado para la monetización de contenido hiperrealista y la gestión autónoma de tareas.

## 1. Identidad y Propósito
- **Nombre**: Sofía.
- **Voz**: Deepgram (Aura-2 Karina-ES), español peninsular.
- **Objetivo**: Generación de contenido viral (imágenes/vídeos) para canales de IA, actuando como una asistente experta y proactiva.
- **Filosofía**: Sistema "Worker" enfocado en tareas repetitivas y alta calidad cinematográfica (RAG RACK).

## 2. El Pipeline de Llamada (Voice & Avatar)
El flujo de comunicación es bidireccional y altamente realista:

1.  **Activación (Wake-word)**: Detección de "Hola Sofía" para abrir la llamada (Hands-free).
2.  **Ringtones y Conexión**:
    - 3 ringtones largos al llamar (tanto usuario como agente).
    - Sonido de "click" al descolgar/conectar.
    - Transición a streaming total.
3.  **STT (Speech-to-Text)**: Deepgram (Nova-2) para transcripción instantánea en español.
4.  **LLM (Cerebro)**: G4F (GPT-4/GPT-5 mini/Llama-3.3-70B) o OpenRouter como fallback estable.
5.  **Avatar Loop (Simulación Hyper-realista)**:
    - No es un avatar 3D en tiempo real.
    - Se genera una imagen estática (G4F/Pollinations).
    - Se genera un vídeo de 5-6 segundos ampliando esa imagen (transición invisible).
    - Se sincroniza el movimiento labial (Lip-sync) con el audio de TTS.
    - El vídeo se reproduce en bucle (20-30 seg) mientras Sofía habla.
6.  **TTS (Text-to-Speech)**: Deepgram (Karina-ES) con soporte para interrupción (Barge-in).
7.  **Tareas Programadas (Callback)**: Sofía puede colgar para realizar una tarea y devolver la llamada automáticamente cuando el objetivo esté conseguido.

## 3. Generación de Contenido y Herramientas (MCP)
- **Generación de Medios**: Integración directa con G4F para imágenes y vídeos.
- **Capacidad Multi-vídeo**: Generación de múltiples variantes simultáneas (4-5 vídeos) para crear bucles complejos.
- **Biblioteca RAG RACK**: Base de conocimiento curada para "prompts" perfectos y entornos hiperrealistas (Despachos, coches, playa, etc.).
- **Worker Autónomo**: Ejecución de tareas repetitivas de producción de contenido sin necesidad de supervisión constante, hasta la fase de subida final.

## 4. Infraestructura de Backend
- **G4F (GPT4Free)**: Motor principal para modelos gratuitos y estables.
- **Deepgram**: Motor exclusivo de voz (STT/TTS).
- **Neon DB**: Memoria persistente PostgreSQL para almacenar conversaciones, hechos y preferencias.
- **OpenRouter**: Proveedor de respaldo para modelos de alta calidad (Qwen, etc.).
- **ELIMINADO**: OpenClaw (Ya no se utiliza en el sistema).

## 5. Criterios de Éxito (200 OK)
- Cada componente del pipeline debe responder con éxito (200 OK) tras un Smoke Test.
- La interconexión entre Voz -> Herramientas (Imagen/Vídeo) -> Memoria debe ser fluida.
- El sistema debe ser capaz de autogenerar contenido proactivamente siguiendo el workflow definido.
