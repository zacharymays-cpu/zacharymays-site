# Organization Data Licensing — Visualization & Enhancement Limits

## Summary

The Cultiness Spectrum research uses restricted academic datasets (GTD, PIRUS, BAAD, SoNAR) that **cannot be redistributed in raw form**. This site visualizes **derived insights only** — organization scores, enriched metadata, and aggregated statistics.

## What Data Is Safe to Visualize

✅ **Safe for public display on zacharymays-site:**

- **Organization scores & cultiness tiers** (Tier 1-5 classification)
- **Organization summary text** (enriched descriptions, sourced from public data)
- **Geographic location** (HQ city/state, facility locations from enriched sources)
- **Financial data** (revenue from SEC EDGAR, Wikidata, USAspending — all public sources)
- **Founding year** (from public records, Wikipedia, news sources)
- **Member count** (where enriched/verified via public sources)
- **Related organizations** (parent/splinter relationships from public sources)
- **Evidence summary count** ("45 evidence sources found" aggregates OK)
- **Public news/academic citations** (links to external sources)

## What Data Is Restricted

❌ **NOT safe to visualize — kept private in backend:**

- Raw records from Global Terrorism Database (GTD)
- PIRUS individual profiles (radicalization pathway data)
- BAAD database dumps (extremism group internal data)
- SoNAR original taxonomy or raw records
- Any unmodified licensed dataset columns
- Full audit trails showing licensed-source dependency

## How This Affects Visualizations

### Map Visualization
✅ **OK:** Show organization HQ locations and facilities  
❌ **NOT OK:** Map GTD events or PIRUS geographic patterns without aggregation  
✅ **OK:** Aggregate "X organizations in region Y" (derived statistic)

### Timeline/History
✅ **OK:** Show founding year, major events from news sources  
❌ **NOT OK:** Publish GTD event timeline for specific org  
✅ **OK:** "Significant incidents: [linked to public news sources]"

### Evidence Dashboard
✅ **OK:** Show count & sources (news, academic, government)  
❌ **NOT OK:** Highlight "from GTD database" as primary evidence  
✅ **OK:** Cite news articles that reference GTD data

### Org Comparison
✅ **OK:** Compare scores, founding years, locations, revenue  
❌ **NOT OK:** Compare PIRUS radicalization profiles  
✅ **OK:** Compare membership counts (enriched data only)

### Export/Download Feature
✅ **OK:** Export derived data (scores, enriched metadata)  
❌ **NOT OK:** Export raw GTD/PIRUS records  
✅ **OK:** Export with disclaimer: "Derived from GTD/PIRUS — see cultiness-spectrum documentation"

## Implementation Guide

### API Responses (Backend)

When serving org data to the frontend, filter out licensed-source raw data:

```python
# ✅ Safe response structure
response = {
    "name": "Earth Liberation Front (ELF)",
    "composite_tier": "HIGH",
    "summary": "Environmental extremist group founded 1992...",
    "revenue": None,
    "hq_location": {"city": "Multiple", "state": "US"},
    "evidence_count": 45,
    "public_sources": [
        {"type": "news", "url": "https://..."},
        {"type": "academic", "url": "https://..."}
    ],
    # ❌ Never include:
    # "gtd_events": [...],
    # "pirus_profile": {...},
    # "baad_record": {...}
}
```

### Frontend Component Tags

Add licensing notices in visualizations:

```jsx
// ✅ Org Card
<OrgCard>
  <h2>{org.name}</h2>
  <Tier>{org.composite_tier}</Tier>
  <Summary>{org.summary}</Summary>
  <Location>{org.hq_location}</Location>
  <Disclaimer>
    Cultiness classification based on public evidence sources.
    See <a href="/licensing">licensing info</a>.
  </Disclaimer>
</OrgCard>
```

### Public Documentation

When publishing research or analysis based on this data:

1. **Cite sources properly**
   - ✅ "Based on public sources including news archives, SEC filings, academic research"
   - ❌ "Sourced from Global Terrorism Database raw extract"

2. **Link to originals**
   - ✅ Direct users to official GTD, PIRUS, BAAD for academic access
   - ❌ Include raw/modified excerpts from those databases

3. **Note data sources**
   - ✅ "This organization appears in the Global Terrorism Database [link to GTD]"
   - ❌ "Here are the 45 GTD records for this organization [raw data dump]"

4. **Aggregate only**
   - ✅ "23 organizations in our research dataset appear in GTD"
   - ❌ "Individual GTD records: [list of raw records]"

## User Expectations

**What users will see on zacharymays-site:**
- Organization profiles with scores, locations, enriched summaries
- Maps and timelines based on public sources
- Evidence dashboards with citation links
- Comparisons and rankings by cultiness tier

**What users will NOT see:**
- Raw GTD database records
- Detailed PIRUS radicalization profiles
- Unmodified academic dataset dumps
- Internal research artifacts

**If users want academic access:**
- Direct them to official GTD (https://www.start.umd.edu/gtd/)
- Link to START Center (https://www.start.umd.edu/)
- Explain that some data requires institutional access

## Compliance Checklist

Before deploying new visualizations:

- [ ] No raw GTD/PIRUS/BAAD/SoNAR records displayed
- [ ] Aggregate statistics only (counts, percentages)
- [ ] License disclaimers present (footer/modal)
- [ ] Links to original data sources included
- [ ] Derived data only (scores, enriched metadata)
- [ ] Evidence sources are public URLs, not raw database exports
- [ ] No unmodified academic dataset columns
- [ ] Geographic/temporal data appropriately aggregated

## Questions?

See cultiness-spectrum repo: `/LICENSING_COMPLIANCE.md`

**Remember:** We can share insights and visualizations freely. We cannot share raw licensed data. The distinction is **derivative vs. raw**.
