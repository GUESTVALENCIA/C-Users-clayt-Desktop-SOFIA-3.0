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
    <aside className="w-[260px] shrink-0 bg-panel/50 backdrop-blur-xl border-r border-slate-800/50 flex flex-col h-full">
      {/* Brand */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-blue-600 shadow-xl shadow-blue-500/20">
             <Brain className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">SOFÍA</h1>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 mt-1">Intelligence Lab</p>
          </div>
        </div>

        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-all duration-200 active:scale-[0.98]"
        >
          <Plus size={18} />
          Nuevo Chat
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
        <h2 className="px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Recientes</h2>
        {conversations.length === 0 && (
          <p className="text-xs text-slate-600 px-2 py-4 italic text-center">No hay historial</p>
        )}
        {conversations.map(c => (
          <div
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-[13px] font-medium transition-all duration-200 ${
              activeId === c.id
                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-lg shadow-blue-500/5'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${activeId === c.id ? 'bg-blue-500' : 'bg-slate-700'}`} />
            <span className="flex-1 truncate">{c.title || 'Conversación'}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(c.id) }}
              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="p-4 mt-auto border-t border-slate-800/50 space-y-1">
        <button
          onClick={() => onViewChange('settings')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-medium transition-all ${
            view === 'settings'
              ? 'bg-white/10 text-white border border-white/10 shadow-lg shadow-black/20'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Settings size={18} /> Configuración
        </button>

        <div className="mt-4 pt-4 border-t border-slate-800/20 flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">System Online</span>
            </div>
            <button className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
                <Mic size={14} />
            </button>
        </div>
      </div>
    </aside>
  )
}
