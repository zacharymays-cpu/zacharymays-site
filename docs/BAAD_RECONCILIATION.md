# BAAD Reconciliation Status

> ## ⚠️ SUPERSEDED — BAAD data has been divested
>
> The BAAD (Big Allied and Dangerous) dataset was **removed** from the database
> in the BAAD divestment. The ~3,555 `organization_attributes` rows described
> below as "retained" / "available for future use" **were DELETED** and are no
> longer present. This document is preserved for historical context only; the
> "Data Disposition" and "Future Possibilities" sections below reflect a
> pre-divestment plan that no longer holds.

**Date:** June 7, 2026  
**Status:** ⚠️ Superseded — BAAD data divested (see banner above). Original reconciliation: complete (out-of-scope determination)

## Summary

All 395 BAAD (Big Allied and Dangerous) organizations have been evaluated for matching against the canonical `organizations` table. **Reconciliation result: 0/395 matched.**

## Rationale

The BAAD dataset and the Cultiness Spectrum dataset have fundamentally different scopes:

### BAAD Dataset
- **Focus:** International armed groups, militant cells, terrorist organizations
- **Examples:** Animal Liberation Front, Army of God, Kosovo Liberation Army, anarchist cells, revolutionary organizations
- **Geographic scope:** Global
- **Time frame:** Historical and contemporary

### Cultiness Spectrum Dataset
- **Focus:** American institutional analysis of cult-like dynamics
- **Categories:** Corporations (111), Political organizations (99), Religious groups (79), Think tanks (42), Academic (33), etc. _(Note: these hardcoded counts predate the 27-org archival and are stale; do not treat them as current.)_
- **Geographic scope:** Primarily United States
- **Institutional context:** Mainstream American institutions

## Conclusion

**Scope mismatch means minimal viable overlap.** BAAD covers armed/militant organizations; Cultiness covers mainstream American institutions with cult-like dynamics. The two datasets serve different research purposes and audiences.

## Data Disposition

**External Entity IDs:**
- All 395 BAAD organization rows in `external_entity_ids` marked as:
  - `match_status = 'no_match'`
  - `match_confidence = 0`
  - `internal_entity_id = NULL` (unchanged)

**Organization Attributes:**
- ~~All 9 × 395 = 3,555 attributes remain in `organization_attributes`~~
  **UPDATE (superseded):** these ~3,555 rows were **DELETED** in the BAAD
  divestment — they no longer remain in `organization_attributes`.
- Not surfaced on org detail pages (no matching canonical org to attach to)
- ~~**Available for future use:** If BAAD orgs are ever added to canonical table as a new research area, attributes can be linked at that time~~
  No longer applicable: the attribute rows have been removed. Re-adding BAAD as
  a research area would require re-ingesting the source data.

## Future Possibilities

1. **Research-only interface:** Build a separate "External Datasets" view for researchers to query BAAD data directly
2. **Add BAAD orgs to canonical:** If scope expands to international militant/armed groups, re-reconcile at that time
3. **Keep as audit trail:** Raw BAAD data preserved in staging tables and `raw_payload` JSONB for compliance/reference

## Files Affected

- `external_entity_ids`: 395 rows updated (match_status='no_match')
- No changes to org detail pages (already handle NULL `internal_entity_id`)
- ~~No changes to `organization_attributes` (attributes remain in DB)~~
  **Superseded:** the ~3,555 BAAD `organization_attributes` rows were later
  DELETED in the BAAD divestment (see banner at top).
