// API de Sofía — Interfaz principal
interface SofiaAPI {
  // Chat
  chat: {
    send: (params: ChatSendParams) => Promise<void>
    resumePendingAuth: (provider: string) => Promise<{ resumed: boolean; error?: string }>
    abort: () => Promise<void>
    onChunk: (cb: (chunk: StreamChunk) => void) => () => void
    extractMemory: (params: ChatSendParams) => Promise<void>
    onExtractChunk: (cb: (chunk: StreamChunk) => void) => () => void
  }
  // Voz
  voice: {
    getDeepgramKey: () => Promise<string | null>
    getRuntimeState: () => Promise<any>
    listAvatarScenes: () => Promise<{ scenes: any[] }>
    listCallbacks: () => Promise<{ callbacks: any[] }>
    queueCallback: (request: any) => Promise<any>
    dequeueReadyCallback: () => Promise<any | null>
    updateCallbackStatus: (id: string, status: string) => Promise<boolean>
    sendToLLM: (params: any) => Promise<void>
    abortLLM: () => Promise<void>
    onLLMChunk: (cb: (chunk: StreamChunk) => void) => () => void
    tts: (text: string) => Promise<string | null>
  }
  // Memoria
  memory: {
    getConversations: (limit?: number) => Promise<Conversation[]>
    getMessages: (conversationId: string) => Promise<DBMessage[]>
    createConversation: (params: { id: string; title: string; provider: string; model: string }) => Promise<Conversation | null>
    deleteConversation: (id: string) => Promise<boolean>
    updateConversationTitle: (id: string, title: string) => Promise<boolean>
    saveMessage: (params: { id: string; conversationId: string; role: string; content: string }) => Promise<boolean | null>
    getMemories: () => Promise<AgentMemory[]>
    saveMemory: (mem: { category: string; key: string; content: string; source_conversation_id?: string; confidence?: number }) => Promise<boolean>
    formatMemoriesForPrompt: () => Promise<string>
    initSchema: () => Promise<{ ok: boolean; error?: string }>
  }
  // Configuración
  settings: {
    get: (key: string) => Promise<any>
    set: (key: string, value: any) => Promise<void>
    getSecret: (key: string) => Promise<string | null>
    setSecret: (key: string, value: string) => Promise<void>
    getAllKeys: () => Promise<Record<string, boolean>>
    getAll: () => Promise<Record<string, any>>
    resetKeys: () => Promise<boolean>
  }
  // MCP - Model Context Protocol
  mcp: {
    getServers: () => Promise<any[]>
    getTools: () => Promise<any[]>
    getRuntimeHealth: () => Promise<any>
    getEditorInventory: () => Promise<any>
    getMemoryPolicy: () => Promise<any>
    getPublicApiCapabilityRegistry: () => Promise<any>
    getKnowledgeRoutingPolicy: () => Promise<any>
    getMcpToolPriorityMap: () => Promise<any>
    getTeachingManifest: () => Promise<any>
    callTool: (name: string, args: any) => Promise<string>
    connectServer: (config: any) => Promise<boolean>
    disconnectServer: (id: string) => Promise<boolean>
  }
  knowledge: {
    query: (payload: { text: string }) => Promise<{
      triggered: boolean
      route: string
      confidence: number
      executionMode?: 'temporal' | 'local-fallback' | 'local'
      card: null | {
        id: string
        title: string
        route: string
        answerShort: string
        answerDetailed: string
        steps: string[]
        prerequisites: string[]
        warnings: string[]
        sourceLabel: string
        sourcePath: string
        sourceUrl: string
        speakableText: string
        confidence: number
        latencyMs: number
      }
    }>
    incident: (payload: { text: string }) => Promise<{
      triggered: boolean
      route: string
      confidence: number
      executionMode?: 'temporal' | 'local-fallback' | 'local'
      card: null | {
        id: string
        title: string
        route: string
        answerShort: string
        answerDetailed: string
        steps: string[]
        prerequisites: string[]
        warnings: string[]
        sourceLabel: string
        sourcePath: string
        sourceUrl: string
        speakableText: string
        confidence: number
        latencyMs: number
      }
    }>
    refresh: () => Promise<{
      ok: boolean
      startedAt: string
      finishedAt: string
      durationMs: number
      steps: Array<{
        name: string
        ok: boolean
        durationMs: number
        exitCode: number | null
        stdoutTail: string
        stderrTail: string
      }>
      runtimeStats: {
        capabilities: number
        concepts: number
        runbooks: number
        errors: number
        categories: string[]
      }
    }>
    syncSchedules: () => Promise<{
      ok: boolean
      syncedAt: string
      schedules: Array<{
        scheduleId: string
        label: string
        workflowType: string
        intervalLabel: string
        paused: boolean
        note: string
        nextActionAt: string | null
        recentActionAt: string | null
      }>
    }>
    listSchedules: () => Promise<Array<{
      scheduleId: string
      label: string
      workflowType: string
      intervalLabel: string
      paused: boolean
      note: string
      nextActionAt: string | null
      recentActionAt: string | null
    }>>
    triggerSchedule: (scheduleId: string) => Promise<{
      scheduleId: string
      label: string
      workflowType: string
      intervalLabel: string
      paused: boolean
      note: string
      nextActionAt: string | null
      recentActionAt: string | null
    }>
    auditCoverage: () => Promise<{
      healthy: boolean
      generatedAt: string
      totals: {
        capabilities: number
        concepts: number
        runbooks: number
        errors: number
      }
      requirements: Array<{
        id: string
        label: string
        matched: boolean
        count: number
      }>
      missingRequirements: string[]
    }>
    getRuntimeState: () => Promise<{
      installed: boolean
      composePath: string
      envPath: string
      readmePath: string
      readmeExists: boolean
      corpusReady: boolean
      temporalUiOk: boolean
      temporalGrpcOk: boolean
      workerPid: number | null
      workerRunning: boolean
      supervisorPid: number | null
      supervisorRunning: boolean
      executionMode: 'temporal' | 'local-fallback'
      stats: {
        capabilities: number
        concepts: number
        runbooks: number
        errors: number
        categories: string[]
      }
      coverage: {
        healthy: boolean
        generatedAt: string
        totals: {
          capabilities: number
          concepts: number
          runbooks: number
          errors: number
        }
        requirements: Array<{
          id: string
          label: string
          matched: boolean
          count: number
        }>
        missingRequirements: string[]
      }
      schedules: {
        ok: boolean
        syncedAt: string | null
        schedules: Array<{
          scheduleId: string
          label: string
          workflowType: string
          intervalLabel: string
          paused: boolean
          note: string
          nextActionAt: string | null
          recentActionAt: string | null
        }>
      }
      supervisor: {
        startedAt: string | null
        lastCheckedAt: string | null
        status: 'healthy' | 'degraded' | 'starting'
        executionMode: 'temporal' | 'local-fallback'
        schedulesSynced: boolean
        workerRestartedAt: string | null
        lastIssueKey: string | null
        lastIncidentAt: string | null
        checks: {
          temporalUiOk: boolean
          temporalGrpcOk: boolean
          workerRunning: boolean
          coverageHealthy: boolean
        }
      }
      lastRefresh: null | {
        ok: boolean
        startedAt: string
        finishedAt: string
        durationMs: number
      }
      lastAudit: null | {
        healthy: boolean
        generatedAt: string
        missingRequirements: string[]
      }
      lastIncident: null | {
        recordedAt: string
        route: string
        triggered: boolean
        confidence: number
      }
      langGraph: {
        available: boolean
        lastRunAt: string | null
        lastOperation: string | null
        lastExecutionMode: string | null
        lastRoute: string | null
        lastThreadId: string | null
        confidence: number | null
        notes?: string[]
      }
    }>
  }
  // G4F
  g4f: {
    listProviders: () => Promise<{ providers: G4FProvider[] }>
    listProviderModels: (provider: string) => Promise<{ models: G4FModel[] }>
    listModels: () => Promise<{ models: any[] }>
    testProviders: () => Promise<Array<{ provider: string; status: number; ok: boolean; latencyMs: number; error?: string }>>
  }
  // Auth directo — OAuth local para ChatGPT Plus y Claude Pro
  openrouter: {
    listModels: () => Promise<{ models: OpenRouterCatalogModel[] }>
  }
  directAuth: {
    login: (provider: string) => Promise<{ ok: boolean; error?: string }>
    refresh: (provider: string) => Promise<{ ok: boolean; error?: string }>
    logout: (provider: string) => Promise<{ ok: boolean }>
    getState: () => Promise<Record<string, DirectAuthState>>
    getRuntimeState: () => Promise<Record<string, DirectRuntimeState>>
    onStateChanged: (cb: (state: Record<string, DirectAuthState>) => void) => () => void
  }
  // Control de ventana
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
    isMaximized: () => Promise<boolean>
    onMaximizedChanged: (cb: (isMax: boolean) => void) => () => void
  }
  desktop: {
    openPath: (targetPath: string) => Promise<{ ok: boolean; error: string }>
    openExternal: (url: string) => Promise<{ ok: boolean }>
  }
}

