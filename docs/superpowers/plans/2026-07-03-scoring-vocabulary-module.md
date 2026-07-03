# Scoring-Vocabulary Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize the three scoring registers (Young/Cultiness, Composite/neutral, Lifton/Totalism) into one source-of-truth module that every visualization imports, fixing the register conflation, the cut-line disagreement bug, and the label/color duplication scattered across the codebase.

**Architecture:** A single pure CommonJS module `src/lib/scoring.js` exports, per track, the labels, short forms, canonical cut-lines, and colors, plus classify helpers. It is unit-tested with `node --test`. Consumer components then replace their local `TIER_LABELS` / `TIER_COLORS` / `lbl()` / Lifton maps with imports from the module. This is plan #1 of the site-split sequence and lands in the current `zacharymays-site` repo (it flows into the extracted OCI repo unchanged).

**Tech Stack:** Next.js (App Router, `.jsx`), CommonJS pure libs, `node:test` + `node:assert`.

## Global Constraints

- **Module format: CommonJS** (`function` + `module.exports`) — matches `src/lib/curatorLifecycle.js` / `curatorSignals.js` so it loads under both Next/webpack and bare `node --test`. No ESM `export`.
- **Three registers are distinct and must never share strings:** Young = Cultiness ("Not/Kinda/Super Culty"), Composite = neutral ("Low/Moderate/High-Control"), Lifton = Totalism ("Non/Moderately/Psychologically Totalizing").
- **Canonical Composite cut-lines: 30 / 60** (`composite < 30` → Low, `< 60` → Moderate, `>= 60` → High). This matches the DB writer (`admin/curator/actions.js`) and migration 0005. The `oci/findings` legend (71/41) is the **bug** to fix — do NOT preserve it.
- **Canonical Young cut-lines: 0–2 / 3–5 / 6+** (presence count on 0–10).
- **Canonical Lifton cut-lines: <3 / 3–5.99 / 6+** (matches existing `liftonTier()` in `ExploreClient.jsx`).
- **DB still stores old strings.** `composite_tier` and `youngs_band` are stored as "Super/Kinda/Not Culty". This plan changes DISPLAY only — no DB migration. The module maps stored strings → the correct register at render time.
- **Preserve all Young & Reed attribution.** This plan touches only tier label/color logic; do not alter framework-credit copy.
- Test runner: `node --test test/scoring.test.js` for one file; `npm test` for all.

---

## File Structure

- **Create** `src/lib/scoring.js` — the single source of truth. Pure, CommonJS, no React/Next imports.
- **Create** `test/scoring.test.js` — unit tests mirroring the lib (matches `test/curatorLifecycle.test.js` convention).
- **Modify** consumers to import from the module, deleting their local duplicates:
  - `src/app/explore/ExploreClient.jsx`
  - `src/app/org/[slug]/page.jsx`
  - `src/app/explore/sankey/SankeyClient.jsx`
  - `src/app/oci/findings/page.jsx` (also fixes the cut-line bug)
  - `src/app/research/children-of-god-network/ChildrenOfGodClient.jsx`
  - `src/app/admin/review/ReviewClient.jsx`

---

## Task 1: The scoring-vocabulary module (core, TDD)

**Files:**
- Create: `src/lib/scoring.js`
- Test: `test/scoring.test.js`

**Interfaces:**
- Consumes: nothing (pure).
- Produces:
  - `TRACKS` — object keyed `young` / `composite` / `lifton`. Each: `{ key, register, scoreLabel, unit, bands }`. Each band: `{ id, label, short, color }` ordered low→high.
  - `classifyYoung(score) -> band | null` (null when score is null/NaN)
  - `classifyComposite(score) -> band | null`
  - `compositeBandFromTier(dbTier) -> band | null` — maps stored `'Super Culty'|'Kinda Culty'|'Not Culty'` → neutral Composite band.
  - `youngBandFromDb(dbBand) -> band | null` — maps stored `'Super Culty'|'Kinda Culty'|'Not Culty'` → Young (Cultiness) band (labels unchanged, but returns the canonical band object with color/short).
  - `classifyLifton(score) -> band | null`

- [ ] **Step 1: Write the failing test**

Create `test/scoring.test.js`:

