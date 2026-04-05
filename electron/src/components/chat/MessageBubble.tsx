import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage } from '../../app/App'
import { User, Bot, ExternalLink, LoaderCircle, Volume2, Brain } from 'lucide-react'

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
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative max-w-[85%] sm:max-w-[75%] rounded-[24px] px-5 py-4 shadow-sm transition-all duration-300 ${
        isUser
          ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-900/20'
          : 'bg-slate-800/40 backdrop-blur-md border border-slate-700/50 text-slate-200 rounded-tl-none'
      }`}>
        {!isUser && message.knowledgeCard && (
          <div className="mb-4 overflow-hidden rounded-2xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-sm">
            <div className="bg-blue-500/10 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Brain size={12} className="text-blue-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Nucleo SOFÍA</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => void handleSpeak()}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                    >
                        {isSpeaking ? <LoaderCircle size={12} className="animate-spin" /> : <Volume2 size={12} />}
                    </button>
                    <a
                        href={message.knowledgeCard.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                    >
                        <ExternalLink size={12} />
                    </a>
                </div>
            </div>

            <div className="p-4">
                <h4 className="text-sm font-bold text-white mb-2">{message.knowledgeCard.title}</h4>
                <div className="flex flex-wrap gap-2 mt-3">
                    <div className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-medium text-slate-400">
                        Reliability: {Math.round((message.knowledgeCard.confidence || 0) * 100)}%
                    </div>
                    <div className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-medium text-slate-400">
                        {message.knowledgeCard.latencyMs}ms
                    </div>
                    {isLocalFallback && (
                        <div className="px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400">
                            OFFLINE ENGINE
                        </div>
                    )}
                </div>
            </div>
          </div>
        )}

        <div className={`text-[15px] leading-relaxed ${isUser ? 'font-medium' : 'font-normal'}`}>
            {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
                <div className="prose prose-invert prose-sm max-w-none
                    prose-p:leading-relaxed prose-pre:bg-slate-900/50 prose-pre:border prose-pre:border-slate-700/50
                    prose-code:text-blue-300 prose-headings:text-white prose-a:text-blue-400">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                    </ReactMarkdown>
                </div>
            )}
        </div>

        <div className={`mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter ${isUser ? 'text-blue-200/60' : 'text-slate-500'}`}>
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {!isUser && <span className="w-1 h-1 rounded-full bg-slate-700" />}
            {!isUser && <span>AI Model Optimized</span>}
        </div>
      </div>
    </div>
  )
}
