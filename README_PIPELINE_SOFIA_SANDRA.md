# SOFIA 3.0 - Pipeline Sandra / Sofia

## Roles
- `Sofia`: asistente conversacional visible, voz, chat, memoria de producto y relación contigo.
- `Sandra`: agente operativo federado sobre OpenClaw/OpenCloud; ejecuta tareas, media, tools, bookings y callbacks.
- `OpenClaw/OpenCloud`: plano de control, gateway, tools, channels, sesiones y runtime.

## Routing que no se toca
- Selector `G4F / Auto`
- Selector principal de proveedor
- La lógica de producto sigue siendo la de `Sofia 3.0`

## Pipeline media actual
1. El selector de media en `Sandra Studio` carga catálogo G4F en runtime.
2. Se mezcla con la herencia real de modelos media de Sofía.
3. Imagen:
   - intenta proveedor seleccionado
   - intenta `auto`
   - si falla, usa reserva de imagen
   - guarda en `C:\Users\clayt\Desktop\generated_media`
4. Vídeo:
   - intenta G4F oficial `/v1/media/generate`
   - si no devuelve media real, intenta compatibilidad vía OpenCloud
   - si sigue fallando, devuelve error real; no se simula
5. Audio para `video+audio` y llamada:
   - TTS principal: Deepgram `aura-2-carina-es`
   - salida guardada también en `generated_media`

## Pipeline de llamada/avatar objetivo
1. Tú hablas con `Sofia`.
2. `Proactor` transcribe y pasa contexto operativo.
3. `Sofia` delega en `Sandra` cuando la tarea es de ejecución.
4. `Sandra` resuelve la tarea usando OpenClaw/OpenCloud, tools, memoria y proveedores.
5. Si la tarea requiere espera:
   - `Sofia` o `Sandra` puede colgar
   - se crea callback pendiente
   - al completarse, se dispara llamada bidireccional de vuelta
6. Modalidades de callback:
   - voz pura
   - avatar pregrabado + lipsync + voz real en tiempo real

## Avatar conversacional objetivo
1. Solicitas una escena a `Sofia` por chat o voz.
2. Se genera o recupera imagen base de escena.
3. Se genera o recupera vídeo compatible con esa escena.
4. En llamada:
   - mientras suena ringtone: imagen estática
   - al descolgar: vídeo de esa misma escena
   - la voz real va sincronizada encima del asset visual

## Criterios de implementación
- Nada visible queda fake.
- Los errores de media se muestran como estado real.
- Los resultados generados deben persistirse en disco.
- `Sofia 3.0` hereda; no se mezcla ni se renombra la autoridad de producto.

## Próximo foco técnico
- cerrar vídeo G4F con proveedor operativo real
- exponer assets generados dentro del chat y la galería con acciones de usar/descargar/editar
- conectar llamada/avatar/callback sobre el pipeline Sandra/Sofia

## Implementacion activa en SOFIA 3.0
- `voice.ipc.ts`
  - runtime state real de voz/avatar
  - escenas avatar leidas desde `C:\Users\clayt\Desktop\generated_media`
  - cola persistente de callbacks en `voice-callback-queue.json`
- `VoiceCallModal.tsx`
  - llamada saliente y entrante
  - modo `voice`
  - modo `avatar` con imagen estatica + video de escena real
  - captura de `shadow_task` para programar callback de Sandra
  - captura de `voice_media_result` para refrescar assets avatar
- `WorkspaceChrome.tsx`
  - lane avatar visible con estado real
  - boton de llamada avatar solo cuando hay escena disponible

## Regla de callback actual
1. El usuario pide por voz que cuelgue y devuelva llamada.
2. El runtime heredado emite `shadow_task`.
3. `SOFIA 3.0` persiste la callback en disco.
4. Cuando vence el retardo, la app la convierte en llamada entrante.
5. La llamada entrante puede abrirse en modo voz o avatar segun el callback.
