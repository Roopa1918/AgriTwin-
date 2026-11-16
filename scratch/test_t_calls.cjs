const fs = require('fs');
const path = require('path');

const en = require('../src/i18n/translations/en.js').default || require('../src/i18n/translations/en.js');

function resolveKey(obj, keyPath) {
  const parts = keyPath.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr === undefined || curr === null) return undefined;
    curr = curr[part];
  }
  return curr;
}

function getAllFiles(dir, exts = ['.jsx', '.js']) {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== 'scratch') {
        files = files.concat(getAllFiles(full, exts));
      }
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

const files = getAllFiles(path.resolve(__dirname, '../src'));
const missingKeys = new Set();
const foundKeys = new Set();

const regex = /t\(\s*['"]([a-zA-Z0-9_.]+)['"]/g;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    foundKeys.add(key);
    const val = resolveKey(en, key);
    if (val === undefined) {
      missingKeys.add(key + ' (in ' + path.basename(file) + ')');
    }
  }
}

console.log('Total unique t(...) calls checked:', foundKeys.size);
console.log('Missing keys in en.js:', missingKeys.size);
if (missingKeys.size > 0) {
  missingKeys.forEach(k => console.log('  MISSING:', k));
} else {
  console.log('ALL t(...) calls resolve successfully to valid keys in en.js!');
}
