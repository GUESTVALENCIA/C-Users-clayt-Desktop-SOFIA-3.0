import { Minus, Square, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    let off: (() => void) | undefined

    void (async () => {
      try {
        setIsMaximized(await window.sofia.window.isMaximized())
        off = window.sofia.window.onMaximizedChanged((value: boolean) => setIsMaximized(value))
      } catch {}
    })()

    return () => {
      if (off) off()
    }
  }, [])

  return (
    <div className="drag-region h-[38px] shrink-0 select-none border-b border-line bg-bg px-4">
      <div className="flex h-full items-center justify-between">
        <div className="no-drag flex items-center gap-2">
          <div
            className="h-6 w-6 rounded-lg"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #7dd3fc, #2563eb)',
            }}
          />
          <span className="text-sm font-semibold text-text">SOFIA</span>
          <span className="text-xs text-muted">3.0</span>
        </div>

        <div className="no-drag flex items-center gap-1">
          <button
            onClick={() => void window.sofia.window.minimize()}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-panel-2 text-muted transition-colors hover:border-accent/40 hover:text-text"
            title="Minimizar"
            aria-label="Minimizar"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={() => void window.sofia.window.maximize()}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-panel-2 text-muted transition-colors hover:border-accent/40 hover:text-text"
            title={isMaximized ? 'Restaurar' : 'Maximizar'}
            aria-label={isMaximized ? 'Restaurar' : 'Maximizar'}
          >
            <Square size={12} />
          </button>
          <button
            onClick={() => void window.sofia.window.close()}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-red-500/40 bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20"
            title="Cerrar"
            aria-label="Cerrar"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
