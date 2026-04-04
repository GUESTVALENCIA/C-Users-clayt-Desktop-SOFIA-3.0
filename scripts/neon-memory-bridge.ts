import { neon } from '@neondatabase/serverless';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function getNeonUrl() {
  // Intentar leer de .env si existe
  const envPath = join(process.cwd(), '.env');
  if (existsSync(envPath)) {
    const env = readFileSync(envPath, 'utf8');
    const match = env.match(/DATABASE_URL=(.+)/);
    if (match) return match[1].trim();
  }
  return process.env.DATABASE_URL;
}

export async function getMemories() {
  const url = getNeonUrl();
  if (!url) throw new Error('Neon DATABASE_URL not found');

  const sql = neon(url);
  return await sql`SELECT * FROM agent_memory WHERE is_active = true ORDER BY category, updated_at DESC`;
}

export async function saveMemory(category: string, key: string, content: string) {
  const url = getNeonUrl();
  if (!url) throw new Error('Neon DATABASE_URL not found');

  const sql = neon(url);
  return await sql`
    INSERT INTO agent_memory (category, key, content)
    VALUES (${category}, ${key}, ${content})
    ON CONFLICT (category, key) DO UPDATE SET
      content = EXCLUDED.content,
      updated_at = now()
    RETURNING *;
  `;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const action = process.argv[2];
  if (action === 'list') {
    getMemories().then(console.log).catch(console.error);
  }
}
