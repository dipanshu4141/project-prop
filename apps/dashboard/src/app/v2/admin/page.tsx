"use client";

import { useEffect, useState } from 'react';
import {
  Building2, Users, LayoutDashboard,
  TrendingUp, AlertTriangle, UserPlus,
  Handshake, Activity,
} from 'lucide-react';
import { apiGet } from '@/lib/api';

/* ------------------------------------------------------------------ */
/* TYPES — matches /admin/health response                              */
/* ------------------------------------------------------------------ */

type HealthData = {
  signups: { today: number; last7d: number; last30d: number };
  workspaces: { total: number; activeLast7d: number };
  activity30d: {
      messagesIngested: number;
      newProperties: number;
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
    ownerEmail: string | null;
    plan: string;
    trialEndsAt: string;
  }[];
  generatedAt: string;
};

/* ------------------------------------------------------------------ */
/* STAT CARD                                                           */
/* ------------------------------------------------------------------ */

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label:  string;
  value:  string | number;
  sub?:   string;
  icon:   React.ElementType;
  color:  string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 relative overflow-hidden">
      <div className={`absolute -right-3 -top-3 h-16 w-16 rounded-full opacity-10 ${color}`} />
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg mb-3 ${color} bg-opacity-10`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <p className="text-[12px] font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-[26px] font-bold text-slate-900 leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
        {value}
      </p>
      {sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */

export default function AdminOverviewPage() {
  const [data,    setData]    = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<HealthData>('/admin/health')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-6 w-48 rounded bg-slate-100 animate-pulse mb-6" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return (
    <div className="p-8 text-slate-400 text-sm">Failed to load platform data.</div>
  );

  const activeRatio = data.workspaces.total > 0
    ? Math.round((data.workspaces.activeLast7d / data.workspaces.total) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900">Platform overview</h1>
          <p className="text-[13.5px] text-slate-500 mt-0.5">
            Real-time snapshot of your entire platform.
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); apiGet<HealthData>('/admin/health').then(setData).finally(() => setLoading(false)); }}
          className="text-xs border border-stone-300 bg-white hover:bg-stone-50 text-stone-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── STAT GRID ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total workspaces"
          value={data.workspaces.total}
          sub={`${data.workspaces.activeLast7d} active this week`}
          icon={Building2}
          color="bg-sky-400"
        />
        <StatCard
          label="New signups today"
          value={data.signups.today}
          sub={`${data.signups.last7d} this week · ${data.signups.last30d} this month`}
          icon={UserPlus}
          color="bg-emerald-400"
        />
        <StatCard
          label="Active workspaces (7d)"
          value={data.workspaces.activeLast7d}
          sub={`${activeRatio}% of total`}
          icon={TrendingUp}
          color="bg-violet-400"
        />
        <StatCard
          label="At-risk workspaces"
          value={data.atRisk.length}
          sub="No activity in 7+ days"
          icon={AlertTriangle}
          color="bg-amber-400"
        />
        <StatCard
          label="New properties (30d)"
          value={data.activity30d.newProperties}
          icon={LayoutDashboard}
          color="bg-sky-400"
        />
        <StatCard
          label="Clients added (30d)"
          value={data.activity30d.clientsAdded}
          icon={Users}
          color="bg-emerald-400"
        />
        <StatCard
          label="Portals sent (30d)"
          value={data.activity30d.sharePortalsSent}
          sub={`${data.activity30d.sharePortalsViewed} viewed`}
          icon={Activity}
          color="bg-violet-400"
        />
        <StatCard
          label="Messages ingested (30d)"
          value={data.activity30d.messagesIngested}
          icon={Handshake}
          color="bg-amber-400"
        />
      </div>

      {/* ── TRIALS ENDING + AT RISK ── */}
      <div className="mt-5 grid grid-cols-2 gap-5">

        {/* Trials ending this week */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
          <p className="text-[13px] font-semibold text-slate-800 mb-4">
            ⏳ Trials ending this week
            {data.trialsEndingThisWeek.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[11px] font-bold">
                {data.trialsEndingThisWeek.length}
              </span>
            )}
          </p>
          {data.trialsEndingThisWeek.length === 0 ? (
            <p className="text-[12.5px] text-slate-400">No trials ending this week.</p>
          ) : (
            <div className="space-y-2">
              {data.trialsEndingThisWeek.map((t) => (
                <div key={t.workspaceId} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-[13px] font-medium text-slate-800">{t.workspaceName}</p>
                    <p className="text-[11px] text-slate-400">{t.ownerEmail ?? '—'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">{t.plan}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(t.trialEndsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* At-risk workspaces */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
          <p className="text-[13px] font-semibold text-slate-800 mb-4">
            🔴 At-risk workspaces
            {data.atRisk.length > 0 && (
              <span className="ml-2 rounded-full bg-red-100 text-red-600 px-2 py-0.5 text-[11px] font-bold">
                {data.atRisk.length}
              </span>
            )}
          </p>
          {data.atRisk.length === 0 ? (
            <p className="text-[12.5px] text-slate-400">🎉 All workspaces active in last 7 days.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.atRisk.map((ws) => (
                <div key={ws.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-[13px] font-medium text-slate-800">{ws.name}</p>
                    {ws.ownerEmail && (
                      <a href={`mailto:${ws.ownerEmail}`} className="text-[11px] text-emerald-600 hover:underline">
                        {ws.ownerEmail}
                      </a>
                    )}
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    ws.plan === 'FREE' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {ws.plan}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Suspended warning */}
      {data.atRisk.length > 3 && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <p className="text-[13px] text-amber-800">
            <span className="font-semibold">{data.atRisk.length} workspaces</span>
            {' '}haven't been active in 7+ days. Consider reaching out to prevent churn.
          </p>
        </div>
      )}

    </div>
  );
}