// Tipos de datos exportados — usados por componentes React
// La interfaz SofiaAPI completa está en global.d.ts (no duplicar aquí)

export interface ChatSendParams {
  provider: string
  model: string
  messages: Array<{ role: string; content: string }>
  tools?: any[]
  maxTokens?: number
  temperature?: number
  baseUrl?: string
}

export interface StreamChunk {
  type: 'text' | 'tool_call_start' | 'tool_call_delta' | 'tool_call_end' | 'tool_result' | 'provider_fallback' | 'done' | 'error'
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
  error?: string
}

export interface ToolTraceItem {
  id: string
  name: string
  status: 'running' | 'done' | 'error'
  argsText: string
  args?: Record<string, unknown>
  summary?: string
  preview?: string
  artifactId?: string
}

export interface RouterNotice {
  fromProvider: string
  fromModel: string
  toProvider: string
  toModel: string
  reason: string
}

export interface Conversation {
  id: string
  title: string
  provider: string
  model: string
  created_at: string
  updated_at: string
}

export interface DBMessage {
  id: string
  conversation_id: string
  role: string
  content_json: string
  created_at: string
}

export interface AgentMemory {
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
