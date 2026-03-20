"use client";

import { useEffect, useState } from 'react';
import {
  Building2, Users, LayoutDashboard,
  UserCheck, TrendingUp, AlertTriangle,
} from 'lucide-react';
import { apiGet } from '@/lib/api';

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

type Stats = {
  totalWorkspaces:      number;
  activeWorkspaces:     number;
  suspendedWorkspaces:  number;
  totalUsers:           number;
  totalListings:        number;
  totalClients:         number;
  totalAgents:          number;
  totalDeals:           number;
  recentWorkspaces:     number;
  usageToday:           number;
  byPlan:  { plan:  string; count: number }[];
  byType:  { type:  string; count: number }[];
  last14:  { date:  string; count: number }[];
};

/* ------------------------------------------------------------------ */
/* STAT CARD                                                           */
/* ------------------------------------------------------------------ */

function StatCard({
  label, value, sub, icon: Icon, accent,
}: {
  label:  string;
  value:  string | number;
  sub?:   string;
  icon:   React.ElementType;
  accent: string;
}) {
  return (
    <div className={`rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 relative overflow-hidden`}>
      <div className={`absolute -right-3 -top-3 h-16 w-16 rounded-full opacity-10 ${accent}`} />
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg mb-3 ${accent} bg-opacity-10`}>
        <Icon className="h-4 w-4" />
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
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Stats>('/admin/stats')
      .then(setStats)
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

  if (!stats) return null;

  const firmCount       = stats.byType.find((t) => t.type === 'FIRM')?.count        ?? 0;
  const individualCount = stats.byType.find((t) => t.type === 'INDIVIDUAL')?.count  ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-slate-900">Platform overview</h1>
        <p className="text-[13.5px] text-slate-500 mt-0.5">
          Real-time snapshot of your entire platform.
        </p>
      </div>

      {/* ── STAT GRID ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total workspaces"  value={stats.totalWorkspaces}    sub={`${stats.recentWorkspaces} new this month`}   icon={Building2}      accent="bg-sky-400"     />
        <StatCard label="Active workspaces" value={stats.activeWorkspaces}   sub={`${stats.suspendedWorkspaces} suspended`}      icon={UserCheck}      accent="bg-emerald-400" />
        <StatCard label="Total users"       value={stats.totalUsers}         icon={Users}                                                                 accent="bg-violet-400"  />
        <StatCard label="Usage events today" value={stats.usageToday}        icon={TrendingUp}                                                            accent="bg-amber-400"   />
        <StatCard label="Total listings"    value={stats.totalListings}      icon={LayoutDashboard}                                                       accent="bg-sky-400"     />
        <StatCard label="Total clients"     value={stats.totalClients}       icon={Users}                                                                 accent="bg-emerald-400" />
        <StatCard label="Total agents"      value={stats.totalAgents}        icon={Users}                                                                 accent="bg-violet-400"  />
        <StatCard label="Total deals"       value={stats.totalDeals}         icon={TrendingUp}                                                            accent="bg-amber-400"   />
      </div>

      {/* ── BREAKDOWN ROW ── */}
      <div className="mt-5 grid grid-cols-3 gap-5">

        {/* By type */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
          <p className="text-[13px] font-semibold text-slate-800 mb-4">Workspace types</p>
          <div className="space-y-3">
            {[
              { label: 'Individual', count: individualCount, color: 'bg-sky-400'     },
              { label: 'Firm',       count: firmCount,       color: 'bg-emerald-400' },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[12.5px] text-slate-600">{row.label}</p>
                  <p className="text-[12.5px] font-semibold text-slate-800">{row.count}</p>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100">
                  <div
                    className={`h-1.5 rounded-full ${row.color}`}
                    style={{ width: `${stats.totalWorkspaces ? (row.count / stats.totalWorkspaces) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By plan */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
          <p className="text-[13px] font-semibold text-slate-800 mb-4">By plan</p>
          <div className="space-y-2">
            {stats.byPlan.map((row) => (
              <div key={row.plan} className="flex items-center justify-between">
                <span className="text-[12.5px] text-slate-500">{row.plan}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                  {row.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* New workspaces last 14 days */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
          <p className="text-[13px] font-semibold text-slate-800 mb-4">
            New workspaces — last 14 days
          </p>
          {stats.last14.length === 0 ? (
            <p className="text-[12.5px] text-slate-400">No data yet.</p>
          ) : (
            <div className="flex items-end gap-1 h-20">
              {stats.last14.map((d) => {
                const max = Math.max(...stats.last14.map((x) => x.count), 1);
                const pct = (d.count / max) * 100;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.count}`}>
                    <div
                      className="w-full rounded-sm bg-emerald-400"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Suspended warning */}
      {stats.suspendedWorkspaces > 0 && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <p className="text-[13px] text-amber-800">
            <span className="font-semibold">{stats.suspendedWorkspaces} workspace{stats.suspendedWorkspaces !== 1 ? 's' : ''}</span>
            {' '}currently suspended. <a href="/admin/workspaces?active=false" className="underline">View them →</a>
          </p>
        </div>
      )}
    </div>
  );
}