'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Activity, DollarSign, ShieldCheck, Users } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuthFetch } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';

type AdminOverviewResponse = {
  summary: {
    totalUsers: number;
    owners: number;
    collaborators: number;
    automations: number;
    superAdmins: number;
    newUsers30d: number;
    pendingInvites: number;
    acceptedInvites: number;
    activeSessions: number;
    newSessions24h: number;
  };
  billing: {
    enabled: boolean;
    mrr: number | null;
    revenue30d: number | null;
    failedPayments30d: number | null;
  };
  generatedAt: string;
};

const EMPTY_OVERVIEW: AdminOverviewResponse = {
  summary: {
    totalUsers: 0,
    owners: 0,
    collaborators: 0,
    automations: 0,
    superAdmins: 0,
    newUsers30d: 0,
    pendingInvites: 0,
    acceptedInvites: 0,
    activeSessions: 0,
    newSessions24h: 0,
  },
  billing: {
    enabled: false,
    mrr: null,
    revenue30d: null,
    failedPayments30d: null,
  },
  generatedAt: '',
};

export default function AdminPage() {
  const authFetch = useAuthFetch();
  const { locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState<AdminOverviewResponse>(EMPTY_OVERVIEW);

  const copy = useMemo(() => (
    locale === 'en'
      ? {
          title: 'Super Admin Dashboard',
          subtitle: 'Platform-level control panel for governance, risk, and growth.',
          refresh: 'Refresh',
          loading: 'Loading admin metrics...',
          loadError: 'Could not load admin metrics',
          users: 'Users',
          usersHint: 'Current platform distribution',
          sessions: 'Sessions',
          sessionsHint: 'Security and access activity',
          billing: 'Billing',
          billingHint: 'Revenue module status',
          governance: 'Governance',
          governanceHint: 'Invites and role visibility',
          totalUsers: 'Total users',
          newUsers30d: 'New users (30d)',
          activeSessions: 'Active sessions',
          newSessions24h: 'New sessions (24h)',
          owners: 'Owners',
          collaborators: 'Collaborators',
          automations: 'Automation users',
          superAdmins: 'Super admins',
          pendingInvites: 'Pending invites',
          acceptedInvites: 'Accepted invites',
          roleBreakdown: 'Role breakdown',
          opsSnapshot: 'Operational snapshot',
          billingNotReady: 'Billing integration not configured yet.',
          billingEnabled: 'Billing integration detected.',
          mrr: 'MRR',
          revenue30d: 'Revenue 30d',
          failedPayments30d: 'Failed payments 30d',
          updatedAt: 'Last update',
          noData: '-',
        }
      : {
          title: 'Dashboard Super Admin',
          subtitle: 'Panel de control de plataforma para gobernanza, riesgo y crecimiento.',
          refresh: 'Actualizar',
          loading: 'Cargando metricas admin...',
          loadError: 'No pudimos cargar metricas admin',
          users: 'Usuarios',
          usersHint: 'Distribucion actual de la plataforma',
          sessions: 'Sesiones',
          sessionsHint: 'Actividad de seguridad y accesos',
          billing: 'Facturacion',
          billingHint: 'Estado del modulo de ingresos',
          governance: 'Gobernanza',
          governanceHint: 'Visibilidad de invitaciones y roles',
          totalUsers: 'Usuarios totales',
          newUsers30d: 'Usuarios nuevos (30d)',
          activeSessions: 'Sesiones activas',
          newSessions24h: 'Sesiones nuevas (24h)',
          owners: 'Owners',
          collaborators: 'Colaboradores',
          automations: 'Usuarios de automatizacion',
          superAdmins: 'Super admins',
          pendingInvites: 'Invitaciones pendientes',
          acceptedInvites: 'Invitaciones aceptadas',
          roleBreakdown: 'Distribucion por rol',
          opsSnapshot: 'Snapshot operativo',
          billingNotReady: 'La integracion de facturacion todavia no esta configurada.',
          billingEnabled: 'Integracion de facturacion detectada.',
          mrr: 'MRR',
          revenue30d: 'Recaudacion 30d',
          failedPayments30d: 'Pagos fallidos 30d',
          updatedAt: 'Ultima actualizacion',
          noData: '-',
        }
  ), [locale]);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authFetch('/api/admin/overview');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || copy.loadError);
      }
      setOverview(data as AdminOverviewResponse);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : copy.loadError);
    } finally {
      setLoading(false);
    }
  }, [authFetch, copy.loadError]);

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <div className="min-h-screen flex flex-col bg-black text-slate-100">
        <Header />
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <section className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-yellow-400/80">Super Admin</p>
                  <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-white">{copy.title}</h1>
                  <p className="mt-2 text-sm text-slate-400 max-w-3xl">{copy.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { void fetchOverview(); }}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-700 px-4 py-2 text-sm text-slate-200 hover:border-yellow-400/50 hover:text-yellow-300"
                >
                  {copy.refresh}
                </button>
              </div>
            </section>

            {loading && (
              <section className="rounded-2xl border border-gray-800 bg-gray-950/70 p-6 text-sm text-slate-300">
                {copy.loading}
              </section>
            )}

            {error && !loading && (
              <section className="rounded-2xl border border-red-500/40 bg-red-950/20 p-4 text-sm text-red-300">
                {error}
              </section>
            )}

            {!loading && !error && (
              <>
                <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <MetricCard icon={<Users className="h-5 w-5 text-cyan-300" />} title={copy.users} hint={copy.usersHint} value={String(overview.summary.totalUsers)} meta={`${copy.newUsers30d}: ${overview.summary.newUsers30d}`} />
                  <MetricCard icon={<Activity className="h-5 w-5 text-emerald-300" />} title={copy.sessions} hint={copy.sessionsHint} value={String(overview.summary.activeSessions)} meta={`${copy.newSessions24h}: ${overview.summary.newSessions24h}`} />
                  <MetricCard
                    icon={<DollarSign className="h-5 w-5 text-yellow-300" />}
                    title={copy.billing}
                    hint={copy.billingHint}
                    value={overview.billing.enabled ? copy.billingEnabled : copy.billingNotReady}
                    meta={`${copy.mrr}: ${formatMoney(overview.billing.mrr, copy.noData)}`}
                  />
                  <MetricCard icon={<ShieldCheck className="h-5 w-5 text-violet-300" />} title={copy.governance} hint={copy.governanceHint} value={`${copy.pendingInvites}: ${overview.summary.pendingInvites}`} meta={`${copy.acceptedInvites}: ${overview.summary.acceptedInvites}`} />
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                    <h2 className="text-lg font-semibold text-white">{copy.roleBreakdown}</h2>
                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full text-sm text-left">
                        <tbody className="divide-y divide-gray-800">
                          <StatRow label={copy.superAdmins} value={overview.summary.superAdmins} />
                          <StatRow label={copy.owners} value={overview.summary.owners} />
                          <StatRow label={copy.collaborators} value={overview.summary.collaborators} />
                          <StatRow label={copy.automations} value={overview.summary.automations} />
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                    <h2 className="text-lg font-semibold text-white">{copy.opsSnapshot}</h2>
                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full text-sm text-left">
                        <tbody className="divide-y divide-gray-800">
                          <StatRow label={copy.totalUsers} value={overview.summary.totalUsers} />
                          <StatRow label={copy.newUsers30d} value={overview.summary.newUsers30d} />
                          <StatRow label={copy.pendingInvites} value={overview.summary.pendingInvites} />
                          <StatRow label={copy.acceptedInvites} value={overview.summary.acceptedInvites} />
                          <StatRow label={copy.revenue30d} value={formatMoney(overview.billing.revenue30d, copy.noData)} />
                          <StatRow label={copy.failedPayments30d} value={overview.billing.failedPayments30d ?? copy.noData} />
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-slate-500"
                >
                  {copy.updatedAt}: {overview.generatedAt ? new Date(overview.generatedAt).toLocaleString(locale === 'en' ? 'en-US' : 'es-AR') : copy.noData}
                </motion.p>
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

function MetricCard({
  icon,
  title,
  hint,
  value,
  meta,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  value: string;
  meta: string;
}) {
  return (
    <article className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
      <div className="flex items-center gap-2 text-slate-300">
        {icon}
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">{title}</h2>
      </div>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
      <p className="mt-4 text-xl sm:text-2xl font-semibold text-white break-words">{value}</p>
      <p className="mt-1 text-xs text-slate-400 break-words">{meta}</p>
    </article>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <tr>
      <td className="py-2 pr-3 text-slate-400">{label}</td>
      <td className="py-2 text-right text-white font-medium">{value}</td>
    </tr>
  );
}

function formatMoney(value: number | null, fallback: string): string {
  if (value === null) return fallback;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}
