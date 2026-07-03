# Plan #4 — OCI Dual-Mode Design System + Light/Dark Toggle (Repo B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the inherited warm author styling with OCI's own purpose-built design system — one identity, two color modes (light "paper" / dark "console"), with a working light/dark toggle — so OCI reads as a credible data instrument and does not resemble the author site.

**Architecture:** A new token layer in `globals.css` defines a light palette (default) and a `[data-mode="dark"]` override, driving all colors via CSS custom properties. One unified type system (serif display, sans body, mono figures) across both modes. A small client toggle sets `data-mode` on `<html>`, defaults to `prefers-color-scheme`, persists to localStorage, and respects `prefers-reduced-motion`. The scoring module's band colors (Plan #1) are repointed at CSS variables so tags theme with the mode. Reference mockup: claude.ai/code/artifact/2e2edc2f-2d55-41d5-870e-0dbc58ba22d2

**Tech Stack:** CSS custom properties, a small React client component, Next.js `layout.jsx`.

## Global Constraints

- **Type system (both modes):** display serif `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`; body sans `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`; mono `ui-monospace, "SF Mono", Menlo, Consolas, monospace` with `tabular-nums` on figures.
- **Light palette (default):** `--ground #eceee9 · --surface #f7f8f4 · --ink #33382f · --bright #1a1e17 · --muted #6a6f62 · --rule #d4d7cc · --accent #2f4b57`.
- **Dark palette (`[data-mode="dark"]`):** `--ground #0d1117 · --surface #161c24 · --ink #b9c3cf · --bright #eef3f8 · --muted #798595 · --rule #232c37 · --accent #45b9bc`.
- **Score band tokens** (theme-aware; consumed by `src/lib/scoring.js`):
  - Composite: `--score-comp-low`, `--score-comp-mod`, `--score-comp-high`
  - Young (Cultiness): `--score-young-not`, `--score-young-kinda`, `--score-young-super`
  - Lifton (Totalism): `--score-lifton-non`, `--score-lifton-mod`, `--score-lifton-psy`
  - Light values from Plan #1; add dark-mode values under `[data-mode="dark"]`.
- **Toggle:** default OS preference; persist choice; visible keyboard focus; honor `prefers-reduced-motion`.
- This replaces the author's warm literary system; do NOT keep `--paper/--ink/--gold/--accent-text` oxblood tokens as the OCI defaults.

## File Structure

- Modify: `src/app/globals.css` (token layer both modes + transitions), `src/app/layout.jsx` (fonts→new system; mount toggle; `suppressHydrationWarning` on `<html>`).
- Create: `src/components/ThemeToggle.jsx` (client toggle), `src/components/ThemeScript.jsx` (inline no-flash pre-hydration script).
- Modify: `src/lib/scoring.js` (band `color` → `var(--score-*)`).

---

## Task 1: Token layer in globals.css

- [ ] **Step 1: Add the light (`:root`) and dark (`[data-mode="dark"]`) token blocks** at the top of `src/app/globals.css` with the palettes + score band tokens from Global Constraints. Add mode transitions guarded by `@media (prefers-reduced-motion: reduce)`.

- [ ] **Step 2: Repoint base element styles** (`body`, headings, links, nav, cards) from the old author tokens to the new `--ground/--surface/--ink/--bright/--muted/--rule/--accent`. Set the three font families as `--f-display/--f-body/--f-mono` and apply.

- [ ] **Step 3: Build**

Run: `npx next build`
Expected: success; no references to removed tokens error out. Grep leftover author tokens: `grep -rIn -- "--gold\|--paper\|--accent-text" src/app src/components` → migrate any that remain.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(design): OCI dual-mode token layer (light paper / dark console)"
```

## Task 2: No-flash theme script + toggle

- [ ] **Step 1: Create `src/components/ThemeScript.jsx`** — a component rendering an inline `<script>` (via `dangerouslySetInnerHTML`) that, before paint, reads `localStorage['oci-mode']` or `matchMedia('(prefers-color-scheme: dark)')` and sets `document.documentElement.dataset.mode`. This prevents a light/dark flash on load.

- [ ] **Step 2: Create `src/components/ThemeToggle.jsx`** (`'use client'`) — a segmented Light/Dark control with `aria-pressed`, visible `:focus-visible`, that sets `document.documentElement.dataset.mode` and writes `localStorage['oci-mode']`. (Port the logic from the reference mockup's `<script>`.)

- [ ] **Step 3: Mount both** in `layout.jsx`: add `suppressHydrationWarning` to `<html>`, render `<ThemeScript />` in `<head>` (or top of body), and `<ThemeToggle />` in the nav.

- [ ] **Step 4: Verify no-flash + persistence**

Run `npm run dev`; load in a dark-preferred OS → page loads dark with no white flash. Toggle to Light, reload → stays Light (localStorage). Tab to the toggle → visible focus ring.

- [ ] **Step 5: Commit**

```bash
git add src/components/ThemeScript.jsx src/components/ThemeToggle.jsx src/app/layout.jsx
git commit -m "feat(design): light/dark toggle with no-flash + persistence"
```

## Task 3: Theme-aware score tags

- [ ] **Step 1: Repoint `src/lib/scoring.js` band colors** from hardcoded hex to CSS vars — e.g. Composite `low` `color: 'var(--score-comp-low)'`, etc. Update `test/scoring.test.js` expectations to the `var(--...)` strings (the classify/mapping logic is unchanged; only the color literal changes).

- [ ] **Step 2: Run module tests**

Run: `node --test test/scoring.test.js`
Expected: PASS with updated color assertions.

- [ ] **Step 3: Visual check across modes** — `/explore`, `/org/<slug>`: score tags recolor correctly in both light and dark; contrast holds; the three registers stay visually distinct.

- [ ] **Step 4: Commit**

```bash
git add src/lib/scoring.js test/scoring.test.js
git commit -m "feat(design): score band colors driven by theme tokens"
```

## Task 4: Sweep components off inline author colors

- [ ] **Step 1: Find inline hardcoded author colors**

Run: `grep -rInE "var\(--gold|var\(--paper|var\(--accent-text|#c8a84b|#8b2020" src/app src/components`
Expected initially: a list. Replace each with the appropriate new token (`--accent`, `--bright`, `--muted`, etc.).

- [ ] **Step 2: Re-grep to zero**; build; visual sweep of the map, sankey, sunburst, heatmap in both modes (chart palettes should read on both grounds).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(design): migrate components to OCI tokens; author styling removed"
```

---

## Self-Review Notes

- Delivers the approved dual-mode identity; toggle has no-flash, persistence, a11y, reduced-motion.
- Scoring tags (Plan #1) become theme-aware — the two plans compose cleanly.
- Explicit greps ensure the author's warm system is fully removed, reinforcing the visual separation.
