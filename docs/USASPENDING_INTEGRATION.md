# USAspending Integration

The project has a Supabase-backed USAspending.gov API v2 integration for matching scored organizations to federal award recipients and storing award summaries.

## Database Objects

- `data_sources` row: `usaspending_api_v2`
- `organization_usaspending_links`: recipient candidates matched to organizations
- `usaspending_awards`: award rows returned by USAspending
- `organization_usaspending_summaries`: per-organization rollups
- `usaspending_sync_runs`: sync history and failure details

## Edge Function

Function: `sync-usaspending`

The function requires JWT verification. Invoke it with a Supabase service role or another authorized server-side token.

Example body:

```json
{
  "orgLimit": 10,
  "awardLimit": 10,
  "minAcceptedScore": 0.95
}
```

Optional `orgIds` can limit the sync to known organization UUIDs:

```json
{
  "orgIds": ["00000000-0000-0000-0000-000000000000"],
  "awardLimit": 5
}
```

Matches under `minAcceptedScore` are stored as `needs_review`. Public UI should only surface award totals from reviewed or accepted links.

## API References

- USAspending API base: `https://api.usaspending.gov/`
- Endpoint docs: `https://api.usaspending.gov/docs/endpoints`
- Recipient autocomplete: `/api/v2/autocomplete/recipient/`
- Award search: `/api/v2/search/spending_by_award/`
