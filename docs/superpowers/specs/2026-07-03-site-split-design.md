# Site Split: Author Site ↔ Dataset Site

**Date:** 2026-07-03
**Status:** Design approved, pending spec review
**Author:** Zachary Mays (with Claude)

## Goal

Separate the author identity (`zacharymays.com`) from the cult-research dataset so that
neither is the headline attached to the other. This is a **soft** separation: authorship
stays discoverable to anyone who looks, but the dataset is no longer the front page of the
author's name, and the author's name is no longer the masthead of the dataset.

### Non-goals

- **Not** anonymity or unattributable publishing. No pseudonym, no git-history scrubbing,
  no WHOIS-privacy safety posture. (Explicitly ruled out: "soft, not the headline.")
- **Not** a database split. The single Supabase backend is shared unchanged.
- **Not** a redesign of either site's content or visuals beyond what separation requires.

## Decisions (locked)

| Decision | Choice |
|---|---|
| Separation level | Soft — not the headline |
| Structure | Two repos, two independent Vercel deploys |
| Backend | One shared Supabase project (unchanged) |
| Author site | `zacharymays.com` — existing repo, trimmed to author pages |
| Dataset site | New repo, extracted from current one |
| Dataset masthead name | **Organizational Coercion Index** |
| Cross-link | One quiet "Research →" link from author site to dataset site |
| Attribution | Preserve existing Young & Reed framework credit + `/terms` IP disclaimer through the split |

## Domain portfolio

Author site: **`zacharymays.com`** (unchanged, resolves independently).

Dataset site — one canonical, four redirects (all registered; ~$52/yr):

| Domain | Role |
|---|---|
| `organizationalcoercionindex.org` | **Canonical** — exact masthead match; the URL Google indexes |
| `coercionindex.org` | 301 → canonical (short form) |
| `organizationalcoercionindex.com` | 301 → canonical (full-name `.com`) |
| `cultspectrum.com` | 301 → canonical (memorable spoken handle) |
| `cultspectrum.org` | 301 → canonical (twin protection) |

**Purchase path:** buy via **Vercel Domains** (Project → Domains / vercel.com/domains). Since the
dataset site deploys on Vercel, DNS auto-wires, SSL is automatic, and the four aliases are set as
"Redirect to" the canonical in the project's Domains settings. User executes the purchase (payment).

Rationale: canonical governs indexing, not typing. The full name anchors the brand in
search; the short and punchy domains funnel the traffic people actually type. Redirects are
301 (permanent) so link equity consolidates on the canonical.

**None are purchased yet.** Registration is the first implementation step, gated on user go-ahead.

## Repo A — `zacharymays-site` (existing, trimmed)

**Keep (author routes only):**
`/`, `/about`, `/how-we-got-here`, `/assholes-in-history`, `/donate`, `/terms`

**Remove (move to Repo B):**
- Routes: `oci/*`, `explore/*`, `org/[slug]`, `research/*`, `research-system/*`,
  `compass`, `findings`, `admin/*`, `auth/*`
- API: `api/dataset-stats`, `api/cron/*`
- Components: `Correlation`, `CultsOverTimeChart`, `ExploreNav`, `LiveStats`, `OrgCount`
- Lib: everything dataset-related — `curator*`, `intake*`, `reviewQueue`, `identity/*`,
  `getDatasetStats`, `getFindingsStats`, `getActiveCultsTimeline`, `hooks/useDatasetStats`,
  `supabase/*`, `auth*`
- Supabase config, cron config in `vercel.json`

**Change:**
- **Root metadata** (`layout.jsx`) → author-first. Title `Zachary S. Mays`; description about
  the author and books. Remove "The Cultiness Spectrum" from the site-level title/description.
- **Homepage** (`page.jsx`) → replace the live `OrgCount` / `Correlation` dataset widgets with
  a static **"Research →"** link out to `organizationalcoercionindex.org`. (Default: no live
  dataset data on the author page. See Open Questions if a teaser is wanted instead.)
- **Nav** → author-only links (Home, About, Books, Donate) plus the one quiet Research link.
- `sitemap.js`, `robots.js`, `opengraph-image.js` → author pages only.
- Author site should end up needing **no Supabase dependency** once widgets are removed.