// Parámetros para enviar mensaje al chat
interface ChatSendParams {
  provider: string
  model: string
  messages: Array<{ role: string; content: any }>
  tools?: any[]
  maxTokens?: number
  temperature?: number
  baseUrl?: string
  _diagnosticDirect?: boolean
}

// Fragmento de respuesta en streaming
interface StreamChunk {
  type: 'text' | 'tool_call_start' | 'tool_call_delta' | 'tool_call_end' | 'tool_result' | 'provider_fallback' | 'turn_trace' | 'done' | 'error'
  text?: string
  toolCallId?: string
  toolName?: string
  toolArgsDelta?: string
  toolArgs?: Record<string, unknown>
  toolStatus?: 'done' | 'error'
  toolSummary?: string
  toolResultPreview?: string
  toolArtifactId?: string
  fromProvider?: string
  fromModel?: string
  toProvider?: string
  toModel?: string
  fallbackReason?: string
  lane?: string
  provider?: string
  model?: string
  latencyMs?: number
  fallbackUsed?: boolean
  fallbackFrom?: string
  error?: string
}

interface OpenRouterCatalogModel {
  id: string
  name: string
  contextLength: number
  supportsTools: boolean
  supportsVision: boolean
  inputPricePerM: number
  outputPricePerM: number
  isFree: boolean
}

