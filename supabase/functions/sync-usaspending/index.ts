import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const USASPENDING_BASE_URL = "https://api.usaspending.gov";
const DEFAULT_FIELDS = [
  "Award ID",
  "Recipient Name",
  "Start Date",
  "End Date",
  "Award Amount",
  "Awarding Agency",
  "Awarding Sub Agency",
  "Award Type",
  "Funding Agency",
  "Funding Sub Agency",
  "generated_internal_id",
];

type Organization = {
  id: string;
  name: string;
  ein: string | null;
};

type RecipientCandidate = {
  recipient_name?: string;
  name?: string;
  recipient_hash?: string;
  recipient_uei?: string;
  uei?: string;
  recipient_duns?: string;
  duns?: string;
  [key: string]: unknown;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function normalizeName(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(inc|incorporated|corp|corporation|llc|ltd|limited|the)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function candidateName(candidate: RecipientCandidate) {
  return candidate.recipient_name ?? candidate.name ?? "";
}

function recipientKey(candidate: RecipientCandidate) {
  return String(
    candidate.recipient_hash ??
      candidate.recipient_uei ??
      candidate.uei ??
      candidate.recipient_duns ??
      candidate.duns ??
      normalizeName(candidateName(candidate)),
  );
}

function scoreCandidate(orgName: string, candidate: RecipientCandidate) {
  const org = normalizeName(orgName);
  const recipient = normalizeName(candidateName(candidate));

  if (!org || !recipient) return 0;
  if (org === recipient) return 0.98;
  if (recipient.includes(org) || org.includes(recipient)) return 0.82;

  const orgWords = new Set(org.split(" ").filter((word) => word.length > 2));
  const recipientWords = new Set(recipient.split(" ").filter((word) => word.length > 2));
  const overlap = [...orgWords].filter((word) => recipientWords.has(word)).length;
  const denominator = Math.max(orgWords.size, recipientWords.size, 1);

  return Math.round((overlap / denominator) * 10000) / 10000;
}

function fiscalYearFromDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getUTCMonth() >= 9 ? date.getUTCFullYear() + 1 : date.getUTCFullYear();
}

async function postUsaspending(path: string, payload: Record<string, unknown>) {
  const response = await fetch(`${USASPENDING_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`USAspending ${path} failed: ${response.status} ${text.slice(0, 500)}`);
  }

  return response.json();
}

async function findRecipients(orgName: string) {
  const payload = { search_text: orgName, limit: 10 };
  const data = await postUsaspending("/api/v2/autocomplete/recipient/", payload);
  const results = data.results ?? data.recipient_results ?? [];
  return Array.isArray(results) ? results as RecipientCandidate[] : [];
}

async function findAwards(recipientName: string, limit: number) {
  const payload = {
    filters: {
      recipient_search_text: [recipientName],
    },
    fields: DEFAULT_FIELDS,
    sort: "Award Amount",
    order: "desc",
    limit,
    page: 1,
  };
  const data = await postUsaspending("/api/v2/search/spending_by_award/", payload);
  const results = data.results ?? [];
  return Array.isArray(results) ? results : [];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Missing Supabase service role configuration" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const body = await req.json().catch(() => ({}));
  const orgLimit = Math.min(Math.max(Number(body.orgLimit ?? 10), 1), 100);
  const awardLimit = Math.min(Math.max(Number(body.awardLimit ?? 10), 1), 100);
  const minAcceptedScore = Number(body.minAcceptedScore ?? 0.95);
  const orgIds = Array.isArray(body.orgIds) ? body.orgIds.filter(Boolean) : null;

  const { data: run, error: runError } = await supabase
    .from("usaspending_sync_runs")
    .insert({
      requested_org_limit: orgLimit,
      metadata: { orgIds, awardLimit, minAcceptedScore },
    })
    .select("id")
    .single();

  if (runError) {
    return jsonResponse({ error: runError.message }, 500);
  }

  try {
    let orgQuery = supabase
      .from("organizations")
      .select("id,name,ein")
      .eq("active", true)
      .not("composite_score", "is", null)
      .order("name")
      .limit(orgLimit);

    if (orgIds?.length) {
      orgQuery = orgQuery.in("id", orgIds);
    }

    const { data: organizations, error: orgError } = await orgQuery;
    if (orgError) throw orgError;

    let matchedOrgCount = 0;
    let awardCount = 0;

    for (const org of (organizations ?? []) as Organization[]) {
      const candidates = await findRecipients(org.name);
      const scored = candidates
        .map((candidate) => ({ candidate, score: scoreCandidate(org.name, candidate) }))
        .filter(({ score }) => score >= 0.65)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      if (!scored.length) {
        await supabase.rpc("refresh_organization_usaspending_summary", {
          target_org_id: org.id,
          sync_run_id: run.id,
        });
        continue;
      }

      matchedOrgCount += 1;

      for (const { candidate, score } of scored) {
        const recipientName = candidateName(candidate);
        const matchStatus = score >= minAcceptedScore ? "accepted" : "needs_review";

        const { data: link, error: linkError } = await supabase
          .from("organization_usaspending_links")
          .upsert({
            org_id: org.id,
            recipient_name: recipientName,
            recipient_key: recipientKey(candidate),
            recipient_hash: candidate.recipient_hash ?? null,
            recipient_uei: candidate.recipient_uei ?? candidate.uei ?? null,
            recipient_duns: candidate.recipient_duns ?? candidate.duns ?? null,
            match_confidence: score,
            match_status: matchStatus,
            match_method: "usaspending_autocomplete_name",
            raw_payload: candidate,
            updated_at: new Date().toISOString(),
          }, { onConflict: "org_id,recipient_key" })
          .select("id,match_status")
          .single();

        if (linkError) throw linkError;

        const awards = await findAwards(recipientName, awardLimit);

        for (const award of awards) {
          const generatedAwardId = award.generated_internal_id ?? award["Generated Unique Award ID"] ?? null;
          const awardId = award["Award ID"] ?? null;
          const sourceAwardKey = String(generatedAwardId ?? `${recipientKey(candidate)}:${awardId ?? award["Start Date"] ?? award["Award Amount"]}`);
          const startDate = award["Start Date"] ?? null;
          const awardAmount = award["Award Amount"] ?? null;

          const { error: awardError } = await supabase
            .from("usaspending_awards")
            .upsert({
              org_id: org.id,
              organization_usaspending_link_id: link.id,
              source_award_key: sourceAwardKey,
              generated_unique_award_id: generatedAwardId,
              award_id: awardId,
              recipient_name: award["Recipient Name"] ?? recipientName,
              recipient_uei: award["Recipient UEI"] ?? candidate.recipient_uei ?? candidate.uei ?? null,
              award_type: award["Award Type"] ?? null,
              award_amount: awardAmount,
              total_obligation: awardAmount,
              start_date: startDate,
              end_date: award["End Date"] ?? null,
              awarding_agency: award["Awarding Agency"] ?? null,
              awarding_subagency: award["Awarding Sub Agency"] ?? null,
              funding_agency: award["Funding Agency"] ?? null,
              funding_subagency: award["Funding Sub Agency"] ?? null,
              fiscal_year: fiscalYearFromDate(startDate),
              raw_payload: award,
              last_seen_at: new Date().toISOString(),
            }, { onConflict: "source_award_key" });

          if (awardError) throw awardError;
          awardCount += 1;
        }
      }

      await supabase.rpc("refresh_organization_usaspending_summary", {
        target_org_id: org.id,
        sync_run_id: run.id,
      });
    }

    await supabase
      .from("usaspending_sync_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        matched_org_count: matchedOrgCount,
        award_count: awardCount,
      })
      .eq("id", run.id);

    return jsonResponse({
      runId: run.id,
      organizationsChecked: organizations?.length ?? 0,
      matchedOrgCount,
      awardCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await supabase
      .from("usaspending_sync_runs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: message,
      })
      .eq("id", run.id);

    return jsonResponse({ runId: run.id, error: message }, 500);
  }
});
