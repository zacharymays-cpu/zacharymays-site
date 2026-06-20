const { test } = require('node:test');
const assert = require('node:assert');
const { adminEmails, isActiveDecryptor } = require('../src/lib/authCore.js');

test('adminEmails parses, lowercases, trims, drops empties', () => {
  process.env.ADMIN_EMAILS = ' A@x.com, b@x.com ,, ';
  assert.deepStrictEqual(adminEmails(), ['a@x.com', 'b@x.com']);
});

test('isActiveDecryptor true only when an active row matches (injected client)', async () => {
  const chain = (data) => ({ from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data }) }) }) }) }) });
  assert.strictEqual(await isActiveDecryptor(chain({ email: 'z@x.com' }), 'z@x.com'), true);
  assert.strictEqual(await isActiveDecryptor(chain(null), 'z@x.com'), false);
});
