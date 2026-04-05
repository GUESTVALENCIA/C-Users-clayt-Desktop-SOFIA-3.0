import { useEffect, useRef, useState } from 'react'
import { Mic, Phone, PhoneIncoming, PhoneOff, Video } from 'lucide-react'
import type { ChatMessage } from '../../app/App'

type CallState = 'ringing' | 'connecting' | 'listening' | 'speaking' | 'ended'
type CallMode = 'voice' | 'avatar'
type CallDirection = 'incoming' | 'outgoing'
type CallActor = 'sofia' | 'sandra' | 'jules'

interface AvatarScene {
  id: string
  label: string
  imageUrl: string | null
  videoUrl: string | null
}

interface VoiceCallModalProps {
  messages: ChatMessage[]
  mode: CallMode
  direction: CallDirection
  actor: CallActor
  onClose: (status?: 'completed' | 'dismissed') => void
}

export function VoiceCallModal({ mode, direction, actor, onClose }: VoiceCallModalProps) {
  const [state, setState] = useState<CallState>(direction === 'incoming' ? 'ringing' : 'connecting')
  const [error, setError] = useState('')
  const [transcript, setTranscript] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [avatarScene, setAvatarScene] = useState<AvatarScene | null>(null)
  const [avatarReady, setAvatarReady] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef(0)
  const ringtoneCtxRef = useRef<AudioContext | null>(null)
  const ringtoneTimerRef = useRef<number | null>(null)
  const callbackQueuedRef = useRef(false)

  useEffect(() => {
    void loadAvatarScene()
    if (direction === 'outgoing') {
      void startCall()
    }
    return () => {
      stopRingtone()
      stopCall()
    }
  }, [])

  useEffect(() => {
    if (state === 'ringing' || state === 'connecting') {
      void startRingtone()
    } else {
      stopRingtone()
    }
  }, [state])

  async function loadAvatarScene() {
    if (mode !== 'avatar') return
    try {
      const response = await window.sofia.voice.listAvatarScenes()
      const nextScene = response.scenes?.[0] ?? null
      setAvatarScene(nextScene)
    } catch {
      setAvatarScene(null)
    }
  }

  async function startCall() {
    setState('connecting')
    setError('')
    try {
      void playClick() // Click al conectar
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      })

      audioCtxRef.current = new AudioContext({ sampleRate: 24000 })
      analyserRef.current = audioCtxRef.current.createAnalyser()
      analyserRef.current.fftSize = 512
      const micSource = audioCtxRef.current.createMediaStreamSource(mediaStreamRef.current)
      micSource.connect(analyserRef.current)
      startWaveform()

      // Gateway WebSocket removed - voice uses Deepgram direct
      // wsRef.current = null

      wsRef.current.onopen = () => {
        sessionIdRef.current = `sofia3-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        wsRef.current?.send(
          JSON.stringify({
            type: 'voice_realtime_init',
            data: {
              sessionId: sessionIdRef.current,
              source: 'sofia3',
              metadata: {
                authorityRoute: { provider: 'g4f', model: 'gpt-4o' },
                voiceLane: { provider: 'deepgram', model: 'nova-2' },
                ttsLane: { provider: 'deepgram', model: 'aura-2-carina-es' },
              },
            },
          }),
        )
      }

      wsRef.current.onmessage = async event => {
        if (typeof event.data !== 'string') return
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'voice_session_ready') {
            setState('listening')
            startSendingAudio()
            return
          }
          if (msg.type === 'transcript_partial' || msg.type === 'transcript_final') {
            setTranscript(msg.data?.text || '')
            return
          }
          if (msg.type === 'assistant_audio') {
            setState('speaking')
            const audioBase64 = msg.data?.audio
            if (audioBase64) {
              const binary = atob(audioBase64)
              const bytes = new Uint8Array(binary.length)
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
              await playAudio(new Blob([bytes], { type: msg.data?.mimeType || 'audio/mpeg' }))
            }
            setState('listening')
            return
          }
          if (msg.type === 'voice_error') {
            setError(msg.data?.error || 'Error de voz')
            return
          }
          if (msg.type === 'voice_media_status') {
            setStatusNote(`Generando ${msg.data?.kind || 'media'}...`)
            return
          }
          if (msg.type === 'voice_media_result') {
            setStatusNote(`Media lista: ${msg.data?.kind || 'asset'}`)
            await loadAvatarScene()
            return
          }
          if (msg.type === 'voice_media_error') {
            setStatusNote(`Fallo media: ${msg.data?.error || 'sin detalle'}`)
            return
          }
          if (msg.type === 'shadow_task' && msg.data?.task?.intent === 'callback-followup' && !callbackQueuedRef.current) {
            callbackQueuedRef.current = true
            await window.sofia.voice.queueCallback({
              actor: 'sandra',
              mode,
              reason: msg.data?.task?.description || 'Seguimiento Proactor pendiente',
              sceneId: avatarScene?.id ?? null,
              source: 'voice-shadow-task',
              voiceSessionId: sessionIdRef.current,
              delayMs: 4000,
            })
            setStatusNote('Callback programado.')
            return
          }
        } catch {}
      }

      wsRef.current.onerror = err => {
        setError('Conexion perdida')
        console.error('[voice] WS error:', err)
      }

      wsRef.current.onclose = () => {
        setState('ended')
      }
    } catch (e: any) {
      setError(e.message || 'Error al conectar')
      setState('ended')
    }
  }

  function startSendingAudio() {
    if (!mediaStreamRef.current || !wsRef.current) return
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
      mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current, { mimeType })
      mediaRecorderRef.current.ondataavailable = async e => {
        if (e.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          const buffer = await e.data.arrayBuffer()
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
          wsRef.current.send(
            JSON.stringify({
              type: 'voice_audio_chunk',
              data: {
                sessionId: sessionIdRef.current,
                audio: base64,
                mimeType,
              },
            }),
          )
        }
      }
      mediaRecorderRef.current.start(250)
    } catch (e) {
      console.error('[voice] MediaRecorder error:', e)
    }
  }

  async function playAudio(blob: Blob) {
    if (!audioCtxRef.current) return
    try {
      const buffer = await blob.arrayBuffer()
      const audioBuffer = await audioCtxRef.current.decodeAudioData(buffer)
      const source = audioCtxRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioCtxRef.current.destination)
      source.start()
    } catch {}
  }

  function stopCall() {
    cancelAnimationFrame(rafRef.current)

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'voice_control',
          data: {
            sessionId: sessionIdRef.current,
            action: 'stop',
            reason: 'user-ended',
          },
        }),
      )
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch {}
    }
    mediaRecorderRef.current = null

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    if (wsRef.current) {
      try {
        wsRef.current.close()
      } catch {}
      wsRef.current = null
    }

    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      void audioCtxRef.current.close()
      audioCtxRef.current = null
    }
  }

  async function playClick() {
    const ctx = new AudioContext()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, now)
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(now + 0.1)
    setTimeout(() => void ctx.close(), 200)
  }

  async function startRingtone() {
    stopRingtone()
    const ctx = new AudioContext()
    ringtoneCtxRef.current = ctx

    const pulse = async () => {
      if (!ringtoneCtxRef.current) return
      const now = ctx.currentTime

      // Ringtone: 2 segundos de tono, 4 segundos de silencio (estilo europeo/telefónico)
      // Pero el usuario pidió "3 ringtones largos"
      const oscillatorA = ctx.createOscillator()
      const oscillatorB = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillatorA.type = 'sine'
      oscillatorB.type = 'sine'
      oscillatorA.frequency.setValueAtTime(425, now)
      oscillatorB.frequency.setValueAtTime(450, now)

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.1, now + 0.1)
      gain.gain.linearRampToValueAtTime(0.1, now + 1.9)
      gain.gain.linearRampToValueAtTime(0, now + 2.0)

      oscillatorA.connect(gain)
      oscillatorB.connect(gain)
      gain.connect(ctx.destination)

      oscillatorA.start(now)
      oscillatorB.start(now)
      oscillatorA.stop(now + 2.1)
      oscillatorB.stop(now + 2.1)
    }

    await pulse()
    ringtoneTimerRef.current = window.setInterval(() => {
      void pulse()
    }, 4000)
  }

  function stopRingtone() {
    if (ringtoneTimerRef.current) {
      window.clearInterval(ringtoneTimerRef.current)
      ringtoneTimerRef.current = null
    }
    if (ringtoneCtxRef.current && ringtoneCtxRef.current.state !== 'closed') {
      void ringtoneCtxRef.current.close()
    }
    ringtoneCtxRef.current = null
  }

  function startWaveform() {
    const draw = () => {
      if (!analyserRef.current || !canvasRef.current) return
      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return
      const buf = new Float32Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getFloatTimeDomainData(buf)
      ctx.clearRect(0, 0, 300, 100)
      ctx.strokeStyle = '#7dd3fc'
      ctx.lineWidth = 2
      ctx.beginPath()
      const sliceWidth = 300 / buf.length
      let x = 0
      for (let i = 0; i < buf.length; i++) {
        const y = buf[i] * 40 + 50
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
        x += sliceWidth
      }
      ctx.stroke()
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
  }

  const stateLabels: Record<CallState, string> = {
    ringing: direction === 'incoming' ? 'Llamada entrante' : 'Llamando...',
    connecting: 'Conectando...',
    listening: 'Escuchando...',
    speaking: 'Hablando...',
    ended: 'Finalizada',
  }

  const stateColors: Record<CallState, string> = {
    ringing: '#fcd34d',
    connecting: '#fcd34d',
    listening: '#86efac',
    speaking: '#93c5fd',
    ended: '#9aa6b2',
  }

  const actorLabel = actor === 'jules' ? 'Julie (Yulex)' : actor === 'sandra' ? 'Sandra' : 'Sofia'
  const canAcceptIncoming = direction === 'incoming' && state === 'ringing'

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/95 backdrop-blur-xl">
      {direction === 'incoming' && state === 'ringing' && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-md animate-in slide-in-from-top-10 duration-500">
          <div className="mx-4 p-6 rounded-[2.5rem] bg-panel-2 border border-accent/50 card-shadow flex items-center gap-5">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-white shadow-lg shadow-accent/20">
              <PhoneIncoming size={32} />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-accent mb-1">HandOff Detectado</div>
              <div className="text-lg font-bold text-text">Llamada de {actorLabel}</div>
              <div className="text-xs text-muted font-medium mt-1">"Hola Jules" wake-word activada.</div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
          {actorLabel} · {mode === 'avatar' ? 'Avatar call' : 'Voice call'}
        </div>
        <div className="mt-2 text-2xl font-semibold text-text">{stateLabels[state]}</div>
        {statusNote && <div className="mt-2 text-sm text-muted">{statusNote}</div>}
      </div>

      <div className="mb-8 w-full max-w-3xl px-6">
        <div className="relative overflow-hidden rounded-[32px] border border-line bg-panel-2/90 shadow-2xl">
          <div className="aspect-video w-full bg-bg">
            {mode === 'avatar' && avatarScene?.imageUrl && (
              <img
                src={avatarScene.imageUrl}
                alt={avatarScene.label}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                  avatarReady && avatarScene.videoUrl ? 'opacity-0' : 'opacity-100'
                }`}
              />
            )}
            {mode === 'avatar' && avatarScene?.videoUrl && (
              <video
                src={avatarScene.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                onCanPlay={() => setAvatarReady(true)}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                  avatarReady && state !== 'ringing' ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent" />
            <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-line bg-bg/70 px-3 py-2 text-sm text-text">
              {direction === 'incoming' ? <PhoneIncoming size={16} /> : mode === 'avatar' ? <Video size={16} /> : <Phone size={16} />}
              {actorLabel}
            </div>
            {mode === 'voice' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div
                  className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, #7dd3fc, #2563eb)',
                    boxShadow: `0 0 ${state === 'speaking' ? 60 : 20}px rgba(37,99,235,.4)`,
                    transition: 'box-shadow 0.3s',
                  }}
                >
                  {state === 'listening' ? <Mic size={32} className="text-white" /> : <Phone size={32} className="text-white" />}
                </div>
                <canvas ref={canvasRef} width={300} height={100} className="mx-auto" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full animate-pulse" style={{ background: stateColors[state] }} />
        <span className="text-sm text-text">{transcript ? `"${transcript}"` : stateLabels[state]}</span>
      </div>

      {error && <p className="mb-4 text-sm text-error">{error}</p>}

      <div className="flex items-center gap-3">
        {canAcceptIncoming ? (
          <>
            <button
              onClick={() => {
                void playClick()
                setState('connecting')
                void startCall()
              }}
              className="rounded-full bg-emerald-500 px-6 py-4 font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Aceptar
            </button>
            <button
              onClick={() => {
                stopCall()
                onClose('dismissed')
              }}
              className="rounded-full bg-red-500 px-6 py-4 font-semibold text-white transition-colors hover:bg-red-600"
            >
              Rechazar
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              stopCall()
              onClose('completed')
            }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 transition-colors hover:bg-red-600"
          >
            <PhoneOff size={24} className="text-white" />
          </button>
        )}
      </div>
    </div>
  )
}
