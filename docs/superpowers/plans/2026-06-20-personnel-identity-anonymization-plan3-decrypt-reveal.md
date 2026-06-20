# Personnel Identity Anonymization — Plan 3: Decrypt / Reveal Path

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an authorized decryptor, from the admin site, **privately reveal** a person's real name (KMS-decrypt, logged, admin-only view) and separately **publish** them (set `identity_public` so the legal name shows on the public site) or **re-anonymize** them — all gated by `aal2` + the `authorized_decryptors` allowlist, with full audit.

**Architecture:** Implemented in the **`zacharymays-site`** repo (Next.js App Router, the live-deployed site). The site server (Node runtime) decrypts the Python-produced AWS-Encryption-SDK ciphertext via the JS AWS Encryption SDK using a **decrypt-only** KMS IAM principal, verifying the `{person_id, field}` encryption context. A shared auth lib adds `requireDecryptor()` on top of the existing `requireAdmin()` (email-allowlist + `aal2`). A dedicated `/admin/persons` console is the only place identity is revealed/published.

**Tech Stack:** Next.js (App Router, Server Actions), `@aws-crypto/client-node` (AWS Encryption SDK for JS), `@supabase/ssr` + `@supabase/supabase-js`, Node's built-in test runner (`node:test`), TypeScript.

## Global Constraints

