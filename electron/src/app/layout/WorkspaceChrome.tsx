import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  Bot,
  Brain,
  FolderOpen,
  Gauge,
  History,
  LayoutGrid,
  Mic,
  Monitor,
  MoreVertical,
  Palette,
  PanelLeftOpen,
  Plus,
  Settings2,
  Sparkles,
  TerminalSquare,
  Wrench,
  X,
} from 'lucide-react'
import type { Conversation } from '../../types'
import { getModelInfo, getProviderInfo } from '../../core/settings/modelCatalog'

type AppView = 'chat' | 'settings' | 'memory'
type LeftPanel = 'none' | 'history' | 'studio' | 'palette'
type RightPanel = 'none' | 'monitor' | 'ops' | 'maintenance' | 'actions'
type StudioSection = 'call' | 'media'
type CallSection = 'voice' | 'avatar'
type MediaSection = 'image' | 'video' | 'video-audio'
type MonitorSection = 'agents' | 'repairs'
type OpsSection = 'metrics' | 'memory'

interface RuntimeServer {
  id: string
  name: string
  url: string
  status: string
  type: string
}

interface MediaOption {
  key: string
  provider: string
  providerLabel: string
  model: string
  image: boolean
  video: boolean
  audio: boolean
}

interface ActionToast {
  tone: 'ok' | 'error' | 'info'
  text: string
}

interface WorkspaceChromeProps {
  children: ReactNode
  view: AppView
  onViewChange: (view: AppView) => void
  conversations: Conversation[]
  activeId: string | null
  onSelectConversation: (id: string) => void
  onCreateConversation: () => Promise<string>
  onDeleteConversation: (id: string) => void
  selectedProvider: string
  selectedModel: string
  apiKeys: Record<string, boolean>
  onOpenVoice: (mode?: 'voice' | 'avatar') => void
}

const GENERATED_MEDIA_PATH = 'C:\\Users\\clayt\\Desktop\\generated_media'
const SOFIA_SHORTCUT_PATH = 'C:\\Users\\clayt\\Desktop\\SOFÃA.lnk'
const DEFAULT_VAULT_PATH = 'C:\\Users\\clayt\\Desktop\\SOFÃA AI\\sofia-ai\\sofia-vault'
const WORKSPACE_PATH = 'C:\\Users\\clayt\\Desktop\\SOFÃA 3.0'
const VIDEO_DURATIONS = [4, 5, 6, 8, 10, 12, 15, 20, 30, 45, 60]
const WORKSPACE_SHELL_VERSION = 'floating-rails-2026-03-27'
const THEME_OPTIONS = [
  {
    id: 'auto',
    label: 'Auto',
    description: 'Se adapta a la hora del dia.',
    swatches: ['#eef4fb', '#0ea5e9', '#2563eb'],
  },
  {
    id: 'day',
    label: 'Daylight',
    description: 'Clara y limpia para trabajo diurno.',
    swatches: ['#eef4fb', '#ffffff', '#0ea5e9'],
  },
  {
    id: 'mist',
    label: 'Mist',
    description: 'Fria, suave y mas descansada.',
    swatches: ['#edf6fb', '#d8ecf7', '#0891b2'],
  },
  {
    id: 'sunset',
    label: 'Sunset',
    description: 'Calida con mas contraste visual.',
    swatches: ['#fff4eb', '#ffd8bf', '#ea580c'],
  },
  {
    id: 'night',
    label: 'Night',
    description: 'Oscura y sobria para poca luz.',
    swatches: ['#0b0d10', '#171c22', '#7dd3fc'],
  },
]

function extractToolPayload(result: any) {
  return result?.result ?? result ?? null
}

function extractToolError(result: any) {
  const payload = extractToolPayload(result)
  if (!payload) return null
  if (typeof payload.error === 'string' && payload.error.trim()) return payload.error
  if (typeof payload.error?.message === 'string' && payload.error.message.trim()) return payload.error.message
  return null
}

function buildMediaResultNote(result: any, fallbackNote: string) {
  const payload = extractToolPayload(result)
  if (!payload) return fallbackNote
  if (typeof payload.savedPath === 'string' && payload.savedPath.trim()) return `${fallbackNote} -> ${payload.savedPath}`
  if (typeof payload.url === 'string' && payload.url.trim()) return `${fallbackNote} -> ${payload.url}`
  return fallbackNote
}

