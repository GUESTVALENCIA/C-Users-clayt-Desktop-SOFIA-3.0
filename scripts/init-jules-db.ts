import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const url = process.env.DATABASE_URL || process.env.NEON_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = neon(url);

async function init() {
  console.log('Iniciando esquemas de Julie...');

  try {
    // Memoria independiente de Julie
    await sql`
      CREATE TABLE IF NOT EXISTS jules_memory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category TEXT NOT NULL,
        key TEXT NOT NULL,
        content TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(category, key)
      )
    `;

    // Tareas locales para el Watcher
    await sql`
      CREATE TABLE IF NOT EXISTS local_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        description TEXT NOT NULL,
        command TEXT,
        status TEXT DEFAULT 'pending', -- pending, running, completed, failed, manual_pending
        result TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `;

    console.log('Esquemas creados correctamente.');
  } catch (e) {
    console.error('Error al crear esquemas:', e);
  }
}

init();
