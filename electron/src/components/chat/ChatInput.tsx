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
    <div className="relative group max-w-4xl mx-auto">
      {/* Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 rounded-[32px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />

      <div className="relative flex flex-col rounded-[30px] border border-slate-700/50 bg-slate-900/80 backdrop-blur-2xl p-2 shadow-2xl transition-all duration-300 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20">

        {/* Attachment preview */}
        {attachment && (
          <div className="m-2 p-3 bg-slate-800/80 border border-slate-700/50 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Paperclip size={14} className="text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{attachment.name}</p>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">{(attachment.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button
              onClick={clearAttachment}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 p-1">
          <div className="flex items-center gap-1 mb-1 ml-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              title="Adjuntar"
            >
              <Paperclip size={18} />
            </button>
            <button
              onClick={toggleDictation}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isDictating ? 'text-blue-400 bg-blue-500/10 animate-pulse' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Dictado"
            >
              <Mic size={18} />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.txt,.md,.json,.csv"
            className="hidden"
          />

          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => { setText(e.target.value); handleInput() }}
              onKeyDown={handleKeyDown}
              placeholder="Pregúntame cualquier cosa..."
              rows={1}
              className="w-full bg-transparent border-none px-2 py-3 text-[15px] text-white placeholder-slate-500 resize-none outline-none focus:ring-0 min-h-[44px]"
              style={{ maxHeight: '200px' }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!text.trim() && !attachment && !isStreaming}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-90 shadow-lg ${
              isStreaming
                ? 'bg-red-500 text-white hover:bg-red-600 rotate-0'
                : text.trim() || attachment
                  ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            {isStreaming ? <Square size={16} fill="currentColor" /> : <Send size={18} />}
          </button>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            {isStreaming ? "SOFÍA está procesando tu solicitud..." : "Enter para enviar · Shift + Enter para nueva línea"}
        </p>
      </div>
    </div>
  )
}
