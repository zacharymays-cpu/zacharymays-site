-- 0010_curator_audit_tables.sql
-- Curator decision audit trail + researcher follow-up requests for the Phase I
-- curator dashboard. curator_decisions is append-only (one row per decision).

create table if not exists curator_decisions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  curator_email text not null,
  decision text not null check (decision in ('approve','modify','reject','request_evidence')),
  notes text,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_curator_decisions_org on curator_decisions(org_id);
create index if not exists idx_curator_decisions_reviewed on curator_decisions(reviewed_at desc);

create table if not exists evidence_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  criteria_needed text[] not null default '{}',
  reasoning text,
  requested_by text not null,
  status text not null default 'pending' check (status in ('pending','completed','closed')),
  requested_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_evidence_requests_org on evidence_requests(org_id);
create index if not exists idx_evidence_requests_status on evidence_requests(status);
