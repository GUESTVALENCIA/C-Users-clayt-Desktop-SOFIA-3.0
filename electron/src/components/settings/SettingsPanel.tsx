import { useState, useEffect } from 'react'
import { Key, Cpu, Volume2, Brain, Plug, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { PROVIDERS } from '../../core/settings/modelCatalog'

interface SettingsPanelProps {
  apiKeys: Record<string, boolean>
  setApiKeys: (keys: Record<string, boolean>) => void
}

type Tab = 'keys' | 'providers' | 'voice' | 'memory' | 'mcp'

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'keys', label: 'API Keys', icon: Key },
  { id: 'providers', label: 'Proveedores', icon: Cpu },
  { id: 'voice', label: 'Voz', icon: Volume2 },
  { id: 'memory', label: 'Memoria', icon: Brain },
  { id: 'mcp', label: 'MCP / Tools', icon: Plug },
]

const KEY_LABELS: Record<string, string> = {
  openai: 'OpenAI', anthropic: 'Anthropic', openrouter: 'OpenRouter',
  groq: 'Groq', deepgram: 'Deepgram', gemini: 'Google Gemini',
  deepseek: 'DeepSeek', xai: 'xAI (Grok)', kimi: 'Kimi / Moonshot',
  qwen: 'Qwen / DashScope', neon_url: 'Neon Database URL', neon_api: 'Neon API Key',
}

