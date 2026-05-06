'use client';
// apps/dashboard/src/app/v2/admin/subscriptions/AdminSubscriptionsClient.tsx

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { SubListResponse, SubRow, SubStats } from './page';

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtAmount(paise: number) {
  const rupees = paise / 100;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

function buildPageRange(cur: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const p: (number | '…')[] = [1];
  if (cur > 3) p.push('…');
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) p.push(i);
  if (cur < total - 2) p.push('…');
  p.push(total); return p;
}

const STATUS_STYLES: Record<string, string> = {
  TRIALING:  'bg-blue-50 text-blue-700 border-blue-100',
  ACTIVE:    'bg-emerald-50 text-emerald-700 border-emerald-100',
  PAST_DUE:  'bg-red-50 text-red-600 border-red-100',
  CANCELLED: 'bg-gray-100 text-gray-400 border-gray-200',
  PAUSED:    'bg-orange-50 text-orange-600 border-orange-100',
};

const PLAN_STYLES: Record<string, string> = {
  FREE:       'bg-gray-100 text-gray-500',
  INDIVIDUAL: 'bg-blue-50 text-blue-700',
  FIRM_5:     'bg-violet-50 text-violet-700',
  FIRM_20:    'bg-purple-50 text-purple-700',
  ENTERPRISE: 'bg-amber-50 text-amber-700',
};

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-2xl px-5 py-4 flex flex-col gap-1" style={{ background: '#fff', border: '1px solid rgba(11,31,20,0.07)' }}>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold leading-none mt-1" style={{ color: accent ?? '#0B1F14' }}>
        {value.toLocaleString('en-IN')}
      </p>
    </div>
  );
}

