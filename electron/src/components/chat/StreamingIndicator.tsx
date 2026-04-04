import { Bot } from 'lucide-react'

export function StreamingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center" style={{
        background: 'radial-gradient(circle at 30% 30%, #7dd3fc, #2563eb)',
      }}>
        <Bot size={16} className="text-white" />
      </div>
      <div className="bg-panel-2 border border-line rounded-2xl px-4 py-3">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
