import { Plus, Settings, Brain, Mic, Trash2 } from 'lucide-react'
import type { AppView } from '../App'
import type { Conversation } from '../../types'

interface SidebarProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  view: AppView
  onViewChange: (v: AppView) => void
}

export function Sidebar({ conversations, activeId, onSelect, onNew, onDelete, view, onViewChange }: SidebarProps) {
  return (
    <aside className="w-[280px] shrink-0 border-r border-line bg-panel flex flex-col h-full">
      {/* Brand */}
      <div className="p-4 border-b border-line">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl shadow-lg" style={{
            background: 'radial-gradient(circle at 30% 30%, #7dd3fc, #2563eb)',
            boxShadow: '0 10px 30px rgba(37,99,235,.35)',
          }} />
          <div>
            <h1 className="text-base font-bold text-text leading-tight">SOFÍA</h1>
            <p className="text-xs text-muted">Asistente IA de Clay</p>
          </div>
        </div>
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-b from-blue-600 to-blue-700 text-white text-sm font-semibold hover:from-blue-500 hover:to-blue-600 transition-all"
        >
          <Plus size={16} />
          Nueva conversación
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 && (
          <p className="text-xs text-muted text-center py-8">Sin conversaciones</p>
        )}
        {conversations.map(c => (
          <div
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-all ${
              activeId === c.id
                ? 'bg-panel-2 border border-line text-text'
                : 'text-muted hover:bg-panel-2/50 hover:text-text border border-transparent'
            }`}
          >
            <span className="flex-1 truncate">{c.title || 'Sin título'}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(c.id) }}
              className="opacity-0 group-hover:opacity-100 text-muted hover:text-error transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="p-2 border-t border-line space-y-1">
        <button
          onClick={() => onViewChange('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
            view === 'settings' ? 'bg-panel-2 text-text border border-line' : 'text-muted hover:bg-panel-2/50 hover:text-text border border-transparent'
          }`}
        >
          <Settings size={16} /> Configuración
        </button>
        <button
          onClick={() => onViewChange('memory')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
            view === 'memory' ? 'bg-panel-2 text-text border border-line' : 'text-muted hover:bg-panel-2/50 hover:text-text border border-transparent'
          }`}
        >
          <Brain size={16} /> Memoria
        </button>
      </div>
    </aside>
  )
}
