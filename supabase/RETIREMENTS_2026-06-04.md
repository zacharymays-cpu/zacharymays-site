# Organization duplicate retirements — applied 2026-06-04

Record of the duplicate cleanup applied **directly to the production database**
(no migration file — do not re-apply). Source analysis: `duplicate_audit_report.csv`
in this directory.

For each duplicate pair the **record_1** entry from the audit report was kept and
the other record was retired with `active = false, scoring_status = 'ARCHIVED'`.
No rows were deleted.

| Kept (active) | Retired (archived) |
|---|---|
| HWGH-v1-A-0071 Council for National Policy (CNP) · 70 | HWGH-v1-A-0510 Council for National Policy (CNP) · 76 |
| HWGH-v1-A-0302 ACLU (American Civil Liberties Union) · 24 | HWGH-v1-A-0502 American Civil Liberties Union (ACLU) · 3 |
| HWGH-v1-A-0281 Satanic Temple · 30 | HWGH-v1-A-0501 The Satanic Temple · 24 |
| HWGH-v1-A-0498 United Church of Christ · 20 | HWGH-v1-A-0272 United Church of Christ (UCC) · 26 |
| HWGH-v1-A-0282 HRC (Human Rights Campaign) · 25 | HWGH-v1-A-0505 Human Rights Campaign · 15 |
| HWGH-v1-A-0279 Unitarian Universalist Assoc. (UUA) · 26 | HWGH-v1-A-0497 Unitarian Universalist Association · 9 |
| HWGH-v1-A-0153 UnitedHealth · 49 | HWGH-v1-A-0476 UnitedHealth Group · 60 |
| HWGH-v1-A-0494 Legionaries of Christ · 93 | HWGH-v1-A-0580 Legion of Christ / Regnum Christi · 93 |

Confirmed **intentionally distinct** (not retired): WWASP / WWASPS Network,
KIPP / KIPP Charter School Network, Joel Osteen–Lakewood / Lakewood Church.

## Known follow-ups (not yet applied)

1. **Stranded EIN** — the 2026-06-04 financial-records batch put EIN `042103733`
   on the retired UU record (HWGH-v1-A-0497); the kept record (HWGH-v1-A-0279)
   has no EIN. Copy it over.
2. **Orphaned ACLU Foundation EIN** — retired HWGH-v1-A-0502 carries EIN
   `810431527` (the ACLU Foundation 501c3), distinct from the kept record's
   `136213516` (the 501c4). Preserve if both entities should be tracked.
3. **Score reconciliation** — kept records retain their own scores; the larger
   gaps (ACLU 24 vs 3, UUA 26 vs 9, UnitedHealth 49 vs 60) were not reconciled.

## Rollback

```sql
update organizations
set active = true, scoring_status = 'ACCEPTED'
where record_id in (
  'HWGH-v1-A-0510','HWGH-v1-A-0502','HWGH-v1-A-0501','HWGH-v1-A-0272',
  'HWGH-v1-A-0505','HWGH-v1-A-0497','HWGH-v1-A-0476','HWGH-v1-A-0580'
);
```
