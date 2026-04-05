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
    <aside className="w-[280px] shrink-0 border-r border-line bg-panel/40 backdrop-blur-xl flex flex-col h-full">
      {/* Brand */}
      <div className="p-6 border-b border-line">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl shadow-2xl rotate-3" style={{
            background: 'radial-gradient(circle at 30% 30%, #38bdf8, #6366f1)',
            boxShadow: '0 8px 30px rgba(99,102,241,.4)',
          }} />
          <div>
            <h1 className="text-lg font-bold text-text leading-tight tracking-tight">JULIE</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Proactor Intelligent</p>
          </div>
        </div>
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-accent to-accent-2 text-white text-sm font-bold shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={18} />
          Nueva Sesión
        </button>
      </div>

      {/* Main Nav */}
      <div className="px-3 py-4 space-y-1">
        <NavItem
          icon={Brain}
          label="Comenzar insight"
          onClick={() => {}}
          active={false}
        />
        <NavItem
          icon={Mic}
          label="Conversación"
          onClick={() => onViewChange('chat')}
          active={view === 'chat'}
        />
        <NavItem
          icon={History}
          label="Historial (Sessions)"
          onClick={() => {}}
          active={false}
        />
        <NavItem
          icon={Settings}
          label="Configuración"
          onClick={() => onViewChange('settings')}
          active={view === 'settings'}
        />
      </div>

      <div className="mt-auto p-4">
        <div className="rounded-2xl bg-panel-2 border border-line p-4 card-shadow">
          <p className="text-[10px] uppercase tracking-widest text-muted mb-2 font-bold">Plan Actual</p>
          <p className="text-sm font-bold text-text mb-3">Enterprise Proactor</p>
          <button className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-text hover:bg-white/10 transition-all">
            Ver detalles
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavItem({ icon: Icon, label, onClick, active }: { icon: any, label: string, onClick: () => void, active: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
        active
          ? 'bg-accent/10 border border-accent/20 text-accent shadow-sm'
          : 'text-muted hover:bg-white/5 hover:text-text border border-transparent'
      }`}
    >
      <Icon size={18} className={active ? 'text-accent' : 'text-muted'} />
      {label}
    </button>
  )
}

import { History } from 'lucide-react'
