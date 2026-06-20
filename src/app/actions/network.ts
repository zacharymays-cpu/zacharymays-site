'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseAdminClient } from '../../lib/supabase/admin';
import { createSupabaseServerClient } from '../../lib/supabase/server';

function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const allow = adminEmails();
  const email = (user.email || '').toLowerCase();
  if (allow.length === 0) throw new Error('ADMIN_EMAILS is not configured.');
  if (!allow.includes(email)) throw new Error(`${email} is not an approved analyst.`);
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') throw new Error('Two-factor step-up required.');
  return user;
}

export interface NetworkNode {
  id: string;
  label: string;
  degree: number;
  roles?: string[];
}

export interface NetworkLink {
  source: string;
  target: string;
  confidence: number;
  location: string;
  evidence: number;
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  links: NetworkLink[];
  stats: {
    totalPersons: number;
    totalConnections: number;
    avgConfidence: number;
    maxDegree: number;
  };
}

/**
 * Get network graph data for an organization.
 *
 * Queries network_connections materialized view to identify co-located
 * persons and their evidence-based relationships.
 *
 * @param orgId - UUID of organization to analyze
 * @returns Network graph with nodes, links, and statistics
 */
export async function getNetworkGraph(orgId: string): Promise<NetworkGraph | { error: string }> {
  if (!orgId) return { error: 'Missing orgId.' };

  try {
    const admin = createSupabaseAdminClient();

    // Query network connections for the organization
    const { data: connections, error: connectionsErr } = await admin
      .from('network_connections')
      .select('*')
      .eq('org_id', orgId);

    if (connectionsErr) throw connectionsErr;

    if (!connections || connections.length === 0) {
      return {
        nodes: [],
        links: [],
        stats: {
          totalPersons: 0,
          totalConnections: 0,
          avgConfidence: 0,
          maxDegree: 0,
        },
      };
    }

    // Extract unique person IDs
    const personIds = new Set<string>();
    let totalConfidence = 0;

    for (const conn of connections) {
      if (conn.person_a_id) personIds.add(conn.person_a_id);
      if (conn.person_b_id) personIds.add(conn.person_b_id);
      totalConfidence += conn.confidence_score || 0;
    }

    // Query persons for metadata
    const { data: persons, error: personsErr } = await admin
      .from('persons')
      .select('id, canonical_name, roles, network_degree')
      .in('id', Array.from(personIds))
      .eq('org_id', orgId);

    if (personsErr) throw personsErr;

    const personMap = new Map(
      (persons || []).map((p) => [p.id, p])
    );

    // Build nodes
    const nodes: NetworkNode[] = Array.from(personIds).map((id) => {
      const person = personMap.get(id);
      return {
        id,
        label: person?.canonical_name || 'Unknown',
        degree: person?.network_degree || 0,
        roles: person?.roles,
      };
    });

    // Build links
    const links: NetworkLink[] = connections.map((conn) => ({
      source: conn.person_a_id,
      target: conn.person_b_id,
      confidence: conn.confidence_score || 0,
      location: conn.location_name || 'Unknown',
      evidence: conn.evidence_count || 0,
    }));

    // Calculate stats
    const maxDegree = Math.max(...nodes.map((n) => n.degree), 0);
    const avgConfidence =
      connections.length > 0
        ? Math.round((totalConfidence / connections.length) * 1000) / 1000
        : 0;

    return {
      nodes,
      links,
      stats: {
        totalPersons: nodes.length,
        totalConnections: connections.length,
        avgConfidence,
        maxDegree,
      },
    };
  } catch (err: any) {
    return { error: err?.message || 'Failed to fetch network graph.' };
  }
}

/**
 * Detect clusters in the network using centrality metrics.
 *
 * @param orgId - UUID of organization
 * @returns Array of clusters with member IDs and centrality scores
 */
