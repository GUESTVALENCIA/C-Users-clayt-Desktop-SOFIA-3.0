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
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl" style={{
            background: 'radial-gradient(circle at 30% 30%, #7dd3fc, #2563eb)',
            boxShadow: '0 10px 40px rgba(37,99,235,.3)',
          }} />
          <h2 className="text-xl font-semibold text-text mb-2">Hola, Clay</h2>
          <p className="text-sm text-muted max-w-md">
            Soy Sofía, tu asistente personal. Escribe un mensaje o inicia una conversación de voz.
          </p>
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
