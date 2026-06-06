# `/admin/review` — analyst score-review console

A restricted page for human review of the AI-jury scores ("engine recommends, a
human disposes"). It shows a prioritized worklist (high model-disagreement +
tier-boundary orgs), and applies accepted changes through the audited
`record_criterion_change` RPC so every edit lands in the immutable
`score_history` trail with the analyst as the actor.

## Architecture
- **Auth:** Supabase Auth (cookie sessions via `@supabase/ssr`) with a choice of
  OAuth providers — **Google, GitHub, Microsoft (Azure), Apple** (buttons in
  `src/app/admin/login/page.jsx`; enable whichever you configure, delete the rest).
- **2FA (required):** TOTP. `src/app/admin/mfa/page.jsx` enrolls an authenticator
  app (Google Authenticator / Authy / 1Password) and steps the session up to
  **AAL2**. `/admin/review` and the write action both require AAL2.
- **Gates:** `src/middleware.js` requires a session on `/admin/*`; the review page
  requires the email in `ADMIN_EMAILS` **and** an AAL2 (2FA) session; the write
  action re-checks both.
- **Reads:** `src/lib/reviewQueue.js` (service role — the AI-jury tables are not
  anon-readable).
- **Writes:** `src/app/admin/review/actions.js` Server Action → service-role →
  `record_criterion_change(...)` (defined in
  `cultiness-spectrum/db/migrations/0004`). The action records `auth.users.id` as
  `changed_by` (this is what finally gives the audit trail a real actor).

## One-time setup

### 1. OAuth provider(s) — pick at least one
Configure the provider's app and copy its Client ID/secret:
- **Google** (easiest, free): Google Cloud Console → OAuth consent + credentials.
- **GitHub** (easy, free): GitHub → Settings → Developer settings → OAuth Apps.
- **Microsoft** (Azure/Entra): register an app, add a client secret.
- **Apple** (needs paid Apple Developer account): create a Services ID + key.

For all, the authorization callback / redirect URL is:
`https://<your-domain>/auth/callback` (and `http://localhost:3000/auth/callback` for dev).

### 2. Supabase
- Auth → Providers → enable each provider you set up and paste its Client ID/secret.
- Auth → URL Configuration → add the callback URLs above to the redirect allowlist.
- 2FA/TOTP is enabled by default; no extra config needed. (Optionally enforce MFA
  org-wide in Auth settings — the app already enforces it for `/admin`.)

### 3. Environment variables (Vercel → Settings → Env Vars, and `.env.local`)
See `.env.example`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — **server-only secret**
- `ADMIN_EMAILS` — your GitHub account email(s)

### 4. Install + run
```bash
npm install        # pulls @supabase/ssr
npm run dev        # visit http://localhost:3000/admin/review → redirected to login
```

## Optional hardening
- Add a Vercel **Deployment Protection** / **Password Protection** layer in front
  of `/admin` for defense-in-depth.
- When you have more than one analyst, formalize roles: add an `app_role` JWT
  claim hook and the RLS policy set in
  `cultiness-spectrum/database-docs/sql/policies.sql`, and switch writes from the
  service-role action to the user's RLS-scoped session.

## Scope / TODO
This is a scaffold: per-criterion score edits with a required rationale, composite
recompute, and audit. Not yet included — body-text editing UI, bulk accept-all,
research_queue integration, and the sampling-frame / IRR work tracked in
`cultiness-spectrum/database-docs/methodology/limitations.mdx`.
