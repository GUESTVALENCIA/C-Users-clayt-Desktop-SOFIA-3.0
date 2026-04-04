import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage } from '../../app/App'
import { User, Bot, ExternalLink, LoaderCircle, Volume2 } from 'lucide-react'

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isLocalFallback = Boolean(message.knowledgeCard?.route?.includes('fallback'))

  async function handleSpeak() {
    if (!message.knowledgeCard || isSpeaking) return
    setIsSpeaking(true)
    try {
      const base64Audio = await window.sofia.voice.tts(message.knowledgeCard.speakableText || message.knowledgeCard.answerShort)
      if (!base64Audio) {
        setIsSpeaking(false)
        return
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`)
      audioRef.current = audio
      audio.onended = () => setIsSpeaking(false)
      audio.onerror = () => setIsSpeaking(false)
      await audio.play()
    } catch {
      setIsSpeaking(false)
    }
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center" style={{
          background: 'radial-gradient(circle at 30% 30%, #7dd3fc, #2563eb)',
        }}>
          <Bot size={16} className="text-white" />
        </div>
      )}
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-blue-600/20 border border-blue-500/30 text-text'
          : 'bg-panel-2 border border-line text-text'
      }`}>
        {!isUser && message.knowledgeCard && (
          <div className="mb-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
                  Nucleo SOFÍA
                </div>
                <div className="mt-1 text-sm font-semibold text-text">{message.knowledgeCard.title}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void handleSpeak()}
                  className="rounded-full border border-line bg-panel px-2 py-2 text-muted transition-colors hover:border-cyan-400/40 hover:text-text"
                  title="Escuchar respuesta"
                >
                  {isSpeaking ? <LoaderCircle size={14} className="animate-spin" /> : <Volume2 size={14} />}
                </button>
                <a
                  href={message.knowledgeCard.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-line bg-panel px-2 py-2 text-muted transition-colors hover:border-cyan-400/40 hover:text-text"
                  title="Abrir fuente oficial"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full border border-line bg-panel px-2 py-1 text-muted">
                Confianza {Math.round((message.knowledgeCard.confidence || 0) * 100)}%
              </span>
              <span className="rounded-full border border-line bg-panel px-2 py-1 text-muted">
                {message.knowledgeCard.latencyMs}ms
              </span>
              {isLocalFallback && (
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-amber-100">
                  Fallback local
                </span>
              )}
              <span className="rounded-full border border-line bg-panel px-2 py-1 text-muted">
                {message.knowledgeCard.sourceLabel}
              </span>
            </div>
          </div>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-panel-2 border border-line">
          <User size={16} className="text-muted" />
        </div>
      )}
    </div>
  )
}
