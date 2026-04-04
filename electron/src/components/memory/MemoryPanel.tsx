import { useState, useEffect } from 'react'
import { Brain, Trash2, RefreshCw } from 'lucide-react'
import type { AgentMemory } from '../../types'

const CATEGORY_LABELS: Record<string, string> = {
  session_state: 'Estado de sesión',
  instruction: 'Instrucciones',
  task_pending: 'Tareas pendientes',
  task_completed: 'Completadas',
  project: 'Proyectos',
  preference: 'Preferencias',
  fact: 'Hechos',
  person: 'Personas',
  decision: 'Decisiones',
  workflow: 'Workflows',
}

const CATEGORY_COLORS: Record<string, string> = {
  session_state: 'bg-accent/20 text-accent',
  instruction: 'bg-purple-500/20 text-purple-400',
  task_pending: 'bg-warn/20 text-warn',
  task_completed: 'bg-ok/20 text-ok',
  project: 'bg-blue-500/20 text-blue-400',
  preference: 'bg-pink-500/20 text-pink-400',
  fact: 'bg-cyan-500/20 text-cyan-400',
  person: 'bg-orange-500/20 text-orange-400',
  decision: 'bg-emerald-500/20 text-emerald-400',
  workflow: 'bg-indigo-500/20 text-indigo-400',
}

export function MemoryPanel() {
  const [memories, setMemories] = useState<AgentMemory[]>([])
  const [loading, setLoading] = useState(true)

  async function loadMemories() {
    setLoading(true)
    const mems = await window.sofia.memory.getMemories()
    setMemories(mems)
    setLoading(false)
  }

  useEffect(() => { loadMemories() }, [])

  const grouped = memories.reduce<Record<string, AgentMemory[]>>((acc, m) => {
    if (!acc[m.category]) acc[m.category] = []
    acc[m.category].push(m)
    return acc
  }, {})

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain size={24} className="text-accent" />
          <h2 className="text-lg font-semibold">Memoria de Sofía</h2>
          <span className="text-xs text-muted">{memories.length} recuerdos</span>
        </div>
        <button
          onClick={loadMemories}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-panel-2 border border-line text-sm text-muted hover:text-text transition-colors"
        >
          <RefreshCw size={14} />
          Refrescar
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Cargando memorias...</p>
      ) : memories.length === 0 ? (
        <div className="text-center py-12">
          <Brain size={48} className="text-line mx-auto mb-4" />
          <p className="text-muted">Sin memorias todavía</p>
          <p className="text-xs text-muted mt-1">Las memorias se extraen automáticamente de las conversaciones</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, mems]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[category] || 'bg-line text-muted'}`}>
                  {CATEGORY_LABELS[category] || category}
                </span>
                <span className="text-xs text-muted">{mems.length}</span>
              </div>
              <div className="space-y-2">
                {mems.map(m => (
                  <div key={m.id} className="p-3 rounded-xl bg-panel-2 border border-line">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-sm font-medium text-text">{m.key}</span>
                        <p className="text-sm text-muted mt-1 leading-relaxed">{m.content}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted">
                      <span>Confianza: {Math.round(m.confidence * 100)}%</span>
                      <span>•</span>
                      <span>{new Date(m.updated_at).toLocaleDateString('es')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