- **Repo: `zacharymays-site`** (live site). All paths below are in that repo unless noted. The DB is Supabase project `shgdrkrqjnwtlyxcdayp`; site Vercel project `zacharymays-site-prod` (`prj_bfwiE0DATRdpydA3AgbnGm22PHJ6`, team `team_AcJzKocPBKkoo5MDAZdSiDe0`).
- **The KMS key** is `arn:aws:kms:us-east-2:834257582710:key/45a4ac2a-12cb-4f4c-be30-f91f4f4c5a87` (region `us-east-2`). Use the **ARN** as `KMS_KEY_ID` (alias fails strict decrypt). Plan 1/2 in `cultiness-spectrum` produced the ciphertext; this plan only decrypts.
- **Encryption context is mandatory on decrypt.** Every `canonical_name_enc` was encrypted with context `{person_id: <uuid>, field: "canonical_name"}`. Decryption MUST pass/verify the same context and reject a mismatch — mirrors `db/identity_crypto.py`.
- **Blind index definition (must match Python exactly):** `hex(HMAC_SHA256(key=PERSON_BIDX_HMAC_KEY_bytes, msg=normalize(name)))`, `normalize(s) = s.toLowerCase().split(/\s+/).filter(Boolean).join(' ')` (collapse whitespace, trim, lowercase), UTF-8. Same as `db/identity_crypto.py:_normalize`/`blind_index`.
- **Node runtime, not edge.** Any route/action that uses the AWS SDK must run in the Node.js runtime. Add `export const runtime = 'nodejs';` to the `/admin/persons` page and ensure server actions are not edge.
- **Service-role only for identity-tier reads/writes.** The decrypt/reveal/publish actions use `createSupabaseAdminClient()` (service-role) — `persons.*_enc`, `authorized_decryptors`, `decrypt_access_log`, `person_visibility_justifications` are all RLS-deny-all to anon/authenticated.
- **Never return ciphertext or `*_enc` to the browser.** Reveal returns the decrypted plaintext string transiently to an authorized decryptor; search returns only non-identifying fields + the `P-<uuid8>` label.
- **Two distinct actions:** *private reveal* (decrypt-to-view, logged, does NOT change `identity_public`) vs *publish* (sets `identity_public=true` + `public_display_name` + a justification row, which the Plan 1 trigger audits). Keep them separate.
- **Denial logging is the app layer's job** (Plan 1 deferred it here): every denied reveal/grant attempt is written to `decrypt_access_log` (with `succeeded=false`) by these actions — the DB RPCs only hard-fail.
- **Env vars to add to Vercel (`zacharymays-site-prod`, Production):** `AWS_REGION=us-east-2`, `KMS_KEY_ID=<arn above>`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (new decrypt-only IAM user), `PERSON_BIDX_HMAC_KEY` (= the value in `cultiness-spectrum/.env`, for blind-index name search). The site already has `ADMIN_EMAILS`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_*`.
- **Tests:** Node's built-in runner, `node --test test/**/*.test.js`. Put new tests under `test/`. Pure logic gets unit tests; KMS round-trips are integration tests gated on env (skipped when AWS creds absent).
- **Out of scope (flagged for Plan 4):** the **clear-text admin movement-view page** (a decryptor-gated map showing real names) and the public movement-map wiring. This plan builds the decrypt primitives + the `/admin/persons` console those will reuse.

---

## File / Object Map

- AWS IAM (out-of-DB): user `cultiness-identity-site-decrypt` (kms:Decrypt only) + Vercel prod env — Task 1
- `package.json` — add `@aws-crypto/client-node` — Task 2
- `src/lib/identity/decrypt.ts` — `decryptField()`, `blindIndex()`, `pLabel()` — Task 2
- `test/identity/decrypt.test.js` — blind-index cross-language test + context-verify unit + gated KMS integration — Task 2
- `src/lib/auth.ts` — shared `requireAdmin()` + `requireDecryptor()` + `logDecryptAttempt()` — Task 3
- `src/app/actions/network.ts`, `actions/photos.ts`, `actions/audit.ts` — import shared `requireAdmin` (remove local copies) — Task 3
- `src/app/actions/identity.ts` — `searchPersons`, `revealPerson`, `publishPerson`, `anonymizePerson` — Task 4
- `src/app/admin/persons/page.jsx` + `PersonsClient.jsx` — Task 5
- `src/app/admin/_components/AdminNav` (existing) — add Persons link — Task 6

Maps to spec: Task 1–2 → §5.1/§5.2; Task 3 → §5.2/§5.3/§5.7; Task 4 → §4/§8/§5.3 (denial logging); Task 5–6 → §4 admin path.

---

## Task 1: Site decrypt credentials (IAM + Vercel env)

**Files:**
- Create: `docs/runbooks/site-decrypt-credentials.md` (in `zacharymays-site`)

**Interfaces:**
- Produces a decrypt-only AWS principal and the 5 Vercel prod env vars Tasks 2/4 consume. No app code.

- [ ] **Step 1: Create the decrypt-only IAM user + policy** (run with the operator's admin AWS CLI; emits no secret)

```bash
KEY_ARN="arn:aws:kms:us-east-2:834257582710:key/45a4ac2a-12cb-4f4c-be30-f91f4f4c5a87"
cat > /tmp/site-decrypt-policy.json <<JSON
{ "Version":"2012-10-17","Statement":[{"Sid":"IdentityDecryptOnly","Effect":"Allow",
  "Action":["kms:Decrypt"],"Resource":"$KEY_ARN"}] }