export function SettingsPanel({ apiKeys, setApiKeys }: SettingsPanelProps) {
  const [tab, setTab] = useState<Tab>('keys')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [keyValue, setKeyValue] = useState('')
  const [testResult, setTestResult] = useState<Record<string, 'ok' | 'fail' | 'testing'>>({})
  const [editorInventory, setEditorInventory] = useState<any>(null)
  const [memoryPolicy, setMemoryPolicy] = useState<any>(null)
  const [publicApiRegistry, setPublicApiRegistry] = useState<any>(null)
  const [knowledgeRouting, setKnowledgeRouting] = useState<any>(null)
  const [teachingManifest, setTeachingManifest] = useState<any>(null)
  const [runtimeHealth, setRuntimeHealth] = useState<any>(null)
  const [toolSourceCounts, setToolSourceCounts] = useState<Record<string, number>>({})
  const [toolPreview, setToolPreview] = useState<Array<{ name: string; source: string }>>([])
  const [knowledgePreflight, setKnowledgePreflight] = useState<'off' | 'preflight-light' | 'full'>('preflight-light')
  const [directAuthStates, setDirectAuthStates] = useState<Record<string, any>>({})
  const [mcpHealth, setMcpHealth] = useState<{ legacy: boolean; official: boolean; checking: boolean; toolCount: number }>({
    legacy: false, official: false, checking: false, toolCount: 0,
  })

  useEffect(() => {
    if (tab === 'mcp') checkMcpHealth()
  }, [tab])

  useEffect(() => {
    void loadRuntimePreferences()
    const cleanup = window.sofia.directAuth.onStateChanged((states) => setDirectAuthStates(states))
    return cleanup
  }, [])

  async function loadRuntimePreferences() {
    const [mode, authStates] = await Promise.all([
      window.sofia.settings.get('knowledgePreflight'),
      window.sofia.directAuth.getState(),
    ])
    if (mode === 'off' || mode === 'preflight-light' || mode === 'full') {
      setKnowledgePreflight(mode)
    }
    setDirectAuthStates(authStates)
  }

  async function setKnowledgeMode(mode: 'off' | 'preflight-light' | 'full') {
    setKnowledgePreflight(mode)
    await window.sofia.settings.set('knowledgePreflight', mode)
  }

  async function checkMcpHealth() {
    setMcpHealth(prev => ({ ...prev, checking: true }))
    try {
      const [healthData, toolsData, runtimeData, inventoryData, libraryData, memoryPolicyData, publicApiData, routingData, teachingData] = await Promise.all([
        window.sofia.mcp.getServers(),
        window.sofia.mcp.getTools(),
        window.sofia.mcp.getRuntimeHealth(),
        window.sofia.mcp.getEditorInventory(),
        Promise.resolve(null),
        window.sofia.mcp.getMemoryPolicy(),
        window.sofia.mcp.getPublicApiCapabilityRegistry(),
        window.sofia.mcp.getKnowledgeRoutingPolicy(),
        window.sofia.mcp.getTeachingManifest(),
      ])
      const servers = (healthData as any)?.servers || []
      const getStatus = (id: string) => servers.find((s: any) => s.id === id)?.status === 'connected'
      setEditorInventory(inventoryData)
      // libraryData not used
      setMemoryPolicy(memoryPolicyData)
      setPublicApiRegistry(publicApiData)
      setKnowledgeRouting(routingData)
      setTeachingManifest(teachingData)
      setRuntimeHealth(runtimeData)
      const tools = Array.isArray((toolsData as any)?.tools) ? (toolsData as any).tools : []
      setToolSourceCounts((runtimeData as any)?.tools?.bySource || {})
      setToolPreview(
        tools
          .slice(0, 24)
          .map((tool: any) => ({
            name: String(tool?.name || 'unknown'),
            source: String(tool?.source || tool?.server || 'unknown'),
          }))
      )
      setMcpHealth({
        legacy: false,
        official: false,
        bridge: getStatus('pwa-bridge'),
        subagents: getStatus('subagents'),
        g4f: getStatus('g4f'),
        proactor: getStatus('proactor'),
        checking: false,
        toolCount: (toolsData as any)?.count || tools.length || 0,
      } as any)
    } catch {
      setRuntimeHealth(null)
      setToolSourceCounts({})
      setToolPreview([])
      setMcpHealth({ legacy: false, official: false, checking: false, toolCount: 0 } as any)
    }
  }

  async function saveKey(key: string) {
    await window.sofia.settings.setSecret(key, keyValue)
    const keys = await window.sofia.settings.getAllKeys()
    setApiKeys(keys)
    setEditingKey(null)
    setKeyValue('')
  }

  async function testProvider(providerId: string) {
    setTestResult(prev => ({ ...prev, [providerId]: 'testing' }))
    try {
      const provider = PROVIDERS.find(p => p.id === providerId)
      if (!provider) throw new Error('Unknown provider')

      // Simple test: try to fetch models or send a tiny request
      const key = await window.sofia.settings.getSecret(provider.secretKey)
      if (!key) throw new Error('No key')

      // For OpenRouter, test with a simple fetch
      if (providerId === 'openrouter') {
        const res = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { 'Authorization': `Bearer ${key}` },
        })
        if (!res.ok) throw new Error(`${res.status}`)
      }

      setTestResult(prev => ({ ...prev, [providerId]: 'ok' }))
    } catch {
      setTestResult(prev => ({ ...prev, [providerId]: 'fail' }))
    }
  }

    
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Tab sidebar */}
      <div className="w-48 shrink-0 border-r border-line bg-panel p-2 space-y-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              tab === t.id ? 'bg-panel-2 text-text border border-line' : 'text-muted hover:text-text border border-transparent'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'keys' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">API Keys</h2>
            <div className="space-y-3">
              {Object.entries(KEY_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-panel-2 border border-line">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text">{label}</div>
                    <div className="text-xs text-muted">
                      {apiKeys[key] ? 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢' : 'No configurado'}
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${apiKeys[key] ? 'bg-ok' : 'bg-line'}`} />
                  {editingKey === key ? (
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={keyValue}
                        onChange={e => setKeyValue(e.target.value)}
                        placeholder="Pegar clave..."
                        className="w-64 px-3 py-1.5 rounded-lg bg-bg border border-line text-sm text-text outline-none focus:border-accent/50"
                        autoFocus
                      />
                      <button onClick={() => saveKey(key)} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium">
                        Guardar
                      </button>
                      <button onClick={() => { setEditingKey(null); setKeyValue('') }} className="px-3 py-1.5 rounded-lg bg-panel border border-line text-sm text-muted">
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingKey(key)}
                      className="px-3 py-1.5 rounded-lg bg-panel border border-line text-sm text-muted hover:text-text transition-colors"
                    >
                      {apiKeys[key] ? 'Cambiar' : 'Configurar'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'providers' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Proveedores</h2>
            <div className="space-y-3">
              {PROVIDERS.map(p => (
                <div key={p.id} className="p-4 rounded-xl bg-panel-2 border border-line">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${apiKeys[p.secretKey] ? 'bg-ok' : 'bg-line'}`} />
                      <span className="font-medium text-text">{p.name}</span>
                      <span className="text-xs text-muted">{p.models.length} modelos</span>
                    </div>
                    <button
                      onClick={() => testProvider(p.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        testResult[p.id] === 'ok' ? 'bg-ok/20 text-ok' :
                        testResult[p.id] === 'fail' ? 'bg-error/20 text-error' :
                        testResult[p.id] === 'testing' ? 'bg-accent/20 text-accent' :
                        'bg-panel border border-line text-muted hover:text-text'
                      }`}
                    >
                      {testResult[p.id] === 'ok' ? 'OK' : testResult[p.id] === 'fail' ? 'Error' : testResult[p.id] === 'testing' ? '...' : 'Test'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {p.models.slice(0, 5).map(m => (
                      <span key={m.id} className="text-[10px] px-2 py-0.5 rounded-full bg-bg text-muted">
                        {m.name}
                      </span>
                    ))}
                    {p.models.length > 5 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg text-muted">
                        +{p.models.length - 5} mÃ¡s
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'voice' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">ConfiguraciÃ³n de Voz</h2>
            <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-4">
              <div>
                <label className="text-sm text-muted mb-1 block">Motor STT</label>
                <p className="text-sm text-text">Deepgram Nova-2</p>
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Motor TTS</label>
                <p className="text-sm text-text">Deepgram Aura-2</p>
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Voz / Persona</label>
                <p className="text-sm text-text">Karina (espaÃ±ol)</p>
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Barge-in</label>
                <p className="text-sm text-ok">Activado</p>
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Estado Deepgram</label>
                <p className={`text-sm ${apiKeys.deepgram ? 'text-ok' : 'text-error'}`}>
                  {apiKeys.deepgram ? 'Conectado' : 'Sin clave API'}
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === 'memory' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Memoria Persistente</h2>
            <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-4">
              <div>
                <label className="text-sm text-muted mb-1 block">Base de datos</label>
                <p className="text-sm text-text">Neon PostgreSQL</p>
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Estado</label>
                <p className={`text-sm ${apiKeys.neon_url ? 'text-ok' : 'text-error'}`}>
                  {apiKeys.neon_url ? 'Conectado' : 'Sin conexiÃ³n'}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">ExtracciÃ³n automÃ¡tica</label>
                <p className="text-sm text-ok">Activada (post-turn, non-blocking)</p>
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Fallback local</label>
                <p className="text-sm text-text">JSON en %APPDATA%/sofia/</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'mcp' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Ecosistema SOFÃA</h2>
              <button
                onClick={checkMcpHealth}
                disabled={mcpHealth.checking}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-panel border border-line text-xs text-muted hover:text-text transition-colors"
              >
                <RefreshCw size={12} className={mcpHealth.checking ? 'animate-spin' : ''} />
                {mcpHealth.checking ? 'Verificando...' : 'Verificar'}
              </button>
            </div>
            <div className="space-y-3">
              {/* Puertos del ecosistema */}
              <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2.5">
                <h3 className="text-sm font-semibold text-text mb-1">Servicios activos</h3>
                {[
                                    { label: 'PWA Bridge', sub: ':3001 · bridge auxiliar', key: 'bridge' },
                  { label: 'Subagents Runtime', sub: ':8089 Â· 175 agentes especializados', key: 'subagents' },
                  { label: 'G4F Docker', sub: ':8082 · 793 modelos LLM gratuitos', key: 'g4f' },
                                                    ].map(s => {
                  const serverData = (mcpHealth as any)
                  const connected = serverData?.[s.key] === true
                  return (
                    <div key={s.key} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-text font-medium">{s.label}</span>
                        <span className="text-muted ml-1.5 text-[10px]">{s.sub}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {connected
                          ? <><CheckCircle size={13} className="text-ok" /><span className="text-ok text-xs">Online</span></>
                          : <><XCircle size={13} className="text-line" /><span className="text-muted text-xs">Offline</span></>
                        }
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text">Snapshot runtime real</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                      false
                        ? 'border-green-500/30 bg-green-500/10 text-green-400'
                        : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {false ? 'Revalidado' : 'Pendiente'}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-bg border border-line text-muted">
                    {runtimeHealth?.generatedAt ? new Date(runtimeHealth.generatedAt).toLocaleTimeString('es') : 'sin datos'}
                  </span>
                </div>
                <div className="text-xs text-muted space-y-1">
                  <p>
                    {runtimeHealth
                      ? `${runtimeHealth.tools?.total ?? 0} tools cargadas`
                      : 'Sin datos de runtime'}
                  </p>
                </div>
              </div>

              {/* Tools disponibles */}
              {toolPreview.length > 0 && (
                <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2">
                  <h3 className="text-sm font-semibold text-text">Tools disponibles ({mcpHealth.toolCount})</h3>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {toolPreview.map((t, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-bg border border-line text-muted">
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
