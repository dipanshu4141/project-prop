'use client';
// apps/dashboard/src/app/v2/admin/workspaces/AdminWorkspacesClient.tsx

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiPatch } from '@/lib/api';
import type { WorkspaceListResponse, WorkspaceRow } from './page';

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null) {
  if (!iso) return '—';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30)  return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function buildPageRange(cur: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const p: (number | '…')[] = [1];
  if (cur > 3) p.push('…');
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) p.push(i);
  if (cur < total - 2) p.push('…');
  p.push(total);
  return p;
}

// ── Status badges ─────────────────────────────────────────────────────────────

const PLAN_BADGE: Record<string, string> = {
  FREE:        'bg-gray-100 text-gray-500',
  INDIVIDUAL:  'bg-blue-50 text-blue-700',
  FIRM_5:      'bg-violet-50 text-violet-700',
  FIRM_20:     'bg-purple-50 text-purple-700',
  ENTERPRISE:  'bg-amber-50 text-amber-700',
};

const SUB_STATUS: Record<string, string> = {
  TRIALING:  'bg-blue-50 text-blue-600',
  ACTIVE:    'bg-emerald-50 text-emerald-700',
  PAST_DUE:  'bg-red-50 text-red-600',
  CANCELLED: 'bg-gray-100 text-gray-400',
  PAUSED:    'bg-orange-50 text-orange-600',
};

// ── Suspend modal ─────────────────────────────────────────────────────────────

