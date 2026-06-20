// Pure identity helpers — CommonJS so `node --test` can import them directly
// (Node 20 can't import .ts, and there's no TS test loader). The .ts modules
// and Server Actions import these via `import { blindIndex } from './blindIndex.js'`
// (tsconfig allowJs + bundler resolution).
const crypto = require('node:crypto');

// Must match db/identity_crypto.py:_normalize exactly (lowercase, collapse
// whitespace runs to single spaces, trim).
function normalize(name) {
  return name.toLowerCase().split(/\s+/).filter(Boolean).join(' ');
}

// hex(HMAC_SHA256(key, normalize(name))) — cross-language identical to Python.
function blindIndex(name, hmacKeyHex) {
  return crypto
    .createHmac('sha256', Buffer.from(hmacKeyHex, 'hex'))
    .update(normalize(name), 'utf8')
    .digest('hex');
}

function pLabel(personId) {
  return 'P-' + personId.slice(0, 8);
}

module.exports = { normalize, blindIndex, pLabel };