export function WorkspaceChrome({
  children,
  view,
  onViewChange,
  conversations,
  activeId,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  selectedProvider,
  selectedModel,
  apiKeys,
  onOpenVoice,
}: WorkspaceChromeProps) {
  const [leftPanel, setLeftPanel] = useState<LeftPanel>('none')
  const [rightPanel, setRightPanel] = useState<RightPanel>('none')
  const [studioSection, setStudioSection] = useState<StudioSection>('call')
  const [callSection, setCallSection] = useState<CallSection>('voice')
  const [mediaSection, setMediaSection] = useState<MediaSection>('image')
  const [monitorSection, setMonitorSection] = useState<MonitorSection>('agents')
  const [opsSection, setOpsSection] = useState<OpsSection>('metrics')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [autoRestartEnabled, setAutoRestartEnabled] = useState(false)
  const [themeMode, setThemeMode] = useState('auto')
  const [servers, setServers] = useState<RuntimeServer[]>([])
  const [toolCount, setToolCount] = useState(0)
  const [editorInventory, setEditorInventory] = useState<any>(null)
  const [memoryPolicy, setMemoryPolicy] = useState<any>(null)
  const [publicApiRegistry, setPublicApiRegistry] = useState<any>(null)
  const [knowledgeRouting, setKnowledgeRouting] = useState<any>(null)
  const [knowledgeRuntime, setKnowledgeRuntime] = useState<any>(null)
  const [coverageAudit, setCoverageAudit] = useState<any>(null)
  const [g4fTests, setG4fTests] = useState<any[]>([])
  const [actionToast, setActionToast] = useState<ActionToast | null>(null)
  const [mediaCatalogLoading, setMediaCatalogLoading] = useState(false)
  const [mediaCatalogLoaded, setMediaCatalogLoaded] = useState(false)
  const [mediaCatalog, setMediaCatalog] = useState<Record<MediaSection, MediaOption[]>>({
    image: [],
    video: [],
    'video-audio': [],
  })
  const [selectedMediaOption, setSelectedMediaOption] = useState<Record<MediaSection, string>>({
    image: '',
    video: '',
    'video-audio': '',
  })
  const selectedProviderInfo = getProviderInfo(selectedProvider)
  const selectedModelInfo = getModelInfo(selectedProvider, selectedModel)
  const selectedProviderLabel = selectedProviderInfo?.name || selectedProvider
  const selectedModelLabel = selectedModelInfo?.name || selectedModel
  const [mediaPrompt, setMediaPrompt] = useState<Record<MediaSection, string>>({
    image: '',
    video: '',
    'video-audio': '',
  })
  const [audioPrompt, setAudioPrompt] = useState<Record<'video' | 'video-audio', string>>({
    video: '',
    'video-audio': '',
  })
  const [mediaDuration, setMediaDuration] = useState<Record<'video' | 'video-audio', number>>({
    video: 5,
    'video-audio': 5,
  })
  const [mediaJobs, setMediaJobs] = useState<Array<{ id: string; label: string; state: string; note: string }>>([])
  const [activityLog, setActivityLog] = useState<Array<{ id: string; label: string; note: string; createdAt: number }>>([])
  const [runningMedia, setRunningMedia] = useState<MediaSection | null>(null)
  const [voiceRuntime, setVoiceRuntime] = useState<any>(null)

  useEffect(() => {
    loadShellPrefs()
    refreshRuntime()
    const intervalId = window.setInterval(refreshRuntime, 20000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (leftPanel === 'studio' && studioSection === 'media' && !mediaCatalogLoaded && !mediaCatalogLoading) {
      void loadMediaCatalog()
    }
  }, [leftPanel, studioSection, mediaCatalogLoaded, mediaCatalogLoading])

  useEffect(() => {
    if (!actionToast) return
    const timeoutId = window.setTimeout(() => setActionToast(null), 4200)
    return () => window.clearTimeout(timeoutId)
  }, [actionToast])

  const serverMap = useMemo(
    () => Object.fromEntries(servers.map(server => [server.id, server])),
    [servers],
  )
  const connectedCount = servers.filter(server => server.status === 'connected').length
  const issueCount = servers.filter(server => server.status !== 'connected').length
  const g4fOnline = serverMap.g4f?.status === 'connected'
  const gatewayOnline = false
  const proactorOnline = serverMap.proactor?.status === 'connected'
  const vaultPath = DEFAULT_VAULT_PATH
  const leftInsetClass = leftPanel === 'none' ? 'pl-[78px]' : 'pl-[362px]'
  const rightInsetClass = rightPanel === 'none' ? 'pr-[78px]' : 'pr-[382px]'
  const notableServers = editorInventory?.summary?.notableServers ?? []

  async function loadShellPrefs() {
    try {
      const [maintenance, autoRestart, savedTheme] = await Promise.all([
        window.sofia.settings.get('maintenance_mode'),
        window.sofia.settings.get('maintenance_auto_restart'),
        window.sofia.settings.get('ui_theme'),
      ])
      setMaintenanceMode(Boolean(maintenance))
      setAutoRestartEnabled(Boolean(autoRestart))
      const nextTheme = typeof savedTheme === 'string' && savedTheme.length > 0 ? savedTheme : 'auto'
      setThemeMode(nextTheme)
    } catch {}
  }

  async function refreshRuntime() {
    try {
      const [serversData, toolsData, inventoryData, memoryData, publicApiData, routingData, voiceRuntimeData, knowledgeRuntimeData] = await Promise.all([
        window.sofia.mcp.getServers(),
        window.sofia.mcp.getTools(),
        window.sofia.mcp.getEditorInventory(),
        window.sofia.mcp.getMemoryPolicy(),
        window.sofia.mcp.getPublicApiCapabilityRegistry(),
        window.sofia.mcp.getKnowledgeRoutingPolicy(),
        window.sofia.voice.getRuntimeState(),
        window.sofia.knowledge.getRuntimeState(),
      ])

      setServers((serversData as any)?.servers ?? [])
      setToolCount((toolsData as any)?.count ?? ((toolsData as any)?.tools?.length ?? 0))
      setEditorInventory(inventoryData)
      setMemoryPolicy(memoryData)
      setPublicApiRegistry(publicApiData)
      setKnowledgeRouting(routingData)
      setVoiceRuntime(voiceRuntimeData)
      setKnowledgeRuntime(knowledgeRuntimeData)
      setCoverageAudit(knowledgeRuntimeData?.coverage ?? null)
    } catch {
      setServers([])
      setToolCount(0)
      setPublicApiRegistry(null)
      setKnowledgeRouting(null)
      setVoiceRuntime(null)
      setKnowledgeRuntime(null)
      setCoverageAudit(null)
    }
  }

  async function runKnowledgeRefresh() {
    pushToast('info', 'Refrescando sistema de conocimiento...')
    try {
      const result = await window.sofia.knowledge.refresh()
      await refreshRuntime()
      if (result.ok) {
        pushToast('ok', `Refresh completado en ${Math.round((result.durationMs || 0) / 1000)}s.`)
        pushActivity('knowledge-refresh', `Refresh sistema OK · ${result.steps.length} pasos.`)
      } else {
        pushToast('error', 'El refresh fallo.')
      }
    } catch {
      pushToast('error', 'No se pudo ejecutar el refresh durable.')
    }
  }

  async function runCoverageAudit() {
    pushToast('info', 'Auditando sistema...')
    try {
      const result = await window.sofia.knowledge.auditCoverage()
      setCoverageAudit(result)
      pushToast(result.healthy ? 'ok' : 'info', result.healthy ? 'Sistema OK.' : `Huecos detectados: ${result.missingRequirements.join(', ')}`)
      pushActivity('coverage-audit', result.healthy ? 'Auditoria OK.' : `Cobertura incompleta: ${result.missingRequirements.join(', ')}`)
    } catch {
      pushToast('error', 'No se pudo ejecutar la auditoria de cobertura.')
    }
  }

  async function syncKnowledgeSchedules() {
    pushToast('info', 'Sincronizando schedules...')
    try {
      const result = await window.sofia.knowledge.syncSchedules()
      await refreshRuntime()
      pushToast('ok', `Schedules sincronizados: ${result.schedules.length}.`)
      pushActivity('schedule-sync', `Schedules OK · ${result.schedules.length} activos.`)
    } catch {
      pushToast('error', 'No se pudieron sincronizar los schedules de Temporal.')
    }
  }

  async function triggerKnowledgeSchedule(scheduleId: string) {
    pushToast('info', 'Disparando workflow programado...')
    try {
      const result = await window.sofia.knowledge.triggerSchedule(scheduleId)
      await refreshRuntime()
      pushToast('ok', `${result.label} disparado.`)
      pushActivity('schedule-trigger', `Schedule ejecutado: ${result.label}.`)
    } catch {
      pushToast('error', 'No se pudo disparar el schedule seleccionado.')
    }
  }

  async function loadMediaCatalog() {
    setMediaCatalogLoading(true)
    try {
      // Catalogo curado estatico — importado de modelCatalog
      const { getImageModels, getVideoModels, getAudioModels } = await import('../../core/settings/modelCatalog')
      const imageModels = getImageModels()
      const videoModels = getVideoModels()
      const audioModels = getAudioModels()

      const toOption = (m: { id: string; name: string; subcategory?: string }): MediaOption => ({
        key: `g4f-unlimited::${m.id}`,
        provider: 'g4f-unlimited',
        providerLabel: m.subcategory || 'G4F',
        model: m.id,
        image: true,
        video: false,
        audio: false,
      })

      const nextCatalog: Record<MediaSection, MediaOption[]> = {
        image: imageModels.map(m => ({ ...toOption(m), image: true, video: false, audio: false })),
        video: videoModels.map(m => ({ ...toOption(m), image: false, video: true, audio: false })),
        'video-audio': [
          ...videoModels.map(m => ({ ...toOption(m), image: false, video: true, audio: false })),
          ...audioModels.map(m => ({ ...toOption(m), image: false, video: false, audio: true })),
        ],
      }

      setMediaCatalog(nextCatalog)
      setSelectedMediaOption({
        image: nextCatalog.image[0]?.key ?? '',
        video: nextCatalog.video[0]?.key ?? '',
        'video-audio': nextCatalog['video-audio'][0]?.key ?? '',
      })
      setMediaCatalogLoaded(true)
    } catch {
      pushToast('error', 'No se pudo cargar el catalogo de media.')
    } finally {
      setMediaCatalogLoading(false)
    }
  }

  async function toggleMaintenance() {
    const nextMode = !maintenanceMode
    try {
      await window.sofia.settings.set('maintenance_mode', nextMode)
      setMaintenanceMode(nextMode)
      pushToast('info', nextMode ? 'Modo de mantenimiento activado.' : 'Modo de mantenimiento desactivado.')
    } catch {
      pushToast('error', 'No se pudo actualizar el modo de mantenimiento.')
    }
  }

  async function toggleAutoRestart() {
    const nextMode = !autoRestartEnabled
    try {
      await window.sofia.settings.set('maintenance_auto_restart', nextMode)
      setAutoRestartEnabled(nextMode)
      pushToast('info', nextMode ? 'Auto-restart activado.' : 'Auto-restart desactivado.')
    } catch {
      pushToast('error', 'No se pudo actualizar auto-restart.')
    }
  }

  function pushToast(tone: ActionToast['tone'], text: string) {
    setActionToast({ tone, text })
  }

  async function applyThemeMode(nextTheme: string) {
    try {
      await window.sofia.settings.set('ui_theme', nextTheme)
      setThemeMode(nextTheme)
      document.documentElement.dataset.theme = resolveThemeMode(nextTheme)
      pushToast('ok', `Paleta ${THEME_OPTIONS.find(theme => theme.id === nextTheme)?.label || nextTheme} activada.`)
      pushActivity('theme', `Tema activo: ${nextTheme}`)
    } catch {
      pushToast('error', 'No se pudo actualizar la paleta.')
    }
  }

  function pushActivity(label: string, note: string) {
    setActivityLog(prev => [
      {
        id: crypto.randomUUID(),
        label,
        note,
        createdAt: Date.now(),
      },
      ...prev,
    ].slice(0, 12))
  }

  function toggleLeftPanel(panel: LeftPanel) {
    setLeftPanel(current => (current === panel ? 'none' : panel))
  }

  function toggleRightPanel(panel: RightPanel) {
    setRightPanel(current => (current === panel ? 'none' : panel))
  }

  async function openPath(targetPath: string, successLabel: string) {
    try {
      const result = await window.sofia.desktop.openPath(targetPath)
      if (result.ok) {
        pushToast('ok', successLabel)
        pushActivity('desktop', successLabel)
      } else {
        pushToast('error', result.error || `No se pudo abrir ${targetPath}.`)
      }
    } catch {
      pushToast('error', `No se pudo abrir ${targetPath}.`)
    }
  }

  async function openExternal(url: string, successLabel: string) {
    try {
      await window.sofia.desktop.openExternal(url)
      pushToast('ok', successLabel)
      pushActivity('browser', `${successLabel} Â· ${url}`)
    } catch {
      pushToast('error', `No se pudo abrir ${url}.`)
    }
  }

  async function callTool(name: string, args: Record<string, unknown>, successLabel: string) {
    try {
      const result = await window.sofia.mcp.callTool(name, args)
      const error = extractToolError(result)
      if (error) {
        pushToast('error', String(error))
        return false
      }
      pushToast('ok', successLabel)
      pushActivity(name, successLabel)
      return true
    } catch {
      pushToast('error', `La accion ${name} no respondio.`)
      return false
    }
  }

  async function launchParallelWindows() {
    let okCount = 0
    for (let index = 0; index < 5; index += 1) {
      const result = await window.sofia.desktop.openPath(SOFIA_SHORTCUT_PATH)
      if (result.ok) okCount += 1
      await wait(150)
    }
    pushToast(okCount > 0 ? 'info' : 'error', okCount > 0 ? `Lanzador 5x ejecutado (${okCount}/5).` : 'No se pudieron abrir nuevas ventanas.')
    if (okCount > 0) pushActivity('parallel-5x', `Lanzadas ${okCount} ventanas auxiliares.`)
  }

  async function runRepairSweep() {
    pushToast('info', 'Verificando runtime...')
    pushActivity('repair', 'Refresh manual del runtime.')
    await refreshRuntime()
  }

  async function runG4FProbe() {
    pushToast('info', 'Probando proveedores G4F...')
    try {
      const result = await window.sofia.g4f.testProviders()
      setG4fTests(result)
      pushToast('ok', 'Prueba G4F completada.')
      pushActivity('g4f-probe', `Se probaron ${result.length} rutas G4F.`)
    } catch {
      pushToast('error', 'No se pudo ejecutar la prueba G4F.')
    }
  }

  async function runMediaJob(kind: MediaSection) {
    const option = mediaCatalog[kind].find(item => item.key === selectedMediaOption[kind])
    const prompt = mediaPrompt[kind].trim()

    if (!option || !prompt) {
      pushToast('error', 'Selecciona un modelo y escribe un prompt.')
      return
    }

    const jobId = crypto.randomUUID()
    const baseNote = `${option.providerLabel} / ${option.model}`

    setRunningMedia(kind)
    setMediaJobs(prev => [
      {
        id: jobId,
        label: kind,
        state: 'running',
        note: baseNote,
      },
      ...prev.slice(0, 5),
    ])

    try {
      if (kind === 'image') {
        const result = await window.sofia.mcp.callTool('generate_image', {
          prompt,
          provider: option.provider,
          model: option.model,
          targetDir: GENERATED_MEDIA_PATH,
        })
        const error = extractToolError(result)
        updateMediaJob(jobId, error ? 'error' : 'done', error || buildMediaResultNote(result, `${baseNote} ejecutado.`))
        pushToast(error ? 'error' : 'ok', error || 'Generacion de imagen enviada.')
      } else if (kind === 'video') {
        const result = await window.sofia.mcp.callTool('generate_video', {
          prompt,
          provider: option.provider,
          model: option.model,
          duration: mediaDuration.video,
          audioPrompt: audioPrompt.video || undefined,
          targetDir: GENERATED_MEDIA_PATH,
        })
        const error = extractToolError(result)
        updateMediaJob(jobId, error ? 'error' : 'done', error || buildMediaResultNote(result, `${baseNote} ejecutado.`))
        pushToast(error ? 'error' : 'ok', error || 'Generacion de video enviada.')
      } else {
        const videoResult = await window.sofia.mcp.callTool('generate_video', {
          prompt,
          provider: option.provider,
          model: option.model,
          duration: mediaDuration['video-audio'],
          targetDir: GENERATED_MEDIA_PATH,
        })
        const audioResult = await window.sofia.mcp.callTool('generate_audio', {
          text: audioPrompt['video-audio'] || prompt,
          voice: 'aura-2-carina-es',
          targetDir: GENERATED_MEDIA_PATH,
        })
        const error = extractToolError(videoResult) || extractToolError(audioResult)
        const successNote = `${buildMediaResultNote(videoResult, baseNote)} + ${buildMediaResultNote(audioResult, 'audio')}`
        updateMediaJob(jobId, error ? 'error' : 'done', error || `${successNote} video+audio ejecutado.`)
        pushToast(error ? 'error' : 'ok', error || 'Generacion de video+audio enviada.')
      }
    } catch {
      updateMediaJob(jobId, 'error', 'El job media no pudo lanzarse.')
      pushToast('error', 'El job media no pudo lanzarse.')
    } finally {
      setRunningMedia(null)
    }
  }

  function updateMediaJob(id: string, state: string, note: string) {
    setMediaJobs(prev =>
      prev.map(job => (job.id === id ? { ...job, state, note } : job)),
    )
  }

  async function handleAction(actionId: string) {
    if (actionId === 'new') {
      await onCreateConversation()
      onViewChange('chat')
      setLeftPanel('history')
      return
    }

    if (actionId === 'terminal') {
      await callTool('open_aider_terminal', { path: WORKSPACE_PATH }, 'Lane Sofia Aider solicitada.')
      return
    }

    if (actionId === 'builder') {
      await openExternal('http://localhost:8082', 'G4F panel abierto.')
      return
    }

    if (actionId === 'browser') {
      await openExternal('http://localhost:8082', 'G4F panel abierto.')
      return
    }

    if (actionId === 'vault') {
      onViewChange('memory')
      setLeftPanel('history')
      return
    }

    if (actionId === 'parallel') {
      await launchParallelWindows()
      return
    }

    if (actionId === 'aider') {
      await callTool('open_aider_terminal', { path: WORKSPACE_PATH }, 'Lane Sofia Aider solicitada.')
      return
    }

    if (actionId === 'manus') {
      await callTool(
        'open_aider_manus_stack',
        { task: 'Abrir stack Aider + OpenManus para SOFIA 3.0' },
        'Stack Aider + OpenManus solicitado.',
      )
      return
    }

    if (actionId === 'gallery') {
      await openPath(GENERATED_MEDIA_PATH, 'Galeria local abierta.')
      return
    }

    if (actionId === 'snapshots') {
      await callTool('create_snapshot', { name: `sofia-shell-${Date.now()}` }, 'Snapshot solicitado.')
      return
    }

    if (actionId === 'settings') {
      onViewChange('settings')
      pushActivity('settings', 'Ajustes abiertos desde Actions.')
      return
    }

    if (actionId === 'open-vault-folder') {
      await openPath(vaultPath, 'Vault abierto en el explorador.')
    }
  }

  return (
    <div data-shell-version={WORKSPACE_SHELL_VERSION} className="flex h-full flex-col bg-bg">

      {maintenanceMode && (
        <div className="shrink-0 border-b border-line bg-[#15120a] px-6 py-2 text-center text-sm font-semibold tracking-[0.18em] text-warn">
          MAINTENANCE MODE - AUTO-RESTART {autoRestartEnabled ? 'ACTIVADO' : 'DESACTIVADO'}
        </div>
      )}

      <div className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-30 flex w-[72px] items-center justify-center">
          <div className="pointer-events-auto flex flex-col gap-3 rounded-full border border-line/80 bg-panel/90 p-2 shadow-2xl backdrop-blur">
            <RailButton active={leftPanel === 'history'} icon={History} label="Chat" onClick={() => toggleLeftPanel('history')} />
            <RailButton active={leftPanel === 'studio'} icon={Sparkles} label="Studio" onClick={() => toggleLeftPanel('studio')} />
            <RailButton active={leftPanel === 'palette'} icon={Palette} label="Paleta" onClick={() => toggleLeftPanel('palette')} />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-y-0 right-0 z-30 flex w-[72px] items-center justify-center">
          <div className="pointer-events-auto flex flex-col gap-3 rounded-full border border-line/80 bg-panel/90 p-2 shadow-2xl backdrop-blur">
            <RailButton active={rightPanel === 'monitor'} icon={Bot} label="Agents" onClick={() => toggleRightPanel('monitor')} />
            <RailButton active={rightPanel === 'ops'} icon={Gauge} label="Ops" onClick={() => toggleRightPanel('ops')} />
            <RailButton active={rightPanel === 'maintenance'} icon={Wrench} label="Maintenance" onClick={() => toggleRightPanel('maintenance')} />
            <RailButton active={rightPanel === 'actions'} icon={MoreVertical} label="Actions" onClick={() => toggleRightPanel('actions')} />
          </div>
        </div>

        <div className={`flex h-full flex-col transition-[padding] duration-300 ${leftInsetClass} ${rightInsetClass}`}>
          {children}
        </div>

        <div
          className={`absolute inset-y-0 left-0 z-20 w-[304px] border-r border-line bg-panel/95 shadow-2xl backdrop-blur transition-transform duration-300 ${
            leftPanel === 'none' ? '-translate-x-full' : 'translate-x-0'
          }`}
        >
          {leftPanel !== 'none' && (
            <div className="flex h-full flex-col">
              <DrawerHeader
                title={
                  leftPanel === 'history'
                    ? 'SOFIA Home'
                    : leftPanel === 'studio'
                      ? 'SOFIA Studio'
                      : 'Paleta'
                }
                subtitle={
                  leftPanel === 'history'
                    ? 'historial y accesos'
                    : leftPanel === 'studio'
                      ? 'control surface'
                      : 'temas visuales'
                }
                onClose={() => setLeftPanel('none')}
              />

              {leftPanel === 'history' && (
                <>
                  <div className="px-4 pb-4">
                    <button
                      onClick={async () => {
                        await onCreateConversation()
                        onViewChange('chat')
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-accent-2 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Plus size={16} />
                      Nueva Sesión Proactor
                    </button>
                  </div>

                  <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
                    {conversations.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
                        Sin conversaciones todavia.
                      </div>
                    )}
                    {conversations.map(conversation => (
                      <div
                        key={conversation.id}
                        onClick={() => {
                          onSelectConversation(conversation.id)
                          onViewChange('chat')
                        }}
                        className={`group flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors ${
                          activeId === conversation.id && view === 'chat'
                            ? 'border-accent/40 bg-panel-2 text-text'
                            : 'border-transparent bg-transparent text-muted hover:border-line hover:bg-panel-2 hover:text-text'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{conversation.title || 'Nueva conversacion'}</div>
                          <div className="mt-1 truncate text-[11px] text-muted">{conversation.model}</div>
                        </div>
                        <button
                          onClick={event => {
                            event.stopPropagation()
                            void onDeleteConversation(conversation.id)
                          }}
                          className="rounded-full p-1 text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-panel hover:text-text"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-line p-3">
                    <button onClick={() => onViewChange('chat')} className={historyFooterButtonClass(view === 'chat')}>
                      <History size={15} />
                      Chat
                    </button>
                    <button onClick={() => onViewChange('settings')} className={historyFooterButtonClass(view === 'settings')}>
                      <Settings2 size={15} />
                      Configuracion
                    </button>
                    <button onClick={() => onViewChange('memory')} className={historyFooterButtonClass(view === 'memory')}>
                      <Brain size={15} />
                      Memoria
                    </button>
                  </div>
                </>
              )}

              {leftPanel === 'studio' && (
                <div className="flex h-full flex-col overflow-hidden">
                  <div className="px-3 pb-3">
                    <SegmentedTabs
                      items={[
                        { id: 'call', label: 'Llamada' },
                        { id: 'media', label: 'Media' },
                      ]}
                      value={studioSection}
                      onChange={value => setStudioSection(value as StudioSection)}
                    />
                  </div>

                  {studioSection === 'call' && (
                    <div className="flex-1 overflow-y-auto px-3 pb-4">
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setCallSection('voice')} className={studioPillClass(callSection === 'voice')}>
                          <Mic size={15} />
                          Voz
                        </button>
                        <button onClick={() => setCallSection('avatar')} className={studioPillClass(callSection === 'avatar')}>
                          <Monitor size={15} />
                          Avatar
                        </button>
                      </div>

                      <PanelCard title="Perfil de llamada" badge={apiKeys.deepgram ? 'DEEPGRAM' : 'SIN CLAVE'}>
                        <div className="rounded-2xl border border-line bg-bg/60 px-3 py-3">
                          <div className="text-sm font-semibold text-text">Aura-2 Carina (es-ES)</div>
                          <div className="mt-1 text-xs text-muted">Deepgram TTS en vivo para voz bidireccional.</div>
                        </div>
                      </PanelCard>

                      <PanelCard title="Proveedores activos" badge={gatewayOnline ? 'LIVE' : 'OFF'}>
                        <div className="rounded-2xl border border-line bg-bg/60 px-3 py-3">
                          <div className="text-sm font-semibold text-text">{selectedProviderLabel}</div>
                          <div className="mt-1 break-all text-xs text-muted">{selectedModelLabel}</div>
                        </div>
                      </PanelCard>

                      {callSection === 'voice' && (
                        <PanelCard title="Cabina de llamada" badge={proactorOnline ? 'READY' : 'DEGRADED'}>
                          <div className="grid gap-2">
                            <div className="rounded-2xl border border-line bg-bg/60 px-3 py-3">
                              <div className="text-sm font-semibold text-text">Voice lane</div>
                              <div className="mt-1 text-xs text-muted">
                                G4F: {serverMap.g4f?.status ?? "sin estado"}
                              </div>
                            </div>
                            <button
                              onClick={() => onOpenVoice('voice')}
                              className="rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-[1px]"
                            >
                              Abrir llamada de voz
                            </button>
                            <button
                              onClick={runRepairSweep}
                              className="rounded-2xl border border-line bg-panel-2 px-4 py-3 text-sm font-semibold text-text transition-colors hover:border-accent/50"
                            >
                              Verificar lane de voz
                            </button>
                          </div>
                        </PanelCard>
                      )}

                      {callSection === 'avatar' && (
                        <PanelCard
                          title="Avatar lane"
                          badge={voiceRuntime?.avatarSceneCount ? `${voiceRuntime.avatarSceneCount} escenas` : 'DEGRADED'}
                        >
                          <div className="grid gap-2">
                            <div className="rounded-2xl border border-line bg-bg/60 px-3 py-3">
                              <div className="text-sm font-semibold text-text">
                                {voiceRuntime?.latestScene ? 'Escena avatar disponible' : 'Sin escena avatar lista'}
                              </div>
                              <div className="mt-1 text-xs text-muted">
                                Gateway: {voiceRuntime?.gatewayOnline ? 'online' : 'offline'} · Callback queue:{' '}
                                {voiceRuntime?.callbackQueueSize ?? 0}
                              </div>
                              <div className="mt-1 text-xs text-muted">
                                {voiceRuntime?.latestScene
                                  ? `Ultima escena: ${voiceRuntime.latestScene.label}`
                                  : 'Genera una imagen o video en media para reutilizarlo en llamada avatar.'}
                              </div>
                            </div>
                            <button
                              onClick={() => onOpenVoice('avatar')}
                              disabled={!voiceRuntime?.latestScene}
                              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-transform ${
                                voiceRuntime?.latestScene
                                  ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:-translate-y-[1px]'
                                  : 'cursor-not-allowed border border-line bg-panel-2 text-muted'
                              }`}
                            >
                              Abrir llamada avatar
                            </button>
                            <button
                              onClick={() => void openPath(GENERATED_MEDIA_PATH, 'Assets de avatar abiertos')}
                              className="rounded-2xl border border-line bg-panel-2 px-4 py-3 text-sm font-semibold text-text transition-colors hover:border-accent/50"
                            >
                              Abrir assets de avatar
                            </button>
                          </div>
                        </PanelCard>
                      )}
                    </div>
                  )}

                  {studioSection === 'media' && (
                    <div className="flex-1 overflow-y-auto px-3 pb-4">
                      <SegmentedTabs
                        items={[
                          { id: 'image', label: 'Imagen' },
                          { id: 'video', label: 'Video' },
                          { id: 'video-audio', label: 'Video+Audio' },
                        ]}
                        value={mediaSection}
                        onChange={value => setMediaSection(value as MediaSection)}
                      />

                      <PanelCard title="Modelo" badge={g4fOnline ? 'G4F LIVE' : 'G4F OFF'}>
                        <select
                          value={selectedMediaOption[mediaSection]}
                          onChange={event => setSelectedMediaOption(prev => ({ ...prev, [mediaSection]: event.target.value }))}
                          className="w-full rounded-2xl border border-line bg-bg/70 px-3 py-3 text-sm text-text outline-none focus:border-accent/50"
                        >
                          {!mediaCatalogLoaded && <option value="">Cargando catalogo...</option>}
                          {mediaCatalogLoaded && mediaCatalog[mediaSection].length === 0 && <option value="">Sin modelos detectados</option>}
                          {mediaCatalog[mediaSection].map(option => (
                            <option key={option.key} value={option.key}>
                              {option.providerLabel} - {option.model}
                            </option>
                          ))}
                        </select>
                      </PanelCard>

                      {(mediaSection === 'video' || mediaSection === 'video-audio') && (
                        <PanelCard title="Duracion" badge={`${mediaDuration[mediaSection]}s`}>
                          <div className="grid grid-cols-5 gap-2">
                            {VIDEO_DURATIONS.map(duration => (
                              <button
                                key={`${mediaSection}-${duration}`}
                                onClick={() => setMediaDuration(prev => ({ ...prev, [mediaSection]: duration }))}
                                className={`rounded-xl border px-0 py-2 text-xs font-semibold transition-colors ${
                                  mediaDuration[mediaSection] === duration
                                    ? 'border-accent bg-accent/10 text-accent'
                                    : 'border-line bg-panel-2 text-muted hover:text-text'
                                }`}
                              >
                                {duration}s
                              </button>
                            ))}
                          </div>
                        </PanelCard>
                      )}

                      {(mediaSection === 'video' || mediaSection === 'video-audio') && (
                        <PanelCard title={mediaSection === 'video-audio' ? 'Audio (requerido)' : 'Audio (opcional)'}>
                          <textarea
                            value={audioPrompt[mediaSection]}
                            onChange={event => setAudioPrompt(prev => ({ ...prev, [mediaSection]: event.target.value }))}
                            rows={3}
                            placeholder={mediaSection === 'video-audio' ? 'Describe voz o ambiente para el video...' : 'Describe musica o ambiente para el video...'}
                            className="w-full rounded-2xl border border-line bg-bg/70 px-3 py-3 text-sm text-text outline-none focus:border-accent/50"
                          />
                        </PanelCard>
                      )}

                      <PanelCard title="Prompt">
                        <textarea
                          value={mediaPrompt[mediaSection]}
                          onChange={event => setMediaPrompt(prev => ({ ...prev, [mediaSection]: event.target.value }))}
                          rows={5}
                          placeholder={
                            mediaSection === 'image'
                              ? 'Describe la imagen...'
                              : mediaSection === 'video'
                                ? 'Describe el video...'
                                : 'Describe el video conversacional...'
                          }
                          className="w-full rounded-2xl border border-line bg-bg/70 px-3 py-3 text-sm text-text outline-none focus:border-accent/50"
                        />
                      </PanelCard>

                      <div className="grid gap-2">
                        <button
                          onClick={() => runMediaJob(mediaSection)}
                          disabled={runningMedia === mediaSection || mediaCatalogLoading}
                          className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-colors ${
                            runningMedia === mediaSection || mediaCatalogLoading
                              ? 'bg-cyan-900/40'
                              : 'bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600'
                          }`}
                        >
                          {runningMedia === mediaSection
                            ? 'Lanzando job...'
                            : mediaSection === 'image'
                              ? 'Generar imagen'
                              : mediaSection === 'video'
                                ? 'Generar video'
                                : 'Generar video+audio'}
                        </button>
                        <button
                          onClick={() => openPath(GENERATED_MEDIA_PATH, 'Galeria local abierta.')}
                          className="rounded-2xl border border-line bg-panel-2 px-4 py-3 text-sm font-semibold text-text transition-colors hover:border-accent/50"
                        >
                          Abrir galeria local
                        </button>
                      </div>

                      <PanelCard title="Factory 5x" badge="PARALLEL">
                        <div className="grid gap-2">
                          <div className="text-xs text-muted">Lanza cinco ventanas auxiliares para trabajo paralelo sobre la misma build.</div>
                          <button
                            onClick={launchParallelWindows}
                            className="rounded-2xl border border-line bg-bg/70 px-4 py-3 text-sm font-semibold text-text transition-colors hover:border-accent/50"
                          >
                            Lanzar 5x
                          </button>
                        </div>
                      </PanelCard>

                      {mediaJobs.length > 0 && (
                        <PanelCard title="Ultimos jobs" badge={String(mediaJobs.length)}>
                          <div className="grid gap-2">
                            {mediaJobs.map(job => (
                              <div key={job.id} className="rounded-2xl border border-line bg-bg/60 px-3 py-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-sm font-semibold text-text">{job.label}</div>
                                  <span className={jobStateClass(job.state)}>{job.state}</span>
                                </div>
                                <div className="mt-1 text-xs text-muted">{job.note}</div>
                              </div>
                            ))}
                          </div>
                        </PanelCard>
                      )}
                    </div>
                  )}
                </div>
              )}

              {leftPanel === 'palette' && (
                <div className="flex h-full flex-col overflow-hidden px-3 pb-3">
                  <div className="mb-2 rounded-2xl border border-line bg-panel-2/80 px-3 py-3">
                    <div className="text-xs text-muted">
                      Paletas oficiales para dia, noche y modo intermedio. Aplicacion inmediata en toda la interfaz.
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {THEME_OPTIONS.map(option => (
                      <button
                        key={option.id}
                        onClick={() => void applyThemeMode(option.id)}
                        className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                          themeMode === option.id
                            ? 'border-accent/60 bg-accent/10'
                            : 'border-line bg-panel-2/80 hover:border-accent/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-text">{option.label}</div>
                            <div className="mt-1 text-xs text-muted">{option.description}</div>
                          </div>
                          <div className="flex gap-1">
                            {option.swatches.map(color => (
                              <span
                                key={`${option.id}-${color}`}
                                className="h-3 w-3 rounded-full border border-white/40"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className={`absolute inset-y-0 right-0 z-20 w-[324px] border-l border-line bg-panel/95 shadow-2xl backdrop-blur transition-transform duration-300 ${
            rightPanel === 'none' ? 'translate-x-full' : 'translate-x-0'
          }`}
        >
          {rightPanel !== 'none' && (
            <div className="flex h-full flex-col">
              <DrawerHeader
                title={
                  rightPanel === 'monitor'
                    ? 'Agent Monitor'
                    : rightPanel === 'ops'
                      ? 'Ops Metrics'
                      : rightPanel === 'maintenance'
                        ? 'Maintenance'
                        : 'Actions'
                }
                subtitle={
                  rightPanel === 'monitor'
                    ? 'runtime y repairs'
                    : rightPanel === 'ops'
                      ? 'estado operativo'
                      : rightPanel === 'maintenance'
                        ? 'controles de mantenimiento'
                        : 'accesos de orquestacion'
                }
                onClose={() => setRightPanel('none')}
              />

              {rightPanel === 'monitor' && (
                <div className="flex h-full flex-col overflow-hidden">
                  <div className="px-3 pb-3">
                    <SegmentedTabs
                      items={[
                        { id: 'agents', label: 'Agentes' },
                        { id: 'repairs', label: 'Repairs' },
                      ]}
                      value={monitorSection}
                      onChange={value => setMonitorSection(value as MonitorSection)}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 px-3">
                    <MetricCard label="Online" value={connectedCount} tone="ok" />
                    <MetricCard label="Tools" value={toolCount} tone="accent" />
                    <MetricCard label="Issues" value={issueCount} tone={issueCount > 0 ? 'warn' : 'ok'} />
                  </div>

                  <div className="flex-1 overflow-y-auto px-3 py-3">
                    {monitorSection === 'agents' && (
                      <div className="space-y-3">
                        <PanelCard title="Servicios">
                          <div className="grid gap-2">
                            {servers.map(server => (
                              <div key={server.id} className="rounded-2xl border border-line bg-bg/60 px-3 py-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-text">{server.name}</div>
                                    <div className="mt-1 text-xs text-muted">{server.url}</div>
                                  </div>
                                  <StatusChip status={server.status} />
                                </div>
                              </div>
                            ))}
                            {servers.length === 0 && (
                              <div className="rounded-2xl border border-dashed border-line px-3 py-4 text-sm text-muted">
                                Sin snapshot de runtime todavia.
                              </div>
                            )}
                          </div>
                        </PanelCard>

                        <PanelCard title="MCP en editores" badge={String(editorInventory?.summary?.totalServers ?? 0)}>
                          <div className="grid gap-2">
                            {notableServers.slice(0, 8).map((server: any) => (
                              <div
                                key={`${server.editor}-${server.name}-${server.transport}`}
                                className="flex items-center justify-between rounded-2xl border border-line bg-bg/60 px-3 py-2.5"
                              >
                                <div>
                                  <div className="text-sm font-semibold text-text">{server.name}</div>
                                  <div className="mt-1 text-xs text-muted">{server.editor}</div>
                                </div>
                                <span className="rounded-full border border-line px-2 py-1 text-[10px] text-muted">
                                  {server.transport}
                                </span>
                              </div>
                            ))}
                          </div>
                        </PanelCard>
                      </div>
                    )}

                    {monitorSection === 'repairs' && (
                      <div className="space-y-3">
                        <PanelCard title="Repair queue">
                          <div className="grid gap-2">
                            <button
                              onClick={runRepairSweep}
                              className="rounded-2xl bg-gradient-to-r from-cyan-700 to-blue-700 px-4 py-3 text-sm font-semibold text-white"
                            >
                              Verificar runtime
                            </button>
                            <button
                              onClick={runG4FProbe}
                              className="rounded-2xl border border-line bg-panel-2 px-4 py-3 text-sm font-semibold text-text transition-colors hover:border-accent/50"
                            >
                              Probar proveedores G4F
                            </button>
                          </div>
                        </PanelCard>

                        <PanelCard title="Incidencias activas" badge={String(issueCount)}>
                          <div className="grid gap-2">
                            {servers
                              .filter(server => server.status !== 'connected')
                              .map(server => (
                                <div key={server.id} className="rounded-2xl border border-line bg-bg/60 px-3 py-3">
                                  <div className="text-sm font-semibold text-text">{server.name}</div>
                                  <div className="mt-1 text-xs text-muted">Estado real: {server.status}</div>
                                </div>
                              ))}
                            {issueCount === 0 && (
                              <div className="rounded-2xl border border-line bg-bg/60 px-3 py-3 text-sm text-ok">
                                Sin incidencias detectadas en este refresh.
                              </div>
                            )}
                          </div>
                        </PanelCard>

                        <PanelCard title="Ultima prueba G4F" badge={String(g4fTests.length)}>
                          <div className="grid gap-2">
                            {g4fTests.length === 0 && (
                              <div className="rounded-2xl border border-dashed border-line px-3 py-4 text-sm text-muted">
                                Ejecuta la prueba para ver latencias y errores reales.
                              </div>
                            )}
                            {g4fTests.map(test => (
                              <div key={`${test.provider}-${test.model}`} className="rounded-2xl border border-line bg-bg/60 px-3 py-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-text">{test.provider}</div>
                                    <div className="mt-1 text-xs text-muted">{test.model}</div>
                                  </div>
                                  <span className={jobStateClass(test.ok ? 'done' : 'error')}>
                                    {test.ok ? `${test.latencyMs}ms` : 'fail'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </PanelCard>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {rightPanel === 'ops' && (
                <div className="flex h-full flex-col overflow-hidden">
                  <div className="px-3 pb-3">
                    <SegmentedTabs
                      items={[
                        { id: 'metrics', label: 'Metricas' },
                        { id: 'memory', label: 'Memoria' },
                      ]}
                      value={opsSection}
                      onChange={value => setOpsSection(value as OpsSection)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 px-3">
                    <MetricCard label="APIs" value={publicApiRegistry?.summary?.usableEntries ?? 0} tone="ok" />
                    <MetricCard label="MCP" value={editorInventory?.summary?.totalServers ?? 0} tone="ok" />
                    <MetricCard label="Rutas" value={knowledgeRouting?.consultationOrder?.length ?? 0} tone="accent" />
                    <MetricCard label="Temporal" value={knowledgeRuntime?.executionMode === 'temporal' ? 'ON' : 'FALLBACK'} tone={knowledgeRuntime?.executionMode === 'temporal' ? 'ok' : 'warn'} />
                    <MetricCard label="Graph" value={knowledgeRuntime?.langGraph?.available ? 'READY' : 'OFF'} tone={knowledgeRuntime?.langGraph?.available ? 'ok' : 'warn'} />
                    <MetricCard label="Coverage" value={coverageAudit?.healthy ? 'OK' : 'CHECK'} tone={coverageAudit?.healthy ? 'ok' : 'warn'} />
                  </div>

                  <div className="flex-1 overflow-y-auto px-3 py-3">
                    {opsSection === 'metrics' && (
                      <div className="space-y-3">
                        <PanelCard title="Proveedores + APIs publicas">
                          <div className="grid gap-2">
                            <div className="rounded-2xl border border-line bg-bg/60 px-3 py-3">
                              <div className="text-sm font-semibold text-text">{publicApiRegistry?.summary?.usableEntries ?? 0} APIs usables</div>
                              <div className="mt-1 text-xs text-muted">Noise filtrado: {publicApiRegistry?.summary?.noiseEntries ?? 0}</div>
                              <div className="mt-1 text-xs text-muted">MCP preferente: {publicApiRegistry?.preferredMcpServer?.name || 'sin servidor online'}</div>
                            </div>
                          </div>
                        </PanelCard>

                        <PanelCard title="MCP y routing">
                          <div className="grid gap-2">
                            <div className="rounded-2xl border border-line bg-bg/60 px-3 py-3">
                              <div className="text-sm font-semibold text-text">{editorInventory?.summary?.editors?.length ?? 0} editores auditados</div>
                              <div className="mt-1 text-xs text-muted">Context7 en {editorInventory?.summary?.context7Detected?.length ?? 0} workspaces.</div>
                            </div>
                            <div className="rounded-2xl border border-line bg-bg/60 px-3 py-3">
                              <div className="text-sm font-semibold text-text">{toolCount} tools detectadas</div>
                              <div className="mt-1 text-xs text-muted">Snapshot local del gateway y adaptadores MCP.</div>
                            </div>
                            <div className="rounded-2xl border border-line bg-bg/60 px-3 py-3">
                              <div className="text-sm font-semibold text-text">{knowledgeRouting?.consultationOrder?.length ?? 0} capas de consulta</div>
                              <div className="mt-1 text-xs text-muted">Primera ruta: {knowledgeRouting?.consultationOrder?.[0]?.surface || 'sin policy cargada'}.</div>
                            </div>
                          </div>
                        </PanelCard>

                        <PanelCard title="Temporal + cobertura" badge={knowledgeRuntime?.executionMode === 'temporal' ? 'RUNNING' : 'FALLBACK'}>
                          <div className="grid gap-2">
                            <div className="rounded-2xl border border-line bg-bg/60 px-3 py-3">
                              <div className="text-sm font-semibold text-text">Temporal UI {knowledgeRuntime?.temporalUiOk ? 'online' : 'offline'}</div>
                              <div className="mt-1 text-xs text-muted">
                                gRPC {knowledgeRuntime?.temporalGrpcOk ? 'activo' : 'inactivo'} · Worker {knowledgeRuntime?.workerRunning ? 'running' : 'stopped'} · Supervisor {knowledgeRuntime?.supervisorRunning ? 'running' : 'stopped'}
                              </div>
                              <div className="mt-1 text-xs text-muted">
                                Modo de ejecucion: {knowledgeRuntime?.executionMode === 'temporal' ? 'Temporal durable' : 'Fallback local controlado'}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-line bg-bg/60 px-3 py-3">
                              <div className="text-sm font-semibold text-text">Cobertura del core</div>
                              <div className="mt-1 text-xs text-muted">
                                {coverageAudit?.healthy
                                  ? 'Todos los proveedores activos.'
                                  : `Huecos: ${(coverageAudit?.missingRequirements ?? []).join(', ') || 'sin datos'}`}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-line bg-bg/60 px-3 py-3">
                              <div className="text-sm font-semibold text-text">Supervisor durable</div>
                              <div className="mt-1 text-xs text-muted">
                                Estado: {knowledgeRuntime?.supervisor?.status || 'sin datos'} · Ultimo check {formatTimestamp(knowledgeRuntime?.supervisor?.lastCheckedAt)}
                              </div>
                              <div className="mt-1 text-xs text-muted">
                                Ultima incidencia: {formatTimestamp(knowledgeRuntime?.supervisor?.lastIncidentAt)}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-line bg-bg/60 px-3 py-3">
                              <div className="text-sm font-semibold text-text">LangGraph runtime</div>
                              <div className="mt-1 text-xs text-muted">
                                Ultima ejecucion: {formatTimestamp(knowledgeRuntime?.langGraph?.lastRunAt)} · Operacion {knowledgeRuntime?.langGraph?.lastOperation || 'sin datos'}
                              </div>
                              <div className="mt-1 text-xs text-muted">
                                Ruta: {knowledgeRuntime?.langGraph?.lastRoute || 'sin datos'} · Modo {knowledgeRuntime?.langGraph?.lastExecutionMode || 'sin datos'}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-line bg-bg/60 px-3 py-3">
                              <div className="text-sm font-semibold text-text">Schedules durables</div>
                              <div className="mt-1 text-xs text-muted">
                                Sync: {formatTimestamp(knowledgeRuntime?.schedules?.syncedAt)}
                              </div>
                              <div className="mt-3 space-y-2">
                                {(knowledgeRuntime?.schedules?.schedules ?? []).map((schedule: any) => (
                                  <div key={schedule.scheduleId} className="rounded-xl border border-line bg-panel px-3 py-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <div>
                                        <div className="text-xs font-semibold text-text">{schedule.label}</div>
                                        <div className="mt-1 text-[11px] text-muted">
                                          {schedule.intervalLabel} · proxima {formatTimestamp(schedule.nextActionAt)}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => void triggerKnowledgeSchedule(schedule.scheduleId)}
                                        className="rounded-xl border border-line bg-panel-2 px-3 py-2 text-[11px] font-semibold text-text transition-colors hover:border-accent/50"
                                      >
                                        Ejecutar
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {(knowledgeRuntime?.schedules?.schedules ?? []).length === 0 && (
                                  <div className="text-xs text-muted">Sin schedules durables sincronizados.</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </PanelCard>
                      </div>
                    )}

                    {opsSection === 'memory' && (
                      <div className="space-y-3">
                        <PanelCard title="Politica de memoria Sofia" badge={memoryPolicy?.state || 'missing'}>
                          <div className="grid gap-2">
                            {(memoryPolicy?.lanes ?? []).map((lane: any) => (
                              <div key={lane.id} className="rounded-2xl border border-line bg-bg/60 px-3 py-3">
                                <div className="text-sm font-semibold text-text">{lane.owner}</div>
                                <div className="mt-1 text-xs text-muted">{lane.id}</div>
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {(lane.scope ?? []).map((scope: string) => (
                                    <span key={`${lane.id}-${scope}`} className="rounded-full border border-line px-2 py-1 text-[10px] text-muted">
                                      {scope}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </PanelCard>

                        <PanelCard title="Bloqueos">
                          <div className="flex flex-wrap gap-2">
                            {(memoryPolicy?.forbiddenSharing ?? []).map((item: string) => (
                              <span key={item} className="rounded-full border border-warn/30 bg-warn/10 px-2 py-1 text-[10px] text-warn">
                                {item}
                              </span>
                            ))}
                            {(memoryPolicy?.forbiddenSharing ?? []).length === 0 && (
                              <span className="text-sm text-muted">Sin restricciones cargadas.</span>
                            )}
                          </div>
                        </PanelCard>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {rightPanel === 'maintenance' && (
                <div className="flex h-full flex-col overflow-hidden px-3 py-3">
                  <div className="space-y-3 overflow-y-auto">
                    <PanelCard title="Estado" badge={maintenanceMode ? 'ON' : 'OFF'}>
                      <div className="grid gap-2">
                        <button
                          onClick={toggleMaintenance}
                          className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                            maintenanceMode
                              ? 'border-warn/60 bg-warn/10 text-warn'
                              : 'border-line bg-panel-2 text-text hover:border-accent/50'
                          }`}
                        >
                          {maintenanceMode ? 'Desactivar maintenance mode' : 'Activar maintenance mode'}
                        </button>
                        <button
                          onClick={toggleAutoRestart}
                          className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                            autoRestartEnabled
                              ? 'border-ok/60 bg-ok/10 text-ok'
                              : 'border-line bg-panel-2 text-text hover:border-accent/50'
                          }`}
                        >
                          Auto-restart {autoRestartEnabled ? 'activo' : 'inactivo'}
                        </button>
                      </div>
                    </PanelCard>

                    <PanelCard title="Diagnostico rapido">
                      <div className="grid gap-2">
                        <button
                          onClick={runRepairSweep}
                          className="rounded-2xl border border-line bg-panel-2 px-4 py-3 text-sm font-semibold text-text transition-colors hover:border-accent/50"
                        >
                          Verificar runtime
                        </button>
                        <button
                          onClick={runG4FProbe}
                          className="rounded-2xl border border-line bg-panel-2 px-4 py-3 text-sm font-semibold text-text transition-colors hover:border-accent/50"
                        >
                          Probar G4F
                        </button>
                        <button
                          onClick={() => void runKnowledgeRefresh()}
                          className="rounded-2xl border border-line bg-panel-2 px-4 py-3 text-sm font-semibold text-text transition-colors hover:border-accent/50"
                        >
                          Refresh sistema
                        </button>
                        <button
                          onClick={() => void runCoverageAudit()}
                          className="rounded-2xl border border-line bg-panel-2 px-4 py-3 text-sm font-semibold text-text transition-colors hover:border-accent/50"
                        >
                          Auditar cobertura
                        </button>
                        <button
                          onClick={() => void syncKnowledgeSchedules()}
                          className="rounded-2xl border border-line bg-panel-2 px-4 py-3 text-sm font-semibold text-text transition-colors hover:border-accent/50"
                        >
                          Sincronizar schedules
                        </button>
                      </div>
                    </PanelCard>
                  </div>
                </div>
              )}

              {rightPanel === 'actions' && (
                <div className="flex h-full flex-col overflow-hidden px-3 py-3">
                  <div className="flex-1 overflow-y-auto rounded-2xl border border-line bg-panel-2/80">
                    <div className="max-h-full overflow-y-auto py-2">
                      {ACTION_ITEMS.map(item => (
                        <button
                          key={item.id}
                          onClick={() => void handleAction(item.id)}
                          className="flex w-full items-start justify-between gap-3 border-b border-line/60 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-panel"
                        >
                          <div>
                            <div className="text-sm font-semibold text-text">{item.label}</div>
                            <div className="mt-1 text-xs text-muted">{item.description}</div>
                          </div>
                          <item.icon size={15} className="mt-0.5 shrink-0 text-muted" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {actionToast && (
          <div className="pointer-events-none absolute bottom-5 right-5 z-40">
            <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl ${toastClass(actionToast.tone)}`}>
              {actionToast.text}
            </div>
          </div>
        )}

      </div>

    </div>
  )
}

function resolveThemeMode(theme: string) {
  if (theme === 'auto') {
    const hour = new Date().getHours()
    return hour >= 8 && hour < 20 ? 'day' : 'night'
  }

  return theme
}

function DrawerHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string
  subtitle: string
  onClose: () => void
}) {
  return (
    <div className="flex items-center justify-between border-b border-line px-4 py-4">
      <div>
        <div className="text-lg font-semibold text-text">{title}</div>
        <div className="mt-1 text-xs uppercase tracking-[0.22em] text-muted">{subtitle}</div>
      </div>
      <button
        onClick={onClose}
        className="rounded-full border border-line bg-panel-2 p-2 text-muted transition-colors hover:border-accent/50 hover:text-text"
      >
        <X size={16} />
      </button>
    </div>
  )
}

