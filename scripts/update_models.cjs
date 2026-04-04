const fs = require('fs');
const configPath = 'C:/Users/clayt/.openclaw/openclaw.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const models = config.agents.defaults.models;

let fixed = 0, backslashFixed = 0, added = 0;

// 1. Corregir backslashes y añadir streaming:false a todos los g4f aliases
const newModels = {};
for (const [key, value] of Object.entries(models)) {
  let newKey = key;
  // Corregir backslash a forward slash
  if (newKey.indexOf('\\') !== -1) {
    newKey = newKey.split('\\').join('/');
    backslashFixed++;
  }
  // Añadir streaming:false a todos los g4f
  if (newKey.startsWith('g4f/')) {
    if (value.streaming !== false) {
      value.streaming = false;
      fixed++;
    }
  }
  newModels[newKey] = value;
}

// 2. Añadir modelos que faltan (solo los útiles)
const missingModels = ['minimax-m2.7', 'minimax-m2.7-highspeed'];
for (const m of missingModels) {
  const key = 'g4f/' + m;
  if (!newModels[key]) {
    newModels[key] = { alias: m, streaming: false };
    added++;
  }
}

config.agents.defaults.models = newModels;

// 3. Escribir
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

// 4. Verificar
const verify = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const g4fTotal = Object.keys(verify.agents.defaults.models).filter(k => k.startsWith('g4f/')).length;
const withStreaming = Object.entries(verify.agents.defaults.models).filter(([k,v]) => k.startsWith('g4f/') && v.streaming === false).length;

console.log('=== RESULTADO ===');
console.log('streaming:false añadido a:', fixed, 'modelos');
console.log('Backslashes corregidos:', backslashFixed);
console.log('Modelos nuevos añadidos:', added);
console.log('Total aliases g4f:', g4fTotal);
console.log('Con streaming:false:', withStreaming);
console.log('JSON válido: OK');
