# `/admin/review` — analyst score-review console

A restricted page for human review of the AI-jury scores ("engine recommends, a
human disposes"). It shows a prioritized worklist (high model-disagreement +
tier-boundary orgs), and applies accepted changes through the audited
`record_criterion_change` RPC so every edit lands in the immutable
`score_history` trail with the analyst as the actor.

## Architecture
- **Auth:** Supabase Auth with the **GitHub** OAuth provider (cookie sessions via
  `@supabase/ssr`). `src/middleware.js` gates `/admin/*` on a session;
  `src/app/admin/review/page.jsx` additionally checks the email against
  `ADMIN_EMAILS`.
- **Reads:** `src/lib/reviewQueue.js` (service role — the AI-jury tables are not
  anon-readable).
- **Writes:** `src/app/admin/review/actions.js` Server Action → service-role →
  `record_criterion_change(...)` (defined in
  `cultiness-spectrum/db/migrations/0004`). The action records `auth.users.id` as
  `changed_by` (this is what finally gives the audit trail a real actor).

## One-time setup

### 1. GitHub OAuth app
GitHub → Settings → Developer settings → OAuth Apps → New:
- Homepage URL: `https://<your-domain>`
- Authorization callback URL: `https://<your-domain>/auth/callback`
- Copy the Client ID + secret.

### 2. Supabase
- Auth → Providers → **GitHub**: paste the Client ID/secret, enable.
- Auth → URL Configuration → add `https://<your-domain>/auth/callback` (and
  `http://localhost:3000/auth/callback` for local dev) to redirect URLs.

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
