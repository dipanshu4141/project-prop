'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface HealthData {
  signups: { today: number; last7d: number; last30d: number };
  workspaces: { total: number; activeLast7d: number };
  activity30d: {
    messagesIngested: number;
    listingsCreated: number;
    clientsAdded: number;
    sharePortalsSent: number;
    sharePortalsViewed: number;
  };
  atRisk: {
    id: string;
    name: string;
    slug: string;
    ownerEmail: string | null;
    plan: string;
    createdAt: string;
  }[];
  trialsEndingThisWeek: {
    workspaceId: string;
    workspaceName: string;
    workspaceSlug: string;
    ownerEmail: string | null;
    plan: string;
    trialEndsAt: string;
  }[];
  generatedAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function daysSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 flex flex-col gap-1 ${
        accent
          ? 'bg-emerald-600 border-emerald-500 text-white'
          : 'bg-white border-stone-200'
      }`}
    >
      <span className={`text-xs font-medium uppercase tracking-wide ${accent ? 'text-emerald-100' : 'text-stone-400'}`}>
        {label}
      </span>
      <span className={`text-3xl font-bold ${accent ? 'text-white' : 'text-[#0B1F14]'}`}>
        {value}
      </span>
      {sub && (
        <span className={`text-xs ${accent ? 'text-emerald-100' : 'text-stone-400'}`}>{sub}</span>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-400 mb-3">
      {children}
    </h2>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<HealthData>('/admin/health')
      .then(setData)
      .catch((e) => setError(e?.message ?? 'Failed to load health data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-stone-500">Loading platform health…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-sm">
          <p className="text-red-600 font-medium">Failed to load</p>
          <p className="text-sm text-red-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const activeRatio =
    data.workspaces.total > 0
      ? Math.round((data.workspaces.activeLast7d / data.workspaces.total) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0B1F14]">Platform Health</h1>
            <p className="text-sm text-stone-400 mt-1">
              Generated {new Date(data.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-xs border border-stone-300 bg-white hover:bg-stone-50 text-stone-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Signups */}
        <section>
          <SectionTitle>New Signups</SectionTitle>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Today" value={data.signups.today} accent={data.signups.today > 0} />
            <StatCard label="Last 7 days" value={data.signups.last7d} />
            <StatCard label="Last 30 days" value={data.signups.last30d} />
          </div>
        </section>

        {/* Workspaces */}
        <section>
          <SectionTitle>Workspaces</SectionTitle>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total" value={data.workspaces.total} />
            <StatCard
              label="Active (7d)"
              value={data.workspaces.activeLast7d}
              sub={`${activeRatio}% of total`}
              accent={activeRatio >= 50}
            />
            <StatCard
              label="At Risk"
              value={data.atRisk.length}
              sub="No activity in 7+ days"
              accent={data.atRisk.length > 0}
            />
          </div>
        </section>

        {/* Activity (30d) */}
        <section>
          <SectionTitle>Activity — Last 30 days</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label="Messages Ingested" value={data.activity30d.messagesIngested} />
            <StatCard label="Listings Created" value={data.activity30d.listingsCreated} />
            <StatCard label="Clients Added" value={data.activity30d.clientsAdded} />
            <StatCard label="Portals Sent" value={data.activity30d.sharePortalsSent} />
            <StatCard label="Portals Viewed" value={data.activity30d.sharePortalsViewed} />
          </div>
        </section>

        {/* Trials ending this week */}
        {data.trialsEndingThisWeek.length > 0 && (
          <section>
            <SectionTitle>⏳ Trials Ending This Week ({data.trialsEndingThisWeek.length})</SectionTitle>
            <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-200 text-amber-700 text-xs uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-medium">Workspace</th>
                    <th className="text-left px-4 py-3 font-medium">Owner</th>
                    <th className="text-left px-4 py-3 font-medium">Plan</th>
                    <th className="text-left px-4 py-3 font-medium">Trial Ends</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trialsEndingThisWeek.map((t) => (
                    <tr key={t.workspaceId} className="border-b border-amber-100 last:border-0 hover:bg-amber-100/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#0B1F14]">{t.workspaceName}</td>
                      <td className="px-4 py-3 text-stone-500">{t.ownerEmail ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          {t.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-600">{fmtDate(t.trialEndsAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* At-risk workspaces */}
        <section>
          <SectionTitle>
            🔴 At-Risk Workspaces — No Activity 7+ Days ({data.atRisk.length})
          </SectionTitle>
          {data.atRisk.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-400 text-sm">
              🎉 All workspaces have been active in the last 7 days
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-stone-400 text-xs uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-medium">Workspace</th>
                    <th className="text-left px-4 py-3 font-medium">Owner Email</th>
                    <th className="text-left px-4 py-3 font-medium">Plan</th>
                    <th className="text-left px-4 py-3 font-medium">Created</th>
                    <th className="text-left px-4 py-3 font-medium">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {data.atRisk.map((ws) => (
                    <tr key={ws.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-[#0B1F14]">{ws.name}</span>
                        <span className="text-stone-400 text-xs ml-1.5">/{ws.slug}</span>
                      </td>
                      <td className="px-4 py-3">
                        {ws.ownerEmail ? (
                          <a
                            href={`mailto:${ws.ownerEmail}`}
                            className="text-emerald-600 hover:underline"
                          >
                            {ws.ownerEmail}
                          </a>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            ws.plan === 'FREE'
                              ? 'bg-stone-100 text-stone-500'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {ws.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-500">{fmtDate(ws.createdAt)}</td>
                      <td className="px-4 py-3 text-stone-400 text-xs">
                        {daysSince(ws.createdAt)}d old
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}