```javascript
// test/scoring.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const {
  TRACKS,
  classifyYoung,
  classifyComposite,
  compositeBandFromTier,
  youngBandFromDb,
  classifyLifton,
} = require('../src/lib/scoring');

test('three tracks exist with distinct registers and no shared strings', () => {
  assert.strictEqual(TRACKS.young.register, 'Cultiness');
  assert.strictEqual(TRACKS.composite.register, 'Neutral');
  assert.strictEqual(TRACKS.lifton.register, 'Totalism');
  const young = TRACKS.young.bands.map(b => b.label);
  const comp = TRACKS.composite.bands.map(b => b.label);
  // Young and Composite must not share any label string (the core defect).
  assert.strictEqual(young.some(l => comp.includes(l)), false);
});

test('Young cut-lines: 0-2 Not, 3-5 Kinda, 6+ Super', () => {
  assert.strictEqual(classifyYoung(0).id, 'not');
  assert.strictEqual(classifyYoung(2).id, 'not');
  assert.strictEqual(classifyYoung(3).id, 'kinda');
  assert.strictEqual(classifyYoung(5).id, 'kinda');
  assert.strictEqual(classifyYoung(6).id, 'super');
  assert.strictEqual(classifyYoung(10).id, 'super');
  assert.strictEqual(classifyYoung(null), null);
  assert.strictEqual(classifyYoung(NaN), null);
});

test('Young bands use Cultiness labels', () => {
  assert.strictEqual(classifyYoung(8).label, 'Super Culty');
  assert.strictEqual(classifyYoung(4).label, 'Kinda Culty');
  assert.strictEqual(classifyYoung(1).label, 'Not Culty');
});

test('Composite canonical cut-lines are 30/60 (NOT 41/71)', () => {
  assert.strictEqual(classifyComposite(0).id, 'low');
  assert.strictEqual(classifyComposite(29).id, 'low');
  assert.strictEqual(classifyComposite(30).id, 'moderate');
  assert.strictEqual(classifyComposite(59).id, 'moderate');
  assert.strictEqual(classifyComposite(60).id, 'high');
  assert.strictEqual(classifyComposite(100).id, 'high');
  // Regression guard for the findings bug: 65 must be High (was "Kinda"/moderate under 71 cut).
  assert.strictEqual(classifyComposite(65).id, 'high');
  assert.strictEqual(classifyComposite(null), null);
});

test('Composite bands use neutral labels', () => {
  assert.strictEqual(classifyComposite(70).label, 'High-Control');
  assert.strictEqual(classifyComposite(40).label, 'Moderate-Control');
  assert.strictEqual(classifyComposite(10).label, 'Low-Control');
});

test('compositeBandFromTier maps stored Cultiness strings to neutral bands', () => {
  assert.strictEqual(compositeBandFromTier('Super Culty').label, 'High-Control');
  assert.strictEqual(compositeBandFromTier('Kinda Culty').label, 'Moderate-Control');
  assert.strictEqual(compositeBandFromTier('Not Culty').label, 'Low-Control');
  assert.strictEqual(compositeBandFromTier('garbage'), null);
  assert.strictEqual(compositeBandFromTier(null), null);
});

test('compositeBandFromTier agrees with classifyComposite at representative scores', () => {
  // 65 stored as "Super Culty" (>=60) → High both ways.
  assert.strictEqual(compositeBandFromTier('Super Culty').id, classifyComposite(65).id);
  // 45 stored as "Kinda Culty" (30–59) → Moderate both ways.
  assert.strictEqual(compositeBandFromTier('Kinda Culty').id, classifyComposite(45).id);
});

test('youngBandFromDb keeps Cultiness labels', () => {
  assert.strictEqual(youngBandFromDb('Super Culty').label, 'Super Culty');
  assert.strictEqual(youngBandFromDb('Not Culty').id, 'not');
  assert.strictEqual(youngBandFromDb(null), null);
});

test('Lifton cut-lines: <3 Non, 3-5.99 Moderately, 6+ Psychologically', () => {
  assert.strictEqual(classifyLifton(0).id, 'non');
  assert.strictEqual(classifyLifton(2.9).id, 'non');
  assert.strictEqual(classifyLifton(3).id, 'moderately');
  assert.strictEqual(classifyLifton(5.9).id, 'moderately');
  assert.strictEqual(classifyLifton(6).id, 'psychologically');
  assert.strictEqual(classifyLifton(10).id, 'psychologically');
  assert.strictEqual(classifyLifton(null), null);
});

test('Lifton bands use Totalism labels and short forms', () => {
  assert.strictEqual(classifyLifton(8).label, 'Psychologically Totalizing');
  assert.strictEqual(classifyLifton(8).short, 'Totalizing');
  assert.strictEqual(classifyLifton(4).short, 'Moderate');
  assert.strictEqual(classifyLifton(1).short, 'Non-Totalizing');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test test/scoring.test.js`