JSON
aws iam create-user --user-name cultiness-identity-site-decrypt
POLICY_ARN=$(aws iam create-policy --policy-name cultiness-identity-site-decrypt \
  --policy-document file:///tmp/site-decrypt-policy.json --query 'Policy.Arn' --output text)
aws iam attach-user-policy --user-name cultiness-identity-site-decrypt --policy-arn "$POLICY_ARN"
rm -f /tmp/site-decrypt-policy.json
```
Note: decrypt-only — the site cannot encrypt or generate data keys, only read existing identities.

- [ ] **Step 2: Operator creates the access key + sets Vercel env** (secret values stay out of any log)

```bash
aws iam create-access-key --user-name cultiness-identity-site-decrypt   # operator copies the two values
cd zacharymays-site   # linked to zacharymays-site-prod
printf 'us-east-2' | vercel env add AWS_REGION production
printf 'arn:aws:kms:us-east-2:834257582710:key/45a4ac2a-12cb-4f4c-be30-f91f4f4c5a87' | vercel env add KMS_KEY_ID production
vercel env add AWS_ACCESS_KEY_ID production       # paste AccessKeyId
vercel env add AWS_SECRET_ACCESS_KEY production    # paste SecretAccessKey
vercel env add PERSON_BIDX_HMAC_KEY production      # paste value from cultiness-spectrum/.env
```

- [ ] **Step 3: Verify the env names landed**

```bash
vercel env ls production | grep -E "AWS_REGION|KMS_KEY_ID|AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|PERSON_BIDX_HMAC_KEY"
```
Expected: all five present.

- [ ] **Step 4: Write + commit the runbook** at `docs/runbooks/site-decrypt-credentials.md` documenting Steps 1–3.

```bash
git add docs/runbooks/site-decrypt-credentials.md
git commit -m "docs(identity): site decrypt-only IAM + Vercel env runbook"
```

---

## Task 2: JS decrypt + blind-index library

**Files:**
- Modify: `package.json` (add `@aws-crypto/client-node`)
- Create: `src/lib/identity/decrypt.ts`
- Test: `test/identity/decrypt.test.js`

**Interfaces:**
- Produces:
  - `blindIndex(name: string, hmacKeyHex: string): string` — hex HMAC-SHA256 of the normalized name (matches Python).
  - `pLabel(personId: string): string` — `'P-' + personId.slice(0, 8)`.
  - `decryptField(ciphertext: Buffer, personId: string, field: string): Promise<string>` — KMS-decrypts via the AWS Encryption SDK; throws if the message's encryption context doesn't match `{person_id: personId, field}`.
  - These consume env `AWS_REGION`, `KMS_KEY_ID`. Consumed by Task 4.

- [ ] **Step 1: Add the dependency**

```bash
cd zacharymays-site
npm install @aws-crypto/client-node
```

- [ ] **Step 2: Write the failing tests**

```javascript
// test/identity/decrypt.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { blindIndex, pLabel } from '../../src/lib/identity/decrypt.ts';

// Cross-language parity: blindIndex must equal the Python db/identity_crypto.blind_index
// for the same key + normalized name. Expected value computed with the same HMAC-SHA256.
const TEST_HMAC_HEX = 'ab'.repeat(32);
function expectedBidx(name) {
  const norm = name.toLowerCase().split(/\s+/).filter(Boolean).join(' ');
  return crypto.createHmac('sha256', Buffer.from(TEST_HMAC_HEX, 'hex')).update(norm, 'utf8').digest('hex');
}

test('blindIndex normalizes (case + whitespace) and matches HMAC-SHA256', () => {
  assert.equal(blindIndex('  Jane   DOE ', TEST_HMAC_HEX), blindIndex('jane doe', TEST_HMAC_HEX));
  assert.equal(blindIndex('Jane Doe', TEST_HMAC_HEX), expectedBidx('Jane Doe'));
  assert.equal(blindIndex('Jane Doe', TEST_HMAC_HEX).length, 64);
  assert.notEqual(blindIndex('jane doe', TEST_HMAC_HEX), blindIndex('john doe', TEST_HMAC_HEX));
});

test('pLabel derives P-<first 8 of uuid>', () => {
  assert.equal(pLabel('550e8400-e29b-41d4-a716-446655440000'), 'P-550e8400');
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `node --test test/identity/decrypt.test.js`
Expected: FAIL (cannot find `../../src/lib/identity/decrypt.ts`).

- [ ] **Step 4: Write the implementation**

```typescript
// src/lib/identity/decrypt.ts
import 'server-only';
import crypto from 'node:crypto';
import { buildClient, CommitmentPolicy, KmsKeyringNode } from '@aws-crypto/client-node';

const { decrypt } = buildClient(CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT);

function normalize(name: string): string {
  return name.toLowerCase().split(/\s+/).filter(Boolean).join(' ');
}

export function blindIndex(name: string, hmacKeyHex: string): string {
  return crypto
    .createHmac('sha256', Buffer.from(hmacKeyHex, 'hex'))
    .update(normalize(name), 'utf8')
    .digest('hex');
}

export function pLabel(personId: string): string {
  return 'P-' + personId.slice(0, 8);
}

let _keyring: KmsKeyringNode | null = null;
function keyring(): KmsKeyringNode {
  if (!_keyring) {
    const keyId = process.env.KMS_KEY_ID;
    if (!keyId) throw new Error('KMS_KEY_ID is not set');
    _keyring = new KmsKeyringNode({ keyIds: [keyId] });
  }
  return _keyring;
}

export async function decryptField(
  ciphertext: Buffer,
  personId: string,
  field: string,
): Promise<string> {
  const { plaintext, messageHeader } = await decrypt(keyring(), ciphertext);
  const ec = messageHeader.encryptionContext || {};
  if (ec.person_id !== personId || ec.field !== field) {
    throw new Error(
      `encryption context mismatch: expected person_id=${personId} field=${field}, ` +
        `got ${ec.person_id}/${ec.field}`,
    );
  }
  return plaintext.toString('utf8');
}
```

- [ ] **Step 5: Run tests to verify the pure functions pass**

Run: `node --test test/identity/decrypt.test.js`
Expected: 2 passed. (The `decryptField` KMS round-trip is covered by the gated integration test in Step 6 — it needs AWS creds + a known encrypted row, so it's not in the pure unit run.)

- [ ] **Step 6: Add a gated integration test (skips without creds)**

Append to `test/identity/decrypt.test.js`:

```javascript
import { decryptField } from '../../src/lib/identity/decrypt.ts';
// Round-trips a real ciphertext via KMS. Skipped unless AWS creds + a known
// person are provided, so CI/unit runs stay offline.
test('decryptField round-trips a real ciphertext (integration)', { skip: !process.env.IDENTITY_IT_CIPHERTEXT_HEX }, async () => {
  const ct = Buffer.from(process.env.IDENTITY_IT_CIPHERTEXT_HEX, 'hex');
  const pid = process.env.IDENTITY_IT_PERSON_ID;
  const name = await decryptField(ct, pid, 'canonical_name');
  assert.equal(typeof name, 'string');
  await assert.rejects(decryptField(ct, '00000000-0000-0000-0000-000000000000', 'canonical_name'), /encryption context mismatch/);
});
```

Run: `node --test test/identity/decrypt.test.js` → still 2 passed (+1 skipped). (Run the integration test manually once env+creds exist, pulling a real `canonical_name_enc` hex.)

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/lib/identity/decrypt.ts test/identity/decrypt.test.js
git commit -m "feat(identity): JS decrypt lib (AWS Encryption SDK) + blind index"
```

---

## Task 3: Shared auth lib — `requireAdmin` + `requireDecryptor`

**Files:**
- Create: `src/lib/auth.ts`
- Modify: `src/app/actions/network.ts`, `src/app/actions/photos.ts`, `src/app/actions/audit.ts` (replace local `requireAdmin` with the import)
- Test: `test/auth.test.js`

**Interfaces:**
- Produces:
  - `adminEmails(): string[]` — parses `ADMIN_EMAILS` (lowercased, trimmed, non-empty).
  - `requireAdmin(): Promise<user>` — the existing gate, verbatim behavior (signed in + email in `ADMIN_EMAILS` + `aal2`). Returns the Supabase `user` object (same shape the old local copies returned). Throws on failure.
  - `requireDecryptor(): Promise<user>` — `requireAdmin()` then verifies the email is an **active** row in `authorized_decryptors` (via service-role client). Returns the `user`. Throws `'Not an authorized decryptor.'` otherwise.
  - `logDecryptAttempt(args: { actorEmail: string; personId: string | null; field: string; justification?: string; succeeded: boolean }): Promise<void>` — inserts into `decrypt_access_log` via service-role client.
  - Consumed by Task 4. The three action files consume `requireAdmin`.

- [ ] **Step 1: Write the failing test** (pure `adminEmails` + membership-check shape, with an injected client)

```javascript
// test/auth.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adminEmails, isActiveDecryptor } from '../src/lib/auth.ts';

test('adminEmails parses, lowercases, trims, drops empties', () => {
  process.env.ADMIN_EMAILS = ' A@x.com, b@x.com ,, ';
  assert.deepEqual(adminEmails(), ['a@x.com', 'b@x.com']);
});

test('isActiveDecryptor true only when an active row matches (injected client)', async () => {
  const yes = { from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { email: 'z@x.com' } }) }) }) }) }) };
  const no = { from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }) }) };
  assert.equal(await isActiveDecryptor(yes, 'z@x.com'), true);
  assert.equal(await isActiveDecryptor(no, 'z@x.com'), false);
});
```

- [ ] **Step 2: Run to verify fail**

Run: `node --test test/auth.test.js`
Expected: FAIL (cannot find `../src/lib/auth.ts`).

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/auth.ts
import 'server-only';
import { createSupabaseServerClient } from './supabase/server';
import { createSupabaseAdminClient } from './supabase/admin';

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const allow = adminEmails();
  const email = (user.email || '').toLowerCase();
  if (allow.length === 0) throw new Error('ADMIN_EMAILS is not configured.');
  if (!allow.includes(email)) throw new Error(`${email} is not an approved analyst.`);
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') throw new Error('Two-factor step-up required.');
  return user;
}

// Injectable for tests; the real callers pass createSupabaseAdminClient().
export async function isActiveDecryptor(adminClient: any, email: string): Promise<boolean> {
  const { data } = await adminClient
    .from('authorized_decryptors').select('email')
    .eq('email', email.toLowerCase()).eq('is_active', true).maybeSingle();
  return !!data;
}

export async function requireDecryptor() {
  const user = await requireAdmin();
  const email = (user.email || '').toLowerCase();
  const admin = createSupabaseAdminClient();
  if (!(await isActiveDecryptor(admin, email))) {
    await logDecryptAttempt({ actorEmail: email, personId: null, field: 'authz', succeeded: false });
    throw new Error('Not an authorized decryptor.');
  }
  return user;
}

export async function logDecryptAttempt(args: {
  actorEmail: string; personId: string | null; field: string; justification?: string; succeeded: boolean;
}): Promise<void> {
  const admin = createSupabaseAdminClient();
  await admin.from('decrypt_access_log').insert({
    actor_email: args.actorEmail, person_id: args.personId, field: args.field,
    justification: args.justification ?? null, succeeded: args.succeeded,
  });
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test test/auth.test.js`
Expected: 2 passed.