export async function detectClusters(orgId: string) {
  if (!orgId) return { ok: false, error: 'Missing orgId.' };

  try {
    const admin = createSupabaseAdminClient();

    // Query network with centrality metrics
    const { data: connections, error } = await admin
      .from('network_connections')
      .select('*')
      .eq('org_id', orgId);

    if (error) throw error;

    if (!connections || connections.length === 0) {
      return { ok: true, clusters: [] };
    }

    // Build adjacency structure for clustering
    const adjacency = new Map<string, Set<string>>();
    for (const conn of connections) {
      if (!adjacency.has(conn.person_a_id)) {
        adjacency.set(conn.person_a_id, new Set());
      }
      if (!adjacency.has(conn.person_b_id)) {
        adjacency.set(conn.person_b_id, new Set());
      }
      adjacency.get(conn.person_a_id)!.add(conn.person_b_id);
      adjacency.get(conn.person_b_id)!.add(conn.person_a_id);
    }

    // Simple clustering: find connected components
    const visited = new Set<string>();
    const clusters: Array<{ members: string[]; size: number; density: number }> = [];

    for (const [nodeId, neighbors] of adjacency) {
      if (visited.has(nodeId)) continue;

      const cluster = new Set<string>();
      const queue = [nodeId];
      visited.add(nodeId);
      cluster.add(nodeId);

      while (queue.length > 0) {
        const current = queue.shift()!;
        for (const neighbor of adjacency.get(current) || []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            cluster.add(neighbor);
            queue.push(neighbor);
          }
        }
      }

      const members = Array.from(cluster);
      const clusterConnections = connections.filter(
        (c) => members.includes(c.person_a_id) && members.includes(c.person_b_id)
      );
      const maxPossible = (members.length * (members.length - 1)) / 2;
      const density =
        maxPossible > 0
          ? Math.round((clusterConnections.length / maxPossible) * 1000) / 1000
          : 0;

      clusters.push({
        members,
        size: members.length,
        density,
      });
    }

    return { ok: true, clusters: clusters.sort((a, b) => b.size - a.size) };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to detect clusters.' };
  }
}

/**
 * Get location hubs (most connected locations) in an organization's network.
 *
 * @param orgId - UUID of organization
 * @returns Array of location hubs ranked by connection count
 */
export async function getLocationHubs(orgId: string) {
  if (!orgId) return { ok: false, error: 'Missing orgId.' };

  try {
    const admin = createSupabaseAdminClient();

    const { data: connections, error } = await admin
      .from('network_connections')
      .select('location_name, evidence_count')
      .eq('org_id', orgId);

    if (error) throw error;

    if (!connections || connections.length === 0) {
      return { ok: true, hubs: [] };
    }

    // Aggregate by location
    const locationMap = new Map<
      string,
      { location: string; connectionCount: number; evidenceTotal: number }
    >();

    for (const conn of connections) {
      const loc = conn.location_name || 'Unknown';
      if (!locationMap.has(loc)) {
        locationMap.set(loc, {
          location: loc,
          connectionCount: 0,
          evidenceTotal: 0,
        });
      }
      const entry = locationMap.get(loc)!;
      entry.connectionCount += 1;
      entry.evidenceTotal += conn.evidence_count || 0;
    }

    const hubs = Array.from(locationMap.values()).sort(
      (a, b) => b.connectionCount - a.connectionCount
    );

    return { ok: true, hubs };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to fetch location hubs.' };
  }
}

/**
 * Refresh network statistics and materialized views.
 *
 * Called by Vercel Cron to update derived network data (nightly).
 *
 * @param orgId - UUID of organization
 * @returns Summary of refresh operation
 */
export async function refreshNetworkStats(orgId: string) {
  await requireAdmin();

  if (!orgId) return { ok: false, error: 'Missing orgId.' };

  try {
    const admin = createSupabaseAdminClient();

    // Refresh network_connections view
    const { error: viewErr } = await admin.rpc('refresh_network_connections', {
      p_org_id: orgId,
    });

    if (viewErr) throw viewErr;

    // Recalculate person network degrees
    const { data: persons, error: personsErr } = await admin
      .from('persons')
      .select('id')
      .eq('org_id', orgId);

    if (personsErr) throw personsErr;

    for (const person of persons || []) {
      const { data: connections, error: connErr } = await admin
        .from('network_connections')
        .select('*')
        .or(`person_a_id.eq.${person.id},person_b_id.eq.${person.id}`)
        .eq('org_id', orgId);

      if (connErr) throw connErr;

      const degree = connections?.length || 0;
      await admin
        .from('persons')
        .update({ network_degree: degree, updated_at: new Date().toISOString() })
        .eq('id', person.id);
    }

    revalidatePath('/research/children-of-god-network');
    revalidatePath('/research/twelve-tribes-network');

    return {
      ok: true,
      message: `Network stats refreshed for org ${orgId}`,
      personsUpdated: persons?.length || 0,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to refresh network stats.' };
  }
}
