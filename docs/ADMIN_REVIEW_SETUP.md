# Admin consoles — setup and authentication

Restricted consoles live under `/admin`:

| Path | Purpose |
|---|---|
| `/admin/review` | Human review of AI-jury scores (prioritized worklist) |
| `/admin/curator` | Data curation — HC + dual-track scores |
| `/admin/intake` | Propose and approve/reject org intake |
| `/admin/photos` | Upload, tag, and validate photos linked to organizations |
| `/admin/persons` | Personnel identity — search, reveal, and publish encrypted identities (reveal/publish require decryptor authorization; every reveal is logged) |

All consoles share the same auth gate and navigation bar.

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
Users who have registered a passkey can sign in with a single tap on any enrolled
authenticator — a platform authenticator (Face ID / Touch ID / Windows Hello) **or** a
roaming FIDO2 hardware security key such as a **YubiKey**. Passkeys are phishing-resistant
and satisfy AAL2 directly — no separate TOTP step required.

- On the login page, tap **"Sign in with passkey"**.
- The browser handles the WebAuthn ceremony and creates a full session.

### Hardware security keys (YubiKey)
A YubiKey (or any FIDO2/WebAuthn security key) is just a passkey backed by dedicated
hardware. It registers and signs in through the exact same `registerPasskey()` /
`signInWithPasskey()` flow as a platform passkey — no extra code or configuration is
required beyond the one-time passkey enablement below.

Two ways to use a YubiKey:
1. **As a passkey (recommended).** Register the key as a WebAuthn credential (steps below).
   USB-A, USB-C, and NFC keys all work in modern browsers; NFC requires tapping the key to
   a phone/reader during the prompt. The credential is cryptographically bound to the
   Relying Party ID (`zacharymays.com`), so a key registered against production will not
   work against `localhost`/preview origins unless those origins are added to the RP config.
2. **As a TOTP token.** A YubiKey 5-series can also store the TOTP secret via the **Yubico
   Authenticator** app, then supply the 6-digit code at `/admin/mfa` like any authenticator
   app. This is a fallback — the passkey path is stronger and faster.

> **Roaming-only enforcement is not supported.** Supabase's managed passkey flow generates
> the WebAuthn options server-side and does not expose `authenticatorAttachment` /
> attestation controls, so the admin app **cannot force** "security key only" and reject
> platform passkeys (Face ID / Touch ID). Both authenticator types are accepted. Any
> client-side attempt to restrict this would be cosmetic and bypassable, so it is
> intentionally not implemented.

**Passkey is the only sign-in method.** The login page (`src/app/admin/login/page.jsx`)
exposes a single **"Sign in with passkey"** button — GitHub OAuth and email magic-link were
removed to minimize the admin login attack surface. Removing the UI does not disable those
flows at the API level, so they must **also** be turned off in the Supabase project
(Auth → Providers / Email) to actually close the surface.

### TOTP (authenticator app) — step-up / enrollment factor, not a login method
TOTP is **not** a way to sign in. It is an AAL2 factor that an already-signed-in analyst
enrolls and verifies at `/admin/mfa`. A passkey sign-in already satisfies AAL2 on its own
(see the gate below), so TOTP mainly exists as a second registered factor and a YubiKey-as-
TOTP fallback. Supported apps: Google Authenticator, Authy, 1Password, Yubico Authenticator.

When a user lands on `/admin/mfa` after verifying TOTP, the page checks whether they have a
passkey enrolled; if not, it offers one-tap registration before redirecting to the console.

---

## One-time setup

### 1. Enable passkeys in Supabase
Dashboard → **Authentication → Passkeys**:
- Toggle **Enable Passkey authentication**
- **Relying Party Display Name:** e.g. `Cultiness Spectrum Admin`
- **Relying Party ID:** your bare production domain, e.g. `zacharymays.com`
- **Relying Party Origins:** `https://zacharymays.com` (and any preview domains if needed)

> **Note:** The RP ID is cryptographically bound to every passkey. Changing it after users enroll will invalidate all existing passkeys.

### 2. Lock down first-factor providers
The login UI only offers passkeys, but Supabase still honors any auth method enabled at the
project level. To match the intended attack surface, **disable email magic-link, OAuth
providers, and password sign-in** in Supabase → Auth (Providers / Email) — except for a
single bootstrap method kept available only while onboarding new analysts (see *Onboarding a
new analyst* below). The catch-22 is intentional: a passkey can only be registered from an
existing session, so the very first sign-in for a new analyst needs a temporary first factor.

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

## Onboarding a new analyst (first passkey)

Because passkey is the only login button and `registerPasskey()` requires an existing
session, a brand-new analyst cannot bootstrap themselves from the UI alone. Use one of:

- **Temporary first factor (simplest):** enable email magic-link in Supabase → Auth just
  long enough for the analyst to sign in once, then immediately follow the enrollment steps
  below and disable magic-link again.
- **Admin-provisioned session:** an existing admin invites/creates the user via the Supabase
  dashboard or `auth.admin` API so they can establish the first session.

Add the analyst's email to `ADMIN_EMAILS` first, or the gate will reject them after sign-in.

### Enrollment steps (once a session exists)

1. Sign in with the temporary first factor (or the provisioned session).
2. Complete the TOTP step at `/admin/mfa`.
3. The MFA page shows: **"Register passkey for faster sign-in next time"**.
4. Tap **Register passkey** — the browser prompts for the authenticator.
   - **Platform passkey:** approve with Face ID / Touch ID / Windows Hello.
   - **YubiKey:** insert the key (or tap it to the NFC reader) and touch the gold contact
     when it blinks; set a PIN if the browser asks. The credential's friendly name is
     auto-derived from the key's AAGUID (e.g. "YubiKey 5 Series").
5. Done. Next sign-in: tap "Sign in with passkey" on the login page and present the same
   authenticator.

> A user can register more than one passkey (e.g. Touch ID **and** a YubiKey as a backup).
> Manage them via `supabase.auth.passkey.list()` / `delete()`. Registering a backup
> hardware key is recommended so a lost or wiped device doesn't lock the analyst out.

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
