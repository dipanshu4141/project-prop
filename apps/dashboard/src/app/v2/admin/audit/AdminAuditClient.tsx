'use client';
// apps/dashboard/src/app/v2/admin/audit/AdminAuditClient.tsx

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronR } from 'lucide-react';
import type { AuditListResponse, AuditMeta, AuditRow } from './page';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function buildPageRange(cur: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const p: (number | '…')[] = [1];
  if (cur > 3) p.push('…');
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) p.push(i);
  if (cur < total - 2) p.push('…');
  p.push(total); return p;
}

// Color-code action strings by prefix
function actionColor(action: string): string {
  const a = action.toUpperCase();
  if (a.includes('DELETE') || a.includes('SUSPEND') || a.includes('DEACTIVATE'))
    return 'bg-red-50 text-red-700';
  if (a.includes('CREATE') || a.includes('REGISTER'))
    return 'bg-emerald-50 text-emerald-700';
  if (a.includes('UPDATE') || a.includes('PATCH') || a.includes('VERIFY'))
    return 'bg-blue-50 text-blue-700';
  if (a.includes('LOGIN') || a.includes('AUTH'))
    return 'bg-violet-50 text-violet-700';
  return 'bg-gray-100 text-gray-600';
}

// ── Expandable row ────────────────────────────────────────────────────────────

