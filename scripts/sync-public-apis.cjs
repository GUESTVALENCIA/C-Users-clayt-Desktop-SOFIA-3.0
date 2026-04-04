'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_SOFIA_AI_ROOT = 'C:\\Users\\clayt\\Desktop\\SOFÍA AI\\sofia-ai';
const DEFAULT_MSP_PATH_A = 'C:\\Users\\clayt\\Desktop\\desktop-app\\public-apis';
const DEFAULT_MSP_PATH_B = 'C:\\Users\\clayt\\Desktop\\sandra-skel-temp\\public-apis';

const sofiaAiRoot = path.resolve(process.env.SOFIA_AI_ROOT || DEFAULT_SOFIA_AI_ROOT);
const syncScript = path.join(sofiaAiRoot, 'scripts', 'sync-public-api-library.cjs');

const mspPathA = path.resolve(process.env.MSP_PUBLIC_APIS_PATH || DEFAULT_MSP_PATH_A);
const mspPathB = path.resolve(process.env.SOFIA_MSP_PUBLIC_APIS_PATH || DEFAULT_MSP_PATH_B);

const sourceJson = path.join(sofiaAiRoot, 'openclaw-setup', 'public-api-library', 'index', 'public-api-library.json');
const sourceStatus = path.join(sofiaAiRoot, 'sofia-snapshots', 'public-api-library-status.json');
const sourceVaultIndex = path.join(sofiaAiRoot, 'sofia-vault', 'Conocimiento', 'Public-APIs', 'INDEX.md');

const targetDir = path.join(ROOT, 'resources', 'public-api-library');
const targetJson = path.join(targetDir, 'public-api-library.json');
const targetStatus = path.join(targetDir, 'public-api-library-status.json');
const targetIndex = path.join(targetDir, 'INDEX.md');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyIfExists(from, to) {
  if (!fs.existsSync(from)) return false;
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
  return true;
}

function existsRequired(p) {
  if (!fs.existsSync(p)) {
    throw new Error(`Missing path: ${p}`);
  }
}

function run() {
  existsRequired(sofiaAiRoot);
  existsRequired(syncScript);

  const env = {
    ...process.env,
    MSP_PUBLIC_APIS_PATH: mspPathA,
    SOFIA_MSP_PUBLIC_APIS_PATH: mspPathB,
  };

  console.log('[sync-public-apis] Starting consolidated sync...');
  console.log(`[sync-public-apis] SOFIA_AI_ROOT=${sofiaAiRoot}`);
  console.log(`[sync-public-apis] MSP_PUBLIC_APIS_PATH=${mspPathA}`);
  console.log(`[sync-public-apis] SOFIA_MSP_PUBLIC_APIS_PATH=${mspPathB}`);

  const result = spawnSync(process.execPath, [syncScript], {
    cwd: sofiaAiRoot,
    env,
    stdio: 'inherit',
    windowsHide: true,
  });

  if (result.status !== 0) {
    throw new Error(`sync-public-api-library exited with code ${result.status}`);
  }

  existsRequired(sourceJson);
  ensureDir(targetDir);

  const copied = {
    json: copyIfExists(sourceJson, targetJson),
    status: copyIfExists(sourceStatus, targetStatus),
    index: copyIfExists(sourceVaultIndex, targetIndex),
  };

  const payload = JSON.parse(fs.readFileSync(sourceJson, 'utf8'));
  const total = Number(payload?.totalApis || 0);
  const sources = Array.isArray(payload?.sources) ? payload.sources.length : 0;

  console.log('[sync-public-apis] Completed.');
  console.log(`[sync-public-apis] APIs total: ${total}`);
  console.log(`[sync-public-apis] Sources: ${sources}`);
  console.log(`[sync-public-apis] Mirror JSON: ${targetJson} ${copied.json ? 'ok' : 'skip'}`);
  console.log(`[sync-public-apis] Mirror status: ${targetStatus} ${copied.status ? 'ok' : 'skip'}`);
  console.log(`[sync-public-apis] Mirror index: ${targetIndex} ${copied.index ? 'ok' : 'skip'}`);
}

try {
  run();
} catch (error) {
  console.error('[sync-public-apis] Failed:', error.message || error);
  process.exitCode = 1;
}
