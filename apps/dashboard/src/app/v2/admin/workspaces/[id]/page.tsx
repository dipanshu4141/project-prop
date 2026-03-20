"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft, Building2, Users, LayoutDashboard,
  CheckCircle2, XCircle, AlertTriangle, Activity,
} from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type WorkspaceDetail = {
  id:          string;
  name:        string;
  slug:        string;
  type:        string;
  plan:        string;
  isActive:    boolean;
  email?:      string | null;
  city?:       string | null;
  createdAt:   string;
  suspendedAt?:     string | null;
  suspendedReason?: string | null;
  members: {
    role: string;
    user: { id: string; email: string; name: string | null; platformRole: string; isActive: boolean; createdAt: string };
  }[];
  subscription?: {
    plan: string; status: string;
    seats: number; seatsUsed: number;
    trialEndsAt?: string | null;
    currentPeriodEnd?: string | null;
  } | null;
  invoices: { id: string; amount: number; status: string; createdAt: string }[];
  _count: { properties: number; clients: number; agents: number };
  recentListings: { id: string; bhk?: string | null; propertySubType?: string | null; city?: string | null; status?: string | null; createdAt: string }[];
  recentUsage:    { event: string; occurredAt: string }[];
  usageBreakdown: { event: string; count: number }[];
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function WorkspaceDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const { user } = useAuth();

  const [ws,       setWs]      = useState<WorkspaceDetail | null>(null);
  const [loading,  setLoading] = useState(true);
  const [actioning, setAction] = useState(false);

  useEffect(() => {
    apiGet<WorkspaceDetail>(`/admin/workspaces/${id}`)
      .then(setWs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleSuspend() {
    if (!ws || actioning) return;
    const confirm = window.confirm(
      ws.isActive
        ? `Suspend "${ws.name}"? All users will lose access immediately.`
        : `Reactivate "${ws.name}"?`,
    );
    if (!confirm) return;

    setAction(true);
    try {
      const endpoint = ws.isActive
        ? `/admin/workspaces/${id}/suspend`
        : `/admin/workspaces/${id}/reactivate`;
      await apiPatch(endpoint, { reason: 'Manual action by admin' });
      setWs((w) => w ? { ...w, isActive: !w.isActive } : w);
    } catch (e: any) {
      alert(e.message);
    }
    setAction(false);
  }

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!ws) return <div className="p-8 text-slate-500">Workspace not found.</div>;

  const isSuperAdmin = user?.platformRole === 'SUPERADMIN';

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-5">

      {/* Back */}
      <button
        onClick={() => router.push('/admin/workspaces')}
        className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        All workspaces
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <Building2 className="h-6 w-6 text-slate-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] font-bold text-slate-900">{ws.name}</h1>
              {ws.isActive
                ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                : <XCircle      className="h-5 w-5 text-red-400"     />}
            </div>
            <p className="text-[13px] text-slate-500">
              {ws.slug} · {ws.type} · {ws.plan} · Created {fmt(ws.createdAt)}
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            onClick={toggleSuspend}
            disabled={actioning}
            className={[
              'h-9 px-4 rounded-lg text-[12.5px] font-semibold transition-colors',
              ws.isActive
                ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100',
            ].join(' ')}
          >
            {actioning ? '…' : ws.isActive ? 'Suspend workspace' : 'Reactivate workspace'}
          </button>
        )}
      </div>

      {ws.suspendedReason && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-3.5">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-[13px] text-red-800">
            Suspended {ws.suspendedAt ? fmt(ws.suspendedAt) : ''}: {ws.suspendedReason}
          </p>
        </div>
      )}

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Members',  value: ws.members.length,      icon: Users           },
          { label: 'Listings', value: ws._count.properties,   icon: LayoutDashboard },
          { label: 'Clients',  value: ws._count.clients,      icon: Users           },
          { label: 'Agents',   value: ws._count.agents,       icon: Users           },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
              <Icon className="h-4 w-4 text-slate-400 mb-2" />
              <p className="text-[22px] font-bold text-slate-900 leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {s.value}
              </p>
              <p className="text-[11.5px] text-slate-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-5">

        {/* ── LEFT ── */}
        <div className="col-span-8 space-y-5">

          {/* Members */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-3.5 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-slate-800">Members</p>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">{ws.members.length}</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  {['User', 'Role', 'Status', 'Joined'].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ws.members.map((m) => (
                  <tr key={m.user.id} className="border-b border-slate-50">
                    <td className="px-5 py-3">
                      <p className="text-[13px] font-medium text-slate-800">{m.user.name ?? m.user.email}</p>
                      <p className="text-[11px] text-slate-400">{m.user.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[12px] text-slate-600">{m.role}</span>
                    </td>
                    <td className="px-5 py-3">
                      {m.user.isActive
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        : <XCircle      className="h-3.5 w-3.5 text-red-400"     />}
                    </td>
                    <td className="px-5 py-3 text-[12px] text-slate-400">
                      {fmt(m.user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent listings */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-3.5">
              <p className="text-[13px] font-semibold text-slate-800">Recent listings</p>
            </div>
            <div className="divide-y divide-slate-50">
              {ws.recentListings.length === 0 && (
                <p className="px-5 py-6 text-[12.5px] text-slate-400">No listings yet.</p>
              )}
              {ws.recentListings.map((l) => (
                <div key={l.id} className="flex items-center justify-between px-5 py-3">
                  <p className="text-[13px] text-slate-700">
                    {[l.bhk, l.propertySubType, l.city].filter(Boolean).join(' ') || 'Unnamed listing'}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-[11.5px] text-slate-400">{fmt(l.createdAt)}</span>
                    {l.status && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-600">
                        {l.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="col-span-4 space-y-5">

          {/* Subscription */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
            <p className="text-[13px] font-semibold text-slate-800 mb-3">Subscription</p>
            {ws.subscription ? (
              <div className="space-y-2 text-[12.5px]">
                {[
                  { label: 'Plan',    value: ws.subscription.plan   },
                  { label: 'Status',  value: ws.subscription.status },
                  { label: 'Seats',   value: `${ws.subscription.seatsUsed} / ${ws.subscription.seats}` },
                  ws.subscription.trialEndsAt    ? { label: 'Trial ends', value: fmt(ws.subscription.trialEndsAt)    } : null,
                  ws.subscription.currentPeriodEnd ? { label: 'Renews',   value: fmt(ws.subscription.currentPeriodEnd) } : null,
                ].filter(Boolean).map((row: any) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-slate-500">{row.label}</span>
                    <span className="font-medium text-slate-800">{row.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12.5px] text-slate-400">No subscription record.</p>
            )}
          </div>

          {/* Usage breakdown */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
            <p className="text-[13px] font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-slate-400" />
              Top events — 30 days
            </p>
            {ws.usageBreakdown.length === 0 ? (
              <p className="text-[12.5px] text-slate-400">No usage data yet.</p>
            ) : (
              <div className="space-y-2">
                {ws.usageBreakdown.map((u) => (
                  <div key={u.event} className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-600 truncate max-w-[140px]">{u.event}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {u.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}