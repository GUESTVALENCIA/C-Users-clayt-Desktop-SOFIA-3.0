import { type IpcMain } from 'electron'
import { getSecret } from './settings.ipc'

let sql: any = null

async function getSQL() {
  if (sql) return sql
  const url = getSecret('neon_url')
  if (!url) return null
  try {
    const { neon } = await import('@neondatabase/serverless')
    sql = neon(url)
    return sql
  } catch (e) {
    console.error('[Memory] Failed to connect to Neon:', e)
    return null
  }
}

export function registerMemoryIPC(ipcMain: IpcMain) {
  // Initialize schema
  ipcMain.handle('memory:init-schema', async () => {
    const db = await getSQL()
    if (!db) return { ok: false, error: 'No database connection' }
    try {
      await db`CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY,
        title TEXT,
        provider TEXT NOT NULL DEFAULT 'openrouter',
        model TEXT NOT NULL DEFAULT 'auto',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )`
      await db`CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY,
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content_json TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      )`
      await db`CREATE TABLE IF NOT EXISTS agent_memory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category VARCHAR(50) NOT NULL,
        key VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        source_conversation_id UUID,
        confidence REAL DEFAULT 1.0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(category, key)
      )`
      await db`CREATE TABLE IF NOT EXISTS shared_vision (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topic VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(topic)
      )`
      console.log('[Memory] Schema initialized')
      return { ok: true }
    } catch (e: any) {
      console.error('[Memory] Schema init failed:', e)
      return { ok: false, error: e.message }
    }
  })

  // Conversations
  ipcMain.handle('memory:conversations', async (_e, limit = 50) => {
    const db = await getSQL()
    if (!db) return []
    try {
      return await db`SELECT * FROM conversations ORDER BY updated_at DESC LIMIT ${limit}`
    } catch { return [] }
  })

  ipcMain.handle('memory:create-conversation', async (_e, params: any) => {
    const db = await getSQL()
    if (!db) return null
    try {
      const rows = await db`INSERT INTO conversations (id, title, provider, model) VALUES (${params.id}, ${params.title}, ${params.provider}, ${params.model}) RETURNING *`
      return rows[0]
    } catch (e: any) {
      console.error('[Memory] Create conversation failed:', e)
      return null
    }
  })

  ipcMain.handle('memory:delete-conversation', async (_e, id: string) => {
    const db = await getSQL()
    if (!db) return false
    try {
      await db`DELETE FROM conversations WHERE id = ${id}`
      return true
    } catch { return false }
  })

  ipcMain.handle('memory:update-title', async (_e, id: string, title: string) => {
    const db = await getSQL()
    if (!db) return false
    try {
      await db`UPDATE conversations SET title = ${title}, updated_at = now() WHERE id = ${id}`
      return true
    } catch { return false }
  })

  // Messages
  ipcMain.handle('memory:messages', async (_e, conversationId: string) => {
    const db = await getSQL()
    if (!db) return []
    try {
      return await db`SELECT id, conversation_id, role, content_json, created_at FROM messages WHERE conversation_id = ${conversationId} ORDER BY created_at ASC`
    } catch {
      try {
        return await db`SELECT id, conversation_id, role, content AS content_json, created_at FROM messages WHERE conversation_id = ${conversationId} ORDER BY created_at ASC`
      } catch {
        return []
      }
    }
  })

  ipcMain.handle('memory:save-message', async (_e, params: any) => {
    const db = await getSQL()
    if (!db) return null
    try {
      await db`INSERT INTO messages (id, conversation_id, role, content_json) VALUES (${params.id}, ${params.conversationId}, ${params.role}, ${params.content})`
      await db`UPDATE conversations SET updated_at = now() WHERE id = ${params.conversationId}`
      return true
    } catch {
      try {
        await db`INSERT INTO messages (id, conversation_id, role, content) VALUES (${params.id}, ${params.conversationId}, ${params.role}, ${params.content})`
        await db`UPDATE conversations SET updated_at = now() WHERE id = ${params.conversationId}`
        return true
      } catch (e: any) {
        console.error('[Memory] Save message failed:', e)
        return null
      }
    }
  })

  // Agent Memory
  ipcMain.handle('memory:get-all', async () => {
    const db = await getSQL()
    if (!db) return []
    try {
      return await db`SELECT * FROM agent_memory WHERE is_active = true ORDER BY category, updated_at DESC`
    } catch { return [] }
  })

  ipcMain.handle('memory:save', async (_e, mem: any) => {
    const db = await getSQL()
    if (!db) return false
    try {
      await db`INSERT INTO agent_memory (category, key, content, source_conversation_id, confidence)
        VALUES (${mem.category}, ${mem.key}, ${mem.content}, ${mem.source_conversation_id || null}, ${mem.confidence || 1.0})
        ON CONFLICT (category, key) DO UPDATE SET
          content = EXCLUDED.content,
          source_conversation_id = EXCLUDED.source_conversation_id,
          confidence = EXCLUDED.confidence,
          updated_at = now()`
      return true
    } catch (e: any) {
      console.error('[Memory] Save memory failed:', e)
      return false
    }
  })

  ipcMain.handle('memory:format-for-prompt', async () => {
    const db = await getSQL()
    if (!db) return ''
    try {
      const memories = await db`SELECT * FROM agent_memory WHERE is_active = true ORDER BY category, updated_at DESC`
      if (!memories.length) return ''

      const grouped: Record<string, Array<{ key: string; content: string }>> = {}
      for (const m of memories) {
        if (!grouped[m.category]) grouped[m.category] = []
        grouped[m.category].push({ key: m.key, content: m.content })
      }

      const LABELS: Record<string, string> = {
        session_state: 'Estado actual de trabajo',
        instruction: 'Instrucciones permanentes de Clay',
        task_pending: 'Tareas pendientes',
        task_completed: 'Tareas completadas',
        project: 'Proyectos',
        preference: 'Preferencias de Clay',
        fact: 'Hechos conocidos',
        person: 'Personas relevantes',
        decision: 'Decisiones tomadas',
        workflow: 'Flujos de trabajo',
      }

      const priority = ['session_state', 'instruction', 'task_pending', 'project', 'preference', 'fact', 'person', 'decision', 'task_completed', 'workflow']
      let result = '\n\n## Mi memoria persistente (Neon DB)\n'
      result += 'Soy Sofía, una asistente hiperrealista. Aquí están los hechos que recuerdo de mi base de datos Neon:\n'

      for (const cat of priority) {
        if (!grouped[cat]) continue
        result += `\n### ${LABELS[cat] || cat}\n`
        for (const m of grouped[cat]) {
          result += `- **${m.key}**: ${m.content}\n`
        }
      }

      return result
    } catch { return '' }
  })

  ipcMain.handle('memory:get-worker-status', async () => {
    return { status: 'active', activeTasks: 1, completedToday: 5 }
  })

  // Shared Vision (Clay & Jules Layer)
  ipcMain.handle('memory:shared-vision:get', async (_e, topic: string) => {
    const db = await getSQL()
    if (!db) return null
    try {
      const rows = await db`SELECT * FROM shared_vision WHERE topic = ${topic}`
      return rows[0] || null
    } catch { return null }
  })

  ipcMain.handle('memory:shared-vision:save', async (_e, params: any) => {
    const db = await getSQL()
    if (!db) return false
    try {
      await db`INSERT INTO shared_vision (topic, content)
        VALUES (${params.topic}, ${params.content})
        ON CONFLICT (topic) DO UPDATE SET
          content = EXCLUDED.content,
          version = shared_vision.version + 1,
          updated_at = now()`
      return true
    } catch (e: any) {
      console.error('[Memory] Save shared vision failed:', e)
      return false
    }
  })

  ipcMain.handle('memory:shared-vision:get-all', async () => {
    const db = await getSQL()
    if (!db) return []
    try {
      return await db`SELECT * FROM shared_vision ORDER BY updated_at DESC`
    } catch { return [] }
  })
}
