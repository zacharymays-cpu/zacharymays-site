# Political-Axis Correction — Ethnonationalist Orgs (2026-06-18)

## Summary

Three white-nationalist / neo-Nazi organizations were mis-placed in **left**
political quadrants because `political_scores.political_quadrant` is derived from
the sign of `economic_axis`, and the jury had scored their economic axis negative.
Their economic-axis scores were corrected to align with the project's own Nazi-era
regime anchor, moving all three to **Authoritarian Right**. Authority-axis scores
were left unchanged.

Scope: `political_scores` rows for 3 organizations. No other tracks (composite,
Young's, HC, Totalism) were touched.

## Root cause

- `political_quadrant` is a mechanical function of `sign(economic_axis)` ×
  `sign(authority_axis)`.
- For the affected orgs the multi-model jury read antisemitic "anti-finance"
  rhetoric and racial collectivism as **economic-left scapegoating** and assigned a
  negative economic axis (e.g. National Alliance −4.5). That placed structurally
  fascist groups in *Authoritarian Left*.
- This contradicted the project's own anchor: **Nazi Germany (1933–45)** — mapped
  via Hitler Youth at economic **+2.0** — and the **National Socialist Movement** at
  **+4.5**, whose note already reads "economically positioned toward
  corporatist/fascist right." Same ideology, opposite sign. The defect was therefore
  an **internal-consistency** failure, not a contested external reclassification.

## Rationale

On this two-axis model, statism is carried by the **authority axis** (Nazi Germany
= +5). With statism accounted for there, the economic axis measures the
redistribution / class dimension, on which fascism scores right (private ownership
retained, organized labor and the Marxist left destroyed, alliance with industrial
capital). Aligning the affected orgs with the existing anchor restores consistency.

## Changes applied

| Org | Economic (old → new) | Authority | Quadrant (old → new) |
|-----|----------------------|-----------|----------------------|
| National Alliance   | −4.5 → **+4.5** | +4.5 (unchanged) | Authoritarian Left → **Authoritarian Right** |
| White Revolution    | −4.5 → **+4.5** | +4.5 (unchanged) | Authoritarian Left → **Authoritarian Right** |
| Goyim Defense League| −2.5 → **+3.5** | +4.5 (unchanged) | Authoritarian Left → **Authoritarian Right** |

National Alliance (Pierce / *Turner Diaries* vanguard) and White Revolution (a
National Alliance splinter) are direct structural twins of NSM and take NSM's +4.5.
GDL is a decentralized hate network with no coherent economic program and is set
below NSM at +3.5.

Each affected `scoring_notes` field has an inline `[CORRECTION 2026-06-18: ...]`
annotation recording the old value, new value, and basis, for auditability.

| Org | score_id |
|-----|----------|
| National Alliance    | `af6248b2-140d-4df8-a1bd-519df5c6894f` |
| White Revolution     | `f08ac757-c451-45b2-9915-bc4feafaa316` |
| Goyim Defense League | `1d5a4a90-420b-4a9d-b6ad-53fdac4902c7` |

Supabase project: `shgdrkrqjnwtlyxcdayp`, table `political_scores`.

## Out of scope / open item

Ten further ethnonationalist orgs sit at economic-**neutral** (0.0–0.5) rather than
in a left quadrant — e.g. Church of the National Knights of the KKK (0.0), plus
Active Clubs, Brotherhood of Klans, Creativity Movement, EURO, Imperial Klans,
Pioneer Fund, Stormfront, The Social Contract Press, American Freedom Party (all
0.5). They were **not** in scope for this correction (not mis-filed as left) but are
inconsistent with peers scored +4.5–5.0 (Aryan Nations, NSM, KKK, Aryan
Brotherhood). Whether that reflects genuine economic incoherence or under-scoring is
deferred to a per-org review.

## Reversibility

Prior values are preserved in this record and in each `scoring_notes` annotation.
No `score_history` rows were written (formal change-log backfill deferred).

---
*Recorded 2026-06-18. Applies to Supabase project `shgdrkrqjnwtlyxcdayp`,
table `political_scores`.*
