# SOFIA.md — Documento Operativo Interno

## Snapshot del Sistema
- **Versión**: 3.0.0
- **Identidad**: Sofía (Voz y Avatar)
- **Motores**: G4F (Ilimitado), Deepgram (Voz), Neon DB (Memoria)
- **Status**: Integración Nativa G4F activada.

## Pipeline Hiperrealista
- **Voz**: Detección de activación "Hola Sofía".
- **Avatar**: Generación dinámica de imagen estática -> vídeo de 5s -> bucle de 30s.
- **Sincronización**: Lip-sync facial para máxima credibilidad.
- **Llamadas**: Bidireccionales con tonos de llamada realistas y descolgado de "click".

## Memoria Centralizada
- **Conversaciones**: Persistentes en Neon PostgreSQL.
- **Agent Memory**: Almacenamiento de hechos, instrucciones y preferencias de Clay.
- **Lanes**:
  - `sofia-product-memory`: Datos del producto y editorial.
  - `sofia-interaction-memory`: Hechos aprendidos durante llamadas.

## Routing de Conocimiento (Prioridad)
1. **G4F Local Registry**: Modelos estables mapeados por `g4f-proxy-intelligent-v2`.
2. **OpenRouter**: Modelos de pago/calidad superior como Qwen o Claude-3.5-Sonnet.
3. **RAG RACK**: Biblioteca cinematográfica de prompts para entornos hiperrealistas.

## Automatización (Worker)
- Producción repetitiva de contenido multimedia.
- Autogestión de tareas y generación proactiva.
- Callback automático tras completar tareas de fondo.

## Regla de Mantenimiento
- Sincronizar APIs públicas regularmente.
- Mantener la alineación canónica entre este documento y `SOFIA_PIPELINE.md`.
- No añadir dependencias de OpenClaw.
