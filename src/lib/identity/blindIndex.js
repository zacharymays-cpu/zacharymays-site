// Pure identity helpers — CommonJS so `node --test` can import them directly.
// The .ts modules / Server Actions import these via
// `import { blindIndex } from './blindIndex.js'` (tsconfig allowJs + bundler).
const crypto = require('node:crypto');

function normalize(name) {
  return name.toLowerCase().split(/\s+/).filter(Boolean).join(' ');
}

function blindIndex(name, hmacKeyHex) {
  return crypto
    .createHmac('sha256', Buffer.from(hmacKeyHex, 'hex'))
    .update(normalize(name), 'utf8')
    .digest('hex');
}

function pLabel(personId) {
  return 'P-' + personId.slice(0, 8);
}

// 'P-xxxxxxxx' -> search by id prefix; anything else -> search by name (blind index).
function searchMode(query) {
  const q = String(query).trim();
  if (/^p-/i.test(q)) return { mode: 'id', value: q.slice(2).toLowerCase() };
  return { mode: 'name', value: q };
}

module.exports = { normalize, blindIndex, pLabel, searchMode };
