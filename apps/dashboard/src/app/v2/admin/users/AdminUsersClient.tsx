'use client';
// apps/dashboard/src/app/v2/admin/users/AdminUsersClient.tsx

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiPatch } from '@/lib/api';
import type { UserListResponse, UserRow } from './page';

function timeAgo(iso: string | null) {
  if (!iso) return '—';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return 'Today'; if (d === 1) return 'Yesterday';
  if (d < 30)  return `${d}d ago`; return `${Math.floor(d / 30)}mo ago`;
}

function buildPageRange(cur: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const p: (number | '…')[] = [1];
  if (cur > 3) p.push('…');
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) p.push(i);
  if (cur < total - 2) p.push('…');
  p.push(total); return p;
}

function initials(name: string | null, email: string) {
  if (name) return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

const ROLE_STYLES: Record<string, string> = {
  SUPERADMIN: 'bg-red-50 text-red-700',
  SUPPORT:    'bg-amber-50 text-amber-700',
  USER:       'bg-gray-100 text-gray-500',
};

// ── Role dropdown ─────────────────────────────────────────────────────────────

function RoleDropdown({
  userId, current, onChange,
}: { userId: string; current: string; onChange: (id: string, role: string) => void }) {
  const [open, setOpen] = useState(false);
  const roles = ['USER', 'SUPPORT', 'SUPERADMIN'];
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${ROLE_STYLES[current] ?? 'bg-gray-100 text-gray-500'}`}
      >
        {current}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 rounded-xl overflow-hidden min-w-[140px]"
            style={{ background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.06)' }}>
            {roles.map((r) => (
              <button key={r} onClick={() => { onChange(userId, r); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${ROLE_STYLES[r]}`}>{r}</span>
                {r === current && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function UserTableRow({
  row, onRoleChange, onToggleActive,
}: { row: UserRow; onRoleChange: (id: string, role: string) => void; onToggleActive: (id: string, active: boolean) => void }) {
  const primaryWs = row.memberships[0];
  return (
    <tr className="border-b border-gray-50 hover:bg-[#F7F5F0]/60 transition-colors">
      <td className="py-4 pl-6 pr-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ background: '#0B1F14', color: '#fff' }}>
            {initials(row.name, row.email)}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0B1F14] leading-tight">{row.name ?? '—'}</p>
            <p className="text-xs text-gray-400">{row.email}</p>
          </div>
        </div>
      </td>

      <td className="py-4 px-4">
        <RoleDropdown userId={row.id} current={row.platformRole} onChange={onRoleChange} />
      </td>

      <td className="py-4 px-4">
        {primaryWs ? (
          <div>
            <p className="text-xs font-medium text-gray-700">{primaryWs.workspace.name}</p>
            <p className="text-[10px] text-gray-400">{primaryWs.role} · {primaryWs.workspace.plan}</p>
            {row.memberships.length > 1 && (
              <p className="text-[10px] text-gray-400">+{row.memberships.length - 1} more</p>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400">No workspace</span>
        )}
      </td>

      <td className="py-4 px-4">
        {row.emailVerified ? (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">Verified</span>
        ) : (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">Unverified</span>
        )}
      </td>

      <td className="py-4 px-4">
        {row.isActive ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />Inactive
          </span>
        )}
      </td>

      <td className="py-4 px-4 text-xs text-gray-400 whitespace-nowrap hidden md:table-cell">
        {timeAgo(row.createdAt)}
      </td>

      <td className="py-4 pl-4 pr-6">
        <button
          onClick={() => onToggleActive(row.id, !row.isActive)}
          className={`text-xs font-semibold transition-colors ${row.isActive ? 'text-red-500 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-800'}`}
        >
          {row.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </td>
    </tr>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function AdminUsersClient({
  initialData, searchParams,
}: { initialData: UserListResponse; searchParams: Record<string, string> }) {
  const router      = useRouter();
  const [, startTx] = useTransition();
  const [q, setQ]   = useState(searchParams.q ?? '');
  const [items, setItems] = useState(initialData.items);
  const page = Number(searchParams.page ?? 1);

  function navigate(params: Record<string, string | undefined>) {
    const merged = { ...searchParams, ...params };
    const p = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v); });
    startTx(() => router.push(`?${p.toString()}`));
  }

  async function handleRoleChange(id: string, role: string) {
    const prev = items.find((u) => u.id === id);
    setItems((p) => p.map((u) => u.id === id ? { ...u, platformRole: role } : u));
    try {
      await apiPatch(`/admin/users/${id}/platform-role`, { role });
    } catch {
      if (prev) setItems((p) => p.map((u) => u.id === id ? prev : u));
    }
  }

  async function handleToggleActive(id: string, active: boolean) {
    const prev = items.find((u) => u.id === id);
    setItems((p) => p.map((u) => u.id === id ? { ...u, isActive: active } : u));
    try {
      await apiPatch(`/admin/users/${id}/${active ? 'activate' : 'deactivate'}`, {});
    } catch {
      if (prev) setItems((p) => p.map((u) => u.id === id ? prev : u));
    }
  }

  const ROLE_BTNS = [
    { label: 'All',        value: undefined     },
    { label: 'User',       value: 'USER'        },
    { label: 'Support',    value: 'SUPPORT'     },
    { label: 'SuperAdmin', value: 'SUPERADMIN'  },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#0B1F14' }}>Users</h1>
        <p className="text-sm text-gray-400 mt-1">All registered users across all workspaces.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl px-5 py-3.5"
        style={{ background: '#fff', border: '1px solid rgba(11,31,20,0.07)' }}>
        <form onSubmit={(e) => { e.preventDefault(); navigate({ q: q || undefined, page: '1' }); }}
          className="flex gap-2 flex-1 min-w-[220px]">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone…"
            className="flex-1 h-8 rounded-lg border border-gray-200 px-3 text-sm bg-gray-50 focus:outline-none focus:border-gray-400" />
          <button type="submit" className="h-8 px-4 rounded-lg text-sm font-semibold text-white" style={{ background: '#0B1F14' }}>Search</button>
        </form>
        <div className="flex gap-1">
          {ROLE_BTNS.map((b) => (
            <button key={b.label} onClick={() => navigate({ platformRole: b.value, page: '1' })}
              className="h-8 px-3 rounded-lg text-xs font-semibold border transition-colors"
              style={searchParams.platformRole === b.value ? { background: '#0B1F14', color: '#fff', borderColor: '#0B1F14' } : { background: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }}>
              {b.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {[{ label: 'All', value: undefined }, { label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }].map((b) => (
            <button key={b.label} onClick={() => navigate({ active: b.value, page: '1' })}
              className="h-8 px-3 rounded-lg text-xs font-semibold border transition-colors"
              style={searchParams.active === b.value ? { background: '#0B1F14', color: '#fff', borderColor: '#0B1F14' } : { background: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }}>
              {b.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 ml-auto">{initialData.total.toLocaleString('en-IN')} users</p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(11,31,20,0.07)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#F7F5F0', borderBottom: '1px solid rgba(11,31,20,0.07)' }}>
                {['User', 'Platform Role', 'Workspace', 'Email', 'Status', 'Joined', ''].map((h, i) => (
                  <th key={h + i} className={`py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 ${i === 0 ? 'pl-6 pr-4' : i === 6 ? 'pl-4 pr-6' : 'px-4'} ${i === 5 ? 'hidden md:table-cell' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-sm text-gray-400">No users found.</td></tr>
              ) : items.map((row) => (
                <UserTableRow key={row.id} row={row} onRoleChange={handleRoleChange} onToggleActive={handleToggleActive} />
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