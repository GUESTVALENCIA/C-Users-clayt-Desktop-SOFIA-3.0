import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  PROVIDERS,
  getChatModels,
  CATEGORY_LABELS,
  formatPrice,
  type G4FModelCategory,
  type ModelInfo,
} from '../../core/settings/modelCatalog'
import type { RouterNotice } from '../../types'

interface RouterMetricsProps {
  provider: string
  model: string
  reason: string
  contextPercent: number
  freePercent: number
  onProviderChange: (p: string) => void
  onModelChange: (m: string) => void
  apiKeys: Record<string, boolean>
  routerNotice?: RouterNotice | null
  reserveUtilitySpace?: boolean
}

function CircleProgress({ percent, color, label }: { percent: number; color: string; label: string }) {
  const r = 16
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c

  return (
    <div className="flex items-center gap-2">
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--color-line)" strokeWidth="3" />
        <circle
          cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 20 20)"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
        <text x="20" y="20" textAnchor="middle" dy="0.35em" fill="var(--color-text)" fontSize="10" fontWeight="600">
          {percent}%
        </text>
      </svg>
      <span className="text-xs text-muted">{label}</span>
    </div>
  )
}

const CHAT_CATEGORIES: G4FModelCategory[] = [
  'text', 'thinking', 'research', 'code', 'vision', 'audio', 'search',
]

function priceSummary(model: Pick<ModelInfo, 'inputPricePerM' | 'outputPricePerM' | 'isFree'>) {
  if (model.isFree) return 'FREE tier'
  return `in ${formatPrice(model.inputPricePerM)} / out ${formatPrice(model.outputPricePerM)}`
}

function contextSummary(contextLength: number) {
  if (!contextLength) return null
  if (contextLength >= 1_000_000) return `${Math.round(contextLength / 1000)}K ctx`
  return `${Math.round(contextLength / 1000)}K ctx`
}

