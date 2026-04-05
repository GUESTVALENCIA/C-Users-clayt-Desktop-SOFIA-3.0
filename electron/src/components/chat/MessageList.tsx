import { useEffect, useRef } from 'react'
import { Bot, CheckCircle2, CircleAlert, LoaderCircle, Shuffle } from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { StreamingIndicator } from './StreamingIndicator'
import type { ChatMessage } from '../../app/App'
import type { RouterNotice, ToolTraceItem } from '../../types'

interface MessageListProps {
  messages: ChatMessage[]
  streamingText: string
  isStreaming: boolean
  toolTrace: ToolTraceItem[]
  routerNotice: RouterNotice | null
}

export function MessageList({ messages, streamingText, isStreaming, toolTrace, routerNotice }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText, toolTrace])

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex h-full items-center justify-center overflow-y-auto p-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl" style={{
              background: 'radial-gradient(circle at 30% 30%, #38bdf8, #6366f1)',
              boxShadow: '0 20px 50px rgba(99,102,241,.4)',
            }} />
            <h2 className="text-4xl font-black text-text mb-4 text-glow tracking-tighter">CENTRO DE MANDO PROACTOR</h2>
            <p className="text-lg text-muted max-w-2xl mx-auto leading-relaxed">
              Soberanía Digital activada. <span className="text-accent font-bold">Juliet (Yulex)</span> orquestando la producción
              multimedia y la red de agentes autónomos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-[2rem] bg-panel-2 border border-line card-shadow group hover:border-accent/50 transition-all duration-500">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/70">Workers Live</span>
              </div>
              <div className="text-3xl font-black text-text group-hover:scale-105 transition-transform origin-left">12</div>
              <div className="text-xs text-muted mt-1 font-medium">Agentes G4F operando sin límites.</div>
            </div>

            <div className="p-6 rounded-[2rem] bg-panel-2 border border-line card-shadow group hover:border-accent/50 transition-all duration-500">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                  <Shuffle size={20} className="group-hover:rotate-180 transition-transform duration-700" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/70">Shared Vision</span>
              </div>
              <div className="text-3xl font-black text-text">SYNC</div>
              <div className="text-xs text-muted mt-1 font-medium">Neon DB + SuperMemory conectadas.</div>
            </div>

            <div className="p-6 rounded-[2rem] bg-panel-2 border border-line card-shadow group hover:border-accent/50 transition-all duration-500">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Bot size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/70">Orchestrator</span>
              </div>
              <div className="text-3xl font-black text-text">YULEX</div>
              <div className="text-xs text-muted mt-1 font-medium">Modo Senior Expert Developer activo.</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-[2.5rem] bg-panel border border-line/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <LoaderCircle size={80} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-accent mb-4">Tareas Locales Pendientes</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-panel-2 border border-line text-xs font-medium text-text group-hover:translate-x-2 transition-transform">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Sincronización de repositorios Paperclip...
                </div>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-panel-2 border border-line text-xs font-medium text-text group-hover:translate-x-2 transition-transform delay-75">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Optimización de pipeline de audio Perplexity-level...
                </div>
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-panel border border-line/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <CheckCircle2 size={80} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400 mb-4">Últimas Sesiones</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-panel-2 border border-line text-xs font-medium text-text/60 group-hover:translate-x-2 transition-transform">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  Rediseño UI Proactor Galaxy v2
                </div>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-panel-2 border border-line text-xs font-medium text-text/60 group-hover:translate-x-2 transition-transform delay-75">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  Configuración inicial de Neon DB Juliet
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-4">
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {routerNotice && (
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center" style={{
            background: 'radial-gradient(circle at 30% 30%, #f59e0b, #ea580c)',
          }}>
            <Shuffle size={16} className="text-white" />
          </div>
          <div className="max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-panel-2 border border-amber-400/30 text-text">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
              Router Automatico
            </div>
            <div className="text-sm text-text">
              {routerNotice.fromProvider} saturado. Cambio automatico a {routerNotice.toProvider}.
            </div>
            <div className="mt-2 text-xs text-muted">
              {routerNotice.fromModel} {'->'} {routerNotice.toModel}
            </div>
            <div className="mt-1 text-xs text-amber-100/80">
              {routerNotice.reason}
            </div>
          </div>
        </div>
      )}
      {toolTrace.length > 0 && (
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center" style={{
            background: 'radial-gradient(circle at 30% 30%, #7dd3fc, #2563eb)',
          }}>
            <Bot size={16} className="text-white" />
          </div>
          <div className="max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-panel-2 border border-line text-text">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
              Tools En Ejecucion
            </div>
            <div className="space-y-2">
              {toolTrace.map(tool => (
                <div key={tool.id} className="rounded-2xl border border-line bg-panel px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-text">{tool.name || 'tool'}</div>
                    <div className="flex items-center gap-2 text-xs">
                      {tool.status === 'running' && (
                        <>
                          <LoaderCircle size={14} className="animate-spin text-cyan-300" />
                          <span className="text-cyan-200">running</span>
                        </>
                      )}
                      {tool.status === 'done' && (
                        <>
                          <CheckCircle2 size={14} className="text-emerald-300" />
                          <span className="text-emerald-200">done</span>
                        </>
                      )}
                      {tool.status === 'error' && (
                        <>
                          <CircleAlert size={14} className="text-rose-300" />
                          <span className="text-rose-200">error</span>
                        </>
                      )}
                    </div>
                  </div>
                  {tool.summary && (
                    <div className="mt-2 text-xs text-muted">
                      {tool.summary}
                    </div>
                  )}
                  {tool.argsText && (
                    <pre className="mt-2 overflow-x-auto rounded-xl border border-line/80 bg-panel-2 px-3 py-2 text-[11px] text-muted whitespace-pre-wrap break-words">
                      {tool.argsText}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {isStreaming && streamingText && (
        <MessageBubble message={{
          id: 'streaming',
          role: 'assistant',
          content: streamingText,
          createdAt: Date.now(),
        }} />
      )}
      {isStreaming && !streamingText && toolTrace.length === 0 && (
        <StreamingIndicator />
      )}
      <div ref={bottomRef} />
    </div>
  )
}