## Repo B — new dataset repo (`organizational-coercion-index` or similar)

**Contains (extracted from Repo A):** all routes, components, lib, API, and Supabase config
listed under "Remove" above.

**Structure:**
- Dataset landing (currently `/oci`) becomes the new site root `/`.
- Own Vercel project, bound to `organizationalcoercionindex.org` (+ the four redirect domains).
- Own `middleware`/config for the 301 redirect domains → canonical.

**Rebrand (finish the in-progress rename):**
- Replace every remaining "The Cultiness Spectrum" string (notably the `explore/*` page
  metadata titles) with "Organizational Coercion Index." Audit for stragglers across all
  pages, metadata, and OG images.
- Decide display treatment of "Cultiness Score" internal field label (currently user-facing on
  the compass page) — rename to a neutral label or retain with a footnote. (See Open Questions.)

**Name scrub (careful — two different "attributions"):**
- Remove **"Zachary S. Mays"** author/personal attribution from dataset pages — confirmed present
  in `org/[slug]` and `oci/dataset`. No author masthead; the site brands as OCI only.
- **PRESERVE all "Young & Reed" framework attribution** — do NOT strip it in the name-scrub. The
  two are easy to confuse; the scrub targets the personal author identity only.

**Attribution (already present — must carry over intact):**
- The Young & Reed framework is already credited thoroughly and consistently, sourced to
  `uncultureyourself.com`: homepage, the **global footer** ("Framework: Young & Reed"), `/about`,
  `/donate`, `/oci` methodology, and `/org/[slug]`. This must survive the split to the OCI site.