function CatalogButton({
  active,
  title,
  meta,
  badge,
  onClick,
  supportsTools,
  supportsVision,
}: {
  active: boolean
  title: string
  meta: string
  badge: { label: string; className: string }
  onClick: () => void
  supportsTools?: boolean
  supportsVision?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-panel-2 transition-colors ${
        active ? 'bg-accent/10 text-text' : 'text-muted'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-text">{title}</span>
          {supportsVision && <span className="text-[9px] px-1 py-0.5 rounded bg-accent/10 text-accent shrink-0">vision</span>}
          {supportsTools && <span className="text-[9px] px-1 py-0.5 rounded bg-accent/10 text-accent shrink-0">tools</span>}
        </div>
        <div className="mt-0.5 text-[11px] text-muted truncate">{meta}</div>
      </div>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${badge.className}`}>
        {badge.label}
      </span>
    </button>
  )
}

export function RouterMetrics({
  provider, model, reason, contextPercent, freePercent,
  onProviderChange, onModelChange, apiKeys,
  routerNotice = null,
  reserveUtilitySpace = false,
}: RouterMetricsProps) {
  const [showG4F, setShowG4F] = useState(false)
  const [showPro, setShowPro] = useState(false)

  const chatModels = getChatModels()
  const modelsByCategory = CHAT_CATEGORIES.reduce<Record<G4FModelCategory, typeof chatModels>>((acc, cat) => {
    acc[cat] = chatModels.filter((entry) => entry.category === cat)
    return acc
  }, {} as Record<G4FModelCategory, typeof chatModels>)

  const proProvider = PROVIDERS.find((entry) => entry.id === 'openrouter-pro')
  const proModels = proProvider?.models ?? []
  const autoModel = proModels.find((entry) => entry.routeProvider === 'openrouter' && entry.tierTag === 'auto')
  const claudeModels = proModels.filter((entry) => entry.tierTag === 'account' && entry.oauthProvider === 'anthropic')
  const openaiModels = proModels.filter((entry) => entry.tierTag === 'account' && entry.oauthProvider === 'openai')
  const openrouterPaidModels = proModels.filter((entry) => entry.routeProvider === 'openrouter' && entry.tierTag === 'paid')
  const openrouterTierModels = proModels.filter((entry) => entry.routeProvider === 'openrouter' && entry.tierTag === 'tier')
  const deepseekModels = proModels.filter((entry) => entry.routeProvider === 'deepseek')

  const staticProMatch = proModels.find((entry) => entry.id === model)
  const currentG4FModel = chatModels.find((entry) => entry.id === model)
  const currentProLabel = staticProMatch?.displayName || staticProMatch?.name || model

  const fallbackTargetModel = routerNotice
    ? proModels.find((entry) => entry.id === routerNotice.toModel)?.displayName
      || proModels.find((entry) => entry.id === routerNotice.toModel)?.name
      || chatModels.find((entry) => entry.id === routerNotice.toModel)?.name
      || routerNotice.toModel
    : null

  const isG4F = provider === 'g4f-unlimited' || provider === 'g4f'
  const isPro = ['openrouter', 'deepseek', 'openrouter-pro'].includes(provider)
  const showProFallback = !!routerNotice && isPro
  const showG4FFallback = !!routerNotice && isG4F
  const g4fDisplayName = isG4F ? (currentG4FModel?.name || model) : 'Ilimitado'
  const proDisplayName = isPro ? currentProLabel : (autoModel?.name || 'OpenRouter auto')
  const openrouterReady = !!apiKeys.openrouter
  const deepseekReady = !!apiKeys.deepseek

  const closeAll = () => {
    setShowG4F(false)
    setShowPro(false)
  }

  const renderOpenRouterModel = (entry: ModelInfo) => (
    <CatalogButton
      key={entry.id}
      active={provider === 'openrouter' && model === entry.id}
      title={entry.displayName || entry.name}
      meta={`${priceSummary(entry)}${contextSummary(entry.contextLength) ? ` · ${contextSummary(entry.contextLength)}` : ''}`}
      badge={{
        label: entry.tierTag === 'tier' ? 'TIER' : (entry.isFree ? 'FREE' : 'PAID'),
        className: entry.tierTag === 'tier'
          ? 'bg-ok/20 text-ok'
          : entry.isFree
            ? 'bg-ok/20 text-ok'
            : 'bg-blue-500/20 text-blue-300',
      }}
      onClick={() => {
        onProviderChange('openrouter')
        onModelChange(entry.id)
        closeAll()
      }}
      supportsTools={entry.supportsTools}
      supportsVision={entry.supportsVision}
    />
  )

  const renderDeepSeekModel = (entry: ModelInfo) => (
    <CatalogButton
      key={entry.id}
      active={provider === 'deepseek' && model === entry.id}
      title={entry.displayName || entry.name}
      meta={`${priceSummary(entry)}${contextSummary(entry.contextLength) ? ` · ${contextSummary(entry.contextLength)}` : ''}`}
      badge={{ label: 'API', className: 'bg-cyan-500/20 text-cyan-300' }}
      onClick={() => {
        onProviderChange('deepseek')
        onModelChange(entry.id)
        closeAll()
      }}
      supportsTools={entry.supportsTools}
      supportsVision={entry.supportsVision}
    />
  )

  const renderAccountModel = (entry: ModelInfo, badgeLabel: string, badgeClassName: string) => (
    <CatalogButton
      key={entry.id}
      active={provider === 'openrouter' && model === entry.id}
      title={entry.displayName || entry.name}
      meta={`${entry.oauthProvider === 'openai' ? 'Cuenta ChatGPT Plus' : 'Cuenta Claude Pro'} · ruta OpenRouter`}
      badge={{ label: badgeLabel, className: badgeClassName }}
      onClick={() => {
        onProviderChange('openrouter')
        onModelChange(entry.id)
        closeAll()
      }}
      supportsTools={entry.supportsTools}
      supportsVision={entry.supportsVision}
    />
  )

  return (
    <div className={`shrink-0 border-b border-line bg-panel px-4 py-2 ${reserveUtilitySpace ? 'pr-[380px] xl:pr-[460px]' : ''}`}>
      <div className="flex items-center gap-4 max-w-full">
        <CircleProgress percent={contextPercent} color={contextPercent > 80 ? '#fcd34d' : '#7dd3fc'} label="Contexto" />
        <CircleProgress percent={freePercent} color={freePercent < 20 ? '#fca5a5' : '#86efac'} label="Free" />

        <div className="flex-1" />

        <div className="relative">
          <button
            onClick={() => { setShowPro(!showPro); setShowG4F(false) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
              isPro
                ? 'bg-accent/10 border-accent/40 text-text hover:border-accent/60'
                : 'bg-panel-2 border-line text-muted hover:border-accent/40'
            }`}
          >
            <span className="text-accent font-semibold">PRO</span>
            <span className="text-muted">/</span>
            <span className="max-w-[260px] truncate">
              {isPro
                ? showProFallback && fallbackTargetModel
                  ? `${proDisplayName} -> ${fallbackTargetModel}`
                  : proDisplayName
                : (autoModel?.name || 'OpenRouter auto')}
            </span>
            {openrouterReady && <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" title="OpenRouter activo" />}
            {deepseekReady && <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" title="DeepSeek activo" />}
            {showProFallback && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warn/20 text-warn font-semibold shrink-0">LIVE</span>}
            <ChevronDown size={14} className="text-muted shrink-0" />
          </button>

          {showPro && (
            <div className="absolute right-0 top-full mt-1 w-[560px] max-h-[650px] overflow-y-auto bg-panel border border-line rounded-xl shadow-2xl z-50">
              <div className="px-3 py-2 text-[10px] font-semibold text-muted bg-panel-2 border-b border-line uppercase tracking-wider">
                OpenRouter auto
              </div>
              {autoModel && (
                <CatalogButton
                  active={provider === 'openrouter' && model === autoModel.id}
                  title={autoModel.name}
                  meta="Router oficial · usa el mejor modelo disponible en tu cuenta"
                  badge={{ label: 'AUTO', className: 'bg-blue-500/20 text-blue-300' }}
                  onClick={() => {
                    onProviderChange('openrouter')
                    onModelChange(autoModel.id)
                    closeAll()
                  }}
                  supportsTools={autoModel.supportsTools}
                  supportsVision={autoModel.supportsVision}
                />
              )}

              <div className="px-3 py-2 text-[10px] font-semibold text-muted bg-panel-2 border-b border-line border-t border-line/30 uppercase tracking-wider">
                OpenRouter pago ({openrouterPaidModels.length})
              </div>
              {openrouterPaidModels.map(renderOpenRouterModel)}

              <div className="px-3 py-2 text-[10px] font-semibold text-muted bg-panel-2 border-b border-line border-t border-line/30 uppercase tracking-wider">
                OpenRouter tier ({openrouterTierModels.length})
              </div>
              {openrouterTierModels.map(renderOpenRouterModel)}

              <div className="px-3 py-2 text-[10px] font-semibold text-muted bg-panel-2 border-b border-line border-t border-line/30 uppercase tracking-wider">
                DeepSeek ({deepseekModels.length})
              </div>
              {deepseekModels.map(renderDeepSeekModel)}

              <div className="px-3 py-2 text-[10px] font-semibold text-muted bg-panel-2 border-b border-line border-t border-line/30 uppercase tracking-wider">
                Claude Pro (ruta OpenRouter)
              </div>
              {claudeModels.map((entry) => renderAccountModel(entry, 'PRO', 'bg-purple-500/20 text-purple-300'))}

              <div className="px-3 py-2 text-[10px] font-semibold text-muted bg-panel-2 border-b border-line border-t border-line/30 uppercase tracking-wider">
                ChatGPT Plus (ruta OpenRouter)
              </div>
              {openaiModels.map((entry) => renderAccountModel(entry, 'PLUS', 'bg-emerald-500/20 text-emerald-300'))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => { setShowG4F(!showG4F); setShowPro(false) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
              isG4F
                ? 'bg-green-500/10 border-green-500/40 text-text hover:border-green-400/60'
                : 'bg-panel-2 border-line text-muted hover:border-green-500/40'
            }`}
          >
            <span className="text-green-400 font-semibold">G4F</span>
            <span className="text-muted">/</span>
            <span className="max-w-[220px] truncate">
              {isG4F
                ? showG4FFallback && fallbackTargetModel
                  ? `${g4fDisplayName} -> ${fallbackTargetModel}`
                  : g4fDisplayName
                : 'Ilimitado'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ok/20 text-ok font-semibold shrink-0">FREE &infin;</span>
            {showG4FFallback && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warn/20 text-warn font-semibold shrink-0">LIVE</span>}
            <ChevronDown size={14} className="text-muted shrink-0" />
          </button>

          {showG4F && (
            <div className="absolute right-0 top-full mt-1 w-[520px] max-h-[600px] overflow-y-auto bg-panel border border-line rounded-xl shadow-2xl z-50">
              <div className="px-3 py-2 text-xs font-semibold text-green-400 bg-panel-2 border-b border-line sticky top-0 z-10">
                G4F Ilimitado &mdash; {chatModels.length} modelos curados
              </div>

              {CHAT_CATEGORIES.map((category) => {
                const entries = modelsByCategory[category]
                if (!entries || entries.length === 0) return null

                return (
                  <div key={category}>
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-muted bg-panel-2/50 border-b border-line/50 border-t border-line/30 uppercase tracking-wider">
                      {CATEGORY_LABELS[category]} ({entries.length})
                    </div>
                    {entries.map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => {
                          onProviderChange('g4f-unlimited')
                          onModelChange(entry.id)
                          closeAll()
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-panel-2 transition-colors ${
                          isG4F && model === entry.id ? 'bg-green-500/10 text-text' : 'text-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-text truncate">{entry.name}</span>
                          {entry.uncensored && <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/15 text-red-400 shrink-0">SIN CENSURA</span>}
                          {entry.supportsVision && <span className="text-[9px] px-1 py-0.5 rounded bg-accent/10 text-accent shrink-0">vision</span>}
                          {entry.supportsTools && <span className="text-[9px] px-1 py-0.5 rounded bg-accent/10 text-accent shrink-0">tools</span>}
                          {entry.realProvider && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/10 text-blue-400 shrink-0">{entry.realProvider}</span>}
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ok/20 text-ok font-semibold shrink-0 ml-2">FREE</span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {reason && (
        <div className="mt-1 text-[11px] text-muted truncate">{reason}</div>
      )}
    </div>
  )
}