Expected: FAIL — `Cannot find module '../src/lib/scoring'`.

- [ ] **Step 3: Write the module**

Create `src/lib/scoring.js`:

```javascript
// src/lib/scoring.js
// Single source of truth for the three scoring registers ("tracks").
// CommonJS (loads under Next/webpack AND bare `node --test`) — see curatorLifecycle.js.
//
//   young     — Cultiness register  (Young & Reed presence count, 0–10)
//   composite — Neutral register    (intensity-weighted index, 0–100)
//   lifton    — Totalism register   (Lifton C11, 0–10)
//
// The three registers are intentionally distinct and must never share label
// strings. DB still stores old "Super/Kinda/Not Culty" strings for BOTH
// composite_tier and youngs_band; the *_FromDb helpers map them to the right
// register at render time. No DB migration here — display only.
//
// Colors are the single tuning point for tag color across every visualization.
// Values below are the light-mode palette; the dual-mode design-system plan
// later swaps these to CSS custom properties.

const YOUNG_BANDS = [
  { id: 'not',   label: 'Not Culty',   short: 'Not Culty',   color: '#7a9a8c' },
  { id: 'kinda', label: 'Kinda Culty', short: 'Kinda Culty', color: '#c8a84b' },
  { id: 'super', label: 'Super Culty', short: 'Super Culty', color: '#a5432e' },
];

const COMPOSITE_BANDS = [
  { id: 'low',      label: 'Low-Control',      short: 'Low',      color: '#8b9a86' },
  { id: 'moderate', label: 'Moderate-Control', short: 'Moderate', color: '#c08a5a' },
  { id: 'high',     label: 'High-Control',     short: 'High',     color: '#7d3a30' },
];

const LIFTON_BANDS = [
  { id: 'non',             label: 'Non-Totalizing',           short: 'Non-Totalizing', color: '#5f8f86' },
  { id: 'moderately',      label: 'Moderately Totalizing',    short: 'Moderate',       color: '#6d83b5' },
  { id: 'psychologically', label: 'Psychologically Totalizing', short: 'Totalizing',   color: '#a06cd5' },
];

const TRACKS = {
  young:     { key: 'young',     register: 'Cultiness', scoreLabel: "Young's",  unit: '/10',  bands: YOUNG_BANDS },
  composite: { key: 'composite', register: 'Neutral',   scoreLabel: 'Composite', unit: '/100', bands: COMPOSITE_BANDS },
  lifton:    { key: 'lifton',    register: 'Totalism',  scoreLabel: 'Totalism', unit: '/10',  bands: LIFTON_BANDS },
};

function toNum(v) {
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
}

function classifyYoung(score) {
  const v = toNum(score);
  if (v === null) return null;
  if (v >= 6) return YOUNG_BANDS[2];
  if (v >= 3) return YOUNG_BANDS[1];
  return YOUNG_BANDS[0];
}

function classifyComposite(score) {
  const v = toNum(score);
  if (v === null) return null;
  if (v >= 60) return COMPOSITE_BANDS[2];
  if (v >= 30) return COMPOSITE_BANDS[1];
  return COMPOSITE_BANDS[0];
}

function classifyLifton(score) {
  const v = toNum(score);
  if (v === null) return null;
  if (v >= 6) return LIFTON_BANDS[2];
  if (v >= 3) return LIFTON_BANDS[1];
  return LIFTON_BANDS[0];
}

// Stored DB tier strings → band. Same string set is used for both tiers in the
// DB, but each maps into its own register.
const DB_TIER_TO_ID = { 'Not Culty': 0, 'Kinda Culty': 1, 'Super Culty': 2 };

function compositeBandFromTier(dbTier) {
  const i = DB_TIER_TO_ID[dbTier];
  return i === undefined ? null : COMPOSITE_BANDS[i];
}

function youngBandFromDb(dbBand) {
  const i = DB_TIER_TO_ID[dbBand];
  return i === undefined ? null : YOUNG_BANDS[i];
}

module.exports = {
  TRACKS,
  classifyYoung,
  classifyComposite,
  classifyLifton,
  compositeBandFromTier,
  youngBandFromDb,
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test test/scoring.test.js`
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring.js test/scoring.test.js
git commit -m "feat(scoring): single-source vocabulary module for the three score registers"
```

---

## Task 2: Migrate ExploreClient to the module

**Files:**
- Modify: `src/app/explore/ExploreClient.jsx` (replaces local `TIER_LABELS`, `lbl`, `TIER_COLORS`, `LIFTON_TIERS`, `LIFTON_TIER_COLORS`, `LIFTON_TIER_SHORT`, `liftonTier`)

**Interfaces:**
- Consumes: `compositeBandFromTier`, `youngBandFromDb`, `classifyLifton`, `TRACKS` from `src/lib/scoring`.
- Produces: nothing new; behavior-preserving except Composite now shows neutral labels and Young keeps Cultiness labels (the intended fix).

**Note:** This is a refactor, not a new unit — verification is `npm test` (module tests still green) + `next build` + a visual check, not a new test file. ExploreClient is a client component; importing a CommonJS module is fine under Next.

- [ ] **Step 1: Add the import**

At the top of `src/app/explore/ExploreClient.jsx`, after the existing imports, add:

```javascript
import { compositeBandFromTier, youngBandFromDb, classifyLifton, TRACKS } from '../../../lib/scoring';
```

- [ ] **Step 2: Delete the local duplicates**

Remove these now-superseded definitions from the file (lines ~7–35): `TIER_COLORS`, `TIER_LABELS`, `lbl`, `LIFTON_TIERS`, `LIFTON_TIER_COLORS`, `LIFTON_TIER_SHORT`, and `liftonTier`. Keep `TRAJECTORIES` and `CRITERIA*`.

- [ ] **Step 3: Rewire the usages**

Replace each former usage with the module equivalent:
- `TIER_COLORS[org.composite_tier]` → `compositeBandFromTier(org.composite_tier)?.color || '#888'`
- `lbl(org.composite_tier)` → `compositeBandFromTier(org.composite_tier)?.label || org.composite_tier` (Composite → **neutral**)
- `TIER_COLORS[org.youngs_band]` → `youngBandFromDb(org.youngs_band)?.color`
- `lbl(org.youngs_band)` → `youngBandFromDb(org.youngs_band)?.label || org.youngs_band` (Young → **keeps Cultiness**)
- `liftonTier(o.lifton_score)` → `classifyLifton(o.lifton_score)?.label`
- `LIFTON_TIER_COLORS[lt]` → `classifyLifton(score)?.color` (or look up the band once and reuse)
- `LIFTON_TIER_SHORT[lt]` → `classifyLifton(score)?.short`
- Filter option lists: build from `TRACKS.composite.bands` / `TRACKS.young.bands` / `TRACKS.lifton.bands` (map to `.label`) instead of the deleted arrays.

- [ ] **Step 4: Verify build + module tests**

Run: `npm test`
Expected: PASS (module tests unaffected).
Run: `npx next build`
Expected: Build succeeds with no unresolved-symbol errors for the deleted constants.

- [ ] **Step 5: Visual check**

Run `npm run dev`, open `/explore`. Confirm: the **Composite Tier** column/filter now reads "Low/Moderate/High-Control"; the **Young Category** column keeps "Not/Kinda/Super Culty"; the Totalism column unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/app/explore/ExploreClient.jsx
git commit -m "refactor(explore): use scoring module; Composite now neutral, Young keeps Cultiness"
```

