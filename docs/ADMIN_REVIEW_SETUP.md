# Admin consoles — setup and authentication

Four restricted consoles live under `/admin`:

| Path | Purpose |
|---|---|
| `/admin/review` | Human review of AI-jury scores (prioritized worklist) |
| `/admin/curator` | Data curation — HC + dual-track scores |
| `/admin/intake` | Propose and approve/reject org intake |
| `/admin/photos` | Upload, tag, and validate photos linked to organizations |

All four share the same auth gate and navigation bar.

---

## Architecture

### Auth stack
- **Session:** Supabase Auth with cookie-based sessions via `@supabase/ssr`.
  `src/middleware.js` intercepts every `/admin/*` request, calls `getUser()` (network-validated),
  and redirects unauthenticated requests to `/admin/login?next=<path>`.
- **Identity allowlist:** The signed-in email must appear in the `ADMIN_EMAILS` env var.
  This is checked server-side in each page component — the middleware only enforces that *a* session exists.
- **AAL2 required:** Every admin page enforces an AAL2 (step-up) session before rendering.
  AAL2 can be satisfied by **TOTP** (authenticator app) **or a registered passkey** — either path
  is accepted.

### Security controls
| Control | Implementation |
|---|---|
| Session sign-out | "Sign out" button in the shared nav (`AdminNav`) — calls `supabase.auth.signOut()` and redirects to `/admin/login` |
| Idle timeout | **15 minutes** of inactivity (NIST SP 800-53 AC-11) — any mouse, keyboard, scroll, or touch event resets the clock; on expiry the session is cleared and the browser is sent to `/admin/login?reason=idle` |
| AAL2 enforcement | Every admin page server-component checks `aal?.currentLevel !== 'aal2'` and redirects to `/admin/mfa` if not met |

---

## Sign-in methods

### Passkeys (recommended — fastest)
Users who have registered a passkey can sign in with a single Face ID / Touch ID tap on any enrolled Apple device (or any FIDO2-capable device). Passkeys are phishing-resistant and satisfy AAL2 directly — no separate TOTP step required.

- On the login page, tap **"Sign in with passkey"**.
- The browser handles the WebAuthn ceremony and creates a full session.

### TOTP (authenticator app)
Users without a passkey sign in with GitHub OAuth or an email magic link, then complete a TOTP step-up at `/admin/mfa`. Supported apps: Google Authenticator, Authy, 1Password.

After completing TOTP, the MFA page automatically checks whether the user has a passkey enrolled. If not, it offers a one-tap registration ("Register passkey for faster sign-in next time") before redirecting to the console. Users can skip this.

### GitHub OAuth / Email magic link
First-factor sign-in options available on the login page for users who have not yet enrolled (or choose not to use) a passkey.

---

## One-time setup

### 1. Enable passkeys in Supabase
Dashboard → **Authentication → Passkeys**:
- Toggle **Enable Passkey authentication**
- **Relying Party Display Name:** e.g. `Cultiness Spectrum Admin`
- **Relying Party ID:** your bare production domain, e.g. `zacharymays.com`
- **Relying Party Origins:** `https://zacharymays.com` (and any preview domains if needed)

> **Note:** The RP ID is cryptographically bound to every passkey. Changing it after users enroll will invalidate all existing passkeys.

### 2. Configure OAuth provider(s)
Optional — only needed if you want GitHub/Google/etc. login in addition to email magic link.

- **GitHub:** GitHub → Settings → Developer settings → OAuth Apps.
  Callback URL: `https://shgdrkrqjnwtlyxcdayp.supabase.co/auth/v1/callback`
- Paste the Client ID / Secret into Supabase → Auth → Providers.
- Add `https://<your-domain>/auth/callback` (and `http://localhost:3000/auth/callback`) to the redirect allowlist in Supabase → Auth → URL Configuration.

### 3. Environment variables
Set in Vercel → Settings → Environment Variables and in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://shgdrkrqjnwtlyxcdayp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key — server-only, never expose client-side>
ADMIN_EMAILS=you@example.com,colleague@example.com
BLOB_READ_WRITE_TOKEN=<Vercel Blob token — required for /admin/photos uploads>
```

### 4. Install + run
```bash
npm install   # requires @supabase/supabase-js >=2.105.0 (currently pinned to ^2.108.2)
npm run dev   # visit http://localhost:3000/admin/review → redirects to login
```

---

## First-time passkey enrollment (existing users)

1. Sign in via GitHub or email magic link.
2. Complete the TOTP step at `/admin/mfa`.
3. The MFA page shows: **"Register passkey for faster sign-in next time"**.
4. Tap **Register passkey** — the browser prompts for Face ID / Touch ID.
5. Done. Next sign-in: tap "Sign in with passkey" on the login page.

---

## Write gates

All mutating operations (score changes, tag validation, photo uploads, etc.) go through
Server Actions that re-run the `requireAdmin()` check (email allowlist + AAL2) independently
of the page auth gate. This means the session cannot be forged client-side to trigger a write.

---

## Optional hardening
- Add Vercel **Deployment Protection** in front of `/admin` for defense-in-depth.
- To enforce MFA project-wide (not just for `/admin`): Auth → MFA settings → "Enforce MFA".
- For multi-analyst setups: add an `app_role` JWT claim hook and RLS policies
  (`cultiness-spectrum/database-docs/sql/policies.sql`) and switch writes to the
  user's RLS-scoped session instead of service role.
