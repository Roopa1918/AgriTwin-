import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const en = (await import('../src/i18n/translations/en.js')).default;
const hi = (await import('../src/i18n/translations/hi.js')).default;
const kn = (await import('../src/i18n/translations/kn.js')).default;

function getKeys(obj, prefix = '') {
  let keys = [];
  for (const k of Object.keys(obj)) {
    const val = obj[k];
    const newPrefix = prefix ? prefix + '.' + k : k;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      keys = keys.concat(getKeys(val, newPrefix));
    } else {
      keys.push(newPrefix);
    }
  }
  return keys;
}

const allEnKeys = new Set(getKeys(en));

console.log('Total En Keys:', allEnKeys.size);

// Scan all JSX files in src/
function scanDir(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(scanDir(full));
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
      results.push(full);
    }
  }
  return results;
}

const allFiles = scanDir(path.resolve(__dirname, '../src'));

console.log(`Scanning ${allFiles.length} files in src/ for t() calls and potential missing keys...`);

let usedKeys = new Map();
let fallbackUsages = [];

for (const file of allFiles) {
  if (file.includes('translations')) continue;
  const content = fs.readFileSync(file, 'utf8');
  
  // Find t('key') or t("key") or t(`key`)
  const regex = /t\(\s*['"`]([a-zA-Z0-9_.]+)['"`](?:\s*,\s*(\{[^}]*\}))?\s*\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    if (!usedKeys.has(key)) {
      usedKeys.set(key, []);
    }
    usedKeys.get(key).push(path.relative(path.resolve(__dirname, '..'), file));
  }

  // Find t('key') || 'Fallback English String'
  const fallbackRegex = /t\(\s*['"`]([a-zA-Z0-9_.]+)['"`][^)]*\)\s*\|\|\s*['"`]([^'"`]+)['"`]/g;
  let fbMatch;
  while ((fbMatch = fallbackRegex.exec(content)) !== null) {
    fallbackUsages.push({
      key: fbMatch[1],
      fallback: fbMatch[2],
      file: path.relative(path.resolve(__dirname, '..'), file)
    });
  }
}

console.log(`Found ${usedKeys.size} distinct keys used in codebase.`);

let missingInDict = [];
for (const [key, files] of usedKeys.entries()) {
  if (!allEnKeys.has(key)) {
    missingInDict.push({ key, files });
  }
}

console.log(`\nKeys used in code but MISSING in en.js (${missingInDict.length}):`);
for (const item of missingInDict) {
  console.log(`  ❌ ${item.key} (used in: ${item.files.join(', ')})`);
}

console.log(`\nKeys with || 'fallback string' (${fallbackUsages.length}):`);
let missingFallbacks = fallbackUsages.filter(fb => !allEnKeys.has(fb.key));
console.log(`Missing fallback keys: ${missingFallbacks.length}`);
for (const item of missingFallbacks) {
  console.log(`  ⚠️  ${item.key}: "${item.fallback}" in ${item.file}`);
}