// Conversación almacenada
interface Conversation {
  id: string
  title: string
  provider: string
  model: string
  created_at: string
  updated_at: string
}

// Mensaje en base de datos
interface DBMessage {
  id: string
  conversation_id: string
  role: string
  content_json: string
  created_at: string
}

// Memoria del agente
interface AgentMemory {
  id: string
  category: string
  key: string
  content: string
  source_conversation_id: string | null
  confidence: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// G4F — metadata de proveedor (estructura real de /backend-api/v2/providers)
interface G4FProvider {
  name: string
  label?: string
  image?: number
  vision?: boolean
  audio?: number
  video?: number
  auth?: boolean
  live?: boolean
  hf_space?: boolean
}

// G4F — metadata de modelo (estructura real de /backend-api/v2/models/{provider})
interface G4FModel {
  name: string
  image?: boolean
  vision?: boolean
  audio?: boolean
  video?: boolean
  providers?: string[]
}

// Auth directo — estado de autenticacion OAuth por provider
type DirectAuthStatus =
  | 'disconnected'
  | 'login-required'
  | 'connecting'
  | 'connected-direct'
  | 'direct-unsupported'
  | 'fallback-active'
  | 'expired'
  | 'refreshing'

interface DirectAuthState {
  status: DirectAuthStatus
  provider: string
  expiresAt?: number
  accountId?: string
  lastError?: string
}

type DirectRuntimeStatus = 'ready' | 'requires-login' | 'direct-unsupported' | 'fallback-active'

interface DirectRuntimeState {
  provider: string
  authStatus: DirectAuthStatus
  runtimeStatus: DirectRuntimeStatus
  tokenLoaded: boolean
  selectable: boolean
  badge: string
  detail: string
}

interface Window {
  sofia: SofiaAPI
}
