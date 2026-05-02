import { NextResponse } from 'next/server';
import { withSecurityHeaders } from '@/middleware/auth';
import { requireRoles } from '@/middleware/rbac';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';

export const GET = requireRoles(['super_admin'])(rateLimit(API_RATE_LIMIT)(async () => {
  try {
    const summaryResult = await query(
      `SELECT
        (SELECT COUNT(*)::int FROM app_users) AS total_users,
        (SELECT COUNT(*)::int FROM app_users WHERE role = 'owner') AS owners,
        (SELECT COUNT(*)::int FROM app_users WHERE role = 'collaborator') AS collaborators,
        (SELECT COUNT(*)::int FROM app_users WHERE role = 'automation') AS automations,
        (SELECT COUNT(*)::int FROM app_users WHERE role = 'super_admin') AS super_admins,
        (SELECT COUNT(*)::int FROM app_users WHERE created_at >= NOW() - INTERVAL '30 days') AS new_users_30d,
        (SELECT COUNT(*)::int FROM collaboration_invites WHERE status = 'pending' AND expires_at > NOW()) AS pending_invites,
        (SELECT COUNT(*)::int FROM collaboration_invites WHERE status = 'accepted') AS accepted_invites,
        (SELECT COUNT(*)::int FROM auth_sessions WHERE revoked_at IS NULL AND expires_at > NOW()) AS active_sessions,
        (SELECT COUNT(*)::int FROM auth_sessions WHERE created_at >= NOW() - INTERVAL '24 hours') AS new_sessions_24h`
    );

    const billingProbe = await query(
      `SELECT
        to_regclass('public.subscriptions') IS NOT NULL AS has_subscriptions,
        to_regclass('public.invoices') IS NOT NULL AS has_invoices`
    );

    const summary = summaryResult.rows[0] ?? {};
    const billing = billingProbe.rows[0] ?? {};
    const billingEnabled = Boolean(billing.has_subscriptions || billing.has_invoices);

    return withSecurityHeaders(NextResponse.json({
      summary: {
        totalUsers: summary.total_users ?? 0,
        owners: summary.owners ?? 0,
        collaborators: summary.collaborators ?? 0,
        automations: summary.automations ?? 0,
        superAdmins: summary.super_admins ?? 0,
        newUsers30d: summary.new_users_30d ?? 0,
        pendingInvites: summary.pending_invites ?? 0,
        acceptedInvites: summary.accepted_invites ?? 0,
        activeSessions: summary.active_sessions ?? 0,
        newSessions24h: summary.new_sessions_24h ?? 0,
      },
      billing: {
        enabled: billingEnabled,
        mrr: null,
        revenue30d: null,
        failedPayments30d: null,
      },
      generatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    logger.error('admin.overview.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'No pudimos obtener el resumen admin' }, { status: 500 }));
  }
}));