- [ ] **Step 5: Replace the duplicated `requireAdmin` in the three action files**

In each of `src/app/actions/network.ts`, `src/app/actions/photos.ts`, `src/app/actions/audit.ts`: delete the local `function adminEmails()` and `async function requireAdmin()` definitions and add at the top (after `'use server';`):

```typescript
import { requireAdmin } from '../../lib/auth';
```

(Leave all call sites — `await requireAdmin()` — unchanged; the shared version returns the bare `user` object, exactly as the old local copies did, so any `const user = await requireAdmin()` still works.) Verify each file still references `requireAdmin` and no longer defines it:

Run: `grep -rn "function requireAdmin" src/app/actions/` → expected: no matches.

- [ ] **Step 6: Build to confirm no breakage**

Run: `npm run build` → expected: build succeeds (type-checks the refactor).

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth.ts test/auth.test.js src/app/actions/network.ts src/app/actions/photos.ts src/app/actions/audit.ts
git commit -m "refactor(auth): shared requireAdmin + add requireDecryptor + decrypt-attempt logging"
```

---

## Task 4: Identity server actions

**Files:**
- Create: `src/app/actions/identity.ts`
- Test: `test/actions/identity.test.js`

**Interfaces:**
- Consumes: `decryptField`, `blindIndex`, `pLabel` (Task 2); `requireAdmin`, `requireDecryptor`, `logDecryptAttempt` (Task 3); `createSupabaseAdminClient`.
- Produces (all `'use server'`):
  - `searchPersons(query: string): Promise<{ id: string; label: string; identity_public: boolean; nationality: string|null; birth_year: number|null; status: string|null }[]>` — `requireAdmin`; matches `P-`prefix → by id prefix, else by `blindIndex(query)` against `canonical_name_bidx`; returns NO names.
  - `revealPerson(personId: string): Promise<{ name: string }>` — `requireDecryptor`; reads `canonical_name_enc`; `decryptField`; logs success to `decrypt_access_log`; returns the plaintext (admin-only, transient). Does NOT change `identity_public`.
  - `publishPerson(personId: string, justificationType: string, sourceNote: string|null): Promise<{ ok: true }>` — `requireDecryptor`; decrypts the name; sets `identity_public=true`, `public_display_name=<name>`; inserts a `person_visibility_justifications` row; the Plan 1 trigger writes the audit log.
  - `anonymizePerson(personId: string, reason: string): Promise<{ ok: true }>` — `requireDecryptor`; sets `identity_public=false`, `public_display_name=null` (trigger audits).

- [ ] **Step 1: Write failing tests** (pure routing/shape with an injected admin client; auth is integration-tested via the page)

```javascript
// test/actions/identity.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchMode } from '../../src/app/actions/identity.ts';

