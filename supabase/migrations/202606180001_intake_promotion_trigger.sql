-- 202606180001_intake_promotion_trigger.sql
-- OCI intake Layer 1: auto-promote APPROVED proposals to organization rows.
--
-- State-machine decision (documented):
--   The BEFORE trigger sets org_id but leaves status = APPROVED.
--   The scorer (Layer 2) then advances the proposal to PIPELINE_RUNNING.
--   That fires the existing AFTER trigger (update_org_intake_status), which
--   transitions org.scoring_status PENDING → IN_REVIEW using OLD.status='APPROVED'
--   as the guard. This ordering is required; setting PIPELINE_RUNNING inside the
--   BEFORE trigger would break that guard (OLD would be the pre-approval state).
--
-- INSERT branch (admin bypass):
--   trg_promote_approved_intake_insert fires on BEFORE INSERT so proposals created
--   already-APPROVED (e.g. intake_bypass_reason path) also get an org row.
--
-- Test-row guard:
--   Names matching ^\s*test\s+ (case-insensitive) are skipped — no org is created.
--
-- Backfill (applied alongside this migration; no further action needed):
--   e019197a (museum of modern art) → COMPLETED; org 48faaa27 created as
--     "Museum of Modern Art (MoMA)", scoring_status = SOURCES_INSUFFICIENT.
--   0c435319 (Test Org Intake)      → REJECTED; no org created.

CREATE OR REPLACE FUNCTION public.promote_approved_intake()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_org_id   uuid;
  v_existing uuid;
BEGIN
  IF NEW.name ~* '^\s*test\s+' THEN
    RETURN NEW;
  END IF;

  IF NEW.org_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_existing
  FROM public.organizations
  WHERE lower(btrim(name)) = lower(btrim(NEW.name))
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    v_org_id := v_existing;
  ELSE
    INSERT INTO public.organizations
      (record_id, name, category, scoring_status, active,
       intake_proposal_id, methodology_version)
    VALUES
      ('ORG-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
       btrim(NEW.name),
       NEW.category,
       'PENDING',
       true,
       NEW.id,
       'V5.2')
    RETURNING id INTO v_org_id;
  END IF;

  NEW.org_id     := v_org_id;
  NEW.updated_at := now();

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_promote_approved_intake ON public.org_intake_proposals;
CREATE TRIGGER trg_promote_approved_intake
  BEFORE UPDATE OF status ON public.org_intake_proposals
  FOR EACH ROW
  WHEN (NEW.status = 'APPROVED' AND NEW.org_id IS NULL)
  EXECUTE FUNCTION public.promote_approved_intake();

DROP TRIGGER IF EXISTS trg_promote_approved_intake_insert ON public.org_intake_proposals;
CREATE TRIGGER trg_promote_approved_intake_insert
  BEFORE INSERT ON public.org_intake_proposals
  FOR EACH ROW
  WHEN (NEW.status = 'APPROVED' AND NEW.org_id IS NULL)
  EXECUTE FUNCTION public.promote_approved_intake();