function AuditTableRow({ row }: { row: AuditRow }) {
  const [expanded, setExpanded] = useState(false);
  const hasDiff = row.before || row.after;

  return (
    <>
      <tr
        className={`border-b border-gray-50 transition-colors ${hasDiff ? 'cursor-pointer hover:bg-[#F7F5F0]/60' : ''}`}
        onClick={() => hasDiff && setExpanded((e) => !e)}
      >
        {/* Timestamp */}
        <td className="py-3.5 pl-6 pr-4 text-xs text-gray-400 whitespace-nowrap">
          {fmtDateTime(row.createdAt)}
        </td>

        {/* Action */}
        <td className="py-3.5 px-4">
          <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-md ${actionColor(row.action)}`}>
            {row.action.replace(/_/g, ' ')}
          </span>
        </td>

        {/* Entity */}
        <td className="py-3.5 px-4">
          <p className="text-xs font-medium text-gray-700">{row.entity}</p>
          {row.entityId && (
            <p className="text-[10px] font-mono text-gray-400 truncate max-w-[100px]" title={row.entityId}>
              {row.entityId.slice(0, 8)}…
            </p>
          )}
        </td>

        {/* User */}
        <td className="py-3.5 px-4">
          {row.user ? (
            <div>
              <p className="text-xs font-medium text-gray-700 leading-tight">{row.user.name ?? row.user.email}</p>
              <p className="text-[10px] text-gray-400">{row.user.platformRole}</p>
            </div>
          ) : (
            <span className="text-xs text-gray-300">System</span>
          )}
        </td>

        {/* Workspace */}
        <td className="py-3.5 px-4 hidden lg:table-cell">
          {row.workspaceId ? (
            <p className="text-[10px] font-mono text-gray-400 truncate max-w-[100px]" title={row.workspaceId}>
              {row.workspaceId.slice(0, 8)}…
            </p>
          ) : <span className="text-xs text-gray-300">—</span>}
        </td>

        {/* IP */}
        <td className="py-3.5 px-4 hidden xl:table-cell text-xs text-gray-400 font-mono">
          {row.ipAddress ?? '—'}
        </td>

        {/* Expand toggle */}
        <td className="py-3.5 pl-4 pr-6">
          {hasDiff && (
            <span className="text-gray-400">
              {expanded
                ? <ChevronDown className="h-3.5 w-3.5" />
                : <ChevronR className="h-3.5 w-3.5" />
              }
            </span>
          )}
        </td>
      </tr>

      {/* Expanded diff view */}
      {expanded && hasDiff && (
        <tr className="bg-[#F7F5F0] border-b border-gray-100">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {row.before && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Before</p>
                  <pre className="text-[11px] bg-white rounded-xl p-3 overflow-auto max-h-48 font-mono text-gray-600 border border-gray-100">
                    {JSON.stringify(row.before, null, 2)}
                  </pre>
                </div>
              )}
              {row.after && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">After</p>
                  <pre className="text-[11px] bg-white rounded-xl p-3 overflow-auto max-h-48 font-mono text-gray-600 border border-gray-100">
                    {JSON.stringify(row.after, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function AdminAuditClient({
  initialData, meta, searchParams,
}: { initialData: AuditListResponse; meta: AuditMeta; searchParams: Record<string, string> }) {
  const router      = useRouter();
  const [, startTx] = useTransition();
  const page = Number(searchParams.page ?? 1);

  function navigate(params: Record<string, string | undefined>) {
    const merged = { ...searchParams, ...params };
    const p = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v); });
    startTx(() => router.push(`?${p.toString()}`));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#0B1F14' }}>Audit Log</h1>
        <p className="text-sm text-gray-400 mt-1">
          Platform-wide action history. Click any row with a diff to expand before/after.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl px-5 py-3.5"
        style={{ background: '#fff', border: '1px solid rgba(11,31,20,0.07)' }}>

        {/* Action filter */}
        <select
          value={searchParams.action ?? ''}
          onChange={(e) => navigate({ action: e.target.value || undefined, page: '1' })}
          className="h-8 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs text-gray-600 focus:outline-none focus:border-gray-400"
        >
          <option value="">All actions</option>
          {meta.actions.map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>

        {/* Entity filter */}
        <select
          value={searchParams.entity ?? ''}
          onChange={(e) => navigate({ entity: e.target.value || undefined, page: '1' })}
          className="h-8 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs text-gray-600 focus:outline-none focus:border-gray-400"
        >
          <option value="">All entities</option>
          {meta.entities.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>

        {/* Date range */}
        <input
          type="date"
          value={searchParams.fromDate ?? ''}
          onChange={(e) => navigate({ fromDate: e.target.value || undefined, page: '1' })}
          className="h-8 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs text-gray-600 focus:outline-none focus:border-gray-400"
        />
        <span className="text-xs text-gray-400">to</span>
        <input
          type="date"
          value={searchParams.toDate ?? ''}
          onChange={(e) => navigate({ toDate: e.target.value || undefined, page: '1' })}
          className="h-8 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs text-gray-600 focus:outline-none focus:border-gray-400"
        />

        {/* Clear filters */}
        {(searchParams.action || searchParams.entity || searchParams.fromDate || searchParams.toDate) && (
          <button
            onClick={() => navigate({ action: undefined, entity: undefined, fromDate: undefined, toDate: undefined, page: '1' })}
            className="h-8 px-3 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            Clear filters
          </button>
        )}

        <p className="text-xs text-gray-400 ml-auto">
          {initialData.total.toLocaleString('en-IN')} entries
        </p>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(11,31,20,0.07)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#F7F5F0', borderBottom: '1px solid rgba(11,31,20,0.07)' }}>
                {[
                  { h: 'Time',        cls: 'pl-6 pr-4' },
                  { h: 'Action',      cls: 'px-4' },
                  { h: 'Entity',      cls: 'px-4' },
                  { h: 'User',        cls: 'px-4' },
                  { h: 'Workspace',   cls: 'px-4 hidden lg:table-cell' },
                  { h: 'IP',          cls: 'px-4 hidden xl:table-cell' },
                  { h: '',            cls: 'pl-4 pr-6' },
                ].map(({ h, cls }) => (
                  <th key={h} className={`py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 ${cls}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {initialData.items.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-sm text-gray-400">No audit log entries found.</td></tr>
              ) : initialData.items.map((row) => (
                <AuditTableRow key={row.id} row={row} />
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