function SuspendModal({
  workspace,
  onClose,
  onConfirm,
}: {
  workspace: WorkspaceRow;
  onClose:   () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 rounded-2xl p-6 max-w-md mx-auto"
        style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
      >
        <h2 className="text-lg font-bold mb-1" style={{ color: '#0B1F14' }}>
          Suspend workspace
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          <strong>{workspace.name}</strong> will be deactivated. Brokers won't be able to log in.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for suspension (optional)"
          rows={3}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-gray-400 mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason || 'Suspended by admin')}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600"
          >
            Suspend
          </button>
        </div>
      </div>
    </>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function WorkspaceRow({
  row, onSuspend, onUnsuspend,
}: {
  row:         WorkspaceRow;
  onSuspend:   (w: WorkspaceRow) => void;
  onUnsuspend: (id: string) => void;
}) {
  return (
    <tr className="border-b border-gray-50 hover:bg-[#F7F5F0]/60 transition-colors group">
      <td className="py-4 pl-6 pr-4">
        <div className="flex items-center gap-3">
          {row.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: '#0B1F14', color: '#fff' }}
            >
              {row.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-[#0B1F14] leading-tight">{row.name}</p>
            <p className="text-xs text-gray-400 font-mono">{row.slug}</p>
          </div>
        </div>
      </td>

      <td className="py-4 px-4">
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
          {row.type}
        </span>
      </td>

      <td className="py-4 px-4">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${PLAN_BADGE[row.plan] ?? 'bg-gray-100 text-gray-500'}`}>
          {row.plan}
        </span>
        {row.subscription && (
          <span className={`ml-1.5 text-xs font-semibold px-2 py-0.5 rounded-md ${SUB_STATUS[row.subscription.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {row.subscription.status}
          </span>
        )}
      </td>

      <td className="py-4 px-4 text-center">
        <span className="text-sm font-semibold text-[#0B1F14]">{row.memberCount}</span>
      </td>

      <td className="py-4 px-4 text-center hidden lg:table-cell">
        <span className="text-sm text-gray-600">{row.listingCount}</span>
      </td>

      <td className="py-4 px-4">
        {row.isActive ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        ) : (
          <div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Suspended
            </span>
            {row.suspendedReason && (
              <p className="text-[10px] text-gray-400 mt-0.5 max-w-[140px] truncate">{row.suspendedReason}</p>
            )}
          </div>
        )}
      </td>

      <td className="py-4 px-4 text-xs text-gray-400 whitespace-nowrap">
        {timeAgo(row.createdAt)}
      </td>

      <td className="py-4 pl-4 pr-6">
        {row.isActive ? (
          <button
            onClick={() => onSuspend(row)}
            className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
          >
            Suspend
          </button>
        ) : (
          <button
            onClick={() => onUnsuspend(row.id)}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
          >
            Unsuspend
          </button>
        )}
      </td>
    </tr>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function AdminWorkspacesClient({
  initialData, searchParams,
}: {
  initialData: WorkspaceListResponse;
  searchParams: Record<string, string>;
}) {
  const router      = useRouter();
  const [, startTx] = useTransition();
  const [q, setQ]   = useState(searchParams.q ?? '');
  const [items, setItems] = useState(initialData.items);
  const [suspendTarget, setSuspendTarget] = useState<WorkspaceRow | null>(null);

  const page = Number(searchParams.page ?? 1);

  function navigate(params: Record<string, string | undefined>) {
    const merged = { ...searchParams, ...params };
    const p = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v); });
    startTx(() => router.push(`?${p.toString()}`));
  }

  async function handleSuspend(row: WorkspaceRow, reason: string) {
    setSuspendTarget(null);
    setItems((prev) => prev.map((w) => w.id === row.id
      ? { ...w, isActive: false, suspendedAt: new Date().toISOString(), suspendedReason: reason }
      : w
    ));
    try {
      await apiPatch(`/admin/workspaces/${row.id}/suspend`, { reason });
    } catch {
      setItems((prev) => prev.map((w) => w.id === row.id ? row : w));
    }
  }

  async function handleUnsuspend(id: string) {
    const prev = items.find((w) => w.id === id);
    setItems((p) => p.map((w) => w.id === id
      ? { ...w, isActive: true, suspendedAt: null, suspendedReason: null }
      : w
    ));
    try {
      await apiPatch(`/admin/workspaces/${id}/unsuspend`, {});
    } catch {
      if (prev) setItems((p) => p.map((w) => w.id === id ? prev : w));
    }
  }

  const ACTIVE_BTNS = [
    { label: 'All',       value: undefined  },
    { label: 'Active',    value: 'true'     },
    { label: 'Suspended', value: 'false'    },
  ];
  const TYPE_BTNS = [
    { label: 'All',        value: undefined     },
    { label: 'Individual', value: 'INDIVIDUAL'  },
    { label: 'Firm',       value: 'FIRM'        },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#0B1F14' }}>Workspaces</h1>
        <p className="text-sm text-gray-400 mt-1">All firms and solo brokers on the platform.</p>
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap items-center gap-3 rounded-2xl px-5 py-3.5"
        style={{ background: '#fff', border: '1px solid rgba(11,31,20,0.07)' }}
      >
        <form
          onSubmit={(e) => { e.preventDefault(); navigate({ q: q || undefined, page: '1' }); }}
          className="flex gap-2 flex-1 min-w-[220px]"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, slug, email…"
            className="flex-1 h-8 rounded-lg border border-gray-200 px-3 text-sm bg-gray-50 focus:outline-none focus:border-gray-400"
          />
          <button type="submit" className="h-8 px-4 rounded-lg text-sm font-semibold text-white" style={{ background: '#0B1F14' }}>
            Search
          </button>
        </form>

        <div className="flex gap-1">
          {TYPE_BTNS.map((b) => (
            <button key={b.label} onClick={() => navigate({ type: b.value, page: '1' })}
              className="h-8 px-3 rounded-lg text-xs font-semibold border transition-colors"
              style={searchParams.type === b.value ? { background: '#0B1F14', color: '#fff', borderColor: '#0B1F14' } : { background: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }}
            >{b.label}</button>
          ))}
        </div>

        <div className="flex gap-1">
          {ACTIVE_BTNS.map((b) => (
            <button key={b.label} onClick={() => navigate({ active: b.value, page: '1' })}
              className="h-8 px-3 rounded-lg text-xs font-semibold border transition-colors"
              style={searchParams.active === b.value ? { background: '#0B1F14', color: '#fff', borderColor: '#0B1F14' } : { background: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }}
            >{b.label}</button>
          ))}
        </div>

        <p className="text-xs text-gray-400 ml-auto">{initialData.total.toLocaleString('en-IN')} workspaces</p>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(11,31,20,0.07)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#F7F5F0', borderBottom: '1px solid rgba(11,31,20,0.07)' }}>
                {['Workspace', 'Type', 'Plan', 'Members', 'Listings', 'Status', 'Created', ''].map((h, i) => (
                  <th key={h + i} className={`py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 ${i === 0 ? 'pl-6 pr-4' : i === 7 ? 'pl-4 pr-6' : 'px-4'} ${[4].includes(i) ? 'hidden lg:table-cell' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={8} className="py-20 text-center text-sm text-gray-400">No workspaces found.</td></tr>
              ) : items.map((row) => (
                <WorkspaceRow key={row.id} row={row} onSuspend={setSuspendTarget} onUnsuspend={handleUnsuspend} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
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
              style={p === page ? { background: '#0B1F14', color: '#fff', borderColor: '#0B1F14' } : { background: '#fff', color: '#374151', borderColor: '#e5e7eb' }}
            >{p}</button>
          )}
          <button disabled={page >= initialData.pages} onClick={() => navigate({ page: String(page + 1) })}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs disabled:opacity-40">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Suspend modal */}
      {suspendTarget && (
        <SuspendModal
          workspace={suspendTarget}
          onClose={() => setSuspendTarget(null)}
          onConfirm={(reason) => handleSuspend(suspendTarget, reason)}
        />
      )}
    </div>
  );
}