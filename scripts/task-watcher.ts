import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';
import { saveSharedVision } from './shared-memory-bridge.js';

const execAsync = promisify(exec);
const url = process.env.DATABASE_URL || process.env.NEON_URL;

if (!url) {
  console.error('[Task Watcher] Error: DATABASE_URL not set.');
  process.exit(1);
}

const sql = neon(url);

async function checkAndRunTasks() {
  try {
    // Buscar tareas pendientes o que requieran reintento
    const pendingTasks = await sql`SELECT * FROM local_tasks WHERE status IN ('pending', 'retry') ORDER BY created_at ASC LIMIT 5`;

    if (pendingTasks.length === 0) {
      return;
    }

    console.log(`[Task Watcher] Encontradas ${pendingTasks.length} tareas para procesar.`);

    for (const task of pendingTasks) {
      console.log(`[Task Watcher] Ejecutando tarea Julie: ${task.description}`);

      await sql`UPDATE local_tasks SET status = 'running', updated_at = now() WHERE id = ${task.id}`;
      await saveSharedVision('local-task-status', `Ejecutando: ${task.description}`);

      try {
        if (task.command) {
          // Si el comando es "aider", lo ejecutamos con parámetros específicos para el entorno
          const cmd = task.command.includes('aider')
            ? `${task.command} --no-auto-commits --yes`
            : task.command;

          const { stdout, stderr } = await execAsync(cmd);
          const result = stdout + (stderr ? '\n[STDERR]: ' + stderr : '');

          await sql`UPDATE local_tasks SET status = 'completed', result = ${result}, updated_at = now() WHERE id = ${task.id}`;
          await saveSharedVision('local-task-last-result', `Tarea ${task.id} completada: ${task.description}`);

          // Notificación visual de éxito en la UI via Shared Vision
          await saveSharedVision('task-notification', `Completada: ${task.description}`);
        } else {
          // Tareas de IA pura que no requieren comando shell pero sí orquestación Julie
          await sql`UPDATE local_tasks SET status = 'processed_by_juliet', updated_at = now() WHERE id = ${task.id}`;
          await saveSharedVision('local-task-status', `Tarea de orquestación finalizada: ${task.description}`);
        }
        console.log(`[Task Watcher] Tarea ${task.id} procesada exitosamente.`);
      } catch (e: any) {
        console.error(`[Task Watcher] Error crítico en tarea ${task.id}:`, e);
        await sql`UPDATE local_tasks SET status = 'failed', result = ${e.message}, updated_at = now() WHERE id = ${task.id}`;
        await saveSharedVision('local-task-error', `Fallo en tarea ${task.id}: ${e.message}`);
      }
    }
  } catch (e) {
    console.error(`[Task Watcher] Error en el ciclo de vigilancia:`, e);
  }
}

// Ejecutar cada 30 segundos
console.log('[Task Watcher] Iniciado. Vigilando local_tasks...');
setInterval(checkAndRunTasks, 30000);
checkAndRunTasks();