---

## Task 3: Migrate remaining consumers + fix the findings cut-line bug

**Files:**
- Modify: `src/app/org/[slug]/page.jsx`
- Modify: `src/app/explore/sankey/SankeyClient.jsx`
- Modify: `src/app/oci/findings/page.jsx` (**bug fix**)
- Modify: `src/app/research/children-of-god-network/ChildrenOfGodClient.jsx`
- Modify: `src/app/admin/review/ReviewClient.jsx`

**Interfaces:**
- Consumes: same module helpers as Task 2.
- Produces: nothing new.

**Import path note:** the relative depth differs per file — from `src/app/org/[slug]/page.jsx` it is `../../../lib/scoring`; from `src/app/explore/sankey/SankeyClient.jsx` it is `../../../../lib/scoring`; from `src/app/oci/findings/page.jsx` it is `../../../lib/scoring`; from `src/app/research/children-of-god-network/ChildrenOfGodClient.jsx` it is `../../../../lib/scoring`; from `src/app/admin/review/ReviewClient.jsx` it is `../../../lib/scoring`. Verify each against the actual `src/lib/scoring.js` location.

- [ ] **Step 1: org/[slug]/page.jsx** — delete local `TIER_TEXT`/`TIER_BG`/`TIER_LABELS`; import the module; replace `composite_tier` color/label lookups with `compositeBandFromTier(...)` (neutral), `youngs_band` lookups with `youngBandFromDb(...)` (Cultiness). Leave the Lifton (C11) card as-is or route its tier/color through `classifyLifton` for consistency. Do NOT touch the Young & Reed attribution copy.

