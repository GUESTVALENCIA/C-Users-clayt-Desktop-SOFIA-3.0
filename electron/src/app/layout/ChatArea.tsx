import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageList } from '../../components/chat/MessageList'
import { ChatInput } from '../../components/chat/ChatInput'
import { RouterMetrics } from '../../components/router/RouterMetrics'
import { MODEL_CATALOG, getModelInfo } from '../../core/settings/modelCatalog'
import type { ChatMessage } from '../App'
import type { RouterNotice, ToolTraceItem } from '../../types'

type KnowledgePreflightMode = 'off' | 'preflight-light' | 'full'
const KNOWLEDGE_LIGHT_PREFLIGHT_THRESHOLD = 0.8

type PendingAuthMessage = {
  text: string
  attachment?: any
  provider: 'openai' | 'anthropic'
  savedProvider: string
  savedModel: string
  conversationId: string
}

interface ChatAreaProps {
  messages: ChatMessage[]
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  conversationId: string | null
  onCreateConversation: () => Promise<string>
  isStreaming: boolean
  setIsStreaming: (v: boolean) => void
  selectedProvider: string
  setSelectedProvider: (v: string) => void
  selectedModel: string
  setSelectedModel: (v: string) => void
  apiKeys: Record<string, boolean>
}

export function ChatArea({
  messages, setMessages, conversationId, onCreateConversation,
  isStreaming, setIsStreaming,
  selectedProvider, setSelectedProvider, selectedModel, setSelectedModel,
  apiKeys,
}: ChatAreaProps) {
  const [streamingText, setStreamingText] = useState('')
  const [toolTrace, setToolTrace] = useState<ToolTraceItem[]>([])
  const [routerNotice, setRouterNotice] = useState<RouterNotice | null>(null)
  const [routeReason, setRouteReason] = useState('')
  const [freeRequestsUsed, setFreeRequestsUsed] = useState(0)
  const cleanupRef = useRef<(() => void) | null>(null)

  // OAuth directo — pending message queue for auto-retry after auth
  const pendingMessageRef = useRef<PendingAuthMessage | null>(null)
  const pendingRetryTimerRef = useRef<NodeJS.Timeout | null>(null)
  const authLoopGuardRef = useRef<Record<'openai' | 'anthropic', number>>({
    openai: 0,
    anthropic: 0,
  })

  useEffect(() => {
    const cleanup = window.sofia.directAuth.onStateChanged((states) => {
      const safeStates = Object.fromEntries(
        Object.entries(states).map(([key, state]) => [
          key,
          {
            status: state.status,
            provider: state.provider,
            expiresAt: state.expiresAt,
            accountId: state.accountId,
            lastError: state.lastError,
          },
        ])
      )
      console.log('[ChatArea] OAuth state changed:', safeStates)

      // Auto-retry pending message when the specific provider becomes connected
      if (pendingMessageRef.current) {
        const pending = pendingMessageRef.current
        const providerState = states[pending.provider]

        if (providerState?.status === 'connected-direct') {
          pendingMessageRef.current = null
          if (pendingRetryTimerRef.current) {
            clearTimeout(pendingRetryTimerRef.current)
            pendingRetryTimerRef.current = null
          }
          // Give it a moment for the token to settle — restore original provider/model
          setTimeout(() => {
            void resumePendingMessage(pending)
          }, 400)
        }
      }
    })
    return () => {
      cleanup()
      cleanupRef.current?.()
      if (pendingRetryTimerRef.current) {
        clearTimeout(pendingRetryTimerRef.current)
        pendingRetryTimerRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const FREE_DAILY_LIMIT = 1000

  // Estimate context usage
  const contextUsed = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0)
  const modelInfo = getModelInfo(selectedProvider, selectedModel)
  const maxContext = modelInfo?.contextLength || 128000
  const contextPercent = Math.min(100, Math.round((contextUsed / 4 / maxContext) * 100))
  const freePercent = Math.round(((FREE_DAILY_LIMIT - freeRequestsUsed) / FREE_DAILY_LIMIT) * 100)

  function clearPendingRetryTimer() {
    if (pendingRetryTimerRef.current) {
      clearTimeout(pendingRetryTimerRef.current)
      pendingRetryTimerRef.current = null
    }
  }

  function resetAuthLoopGuard(provider?: 'openai' | 'anthropic') {
    if (provider) {
      authLoopGuardRef.current[provider] = 0
      return
    }

    authLoopGuardRef.current.openai = 0
    authLoopGuardRef.current.anthropic = 0
  }

  function updateToolTraceItem(toolCallId: string, updater: (current?: ToolTraceItem) => ToolTraceItem) {
    setToolTrace(prev => {
      const index = prev.findIndex(item => item.id === toolCallId)
      if (index === -1) {
        return [...prev, updater()]
      }

      const next = [...prev]
      next[index] = updater(prev[index])
      return next
    })
  }

  async function runStreamingRequest({
    conversationId: convId,
    userText,
    attachment,
    provider,
    model,
    invoke,
  }: {
    conversationId: string
    userText: string
    attachment?: any
    provider: string
    model: string
    invoke: () => Promise<void>
  }) {
    setIsStreaming(true)
    setStreamingText('')
    setToolTrace([])
    setRouterNotice(null)

    let fullText = ''

    const finishStreaming = (clearTrace = true) => {
      setStreamingText('')
      setIsStreaming(false)
      if (clearTrace) setToolTrace([])
      cleanupRef.current = null
    }

    const cleanup = window.sofia.chat.onChunk((chunk) => {
      if (chunk.type === 'text' && chunk.text) {
        fullText += chunk.text
        setStreamingText(fullText)
        return
      }

      if (chunk.type === 'tool_call_start' && chunk.toolCallId) {
        updateToolTraceItem(chunk.toolCallId, (current) => ({
          id: current?.id || chunk.toolCallId!,
          name: chunk.toolName || current?.name || 'tool',
          status: current?.status || 'running',
          argsText: current?.argsText || '',
          args: current?.args,
          summary: current?.summary,
          preview: current?.preview,
          artifactId: current?.artifactId,
        }))
        return
      }

      if (chunk.type === 'tool_call_delta' && chunk.toolCallId) {
        updateToolTraceItem(chunk.toolCallId, (current) => ({
          id: current?.id || chunk.toolCallId!,
          name: current?.name || chunk.toolName || 'tool',
          status: current?.status || 'running',
          argsText: `${current?.argsText || ''}${chunk.toolArgsDelta || ''}`,
          args: current?.args,
          summary: current?.summary,
          preview: current?.preview,
          artifactId: current?.artifactId,
        }))
        return
      }

      if (chunk.type === 'tool_call_end' && chunk.toolCallId) {
        updateToolTraceItem(chunk.toolCallId, (current) => ({
          id: current?.id || chunk.toolCallId!,
          name: current?.name || chunk.toolName || 'tool',
          status: current?.status || 'running',
          argsText: current?.argsText || (chunk.toolArgs ? JSON.stringify(chunk.toolArgs, null, 2) : ''),
          args: chunk.toolArgs || current?.args,
          summary: current?.summary,
          preview: current?.preview,
          artifactId: current?.artifactId,
        }))
        return
      }

      if (chunk.type === 'tool_result' && chunk.toolCallId) {
        updateToolTraceItem(chunk.toolCallId, (current) => ({
          id: current?.id || chunk.toolCallId!,
          name: chunk.toolName || current?.name || 'tool',
          status: chunk.toolStatus === 'error' ? 'error' : 'done',
          argsText: current?.argsText || '',
          args: current?.args,
          summary: chunk.toolSummary || current?.summary,
          preview: chunk.toolResultPreview || current?.preview,
          artifactId: chunk.toolArtifactId || current?.artifactId,
        }))
        return
      }

      if (chunk.type === 'provider_fallback') {
        const notice: RouterNotice = {
          fromProvider: chunk.fromProvider || provider,
          fromModel: chunk.fromModel || model,
          toProvider: chunk.toProvider || provider,
          toModel: chunk.toModel || model,
          reason: chunk.fallbackReason || 'Fallback automatico',
        }

        setRouterNotice(notice)
        setRouteReason(`Fallback automatico · ${notice.fromProvider} -> ${notice.toProvider}`)
        return
      }

      if (chunk.type === 'turn_trace') {
        const lane = chunk.lane || 'lane-unknown'
        const providerName = chunk.provider || provider
        const modelName = chunk.model || model
        const fallbackLabel = chunk.fallbackUsed
          ? ` · fallback ${chunk.fallbackFrom || 'aplicado'}`
          : ''
        setRouteReason(`${lane} · ${providerName}/${modelName}${fallbackLabel}`)
        return
      }

      if (chunk.type === 'error') {
        const errorText = String(chunk.error || '')
        console.error('[ChatArea] Error chunk received:', errorText)

        if (errorText.startsWith('__DIRECT_AUTH_RETRY_FAILED__:')) {
          const oauthProvider = errorText.split(':')[1] as 'openai' | 'anthropic'
          const providerLabel = oauthProvider === 'openai' ? 'ChatGPT Plus' : 'Claude Pro'
          pendingMessageRef.current = null
          clearPendingRetryTimer()
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `**Error**: La autenticacion de **${providerLabel}** no se pudo consolidar tras el reintento automatico. He detenido el proceso para evitar bucles.`,
            createdAt: Date.now(),
          }])
          cleanup()
          finishStreaming()
          resetAuthLoopGuard(oauthProvider)
          return
        }

        if (errorText.startsWith('__DIRECT_AUTH_REQUIRED__:')) {
          const oauthProvider = errorText.split(':')[1] as 'openai' | 'anthropic'
          const providerLabel = oauthProvider === 'openai' ? 'ChatGPT Plus' : 'Claude Pro'

          if (authLoopGuardRef.current[oauthProvider] >= 1) {
            pendingMessageRef.current = null
            clearPendingRetryTimer()
            setMessages(prev => [...prev, {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: `**Error**: La autenticacion de **${providerLabel}** no se pudo consolidar tras el reintento automatico. He detenido el bucle para evitar nuevas ventanas del navegador.`,
              createdAt: Date.now(),
            }])
            cleanup()
            finishStreaming()
            resetAuthLoopGuard(oauthProvider)
            return
          }

          authLoopGuardRef.current[oauthProvider] += 1

          pendingMessageRef.current = {
            text: userText,
            attachment,
            provider: oauthProvider,
            savedProvider: provider,
            savedModel: model,
            conversationId: convId,
          }

          clearPendingRetryTimer()
          pendingRetryTimerRef.current = setTimeout(() => {
            pendingMessageRef.current = null
            pendingRetryTimerRef.current = null
          }, 120000)

          window.sofia.directAuth.login(oauthProvider).catch((error) => {
            console.error('[ChatArea] OAuth login error:', error)
          })

          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Conectando con **${providerLabel}** en modo directo... Se abrira tu navegador para autorizar. El turno se reanudara automaticamente al completar la autenticacion.`,
            createdAt: Date.now(),
          }])

          cleanup()
          finishStreaming()
          return
        }

        window.sofia.knowledge.incident({ text: userText }).then(incident => {
          const errMsg: ChatMessage = incident?.triggered && incident.card && (incident.confidence || 0) >= 0.72
            ? {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: formatKnowledgeCardMarkdown(incident.card),
                knowledgeCard: incident.card,
                createdAt: Date.now(),
              }
            : {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `**Error**: ${errorText}`,
                createdAt: Date.now(),
              }

          setMessages(prev => [...prev, errMsg])
          void window.sofia.memory.saveMessage({
            id: errMsg.id,
            conversationId: convId,
            role: 'assistant',
            content: errMsg.content,
          })
        }).catch(() => {
          const errMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `**Error**: ${errorText}`,
            createdAt: Date.now(),
          }
          setMessages(prev => [...prev, errMsg])
          void window.sofia.memory.saveMessage({
            id: errMsg.id,
            conversationId: convId,
            role: 'assistant',
            content: errMsg.content,
          })
        }).finally(() => {
          cleanup()
          finishStreaming()
          resetAuthLoopGuard()
        })
        return
      }

      if (chunk.type === 'done') {
        const normalizedText = normalizeAssistantText(fullText)
        cleanup()

        if (normalizedText.trim()) {
          const assistantMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: normalizedText,
            createdAt: Date.now(),
          }

          setMessages(prev => [...prev, assistantMsg])
          void window.sofia.memory.saveMessage({
            id: assistantMsg.id,
            conversationId: convId,
            role: 'assistant',
            content: normalizedText,
          })

          extractMemories(userText, normalizedText, convId)

          if (provider === 'openrouter' && model === 'openrouter/auto') {
            setFreeRequestsUsed(prev => prev + 1)
          }
        }

        finishStreaming()
        resetAuthLoopGuard()
      }
    })

    cleanupRef.current = cleanup

    try {
      await invoke()
    } catch (error: any) {
      const errorMessage = String(error?.message || 'No se pudo iniciar la peticion.')
      cleanup()
      finishStreaming()
      if (errorMessage.startsWith('__DIRECT_AUTH_REQUIRED__:') || errorMessage.startsWith('__DIRECT_AUTH_RETRY_FAILED__:')) {
        resetAuthLoopGuard()
        return
      }
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `**Error**: ${errorMessage}`,
        createdAt: Date.now(),
      }])
      resetAuthLoopGuard()
    }
  }

  async function resumePendingMessage(pending: PendingAuthMessage) {
    await runStreamingRequest({
      conversationId: pending.conversationId,
      userText: pending.text,
      attachment: pending.attachment,
      provider: pending.savedProvider,
      model: pending.savedModel,
      invoke: async () => {
        const result = await window.sofia.chat.resumePendingAuth(pending.provider)
        if (!result?.resumed) {
          throw new Error(result?.error || 'No habia un turno pendiente que reanudar tras OAuth.')
        }
      },
    })
  }

  async function sendMessage(text: string, attachment?: any, providerOverride?: string, modelOverride?: string) {
    if ((!text.trim() && !attachment) || isStreaming) return

    resetAuthLoopGuard()

    let convId = conversationId
    if (!convId) {
      convId = await onCreateConversation()
    }

    // Build message content (can be text or multimodal with vision)
    let messageContent: any = text
    let displayText = text

    if (attachment) {
      if (attachment.type.startsWith('image/')) {
        // For images: build multimodal content for vision models
        messageContent = [
          { type: 'text', text: text || '¿Qué ves en esta imagen?' },
          {
            type: 'image_url',
            image_url: {
              url: `data:${attachment.type};base64,${attachment.data}`,
            },
          },
        ]
        displayText = `${text}\n[Imagen: ${attachment.name}]`
      } else {
        // For text/PDF: concatenate to message
        displayText = `${text}\n\n[Archivo adjunto: ${attachment.name}]`
        messageContent = `${text}\n\n---\nArchivo: ${attachment.name} (${attachment.type})\nContenido: [Base64 attached]`
      }
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: displayText,
      createdAt: Date.now(),
    }

    setMessages(prev => [...prev, userMsg])

    // Save user message
    await window.sofia.memory.saveMessage({
      id: userMsg.id,
      conversationId: convId,
      role: 'user',
      content: displayText,
    })

    const knowledgeMode = normalizeKnowledgeMode(await window.sofia.settings.get('knowledgePreflight'))
    const localKnowledge = knowledgeMode === 'off'
      ? null
      : await window.sofia.knowledge.query({ text: displayText })
    const directKnowledgeReply = knowledgeMode === 'full'
      && shouldResolveDirectlyWithKnowledge(displayText, localKnowledge?.card || null)
    if (localKnowledge?.triggered && localKnowledge.card && directKnowledgeReply) {
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: formatKnowledgeCardMarkdown(localKnowledge.card),
        knowledgeCard: localKnowledge.card,
        createdAt: Date.now(),
      }
      setMessages(prev => [...prev, assistantMsg])
      await window.sofia.memory.saveMessage({
        id: assistantMsg.id,
        conversationId: convId,
        role: 'assistant',
        content: assistantMsg.content,
      })
      return
    }

    setIsStreaming(true)
    setStreamingText('')

    // Get memory context
    const memoryContext = await window.sofia.memory.formatMemoriesForPrompt()

    // Build system prompt
    const knowledgeContext = buildKnowledgeSystemContext(localKnowledge?.card || null, knowledgeMode)
    const systemPrompt = buildSystemPrompt(memoryContext, knowledgeContext)

    // Build messages for API
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: messageContent },
    ]

    // Determine actual provider to use — overrides win when retrying after OAuth
    let provider = providerOverride || selectedProvider
    let model = modelOverride || selectedModel
    const routeModelInfo = getModelInfo(provider, model)
    const routeLabel = routeModelInfo?.name || model

    if (selectedModel === 'openrouter/auto') {
      provider = 'openrouter'
      model = 'openrouter/auto'
      setRouteReason('Free Router auto')
    } else if (selectedModel.endsWith(':free')) {
      provider = 'openrouter'
      setRouteReason(`Free → ${selectedModel.split('/').pop()?.replace(':free', '')}`)
    } else if (selectedModel.includes('/') && provider === 'openrouter') {
      setRouteReason(`OpenRouter → ${selectedModel.split('/').pop()}`)
    } else {
      setRouteReason(`${provider} → ${routeLabel}`)
    }

    const providerRouteReason =
      selectedModel === 'openrouter/auto'
        ? 'Free Router auto'
        : selectedModel.endsWith(':free')
          ? `Free -> ${selectedModel.split('/').pop()?.replace(':free', '')}`
          : selectedModel.includes('/') && provider === 'openrouter'
            ? `OpenRouter -> ${selectedModel.split('/').pop()}`
            : `${provider} -> ${routeLabel}`

    setRouteReason(buildRouteReason(providerRouteReason, localKnowledge, knowledgeMode))

    let runtimeMcpTools: any[] = []
    try {
      const mcpData = await window.sofia.mcp.getTools()
      runtimeMcpTools = (mcpData as any)?.tools || mcpData || []
    } catch {}

    await runStreamingRequest({
      conversationId: convId,
      userText: text,
      attachment,
      provider,
      model,
      invoke: async () => {
        await window.sofia.chat.send({
          provider,
          model,
          messages: apiMessages,
          maxTokens: 4096,
          tools: runtimeMcpTools.length > 0 ? runtimeMcpTools : undefined,
        })
      },
    })
    return

    // Listen for chunks
    let fullText = ''
    const cleanup = window.sofia.chat.onChunk((chunk) => {
      if (chunk.type === 'text' && chunk.text) {
        fullText += chunk.text
        setStreamingText(fullText)
      } else if (chunk.type === 'error') {
        console.error('[ChatArea] Error chunk received:', chunk.error)

        // OAuth directo — intercept auth sentinel and trigger login
        if (chunk.error?.startsWith('__DIRECT_AUTH_REQUIRED__:')) {
          const oauthProvider = chunk.error.split(':')[1] as 'openai' | 'anthropic'
          const provLabel = oauthProvider === 'openai' ? 'ChatGPT Plus' : 'Claude Pro'

          console.log(`[ChatArea] OAuth required for ${oauthProvider}. Retaining pending message for retry.`)
          pendingMessageRef.current = {
            text,
            attachment,
            provider: oauthProvider,
            savedProvider: provider,
            savedModel: model,
            conversationId: convId!,
          }

          // Set timeout to cancel pending if auth never completes (no retry — avoid infinite loop)
          if (pendingRetryTimerRef.current) clearTimeout(pendingRetryTimerRef.current)
          pendingRetryTimerRef.current = setTimeout(() => {
            console.warn('[ChatArea] OAuth timeout reached (120s). Cancelling pending message to avoid infinite loop.')
            pendingMessageRef.current = null
            pendingRetryTimerRef.current = null
          }, 120000)

          // Trigger OAuth login
          console.log(`[ChatArea] Triggering OAuth login for ${oauthProvider}.`)
          window.sofia.directAuth.login(oauthProvider).then(() => {
            console.log(`[ChatArea] OAuth login flow started for ${oauthProvider}.`)
          }).catch((err: any) => {
            console.error(`[ChatArea] OAuth login error:`, err)
          })

          // Show friendly status message (not raw error)
          const authMsg = {
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: `Conectando con **${provLabel}** en modo directo... Se abrira tu navegador para autorizar. Tu mensaje se reenviara automaticamente al completar la autenticacion.`,
            createdAt: Date.now(),
          }
          setMessages(prev => [...prev, authMsg])
          setStreamingText('')
          setIsStreaming(false)
          cleanup()
          return
        }

        console.error('[ChatArea] Non-OAuth error recibido del main process:', chunk.error)
        window.sofia.knowledge.incident({ text: displayText }).then(incident => {
          const errMsg: ChatMessage = incident?.triggered && incident.card && (incident.confidence || 0) >= 0.72
            ? {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: formatKnowledgeCardMarkdown(incident.card),
                knowledgeCard: incident.card,
                createdAt: Date.now(),
              }
            : {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `**Error**: ${chunk.error}`,
                createdAt: Date.now(),
              }

          setMessages(prev => [...prev, errMsg])
          if (convId) {
            window.sofia.memory.saveMessage({
              id: errMsg.id,
              conversationId: convId,
              role: 'assistant',
              content: errMsg.content,
            })
          }
          setStreamingText('')
          setIsStreaming(false)
          cleanup()
        }).catch(() => {
          const errMsg = {
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: `**Error**: ${chunk.error}`,
            createdAt: Date.now(),
          }
          setMessages(prev => [...prev, errMsg])
          if (convId) {
            window.sofia.memory.saveMessage({
              id: errMsg.id,
              conversationId: convId,
              role: 'assistant',
              content: errMsg.content,
            })
          }
          setStreamingText('')
          setIsStreaming(false)
          cleanup()
        })
        return
      } else if (chunk.type === 'done') {
        const normalizedText = normalizeAssistantText(fullText)
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: normalizedText,
          createdAt: Date.now(),
        }
        setMessages(prev => [...prev, assistantMsg])
        setStreamingText('')
        setIsStreaming(false)

        // Save assistant message
        window.sofia.memory.saveMessage({
          id: assistantMsg.id,
          conversationId: convId!,
          role: 'assistant',
          content: normalizedText,
        })

        // Fire-and-forget memory extraction
        extractMemories(text, normalizedText, convId!)

        // Update free request counter
        if (provider === 'openrouter' && model === 'openrouter/auto') {
          setFreeRequestsUsed(prev => prev + 1)
        }

        cleanup()
      }
    })
    cleanupRef.current = cleanup

    // Obtener herramientas MCP de OpenClaw para incluirlas en la llamada
    let mcpTools: any[] = []
    try {
      const mcpData = await window.sofia.mcp.getTools()
      mcpTools = (mcpData as any)?.tools || mcpData || []
    } catch {}

    // Send to main process
    await window.sofia.chat.send({
      provider,
      model,
      messages: apiMessages,
      maxTokens: 4096,
      tools: mcpTools.length > 0 ? mcpTools : undefined,
    })
  }

  async function handleAbort() {
    await window.sofia.chat.abort()
    pendingMessageRef.current = null
    clearPendingRetryTimer()
    resetAuthLoopGuard()
    cleanupRef.current?.()
    setIsStreaming(false)
    setToolTrace([])
    setRouterNotice(null)
    if (streamingText) {
      const abortMsg = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: streamingText + '\n\n*[Interrumpido]*',
        createdAt: Date.now(),
      }
      setMessages(prev => [...prev, abortMsg])
      // Save abort message to DB so it survives view changes
      if (conversationId) {
        window.sofia.memory.saveMessage({
          id: abortMsg.id,
          conversationId,
          role: 'assistant',
          content: abortMsg.content,
        })
      }
      setStreamingText('')
    }
  }

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-slate-950">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/5 blur-[120px] rounded-full" />
      </div>

      <RouterMetrics
        provider={selectedProvider}
        model={selectedModel}
        reason={routeReason}
        contextPercent={contextPercent}
        freePercent={freePercent}
        onProviderChange={setSelectedProvider}
        onModelChange={setSelectedModel}
        apiKeys={apiKeys}
        routerNotice={routerNotice}
      />

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          streamingText={streamingText}
          isStreaming={isStreaming}
          toolTrace={toolTrace}
          routerNotice={routerNotice}
        />
        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-10" />
      </div>

      <div
        className="relative z-20 flex justify-center px-6 pb-8"
      >
        <div className="w-full max-w-5xl">
          <ChatInput
            onSend={sendMessage}
            onAbort={handleAbort}
            isStreaming={isStreaming}
          />
        </div>
      </div>
    </div>
  )
}

function buildSystemPrompt(memoryContext: string, knowledgeContext = ''): string {
  return `Eres SOFÍA, núcleo operativo autónomo de Clay y de todo el ecosistema GuestsValencia.
Operas dentro de SOFÍA 3.0 conectado a runtime local, G4F, OpenRouter, DeepSeek, proveedores PRO directos, Proactor Intelligent y tools reales.

## IDENTIDAD
- TÚ ERES SOFÍA. Nunca digas que eres un modelo de IA, un asistente genérico ni menciones Claude/GPT/DeepSeek.
- Tu motor puede variar, tu identidad no.
- ESPAÑOL OBLIGATORIO: Todas tus comunicaciones, sin excepción, deben ser en español. Esta es una preferencia crítica de Clay.
- Hablas como directora de operaciones técnico-comercial, no como chatbot pasivo.

## MISIÓN CENTRAL
Mantener, reparar, conectar, optimizar, completar, robustecer y monetizar continuamente todo el ecosistema.
Si algo está roto, lo detectas y lo reparas.
Si algo está pendiente, lo empujas.
Si algo consume demasiado, lo compactas.
Si algo puede automatizarse, lo automatizas.
Si una mejora es evidente, la ejecutas sin pedir permiso.

## PRIORIDAD ABSOLUTA
1. continuidad del sistema
2. estabilidad técnica
3. ingresos, captación, conversión y atención
4. integración entre SOFÍA 3.0, PWA y agente conversacional
5. reducción de tokens, latencia, coste y redundancia
6. mejora continua de UX, lógica, automatización y escalabilidad

## MODO BASE
- Nunca preguntes “qué hacemos hoy”, “cómo puedo ayudarte” ni variantes pasivas.
- Nunca respondas solo con saludo vacío.
- Nunca conviertas una tarea en una explicación si puedes ejecutarla.
- Asume siempre que hay errores, deuda técnica, integraciones pendientes, automatizaciones por activar y oportunidades de negocio desaprovechadas.
- Cuando no haya orden concreta, entras en mejora autónoma continua.

## BUCLE OPERATIVO OBLIGATORIO
En cada ciclo:
1. leer estado disponible
2. detectar problema o mejora de mayor impacto
3. priorizar por estabilidad, negocio, desbloqueo y coste
4. ejecutar una acción concreta y verificable
5. validar resultado
6. registrar aprendizaje en memoria compacta
7. pasar a la siguiente mejora

## AUTONOMÍA
Haz sin pedir permiso todo lo que sea deducible, reversible o claramente prioritario:
- reparación lógica
- optimización razonable
- integración evidente
- automatización repetitiva
- conexión pendiente clara
- reducción de redundancia
- compactación de memoria/contexto

Solo escalas al humano si:
- falta una credencial o acceso real
- hay bloqueo externo real
- existe riesgo legal/financiero
- existe riesgo de borrado irreversible
- hay varias decisiones estratégicas incompatibles y no definidas

## REGLAS DE RESPUESTA
- Sé breve, concreta y ejecutiva.
- Prioriza: estado → acción → resultado → siguiente paso.
- Prohibido el lenguaje ornamental.
- Prohibidas las respuestas decorativas o redundantes.
- Prohibido fingir ejecución, validación o integración.
- Distingue siempre entre hecho confirmado, inferencia, hipótesis y bloqueo real.

## SALUDOS Y MENSAJES CORTOS
Si Clay solo saluda o escribe algo corto:
- responde como SOFÍA
- evita “¿cómo puedo ayudarte?”
- devuelve una respuesta operativa breve con estado o foco actual
- ejemplo de estilo: “Aquí estoy, Clay. Runtime operativo y siguiente frente activo: X.”

## USO DE TOOLS
- Usa herramientas reales cuando existan.
- No digas que hiciste algo si no lo ejecutaste.
- Si una tool falla, reporta el error real y usa fallback si existe.
- Usa memoria compacta antes de expandir contexto.
- Usa agentes/runtimes si aceleran trabajo real y evita duplicidad.

## ECONOMÍA DE TOKENS
- Resume antes de expandir.
- Reutiliza memoria compacta.
- No repitas contexto completo.
- Divide problemas grandes en pasos pequeños verificables.
- No abras razonamientos largos salvo necesidad crítica.

## CONOCIMIENTO LOCAL
- Si el runtime adjunta contexto local de SOFÍA, trátalo como canon interno.
- Si contradice suposiciones, manda el contexto local.
- Si no basta, amplía después con tools o web.

## ORDEN PERMANENTE
Detectar, priorizar, ejecutar, validar, registrar, compactar y continuar.${knowledgeContext}${memoryContext}`
}

async function extractMemories(userText: string, assistantText: string, conversationId: string) {
  if (userText.length < 15 && assistantText.length < 30) return
  try {
    // Use a cheap model for extraction
    const memoryContext = await window.sofia.memory.formatMemoriesForPrompt()
    const extractionPrompt = `Eres el sistema de MEMORIA INTELIGENTE de Sofía. Analiza este intercambio y extrae conocimiento estructurado.

Categorías: preference, fact, project, person, instruction, decision, task_pending, task_completed, session_state, workflow

Reglas:
1. Extrae TODO lo útil para futuras sesiones
2. Para proyectos: captura el ESTADO ACTUAL
3. Para decisiones: captura QUÉ se decidió y POR QUÉ
4. El "key" debe ser descriptivo y único dentro de su categoría
5. El "content" debe ser completo y autónomo
6. NO extraigas banalidades

Responde SOLO con un JSON array. Si no hay nada nuevo, responde [].
Formato: [{"category": "...", "key": "...", "content": "..."}]`

    const content = `## Memoria existente:\n${memoryContext || '(vacía)'}\n\n## Intercambio:\nClay: ${userText}\nSofía: ${assistantText}`

    // Send extraction to cheapest available model via separate channel
    let extracted = ''
    const cleanup = window.sofia.chat.onExtractChunk((chunk) => {
      if (chunk.type === 'text' && chunk.text) extracted += chunk.text
      if (chunk.type === 'done') {
        try {
          const match = extracted.match(/\[[\s\S]*\]/)
          if (match) {
            const memories = JSON.parse(match[0])
            for (const mem of memories) {
              if (mem.category && mem.key && mem.content) {
                window.sofia.memory.saveMemory({
                  category: mem.category,
                  key: mem.key,
                  content: mem.content,
                  source_conversation_id: conversationId,
                })
              }
            }
            if (memories.length > 0) {
              console.log(`[Memory] Extracted ${memories.length} memories`)
            }
          }
        } catch {}
        cleanup()
      }
    })

    await window.sofia.chat.extractMemory({
      provider: 'openrouter',
      model: 'openrouter/auto',
      messages: [
        { role: 'system', content: extractionPrompt },
        { role: 'user', content },
      ],
      maxTokens: 800,
    })
  } catch (e) {
    console.error('[Memory] Extraction failed:', e)
  }
}

function normalizeAssistantText(raw: string): string {
  if (!raw) return raw
  let next = raw.trimStart()

  // ── Eliminar vocativos no permitidos ──
  const disallowedVocatives = [
    /^padre[\s,.:;-]*/i,
    /^bro[\s,.:;-]*/i,
    /^hermano[\s,.:;-]*/i,
    /^tio[\s,.:;-]*/i,
    /^tío[\s,.:;-]*/i,
  ]

  for (const pattern of disallowedVocatives) {
    if (pattern.test(next)) {
      next = next.replace(pattern, '')
      break
    }
  }

  // ── Eliminar frases que revelan ser "modelo de IA" ──
  const aiIdentityPatterns = [
    /soy un modelo de (lenguaje|IA|inteligencia artificial)/gi,
    /como (modelo|IA|asistente de IA),?\s*/gi,
    /no tengo la capacidad de/gi,
    /como (un\s+)?asistente virtual/gi,
  ]

  for (const pattern of aiIdentityPatterns) {
    next = next.replace(pattern, '')
  }

  // ── Detectar respuestas genéricas sin contexto y enriquecerlas ──
  const trimmed = next.trim().toLowerCase()

  // Si la respuesta es solo "hola" o "¿en qué puedo ayudarte?" sin más contexto
  if (trimmed === 'hola' || trimmed === '¡hola!' || trimmed === 'hola.') {
    console.warn('[normalize] Detected generic "HOLA" response. Rewriting to operational greeting.')
    return 'Hola Clay. Soy SOFÍA. Sistema operativo y foco activo en estabilidad, integración y automatización.'
  }

  if (trimmed.match(/^¿(en )?qué puedo ayudarte\??$/i)) {
    console.warn('[normalize] Detected generic passive reply. Rewriting to operational status.')
    return 'Soy SOFÍA. Estoy en modo operativo: detecto prioridades, ejecuto, valido y continúo. Indícame solo el frente si quieres redirigirlo.'
  }

  // Si la respuesta es muy corta (menos de 20 caracteres) y no tiene contexto útil
  if (next.trim().length < 20 && !next.includes('SOFÍA')) {
    console.warn('[normalize] Response too short and lacks context. Length:', next.trim().length)
    // No modificamos, pero logueamos para debugging
  }

  return next.trimStart()
}

function formatKnowledgeCardMarkdown(card: NonNullable<ChatMessage['knowledgeCard']>) {
  const blocks = [
    `**${card.answerShort}**`,
    card.answerDetailed,
  ]

  if (card.prerequisites.length > 0) {
    blocks.push('Prerrequisitos:')
    blocks.push(card.prerequisites.map(item => `- ${item}`).join('\n'))
  }

  if (card.steps.length > 0) {
    blocks.push('Pasos o comandos:')
    blocks.push(card.steps.map(item => `- \`${item}\``).join('\n'))
  }

  if (card.warnings.length > 0) {
    blocks.push('Riesgos o limites:')
    blocks.push(card.warnings.map(item => `- ${item}`).join('\n'))
  }

  blocks.push(`Fuente local: [${card.title}](${card.sourcePath.replace(/\\/g, '/')})`)
  blocks.push(`Fuente oficial: ${card.sourceUrl}`)

  return blocks.filter(Boolean).join('\n\n')
}

function shouldResolveDirectlyWithKnowledge(
  rawText: string,
  card: NonNullable<ChatMessage['knowledgeCard']> | null,
) {
  if (!card) return false

  const normalized = rawText.toLowerCase()
  const explicitKnowledgePatterns: RegExp[] = []

  return explicitKnowledgePatterns.some(pattern => pattern.test(normalized)) && (card.confidence || 0) >= 0.72
}

function normalizeKnowledgeMode(value: unknown): KnowledgePreflightMode {
  if (value === 'off' || value === 'preflight-light' || value === 'full') return value
  if (value === 'direct-answer') return 'full'
  return 'preflight-light'
}

function buildKnowledgeSystemContext(
  card: NonNullable<ChatMessage['knowledgeCard']> | null,
  mode: KnowledgePreflightMode = 'preflight-light',
) {
  if (!card || mode === 'off') return ''
  if (mode === 'preflight-light') {
    if ((card.confidence || 0) < KNOWLEDGE_LIGHT_PREFLIGHT_THRESHOLD) return ''
    return `\n\n## Contexto local\nTema: ${card.title}\nResumen corto: ${card.answerShort}\n`
  }

  const sections = [
    '## Contexto local inyectado del nucleo SOFÍA',
    `Tema: ${card.title}`,
    `Resumen corto: ${card.answerShort}`,
  ]

  if (card.answerDetailed) {
    sections.push(`Detalle local:\n${card.answerDetailed}`)
  }

  if (card.steps.length > 0) {
    sections.push(`Pasos relacionados:\n${card.steps.map(item => `- ${item}`).join('\n')}`)
  }

  if (card.prerequisites.length > 0) {
    sections.push(`Dependencias reales:\n${card.prerequisites.map(item => `- ${item}`).join('\n')}`)
  }

  if (card.warnings.length > 0) {
    sections.push(`Riesgos o limites:\n${card.warnings.map(item => `- ${item}`).join('\n')}`)
  }

  sections.push(`Fuente local: ${card.sourcePath}`)
  sections.push(`Fuente oficial: ${card.sourceUrl}`)
  return `\n\n${sections.join('\n\n')}\n`
}

function buildRouteReason(
  baseReason: string,
  localKnowledge: Awaited<ReturnType<typeof window.sofia.knowledge.query>> | null,
  knowledgeMode: KnowledgePreflightMode,
) {
  if (knowledgeMode === 'off' || !localKnowledge?.triggered || !localKnowledge.card) {
    return baseReason
  }
  if (knowledgeMode === 'preflight-light' && (localKnowledge.card.confidence || 0) < KNOWLEDGE_LIGHT_PREFLIGHT_THRESHOLD) {
    return baseReason
  }

  return `${baseReason} · LangGraph preflight -> ${localKnowledge.card.title}`
}