test('searchMode picks id-prefix for P- queries, blind-index otherwise', () => {
  assert.deepEqual(searchMode('P-550e8400'), { mode: 'id', value: '550e8400' });
  assert.deepEqual(searchMode('p-AbC'), { mode: 'id', value: 'abc' });
  assert.deepEqual(searchMode('Jane Doe'), { mode: 'name', value: 'Jane Doe' });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `node --test test/actions/identity.test.js` → FAIL (module/exports missing).

- [ ] **Step 3: Write the implementation**

```typescript
// src/app/actions/identity.ts
'use server';
import { createSupabaseAdminClient } from '../../lib/supabase/admin';
import { requireAdmin, requireDecryptor, logDecryptAttempt } from '../../lib/auth';
import { decryptField, blindIndex, pLabel } from '../../lib/identity/decrypt';

const FIELD = 'canonical_name';

// Exported for unit testing; pure.
export function searchMode(query: string): { mode: 'id' | 'name'; value: string } {
  const q = query.trim();
  if (/^p-/i.test(q)) return { mode: 'id', value: q.slice(2).toLowerCase() };
  return { mode: 'name', value: q };
}

const SAFE_COLS = 'id, identity_public, nationality, birth_year, status';

export async function searchPersons(query: string) {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const { mode, value } = searchMode(query);
  let rows;
  if (mode === 'id') {
    ({ data: rows } = await admin.from('persons').select(SAFE_COLS).ilike('id', `${value}%`).limit(25));
  } else {
    const bidx = blindIndex(value, process.env.PERSON_BIDX_HMAC_KEY as string);
    ({ data: rows } = await admin.from('persons').select(SAFE_COLS).eq('canonical_name_bidx', bidx).limit(25));
  }
  return (rows || []).map((r: any) => ({
    id: r.id, label: pLabel(r.id), identity_public: r.identity_public,
    nationality: r.nationality, birth_year: r.birth_year, status: r.status,
  }));
}

async function decryptName(admin: any, personId: string, actorEmail: string): Promise<string> {
  const { data, error } = await admin.from('persons').select('canonical_name_enc').eq('id', personId).single();
  if (error || !data?.canonical_name_enc) {
    await logDecryptAttempt({ actorEmail, personId, field: FIELD, succeeded: false });
    throw new Error('No encrypted name for this person.');
  }
  const hex = data.canonical_name_enc.startsWith('\\x') ? data.canonical_name_enc.slice(2) : data.canonical_name_enc;
  return decryptField(Buffer.from(hex, 'hex'), personId, FIELD);
}

export async function revealPerson(personId: string) {
  const user = await requireDecryptor();
  const email = (user.email || '').toLowerCase();
  const admin = createSupabaseAdminClient();
  const name = await decryptName(admin, personId, email);
  await logDecryptAttempt({ actorEmail: email, personId, field: FIELD, succeeded: true });
  return { name };
}

export async function publishPerson(personId: string, justificationType: string, sourceNote: string | null) {
  const user = await requireDecryptor();
  const email = (user.email || '').toLowerCase();
  const admin = createSupabaseAdminClient();
  const name = await decryptName(admin, personId, email);
  await admin.from('person_visibility_justifications').insert({
    person_id: personId, justification_type: justificationType, source_note: sourceNote, created_by: email,
  });
  const { error } = await admin.from('persons')
    .update({ identity_public: true, public_display_name: name }).eq('id', personId);
  if (error) throw new Error(error.message);
  await logDecryptAttempt({ actorEmail: email, personId, field: FIELD, justification: justificationType, succeeded: true });
  return { ok: true as const };
}

export async function anonymizePerson(personId: string, reason: string) {
  const user = await requireDecryptor();
  const email = (user.email || '').toLowerCase();
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('persons')
    .update({ identity_public: false, public_display_name: null }).eq('id', personId);
  if (error) throw new Error(error.message);
  await logDecryptAttempt({ actorEmail: email, personId, field: FIELD, justification: `anonymize: ${reason}`, succeeded: true });
  return { ok: true as const };
}
```

Note: setting `public_display_name` on publish requires `identity_public=true` in the same update (the Plan 1 `persons_public_display_name_gate` check). The single `.update({ identity_public: true, public_display_name: name })` satisfies it.

- [ ] **Step 4: Run to verify pass**

Run: `node --test test/actions/identity.test.js` → 1 passed.

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/identity.ts test/actions/identity.test.js
git commit -m "feat(identity): search/reveal/publish/anonymize server actions + denial logging"
```

---

## Task 5: `/admin/persons` console

**Files:**
- Create: `src/app/admin/persons/page.jsx`
- Create: `src/app/admin/persons/PersonsClient.jsx`

**Interfaces:**
- Consumes the Task 4 actions. The page is a Server Component (Node runtime) that gates with `requireAdmin()` and renders `PersonsClient`. The client calls the server actions.

- [ ] **Step 1: Write the page (server component, Node runtime, admin-gated)**

```jsx
// src/app/admin/persons/page.jsx
import { requireAdmin } from '../../../lib/auth';
import PersonsClient from './PersonsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function PersonsAdminPage() {
  try {
    await requireAdmin();
  } catch (e) {
    return <main style={{ padding: 24 }}><h1>Personnel identity</h1><p>{e.message}</p></main>;
  }
  return (
    <main style={{ padding: 24 }}>
      <h1>Personnel identity</h1>
      <p>Search by P-label or name. Reveal/publish requires decryptor authorization; every reveal is logged.</p>
      <PersonsClient />
    </main>
  );
}
```

- [ ] **Step 2: Write the client (search + reveal/publish/anonymize)**

```jsx
// src/app/admin/persons/PersonsClient.jsx
'use client';
import { useState } from 'react';
import { searchPersons, revealPerson, publishPerson, anonymizePerson } from '../../actions/identity';

export default function PersonsClient() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [revealed, setRevealed] = useState({}); // id -> name
  const [err, setErr] = useState('');

  async function run(fn) { setErr(''); try { return await fn(); } catch (e) { setErr(e.message); } }

  return (
    <div>
      <form onSubmit={async (e) => { e.preventDefault(); const r = await run(() => searchPersons(q)); if (r) setRows(r); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="P-xxxxxxxx or name" />
        <button type="submit">Search</button>
      </form>
      {err && <p style={{ color: 'crimson' }}>{err}</p>}
      <table>
        <thead><tr><th>Label</th><th>Public?</th><th>Nationality</th><th>Birth yr</th><th>Actions</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{revealed[r.id] ? <strong>{revealed[r.id]}</strong> : r.label}</td>
              <td>{r.identity_public ? 'public' : 'anonymized'}</td>
              <td>{r.nationality || ''}</td>
              <td>{r.birth_year || ''}</td>
              <td>
                <button onClick={async () => { const x = await run(() => revealPerson(r.id)); if (x) setRevealed((m) => ({ ...m, [r.id]: x.name })); }}>Reveal</button>{' '}
                {!r.identity_public && (
                  <button onClick={async () => { const t = prompt('Justification type (memoir_author / public_self_disclosure / adjudicated_public_figure / named_under_real_name_in_source / deanonymization_request_granted / other):'); if (!t) return; const n = prompt('Source note (optional):'); const x = await run(() => publishPerson(r.id, t, n || null)); if (x) { setRows((rr) => rr.map((z) => z.id === r.id ? { ...z, identity_public: true } : z)); } }}>Publish</button>
                )}{' '}
                {r.identity_public && (
                  <button onClick={async () => { const reason = prompt('Reason for re-anonymizing:'); if (!reason) return; const x = await run(() => anonymizePerson(r.id, reason)); if (x) { setRows((rr) => rr.map((z) => z.id === r.id ? { ...z, identity_public: false } : z)); setRevealed((m) => { const c = { ...m }; delete c[r.id]; return c; }); } }}>Anonymize</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Build**

Run: `npm run build` → expected: build succeeds, `/admin/persons` compiles.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/persons/page.jsx src/app/admin/persons/PersonsClient.jsx
git commit -m "feat(admin): /admin/persons console — search, reveal, publish, anonymize"
```

---

## Task 6: AdminNav link + middleware coverage

**Files:**
- Modify: the existing AdminNav component (find it: `grep -rl "AdminNav" src/app/admin`); add a Persons link
- Verify: `src/middleware.js` already protects `/admin/*` (it does — confirm `/admin/persons` is covered by the matcher)

**Interfaces:** none new.

- [ ] **Step 1: Add the nav link**

Locate the nav (`grep -rln "admin/curator\|AdminNav" src/`). In the links list, add alongside the others:

```jsx
<a href="/admin/persons">Persons</a>
```
(Match the existing link markup/style in that file exactly.)

- [ ] **Step 2: Confirm middleware protects the route**

Run: `grep -n "admin" src/middleware.js`
Expected: the matcher covers `/admin/:path*` (so `/admin/persons` requires a session). If the matcher lists explicit paths, add `/admin/persons`.

- [ ] **Step 3: Build + commit**

```bash
npm run build
git add -A && git commit -m "feat(admin): link Persons console in AdminNav"
```

---

## Plan 3 — Definition of Done

- [ ] Decrypt-only IAM user + 5 Vercel prod env vars set.
- [ ] `@aws-crypto/client-node` decrypt lib: `blindIndex` matches Python (unit), `decryptField` verifies encryption context (gated integration).
- [ ] Shared `requireAdmin`/`requireDecryptor` + denial logging; the 3 action files no longer define their own `requireAdmin`; build passes.
- [ ] `searchPersons` (no names), `revealPerson` (logged), `publishPerson` (identity_public+justification, trigger audits), `anonymizePerson`.
- [ ] `/admin/persons` console (admin-gated, Node runtime) with reveal/publish/anonymize; linked in AdminNav.
- [ ] Manual end-to-end: as `zachary.mays@icloud.com` (aal2), reveal a `P-` person → name shown + a `decrypt_access_log` row; publish → `persons_public` shows the legal name + an audit row; anonymize → back to `P-` label.

## Roadmap — flagged follow-on

- **Plan 4 — public movement map + clear-text admin movement view.** The public map renders `persons_public` labels + `person_relationships_public` edges (P-labels, Option B family hiding). Separately, a **decryptor-gated admin movement-view page** must render the SAME map with real names decrypted (reusing Task 2/4 reveal primitives) so movement can be reviewed in clear text. (User-flagged requirement.)
- **Plan 2c — plaintext removal.** Safe once readers use `persons_public`/the decrypt path and the sweep is proven; then drop/lock `persons.canonical_name`.
