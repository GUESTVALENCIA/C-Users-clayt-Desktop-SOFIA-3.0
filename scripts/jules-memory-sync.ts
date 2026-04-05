import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const url = process.env.DATABASE_URL || process.env.NEON_URL;
if (!url) {
  process.exit(1);
}

const sql = neon(url);

export async function saveJulesMemory(category: string, key: string, content: string) {
  try {
    await sql`
      INSERT INTO jules_memory (category, key, content)
      VALUES (${category}, ${key}, ${content})
      ON CONFLICT (category, key) DO UPDATE SET
        content = EXCLUDED.content,
        updated_at = now()
    `;
    console.log(`[Juliet Memory] Guardado: ${category}/${key}`);
  } catch (e) {
    console.error(`[Juliet Memory] Error:`, e);
  }
}

export async function addTask(description: string, command?: string) {
  try {
    await sql`
      INSERT INTO local_tasks (description, command, status)
      VALUES (${description}, ${command || null}, 'pending')
    `;
    console.log(`[Juliet Tasks] Tarea añadida: ${description}`);
  } catch (e) {
    console.error(`[Juliet Tasks] Error:`, e);
  }
}
