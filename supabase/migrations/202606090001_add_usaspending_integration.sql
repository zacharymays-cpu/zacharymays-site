insert into public.data_sources (
  source_key,
  source_name,
  source_url,
  source_type,
  active,
  license_notes,
  citation
)
values (
  'usaspending_api_v2',
  'USAspending.gov API v2',
  'https://api.usaspending.gov/',
  'federal_spending_api',
  true,
  'Public federal spending data published under the DATA Act. API endpoints do not require authorization as of setup.',
  'U.S. Department of the Treasury, USAspending.gov API v2, https://api.usaspending.gov/docs/'
)
on conflict (source_key) do update set
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  source_type = excluded.source_type,
  active = excluded.active,
  license_notes = excluded.license_notes,
  citation = excluded.citation;

create table if not exists public.usaspending_sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  requested_org_limit integer,
  matched_org_count integer not null default 0,
  award_count integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.organization_usaspending_links (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  recipient_name text not null,
  recipient_key text not null,
  recipient_hash text,
  recipient_uei text,
  recipient_duns text,
  match_confidence numeric(5,4) not null default 0,
  match_status text not null default 'needs_review' check (match_status in ('accepted', 'needs_review', 'rejected')),
  match_method text not null default 'name_autocomplete',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, recipient_key)
);

create table if not exists public.usaspending_awards (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete set null,
  organization_usaspending_link_id uuid references public.organization_usaspending_links(id) on delete set null,
  source_award_key text not null,
  generated_unique_award_id text,
  award_id text,
  recipient_name text,
  recipient_uei text,
  award_type text,
  award_amount numeric,
  total_obligation numeric,
  start_date date,
  end_date date,
  awarding_agency text,
  awarding_subagency text,
  funding_agency text,
  funding_subagency text,
  fiscal_year smallint,
  raw_payload jsonb not null default '{}'::jsonb,
  source_key text not null default 'usaspending_api_v2',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (source_award_key)
);

create table if not exists public.organization_usaspending_summaries (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  accepted_link_count integer not null default 0,
  needs_review_link_count integer not null default 0,
  award_count integer not null default 0,
  total_award_amount numeric not null default 0,
  total_obligation numeric not null default 0,
  earliest_award_start date,
  latest_award_end date,
  latest_sync_run_id uuid references public.usaspending_sync_runs(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_org_usaspending_links_org_status
  on public.organization_usaspending_links (org_id, match_status);

create index if not exists idx_usaspending_awards_org
  on public.usaspending_awards (org_id);

create index if not exists idx_usaspending_awards_recipient
  on public.usaspending_awards (recipient_name);

create index if not exists idx_usaspending_awards_fiscal_year
  on public.usaspending_awards (fiscal_year);

create or replace function public.refresh_organization_usaspending_summary(
  target_org_id uuid,
  sync_run_id uuid default null
)
returns void
language sql
security definer
as $$
  insert into public.organization_usaspending_summaries (
    org_id,
    accepted_link_count,
    needs_review_link_count,
    award_count,
    total_award_amount,
    total_obligation,
    earliest_award_start,
    latest_award_end,
    latest_sync_run_id,
    updated_at
  )
  select
    target_org_id,
    count(distinct l.id) filter (where l.match_status = 'accepted')::integer,
    count(distinct l.id) filter (where l.match_status = 'needs_review')::integer,
    count(distinct a.id)::integer,
    coalesce(sum(a.award_amount), 0),
    coalesce(sum(a.total_obligation), 0),
    min(a.start_date),
    max(a.end_date),
    sync_run_id,
    now()
  from public.organization_usaspending_links l
  left join public.usaspending_awards a
    on a.organization_usaspending_link_id = l.id
  where l.org_id = target_org_id
  group by l.org_id
  on conflict (org_id) do update set
    accepted_link_count = excluded.accepted_link_count,
    needs_review_link_count = excluded.needs_review_link_count,
    award_count = excluded.award_count,
    total_award_amount = excluded.total_award_amount,
    total_obligation = excluded.total_obligation,
    earliest_award_start = excluded.earliest_award_start,
    latest_award_end = excluded.latest_award_end,
    latest_sync_run_id = excluded.latest_sync_run_id,
    updated_at = excluded.updated_at;
$$;
