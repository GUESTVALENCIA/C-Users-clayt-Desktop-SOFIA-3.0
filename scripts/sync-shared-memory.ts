import { getAllSharedVision } from './shared-memory-bridge.js';

async function sync() {
  const visions = await getAllSharedVision();
  console.log('--- Sincronizando Memoria Yulex (Terminal/Web) ---');
  visions.forEach(v => {
    console.log(`[${v.topic}] v${v.version}: ${v.content}`);
  });
  console.log('--- Sincronización Completada ---');
}

sync().catch(console.error);
