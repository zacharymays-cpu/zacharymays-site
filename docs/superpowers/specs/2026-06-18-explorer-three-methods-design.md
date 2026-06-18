# Dataset Explorer — Three Scoring Methods + Psychological Tier Filter

**Date:** 2026-06-18
**Status:** Approved design — ready for implementation plan
**Repo:** `zacharymays-site`
**Primary surface:** `src/app/explore/` (Dataset Explorer)

## Problem

V6.0 introduced **dual-track scoring**, giving every organization three scores:

| Method | Field | Scale | Track |
|---|---|---|---|
| Composite | `organizations.composite_score` | 0–100% | Behavioral (C1–C10) |
| Young's Original | `organizations.youngs_score` | 0–10 | Behavioral (C1–C10) |
| **Lifton Psychological Totalism** | `criterion_scores.score` where `criterion='C11'` | 0–10 | **Psychological (C11)** |

The Dataset Explorer currently surfaces only Composite and Young's, and filters only by the
composite (behavioral) tier. The **Lifton score is not surfaced anywhere in the explorer**, and
there is no way to filter by it. Because Composite and Young's are both built from C1–C10 they track
each other closely; **Lifton is the only orthogonal axis**, and the genuinely interesting signal is
where behavioral control and psychological closure diverge (e.g. corporations/media with real
structural control but low totalism; Branch Davidians high-control but comparatively lower Lifton).

## Goal

1. Surface all three scores in the explorer table and on the org detail page.
2. Add a **psychological (Lifton) tier filter** alongside the existing composite (behavioral) tier filter.

Both tiers are independent and AND-combined, so users can isolate cells like
"High-Control + Non-Totalizing".

## Data facts (verified against live DB `shgdrkrqjnwtlyxcdayp`, 2026-06-18)

- Analytics population: 616 active, non-calibration orgs.
- Coverage: 609 composite, 568 Young's, **608 Lifton (C11)**.
- C11 has exactly **one row per org** (608 rows = 608 distinct orgs) → safe to merge by `org_id`.
- No stored Lifton tier column exists; the tier is **derived from the C11 score** using the
  methodology cut-lines.
- Live Lifton tier distribution (608 scored): **376** Psychologically Totalizing /
  **147** Moderately Totalizing / **85** Non-Totalizing. (Skews higher than the behavioral tier:
  206 Super / 253 Kinda / 150 Not.)

## Lifton tier definition (derived, client-side)

From `METHODOLOGY` C11 cut-lines:

| Score | Tier label (UI) | Color |
|---|---|---|
| 6.0 – 10 | Psychologically Totalizing | `#a06cd5` (violet) |
| 3.0 – 5.9 | Moderately Totalizing | `#6d83b5` (indigo) |
| 0 – 2.9 | Non-Totalizing | `#5f8f86` (teal) |
| null | (unscored — excluded, renders `—`) | — |

**Color rationale:** the behavioral tier uses warm colors (`#e8574d` / `#d99b3e` / `#5cb878`).
The psychological tier uses a **cool/violet palette** so the two tier systems never visually collide.

**Label rationale:** use the methodology's exact totalizing vocabulary (chosen over softened
"High/Moderate/Low Closure" alternatives) for precision.

## Design

### 1. Data layer — `src/app/explore/page.jsx`

`getOrgs()` currently issues one REST fetch against `organizations`. Add a **second parallel fetch**
and merge:

- Fetch `criterion_scores?select=org_id,score&criterion=eq.C11`.
- Build an `org_id → score` map; attach `lifton_score` (number | null) to each org object.
- Keep both fetches under the existing `next: { revalidate: 3600 }` ISR cache.
- Failure isolation: if the C11 fetch fails, orgs still render (every `lifton_score` is null →
  `—` everywhere). The page never hard-fails on the secondary fetch.

No DB migration and no new view — this stays a pure front-end change with zero migration risk.

