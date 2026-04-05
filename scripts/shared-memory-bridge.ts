import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

// Bridge para acceder a la memoria compartida (Shared Vision) desde scripts/CLI
const url = process.env.DATABASE_URL || process.env.NEON_URL;

if (!url) {
  console.error('[Memory Bridge] Error: No se encontró DATABASE_URL o NEON_URL en el entorno.');
  process.exit(1);
}

const sql = neon(url);

export async function saveSharedVision(topic: string, content: string) {
  try {
    await sql`
      INSERT INTO shared_vision (topic, content)
      VALUES (${topic}, ${content})
      ON CONFLICT (topic) DO UPDATE SET
        content = EXCLUDED.content,
        version = shared_vision.version + 1,
        updated_at = now()
    `;
    console.log(`[Memory Bridge] Visión compartida actualizada: ${topic}`);
    return true;
  } catch (e) {
    console.error(`[Memory Bridge] Error al guardar visión:`, e);
    return false;
  }
}

export async function getSharedVision(topic: string) {
  try {
    const rows = await sql`SELECT * FROM shared_vision WHERE topic = ${topic}`;
    return rows[0] || null;
  } catch (e) {
    console.error(`[Memory Bridge] Error al recuperar visión:`, e);
    return null;
  }
}

export async function getAllSharedVision() {
  try {
    return await sql`SELECT * FROM shared_vision ORDER BY updated_at DESC`;
  } catch (e) {
    console.error(`[Memory Bridge] Error al recuperar todas las visiones:`, e);
    return [];
  }
}