function SubTableRow({ row }: { row: SubRow }) {
  const isExpiringSoon = row.currentPeriodEnd
    ? (new Date(row.currentPeriodEnd).getTime() - Date.now()) < 7 * 86400000
    : false;

  return (
    <tr className="border-b border-gray-50 hover:bg-[#F7F5F0]/60 transition-colors">
      <td className="py-4 pl-6 pr-4">
        <div className="flex items-center gap-3">
          {row.workspace.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.workspace.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
              style={{ background: '#0B1F14', color: '#fff' }}>
              {row.workspace.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-[#0B1F14] leading-tight">{row.workspace.name}</p>
            <p className="text-xs text-gray-400 font-mono">{row.workspace.slug}</p>
          </div>
        </div>
      </td>

      <td className="py-4 px-4">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${PLAN_STYLES[row.plan] ?? 'bg-gray-100 text-gray-500'}`}>
          {row.plan}
        </span>
        <p className="text-[10px] text-gray-400 mt-0.5">{row.interval}</p>
      </td>

      <td className="py-4 px-4">
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border ${STATUS_STYLES[row.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'ACTIVE' ? 'bg-emerald-500' : row.status === 'PAST_DUE' ? 'bg-red-500' : row.status === 'TRIALING' ? 'bg-blue-500' : 'bg-gray-400'}`} />
          {row.status}
        </span>
      </td>

      <td className="py-4 px-4 text-sm text-gray-600 hidden md:table-cell">
        {row.seatsUsed} / {row.seats}
      </td>

      <td className="py-4 px-4 hidden lg:table-cell">
        {row.lastInvoice ? (
          <div>
            <p className="text-sm font-semibold text-[#0B1F14]">{fmtAmount(row.lastInvoice.amount)}</p>
            <p className={`text-[10px] ${row.lastInvoice.status === 'PAID' ? 'text-emerald-600' : 'text-red-500'}`}>
              {row.lastInvoice.status}
            </p>
          </div>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>

      <td className="py-4 px-4 hidden lg:table-cell">
        <p className={`text-xs ${isExpiringSoon ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
          {fmtDate(row.currentPeriodEnd)}
        </p>
        {row.trialEndsAt && (
          <p className="text-[10px] text-blue-500">Trial: {fmtDate(row.trialEndsAt)}</p>
        )}
      </td>

      <td className="py-4 pl-4 pr-6 text-xs text-gray-400 whitespace-nowrap">
        {row.gatewaySubscriptionId ? (
          <span className="font-mono text-[10px] text-gray-400 truncate max-w-[100px] block" title={row.gatewaySubscriptionId}>
            {row.gatewaySubscriptionId.slice(0, 12)}…
          </span>
        ) : '—'}
      </td>
    </tr>
  );
}

export function AdminSubscriptionsClient({
  initialData, stats, searchParams,
}: { initialData: SubListResponse; stats: SubStats; searchParams: Record<string, string> }) {
  const router      = useRouter();
  const [, startTx] = useTransition();
  const [q, setQ]   = useState(searchParams.q ?? '');
  const page = Number(searchParams.page ?? 1);

  function navigate(params: Record<string, string | undefined>) {
    const merged = { ...searchParams, ...params };
    const p = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v); });
    startTx(() => router.push(`?${p.toString()}`));
  }

  const STATUS_BTNS = [
    { label: 'All',       value: undefined    },
    { label: 'Trialing',  value: 'TRIALING'   },
    { label: 'Active',    value: 'ACTIVE'     },
    { label: 'Past Due',  value: 'PAST_DUE'   },
    { label: 'Cancelled', value: 'CANCELLED'  },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#0B1F14' }}>Subscriptions</h1>
        <p className="text-sm text-gray-400 mt-1">Billing, plans, and subscription status across all workspaces.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total"     value={stats.total}     />
        <StatCard label="Trialing"  value={stats.trialing}  accent="#3b82f6" />
        <StatCard label="Active"    value={stats.active}    accent="#059669" />
        <StatCard label="Past Due"  value={stats.pastDue}   accent="#dc2626" />
        <StatCard label="Cancelled" value={stats.cancelled} accent="#9ca3af" />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl px-5 py-3.5"
        style={{ background: '#fff', border: '1px solid rgba(11,31,20,0.07)' }}>
        <form onSubmit={(e) => { e.preventDefault(); navigate({ q: q || undefined, page: '1' }); }}
          className="flex gap-2 flex-1 min-w-[220px]">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search workspace name, slug…"
            className="flex-1 h-8 rounded-lg border border-gray-200 px-3 text-sm bg-gray-50 focus:outline-none focus:border-gray-400" />
          <button type="submit" className="h-8 px-4 rounded-lg text-sm font-semibold text-white" style={{ background: '#0B1F14' }}>Search</button>
        </form>
        <div className="flex gap-1 flex-wrap">
          {STATUS_BTNS.map((b) => (
            <button key={b.label} onClick={() => navigate({ status: b.value, page: '1' })}
              className="h-8 px-3 rounded-lg text-xs font-semibold border transition-colors"
              style={searchParams.status === b.value ? { background: '#0B1F14', color: '#fff', borderColor: '#0B1F14' } : { background: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }}>
              {b.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 ml-auto">{initialData.total.toLocaleString('en-IN')} subscriptions</p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(11,31,20,0.07)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#F7F5F0', borderBottom: '1px solid rgba(11,31,20,0.07)' }}>
                {[
                  { h: 'Workspace', cls: 'pl-6 pr-4' },
                  { h: 'Plan',      cls: 'px-4' },
                  { h: 'Status',    cls: 'px-4' },
                  { h: 'Seats',     cls: 'px-4 hidden md:table-cell' },
                  { h: 'Last Invoice', cls: 'px-4 hidden lg:table-cell' },
                  { h: 'Period End',   cls: 'px-4 hidden lg:table-cell' },
                  { h: 'Gateway ID',   cls: 'pl-4 pr-6' },
                ].map(({ h, cls }) => (
                  <th key={h} className={`py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 ${cls}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {initialData.items.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-sm text-gray-400">No subscriptions found.</td></tr>
              ) : initialData.items.map((row) => (
                <SubTableRow key={row.id} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {initialData.pages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-4">
          <button disabled={page <= 1} onClick={() => navigate({ page: String(page - 1) })}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs disabled:opacity-40">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {buildPageRange(page, initialData.pages).map((p, i) =>
            p === '…' ? <span key={i} className="w-8 text-center text-xs text-gray-400">…</span> :
            <button key={p} onClick={() => navigate({ page: String(p) })}
              className="h-8 w-8 flex items-center justify-center rounded-lg border text-xs font-semibold"
              style={p === page ? { background: '#0B1F14', color: '#fff', borderColor: '#0B1F14' } : { background: '#fff', color: '#374151', borderColor: '#e5e7eb' }}>
              {p}
            </button>
          )}
          <button disabled={page >= initialData.pages} onClick={() => navigate({ page: String(page + 1) })}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs disabled:opacity-40">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}