- **`/terms` carries a formal IP + non-endorsement disclaimer** ("The Young & Reed Dual-Metric
  System is the intellectual property of Daniella Mestyanek Young and Amy Reed… does not imply
  endorsement by Young, Reed, or Otterpine"). The OCI site MUST carry a terms page with this
  disclaimer intact (legal requirement, not cosmetic).
- Daniella Mestyanek Young coined "cultiness" specifically; the Cultiness *register* (Young track
  labels) is Young & Reed's. No new credit line needed beyond preserving the existing attribution.

**SEO separation (the part that actually unhooks the name in search):**
- Every dataset page sets `alternates.canonical` to its absolute URL on
  `organizationalcoercionindex.org`.
- `metadataBase` → the canonical domain.
- Own `sitemap.js` / `robots.js` advertising only dataset pages.

## Score vocabulary — three registers (by design)

The three scoring tracks intentionally speak in **different vernaculars**, and the register
signals which methodology produced the score. This variation is a feature, not an
inconsistency to neutralize:

| Track | Range | Vernacular | Notes |
|---|---|---|---|
| **Young score** | presence count | **Cultiness language** ("Super Culty" …) | Young & Reed framework (Daniella Mestyanek Young coined "cultiness"); retained by design. Existing Young & Reed attribution carries over — see Attribution. |
| **Composite (YM Composite)** | 1–100 | **Neutral language** (Negligible / Low / Moderate / Elevated / Severe) | The evenhanded, institutional register — matches the OCI masthead. |
| **Lifton score** | Lifton 8-criteria | **Totalism language** | Robert Jay Lifton's ideological-totalism vocabulary. |

Design/UI implication: each score must be **labeled with its track**, and the UI should make
"which register am I reading" unambiguous (e.g. distinct labeling/typographic treatment per
track). The neutral tier labels shown in the design mockups apply specifically to the
**Composite** track. Do **not** globally rename the Young or Lifton vocabularies.

Migration note: today "Super Culty"-style labels are applied at the composite/tier level.
Target state moves the Cultiness language to be specifically the **Young** track's register and
gives the **Composite** track neutral labels; the **Lifton** track adopts totalism terms.

## Scoring-tag audit (current state) + refactor requirement

Audited how the three tracks are tagged across the live visualizations (2026-07-03). The
current implementation conflates the Composite and Young registers and scatters
label/color/cut-line logic across many files. Fixing this is a required work item in Repo B.

**Data model** (per-org fields): `composite_score` /100 + `composite_tier`; `youngs_score` /10
+ `youngs_band`; `lifton_score` /10 (+ client-derived Lifton tier).

**Current tags:**

| Track | Tier field | Current labels | Register | Verdict |
|---|---|---|---|---|
| Young | `youngs_band` | Super / Kinda / Not Culty | Cultiness | correct |
| Composite | `composite_tier` | Super / Kinda / Not Culty | (should be neutral) | **wrong — reuses Young's strings** |
| Lifton | derived | Psychologically / Moderately / Non-Totalizing (purple, own card) | Totalism | correct — reference model |

**Core defect:** `composite_tier` and `youngs_band` store the *identical* string set, so the
same three words denote two different things (0–100 intensity band vs 0–10 presence count) and
are indistinguishable in the UI.

**Inconsistencies found:**
1. A `TIER_LABELS` remap (`Super Culty → High-Control` …) is applied via `lbl()` to *both*
   `composite_tier` and `youngs_band` — it strips the Cultiness language off the Young track
   (where it should stay) while raw "Super Culty" still shows on other pages. Users see a mix.
2. That remap is duplicated across 5+ files (ExploreClient, Sankey, CoG client, org page,
   findings) — no single source of truth.
3. **Cut-lines disagree between files** (likely a real bug): `oci/findings` legends Super
   71–100 / Kinda 41–70 / Not 0–40; admin actions compute Super ≥60 / Kinda ≥30. Reconcile
   against whatever `composite_tier` the DB stores authoritatively.
4. At least three color palettes for the same tiers (Solarized red/amber/olive; oxblood;
   dark findings set) plus ExploreClient's own `TIER_COLORS`. Same tag, different color per viz.
5. Two findings implementations (`/findings` and `/oci/findings`) — likely legacy duplication;
   consolidate.

**Refactor requirement (Repo B):** introduce a **single scoring-vocabulary module** — the one
source of truth defining, per track: score label, range, band labels, cut-lines, and color
family, with the three registers (Cultiness / neutral / Totalism) each visually distinct. Every
visualization imports from it. This resolves #1–#4, centralizes #2, and enforces the "label each
score by its track" UI rule from the Score Vocabulary section. Model it on the Lifton track,
which already does this correctly.

Target per-track vocabulary:
- **Young** — keep `youngs_band` Cultiness labels (Not / Kinda / Super Culty); one color family; preserve Young & Reed attribution.
- **Composite** — **3-band neutral labels: Low-Control / Moderate-Control / High-Control**
  (DECIDED; maps 1:1 onto existing `composite_tier` data — no re-tiering); own color family
  (a 3-step severity ramp). Stops sharing strings with the Young track.
- **Lifton** — already correct; formalize into the module. Current labels (keep):
  Non-Totalizing / Moderately Totalizing / Psychologically Totalizing (short: Non-Totalizing /
  Moderate / Totalizing); cut-lines ≥6 / ≥3 / <3; colors `#5f8f86` / `#6d83b5` / `#a06cd5`.
  Optional tidy: make the three short forms parallel.

## Visual identity — dataset site (OCI)

OCI gets its **own purpose-built design system**, replacing the inherited author `globals.css`.
This is both a credibility choice (a data instrument should read as neutral/institutional, not
as an author's literary brand) and part of the soft separation (a distinct look stops the two
sites re-coupling visually once the name is removed). The author site keeps its existing warm
literary system unchanged.

Approved direction: **one identity, two color modes, with a light/dark toggle.**

**Type system (shared across both modes):**
- Display / headings / wordmark: serif — `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`
- Body: grotesque sans — `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
- Figures / labels / eyebrows / table numerals: mono — `ui-monospace, "SF Mono", Menlo, Consolas, monospace` with `tabular-nums`
- (System stacks used deliberately to avoid CSP webfont issues; a licensed display serif can be
  swapped in later via `@font-face` data URI if desired.)

**Color logic:** accent is separate from semantic color. Two data ramps coexist because the
site needs both — a **sequential severity ramp** (tiers) and a **categorical palette** (org
categories) — each retuned per mode.

**Light mode — "Field Report" (paper):**
`--ground #eceee9 · --surface #f7f8f4 · --ink #33382f · --bright #1a1e17 · --muted #6a6f62 ·
--rule #d4d7cc · --accent #2f4b57` · tiers `#8b9a86 #b7a469 #c08a5a #a75a48 #7d3a30` ·
categories rel `#6b7fa3` pol `#a36b6b` com `#5f9a80` ther `#b08a4e`

**Dark mode — "Instrument" (console):**
`--ground #0d1117 · --surface #161c24 · --ink #b9c3cf · --bright #eef3f8 · --muted #798595 ·
--rule #232c37 · --accent #45b9bc` · tiers `#35625e #4f8a72 #c2a747 #d78338 #c14a30` ·
categories rel `#7d90b8` pol `#c08a8a` com `#6fb495` ther `#cfa860`

**Toggle behavior:** default to OS `prefers-color-scheme` on first load; persist the user's
choice (localStorage); respect `prefers-reduced-motion`; visible keyboard focus on the control.

**Reference mockups:**
- Three directions explored: `claude.ai/code/artifact/28c5f7ff-aff6-4ce2-a554-a42f823e7713`
- Approved dual-mode toggle: `claude.ai/code/artifact/2e2edc2f-2d55-41d5-870e-0dbc58ba22d2`

**Vocabulary note:** the neutral tier labels shown in the mockups belong to the **Composite**
track only. The Young ("Cultiness") and Lifton ("Totalism") tracks keep their own registers —
see the Score Vocabulary section. The design must label each score by track and treat the three
registers distinctly.

## Shared backend

- Supabase project unchanged. Repo B holds the Supabase clients and reads/writes as today.
- Repo A ideally holds none; if a future author-side teaser needs counts, it calls a public
  read endpoint on the dataset site rather than embedding Supabase directly.

## GitHub hygiene (optional, recommended)

The public repo `zacharymays-cpu/cultiness-spectrum` (Python scoring/data backend) is a second
name-link independent of the website. For consistency:
- Create a neutral GitHub org (e.g., `organizational-coercion-index`).
- Home the **new** dataset frontend repo there (not under the personal handle).
- Optionally move/rename the existing `cultiness-spectrum` backend repo into the same org.

Marked optional because "soft" separation does not require it; it closes the loop for consistency.

## Sequencing (high level — full plan comes from writing-plans)

1. Register the five dataset domains; set redirects to canonical.
2. Scaffold Repo B; move dataset routes/components/lib/api in; wire Supabase; deploy to a
   preview URL and verify parity with the current dataset pages.
3. Finish rebrand + name scrub (preserve Young & Reed attribution) + canonical metadata in Repo B.
4. Point `organizationalcoercionindex.org` (+ redirects) at Repo B's Vercel project.
5. Trim Repo A: remove dataset routes/components/lib/api, author-first metadata, quiet
   Research link, drop Supabase dep.
6. Verify: author site clean on `zacharymays.com`, dataset site clean on canonical, redirects
   working, no cross-domain duplicate-content, search consoles show separated properties.
7. (Optional) GitHub org move.

## Open questions / risks

- **Author homepage teaser:** default is a static Research link (no live data). Confirm you
  don't want a small live counter — if you do, it requires a public read endpoint from Repo B.
- **Three-register vocabulary** decided (see Score Vocabulary + Scoring-tag audit): Young =
  Cultiness (Not/Kinda/Super Culty), Composite = neutral 3-band (Low/Moderate/High-Control),
  Lifton = Totalism (existing labels kept). Attribution resolved — Young & Reed credit already
  exists site-wide and carries over intact (see Attribution); no new credit line needed.
- **Cutover coordination:** DNS/redirect propagation means a brief window where old dataset URLs
  under `zacharymays.com` should 301 to the new canonical to preserve inbound links and SEO.
  Plan a redirect map for the old `zacharymays.com/oci`, `/explore`, `/org/...` paths.
- **Admin auth:** `admin/*` and `auth/*` move to Repo B; verify the auth provider config and
  any allowed-redirect URLs are updated to the new domain.
