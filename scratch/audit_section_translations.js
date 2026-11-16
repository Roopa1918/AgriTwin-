import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const en = (await import('../src/i18n/translations/en.js')).default;
const hi = (await import('../src/i18n/translations/hi.js')).default;
const kn = (await import('../src/i18n/translations/kn.js')).default;

function checkSection(sectionName) {
  console.log(`\n======================================================`);
  console.log(`SECTION: ${sectionName}`);
  console.log(`======================================================`);
  const enSec = en[sectionName] || {};
  const hiSec = hi[sectionName] || {};
  const knSec = kn[sectionName] || {};

  for (const k of Object.keys(enSec)) {
    const enVal = enSec[k];
    const hiVal = hiSec[k];
    const knVal = knSec[k];
    if (typeof enVal === 'string') {
      console.log(`[${k}]`);
      console.log(`  EN: ${enVal}`);
      console.log(`  HI: ${hiVal}`);
      console.log(`  KN: ${knVal}`);
    } else if (typeof enVal === 'object' && enVal !== null) {
      console.log(`[${k}] (Nested Object)`);
      for (const subK of Object.keys(enVal)) {
        console.log(`  [${subK}]`);
        console.log(`    EN: ${enVal[subK]}`);
        console.log(`    HI: ${hiSec[k]?.[subK]}`);
        console.log(`    KN: ${knSec[k]?.[subK]}`);
      }
    }
  }
}

const sections = process.argv.slice(2);
for (const sec of (sections.length > 0 ? sections : ['common', 'nav', 'header', 'home'])) {
  checkSection(sec);
}