- [ ] **Step 2: SankeyClient.jsx** — delete local `TIER_LABELS`/`lbl`; import `compositeBandFromTier`; the sankey is keyed on `composite_tier`, so render node labels via `compositeBandFromTier(tier)?.label || tier` (neutral) and node color via `.color`.

- [ ] **Step 3: oci/findings/page.jsx (BUG FIX)** — the local tier legend hardcodes ranges `71–100 / 41–70 / 0–40`. Replace with the module: import `TRACKS`/`compositeBandFromTier`, and render the legend from `TRACKS.composite.bands` with the **canonical 30/60 ranges** (Low 0–29, Moderate 30–59, High 60–100). Delete the stale `TIER_INFO` range literals and the local `TIER_LABELS`. Confirm the `/findings` percentages still map to the correct (renamed) bands.

- [ ] **Step 4: ChildrenOfGodClient.jsx** — delete local `TIER_TEXT`/`TIER_BG`/`TIER_LABELS`/`lbl`; import `compositeBandFromTier`; `cogData.composite_tier` → `compositeBandFromTier(...)` for color + neutral label. (Leave `SIZE_TIER_LABELS` untouched — unrelated.)

- [ ] **Step 5: admin/review/ReviewClient.jsx** — delete local `TIER_COLOR`; import `compositeBandFromTier`; use `.color` for the tier swatch. Admin may keep the raw stored string for curator clarity, but color must come from the module for consistency.

- [ ] **Step 6: Verify build + tests**

Run: `npm test`
Expected: PASS.
Run: `npx next build`
Expected: Build succeeds; no references to deleted constants remain.

- [ ] **Step 7: Grep for stragglers**

Run: `grep -rInE "TIER_LABELS|TIER_COLORS|TIER_TEXT|TIER_BG|liftonTier|LIFTON_TIER_" src/app`
Expected: no results except inside `src/lib/scoring.js` consumers already migrated. Any hit is an un-migrated duplicate — migrate it.

- [ ] **Step 8: Commit**

```bash
git add src/app/org src/app/explore/sankey src/app/oci/findings src/app/research/children-of-god-network src/app/admin/review
git commit -m "refactor(scoring): migrate remaining consumers to module; fix findings cut-line bug (30/60)"
```

---

## Task 4: Final verification

- [ ] **Step 1: Full test run**

Run: `npm test`
Expected: PASS, including `test/scoring.test.js`.

- [ ] **Step 2: Production build**

Run: `npx next build`
Expected: Success.

- [ ] **Step 3: Cross-page visual sweep**

Run `npm run dev` and spot-check `/explore`, `/org/<any-slug>`, `/explore/sankey`, `/oci/findings`, the CoG network page: every Composite tag reads neutral (Low/Moderate/High-Control) and identically-colored across pages; every Young tag reads Cultiness; every Lifton tag reads Totalism. No page shows "Super Culty" for a Composite score.

- [ ] **Step 4: Commit any fixes and finish**

```bash
git add -A
git commit -m "chore(scoring): final verification sweep"
```

---

## Self-Review Notes

- **Spec coverage:** implements the Scoring-tag audit section's refactor requirement (single vocabulary module), the three-register model (Young Cultiness / Composite neutral 3-band / Lifton Totalism), inconsistencies #1 (mis-pointed remap), #2 (duplication), #3 (cut-line bug), #4 (color inconsistency). Inconsistency #5 (two findings routes) is a consolidation deferred to the rebrand plan (#3 in the sequence), not this one — noted so it is not lost.
- **Type consistency:** all consumers use the same helper names and the band shape `{ id, label, short, color }` defined in Task 1.
- **No DB migration:** display-only; `composite_tier`/`youngs_band` stored strings are unchanged and mapped at render.
- **Attribution untouched:** no task alters Young & Reed credit copy.
