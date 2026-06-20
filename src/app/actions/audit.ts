'use server';

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

export interface AuditLog {
  id: string;
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  changed_by: string;
  changed_at: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  record_id: string;
  source_session: string;
}

export interface AuditFilter {
  tableName?: string;
  operation?: 'INSERT' | 'UPDATE' | 'DELETE';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get audit log entries filtered by table, operation, and date range.
 *
 * @param filter - Filter criteria for audit logs
 * @returns Paginated audit log entries
 */
export async function getAuditLog(filter: AuditFilter) {
  await requireAdmin();

  const limit = Math.min(filter.limit || 100, 500);
  const offset = filter.offset || 0;

  try {
    const admin = createSupabaseAdminClient();

    let query = admin.from('audit_log').select('*', { count: 'exact' });

    if (filter.tableName) {
      query = query.eq('table_name', filter.tableName);
    }

    if (filter.operation) {
      query = query.eq('operation', filter.operation);
    }

    if (filter.startDate) {
      query = query.gte('changed_at', filter.startDate);
    }

    if (filter.endDate) {
      query = query.lte('changed_at', filter.endDate);
    }

    const { data, error, count } = await query
      .order('changed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      ok: true,
      entries: data as AuditLog[],
      total: count || 0,
      limit,
      offset,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to fetch audit log.' };
  }
}

/**
 * Get detailed information about a specific audit log entry.
 *
 * @param auditId - UUID of audit log entry
 * @returns Full audit log record with change details
 */
export async function getAuditDetail(auditId: string) {
  await requireAdmin();

  if (!auditId) return { ok: false, error: 'Missing auditId.' };

  try {
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
      .from('audit_log')
      .select('*')
      .eq('id', auditId)
      .single();

    if (error) throw error;
    if (!data) return { ok: false, error: 'Audit log entry not found.' };

    return { ok: true, entry: data as AuditLog };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to fetch audit detail.' };
  }
}

/**
 * Revert a change by applying the inverse operation.
 *
 * For UPDATE operations: restores old_values
 * For INSERT operations: performs a DELETE
 * For DELETE operations: performs an INSERT
 *
 * @param auditId - UUID of audit log entry to revert
 * @returns Result of revert operation
 */
export async function revertChange(auditId: string) {
  const user = await requireAdmin();

  if (!auditId) return { ok: false, error: 'Missing auditId.' };

  try {
    const admin = createSupabaseAdminClient();

    // Fetch the audit log entry
    const { data: auditEntry, error: auditErr } = await admin
      .from('audit_log')
      .select('*')
      .eq('id', auditId)
      .single();

    if (auditErr || !auditEntry) {
      return { ok: false, error: 'Audit log entry not found.' };
    }

    const { table_name, operation, record_id, old_values, new_values } = auditEntry;

    // Only allow reverting UPDATE operations (safest path)
    if (operation !== 'UPDATE') {
      return {
        ok: false,
        error: `Cannot revert ${operation} operations (too risky). Only UPDATE operations are reversible.`,
      };
    }

    if (!old_values) {
      return { ok: false, error: 'No old values available for revert.' };
    }

    // Perform the revert (restore old_values)
    const { error: revertErr } = await admin
      .from(table_name)
      .update({ ...old_values, updated_at: new Date().toISOString() })
      .eq('id', record_id);

    if (revertErr) throw revertErr;

    // Log the revert as an audit entry
    await admin.from('audit_log').insert([{
      table_name,
      operation: 'UPDATE',
      record_id,
      changed_by: user.id,
      changed_at: new Date().toISOString(),
      old_values: new_values,
      new_values: old_values,
      source_session: 'admin-revert',
    }]);

    return {
      ok: true,
      message: `Reverted ${operation} on ${table_name}/${record_id}`,
      revertedValues: old_values,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to revert change.' };
  }
}

/**
 * Get audit summary statistics.
 *
 * @returns Statistics on audit activity
 */
export async function getAuditStats() {
  await requireAdmin();

  try {
    const admin = createSupabaseAdminClient();

    // Get total audit entries
    const { count: totalCount } = await admin
      .from('audit_log')
      .select('*', { count: 'exact', head: true });

    // Get counts by operation
    const { data: opCounts } = await admin
      .from('audit_log')
      .select('operation', { count: 'exact' });

    const operations = {
      INSERT: 0,
      UPDATE: 0,
      DELETE: 0,
    };

    for (const record of opCounts || []) {
      if (record.operation in operations) {
        operations[record.operation as keyof typeof operations]++;
      }
    }

    // Get counts by table
    const { data: tables } = await admin
      .from('audit_log')
      .select('table_name', { count: 'exact' });

    const tableMap = new Map<string, number>();
    for (const record of tables || []) {
      tableMap.set(
        record.table_name,
        (tableMap.get(record.table_name) || 0) + 1
      );
    }

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await admin
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .gte('changed_at', sevenDaysAgo);

    return {
      ok: true,
      stats: {
        totalEntries: totalCount || 0,
        recentEntries: recentCount || 0,
        operationBreakdown: operations,
        tableBreakdown: Object.fromEntries(tableMap),
      },
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to fetch audit stats.' };
  }
}