### 2. Tier helper — `src/app/explore/ExploreClient.jsx`

Add, mirroring the existing `TIER_COLORS` / `TIER_LABELS` / `lbl` pattern near the top of the file:

- `LIFTON_TIERS = ['Psychologically Totalizing','Moderately Totalizing','Non-Totalizing']`
- `LIFTON_TIER_COLORS = { ... }` (violet/indigo/teal above)
- `liftonTier(score)` → tier string, or `null` when score is null/undefined.

### 3. Sidebar filters

- Rename the existing **"Tier"** section header to **"Control Tier"** with a small
  `· behavioral` caption, so the pairing is explicit.
- Add a new **"Psychological Tier"** section directly below it:
  - 3 checkboxes (the `LIFTON_TIERS` labels), violet accent colors, live per-tier counts
    computed from `orgs` via `liftonTier(o.lifton_score)`.
  - New state `liftonTierFilter` (array), `toggle()`-driven like the others.
- Wire `liftonTierFilter` into:
  - `hasFilters`
  - the active-count chip in the filter toggle
  - the **Clear All** handler

### 4. Filter logic — `filtered` memo

Add an AND clause:
```
if (liftonTierFilter.length && !liftonTierFilter.includes(liftonTier(o.lifton_score))) return false;
```
Include `liftonTierFilter` in the memo dependency array.

### 5. Table

- Add two columns after **Young's**:
  - **Lifton** — `${score}/10` (mono), or `—` when null. Sortable.
  - **Psych Tier** — colored dot (`LIFTON_TIER_COLORS`) + short label
    (`Totalizing` / `Moderate` / `Non-Totalizing`), or `—` when null.
- Extend the sortable-header column array with `['lifton_score','Lifton']`.
- Add `lifton_score` to the numeric-sort branch alongside `composite_score`/`youngs_score`
  (NaN/null sinks to the bottom regardless of direction).
- Rename the existing **"Tier"** header label to **"Control Tier"**.
- Add the two new columns to `explore-table-hide-mobile` to avoid crowding small screens.
- Row color theme (`TIER_CLASS` keyed on `composite_tier`) is **unchanged** — the behavioral tier
  remains the row's primary identity; the psychological tier reads as a secondary dot.

### 6. Org detail page — `src/app/org/[slug]/page.jsx`

Already fetches `criterion_scores`, so C11 is in hand. Add a **third score card** to the header
score row (next to Composite and Young's):

- Value: `${C11 score}/10`
- Sub-label: `Lifton · <totalizing tier>` (parallels the existing `Young's · <band>` label)
- Render nothing / `—` if no C11 score for the org.

## Out of scope (deferred — phase 2)

The dedicated **Method Comparison page** (tabbed: divergence scatter, per-org slopegraph,
pairwise correlation matrix). A mockup exists from brainstorming
(`.superpowers/brainstorm/.../compare-methods.html`). Not built in this phase.

## Testing / verification

- **Merge correctness:** orgs with a C11 score show Lifton value + tier; orgs without show `—`
  in both the column and the detail card. No crash on missing C11.
- **Filter — psychological alone:** selecting each Lifton tier yields counts matching the
  sidebar (376 / 147 / 85 on the full set).
- **Filter — AND-combined:** "High-Control" + "Non-Totalizing" returns the structural-control-
  without-totalism set (CNN / Atlantic / Pfizer-type orgs); empty-but-valid combos render an
  empty table, not an error.
- **Sort:** sorting by Lifton orders correctly; unscored rows sink to the bottom in both directions.
- **Clear All** resets `liftonTierFilter` along with the others; active-count chip reflects it.
- **Build/lint:** `next build` (or project lint) passes clean.

## Notes

- Reader-facing tier labels chosen: Psychologically Totalizing / Moderately Totalizing /
  Non-Totalizing.
- Pure front-end change; no migrations; the live DB is the source of truth and is not modified.
