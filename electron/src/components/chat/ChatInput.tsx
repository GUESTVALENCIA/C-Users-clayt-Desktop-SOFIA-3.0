import { useState, useRef, useEffect } from 'react'
import { Send, Square, Mic, Paperclip, X } from 'lucide-react'

interface FileAttachment {
  name: string
  type: string
  data: string // base64
  size: number
}

interface ChatInputProps {
  onSend: (text: string, attachment?: FileAttachment) => void
  onAbort: () => void
  isStreaming: boolean
}

export function ChatInput({ onSend, onAbort, isStreaming }: ChatInputProps) {
  const [text, setText] = useState('')
  const [attachment, setAttachment] = useState<FileAttachment | null>(null)
  const [isDictating, setIsDictating] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const baseTextRef = useRef('')
  const speechSupported = Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

  useEffect(() => {
    if (!isStreaming) textareaRef.current?.focus()
  }, [isStreaming])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
    }
  }, [])

  function handleSubmit() {
    if (isStreaming) {
      onAbort()
      return
    }
    if (!text.trim() && !attachment) return
    onSend(text.trim(), attachment || undefined)
    setText('')
    setAttachment(null)
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipos soportados
    const supportedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'text/plain', 'text/markdown',
      'application/json',
      'text/csv'
    ]

    if (!supportedTypes.includes(file.type)) {
      alert('Tipo de archivo no soportado. Usa imágenes, PDF, o archivos de texto.')
      return
    }

    // Límite de tamaño: 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('Archivo muy grande. Máximo 10MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const data = event.target?.result as string
      const base64 = data.split(',')[1] // Remove data:image/... prefix
      setAttachment({
        name: file.name,
        type: file.type,
        data: base64,
        size: file.size,
      })
    }
    reader.readAsDataURL(file)
  }

  function clearAttachment() {
    setAttachment(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleInput() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  function toggleDictation() {
    if (!speechSupported) return

    if (isDictating) {
      try { recognitionRef.current?.stop() } catch {}
      setIsDictating(false)
      return
    }

    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionCtor) return

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognitionCtor()
      recognition.lang = 'es-ES'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.onresult = (event: any) => {
        let transcript = ''
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          transcript += event.results[index][0]?.transcript ?? ''
        }
        const nextText = `${baseTextRef.current}${transcript}`.trimStart()
        setText(nextText)
        requestAnimationFrame(handleInput)
      }
      recognition.onerror = () => {
        setIsDictating(false)
      }
      recognition.onend = () => {
        setIsDictating(false)
        baseTextRef.current = ''
      }
      recognitionRef.current = recognition
    }

    baseTextRef.current = text ? `${text} ` : ''
    setIsDictating(true)
    try {
      recognitionRef.current.start()
    } catch {
      setIsDictating(false)
    }
  }

  return (
    <div className="rounded-[28px] border border-line bg-panel/95 p-4 shadow-[0_22px_60px_rgba(15,23,42,0.28)] backdrop-blur-xl">
      {/* Attachment preview */}
      {attachment && (
        <div className="mb-3 p-3 bg-panel-2 border border-line rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Paperclip size={16} className="text-accent shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted truncate">{attachment.name}</p>
              <p className="text-xs text-muted/50">{(attachment.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button
            onClick={clearAttachment}
            className="shrink-0 p-1 hover:bg-panel rounded transition-colors"
            title="Quitar archivo"
          >
            <X size={14} className="text-muted" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        <button
          onClick={toggleDictation}
          disabled={!speechSupported}
          className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
            isDictating
              ? 'bg-accent/15 border-accent/60 text-accent'
              : speechSupported
                ? 'bg-panel-2 border-line text-muted hover:text-accent hover:border-accent/50'
                : 'bg-panel-2 border-line text-muted/40 cursor-not-allowed'
          }`}
          title={speechSupported ? (isDictating ? 'Detener dictado' : 'Dictado al chat') : 'Dictado no disponible'}
        >
          <Mic size={18} />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 w-10 h-10 rounded-xl bg-panel-2 border border-line flex items-center justify-center text-muted hover:text-accent hover:border-accent/50 transition-all"
          title="Adjuntar archivo"
        >
          <Paperclip size={18} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.txt,.md,.json,.csv"
          className="hidden"
        />

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); handleInput() }}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={1}
            className="w-full bg-panel-2 border border-line rounded-xl px-4 py-3 text-sm text-text placeholder-muted resize-none outline-none focus:border-accent/50 transition-colors"
            style={{ maxHeight: '200px' }}
          />
        </div>

        <button
          onClick={handleSubmit}
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            isStreaming
              ? 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30'
              : text.trim() || attachment
                ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600'
                : 'bg-panel-2 border border-line text-muted'
          }`}
        >
          {isStreaming ? <Square size={16} /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}