function SegmentedTabs({
  items,
  value,
  onChange,
}: {
  items: Array<{ id: string; label: string }>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="rounded-2xl border border-line bg-bg/60 p-1">
      <div className={`grid gap-1 ${items.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`rounded-[14px] px-3 py-2 text-sm font-semibold transition-colors ${
              value === item.id ? 'bg-panel-2 text-text shadow-sm' : 'text-muted hover:text-text'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function PanelCard({
  title,
  badge,
  children,
}: {
  title: string
  badge?: string
  children: ReactNode
}) {
  return (
    <div className="mt-3 rounded-[24px] border border-line bg-panel-2/80 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">{title}</div>
        {badge && (
          <span className="rounded-full border border-line bg-bg/70 px-2 py-1 text-[10px] font-semibold text-muted">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function RailButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: any
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
        active
          ? 'border-accent/60 bg-accent/10 text-accent'
          : 'border-line bg-panel-2 text-muted hover:border-accent/40 hover:text-text'
      }`}
    >
      <Icon size={18} />
    </button>
  )
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone: 'ok' | 'warn' | 'accent'
}) {
  return (
    <div className={`rounded-[22px] border px-3 py-3 ${metricCardToneClass(tone)}`}>
      <div className="text-xl font-semibold">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted">{label}</div>
    </div>
  )
}

function StatusPill({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'ok' | 'warn' | 'neutral'
}) {
  return (
    <div className={`rounded-full border px-3 py-2 text-sm font-semibold ${statusPillClass(tone)}`}>
      <span className="mr-1 text-muted">{label}</span>
      <span>{value}</span>
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  const tone = status === 'connected' ? 'ok' : status === 'checking' ? 'warn' : 'neutral'
  return <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusChipToneClass(tone)}`}>{status}</span>
}

function formatTimestamp(value?: string) {
  if (!value) return 'sin snapshot'
  try {
    return new Date(value).toLocaleString('es-ES')
  } catch {
    return value
  }
}

function historyFooterButtonClass(active: boolean) {
  return `mb-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors ${
    active
      ? 'border border-line bg-panel-2 text-text'
      : 'border border-transparent text-muted hover:border-line hover:bg-panel-2 hover:text-text'
  }`
}

function studioPillClass(active: boolean) {
  return `flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors ${
    active
      ? 'border-accent/60 bg-accent/10 text-accent'
      : 'border-line bg-panel-2 text-muted hover:border-accent/40 hover:text-text'
  }`
}

function metricCardToneClass(tone: 'ok' | 'warn' | 'accent') {
  if (tone === 'ok') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  if (tone === 'warn') return 'border-amber-500/30 bg-amber-500/10 text-amber-200'
  return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200'
}

function statusPillClass(tone: 'ok' | 'warn' | 'neutral') {
  if (tone === 'ok') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  if (tone === 'warn') return 'border-amber-500/30 bg-amber-500/10 text-amber-200'
  return 'border-line bg-panel-2 text-text'
}

function statusChipToneClass(tone: 'ok' | 'warn' | 'neutral') {
  if (tone === 'ok') return 'bg-emerald-500/10 text-emerald-300'
  if (tone === 'warn') return 'bg-amber-500/10 text-amber-200'
  return 'bg-panel text-muted'
}

function toastClass(tone: ActionToast['tone']) {
  if (tone === 'ok') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
  if (tone === 'error') return 'border-red-500/30 bg-red-500/10 text-red-200'
  return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200'
}

function jobStateClass(state: string) {
  if (state === 'done') return 'rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300'
  if (state === 'error') return 'rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-200'
  return 'rounded-full bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-200'
}

function mediaScore(provider: any) {
  return Number(provider.image ?? 0) + Number(provider.video ?? 0) * 2 + Number(provider.audio ?? 0) + (provider.vision ? 2 : 0)
}

function wait(ms: number) {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

const ACTION_ITEMS = [
  { id: 'new', label: 'Nueva Sesión Proactor', description: 'Iniciar orquestación Juliet', icon: Plus },
  { id: 'terminal', label: 'Terminal', description: 'Abrir lane Aider local', icon: TerminalSquare },
  { id: 'builder', label: 'Fábrica de Workers', description: 'Abrir panel G4F', icon: LayoutGrid },
  { id: 'browser', label: 'Browser', description: 'Abrir panel G4F', icon: Monitor },
  { id: 'vault', label: 'Vault', description: 'Ir a memoria operativa', icon: Brain },
  { id: 'parallel', label: 'Parallel 5x', description: 'Lanzar cinco ventanas auxiliares', icon: PanelLeftOpen },
  { id: 'aider', label: 'Sofia Aider', description: 'Abrir lane Aider', icon: Wrench },
  { id: 'manus', label: 'Aider + OpenManus', description: 'Solicitar stack paralelo', icon: Sparkles },
  { id: 'gallery', label: 'Galeria', description: 'Abrir imagenes y videos generados', icon: FolderOpen },
  { id: 'snapshots', label: 'Snapshots', description: 'Crear snapshot del shell', icon: Activity },
  { id: 'settings', label: 'Configuracion', description: 'Abrir ajustes del sistema', icon: Settings2 },
]
