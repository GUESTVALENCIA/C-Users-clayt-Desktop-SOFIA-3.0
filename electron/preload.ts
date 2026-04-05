import { contextBridge, ipcRenderer } from './electron-wrapper.mjs'

// Type-safe listener helper with cleanup
function onEvent(channel: string, callback: (...args: any[]) => void) {
  const handler = (_event: Electron.IpcRendererEvent, ...args: any[]) => callback(...args)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

contextBridge.exposeInMainWorld('sofia', {
      // Chat - enviar y recibir mensajes
      chat: {
        send: (params: any) => ipcRenderer.invoke('chat:send', params),
        resumePendingAuth: (provider: string) => ipcRenderer.invoke('chat:resume-after-auth', provider),
        abort: () => ipcRenderer.invoke('chat:abort'),
        onChunk: (cb: (chunk: any) => void) => onEvent('chat:chunk', cb),
        extractMemory: (params: any) => ipcRenderer.invoke('chat:extract-memory', params),
        onExtractChunk: (cb: (chunk: any) => void) => onEvent('chat:extract-chunk', cb),
      },

      // Voz - LLM y síntesis de voz
      voice: {
        getDeepgramKey: () => ipcRenderer.invoke('voice:get-deepgram-key'),
        getRuntimeState: () => ipcRenderer.invoke('voice:get-runtime-state'),
        listAvatarScenes: () => ipcRenderer.invoke('voice:list-avatar-scenes'),
        listCallbacks: () => ipcRenderer.invoke('voice:list-callbacks'),
        queueCallback: (request: any) => ipcRenderer.invoke('voice:queue-callback', request),
        dequeueReadyCallback: () => ipcRenderer.invoke('voice:dequeue-ready-callback'),
        updateCallbackStatus: (id: string, status: string) => ipcRenderer.invoke('voice:update-callback-status', { id, status }),
        sendToLLM: (params: any) => ipcRenderer.invoke('voice:send-to-llm', params),
        abortLLM: () => ipcRenderer.invoke('voice:abort-llm'),
        onLLMChunk: (cb: (chunk: any) => void) => onEvent('voice:llm-chunk', cb),
        tts: (text: string, actor?: string) => ipcRenderer.invoke('voice:tts', { text, actor }),
      },

      // Memoria - gestión de conversaciones y contexto
      memory: {
        getConversations: (limit?: number) => ipcRenderer.invoke('memory:conversations', limit),
        getMessages: (conversationId: string) => ipcRenderer.invoke('memory:messages', conversationId),
        createConversation: (params: any) => ipcRenderer.invoke('memory:create-conversation', params),
        deleteConversation: (id: string) => ipcRenderer.invoke('memory:delete-conversation', id),
        updateConversationTitle: (id: string, title: string) => ipcRenderer.invoke('memory:update-title', id, title),
        saveMessage: (params: any) => ipcRenderer.invoke('memory:save-message', params),
        getMemories: () => ipcRenderer.invoke('memory:get-all'),
        saveMemory: (mem: any) => ipcRenderer.invoke('memory:save', mem),
        getSharedVision: (topic: string) => ipcRenderer.invoke('memory:shared-vision:get', topic),
        saveSharedVision: (topic: string, content: string) => ipcRenderer.invoke('memory:shared-vision:save', { topic, content }),
        formatMemoriesForPrompt: () => ipcRenderer.invoke('memory:format-for-prompt'),
        initSchema: () => ipcRenderer.invoke('memory:init-schema'),
        jules: {
          save: (mem: any) => ipcRenderer.invoke('memory:jules:save', mem),
          getAll: () => ipcRenderer.invoke('memory:jules:get-all'),
        },
        tasks: {
          create: (task: any) => ipcRenderer.invoke('memory:tasks:create', task),
          getPending: () => ipcRenderer.invoke('memory:tasks:get-pending'),
          updateStatus: (params: any) => ipcRenderer.invoke('memory:tasks:update-status', params),
        },
      },

      // Configuración - claves API y secretos
      settings: {
        get: (key: string) => ipcRenderer.invoke('settings:get', key),
        set: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
        getSecret: (key: string) => ipcRenderer.invoke('settings:get-secret', key),
        setSecret: (key: string, value: string) => ipcRenderer.invoke('settings:set-secret', key, value),
        getAllKeys: () => ipcRenderer.invoke('settings:get-all-keys'),
        getAll: () => ipcRenderer.invoke('settings:get-all'),
        resetKeys: () => ipcRenderer.invoke('settings:reset-keys'),
      },

      // MCP - Model Context Protocol (integración con herramientas)
      mcp: {
        getServers: () => ipcRenderer.invoke('mcp:get-servers'),
        getTools: () => ipcRenderer.invoke('mcp:get-tools'),
        getRuntimeHealth: () => ipcRenderer.invoke('mcp:get-runtime-health'),
        getEditorInventory: () => ipcRenderer.invoke('mcp:get-editor-inventory'),
        getMemoryPolicy: () => ipcRenderer.invoke('mcp:get-memory-policy'),
        getPublicApiCapabilityRegistry: () => ipcRenderer.invoke('mcp:get-public-api-capability-registry'),
        getKnowledgeRoutingPolicy: () => ipcRenderer.invoke('mcp:get-knowledge-routing-policy'),
        getMcpToolPriorityMap: () => ipcRenderer.invoke('mcp:get-tool-priority-map'),
        getTeachingManifest: () => ipcRenderer.invoke('mcp:get-teaching-manifest'),
        callTool: (name: string, args: any) => ipcRenderer.invoke('mcp:call-tool', name, args),
        connectServer: (config: any) => ipcRenderer.invoke('mcp:connect', config),
        disconnectServer: (id: string) => ipcRenderer.invoke('mcp:disconnect', id),
      },

      knowledge: {
        query: (payload: any) => ipcRenderer.invoke('knowledge:query', payload),
        incident: (payload: any) => ipcRenderer.invoke('knowledge:incident', payload),
        refresh: () => ipcRenderer.invoke('knowledge:refresh'),
        syncSchedules: () => ipcRenderer.invoke('knowledge:sync-schedules'),
        listSchedules: () => ipcRenderer.invoke('knowledge:list-schedules'),
        triggerSchedule: (scheduleId: string) => ipcRenderer.invoke('knowledge:trigger-schedule', { scheduleId }),
        auditCoverage: () => ipcRenderer.invoke('knowledge:audit-coverage'),
        getRuntimeState: () => ipcRenderer.invoke('knowledge:get-runtime-state'),
      },

      // G4F — proveedores y modelos dinámicos desde localhost:8080
      g4f: {
        listProviders: () => ipcRenderer.invoke('g4f:list-providers'),
        listProviderModels: (provider: string) => ipcRenderer.invoke('g4f:list-provider-models', provider),
        listModels: () => ipcRenderer.invoke('g4f:list-models'),
        testProviders: () => ipcRenderer.invoke('g4f:test-providers'),
      },

      openrouter: {
        listModels: () => ipcRenderer.invoke('openrouter:list-models'),
      },

      // Auth directo — OAuth local para ChatGPT Plus y Claude Pro
      directAuth: {
        login: (provider: string) => ipcRenderer.invoke('direct:login', { provider }),
        refresh: (provider: string) => ipcRenderer.invoke('direct:refresh', { provider }),
        logout: (provider: string) => ipcRenderer.invoke('direct:logout', { provider }),
        getState: () => ipcRenderer.invoke('direct:get-auth-state'),
        getRuntimeState: () => ipcRenderer.invoke('direct:get-runtime-state'),
        onStateChanged: (cb: (state: any) => void) => onEvent('direct:auth-state-changed', cb),
      },

      // Controles de ventana
      window: {
        minimize: () => ipcRenderer.invoke('window:minimize'),
        maximize: () => ipcRenderer.invoke('window:maximize'),
        close: () => ipcRenderer.invoke('window:close'),
        isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
        onMaximizedChanged: (cb: (isMax: boolean) => void) => onEvent('window:maximized-changed', cb),
      },

      desktop: {
        openPath: (targetPath: string) => ipcRenderer.invoke('desktop:open-path', targetPath),
        openExternal: (url: string) => ipcRenderer.invoke('desktop:open-external', url),
      },
    })
