"use client";

import { useEffect, useState, useCallback } from 'react';
import { Search, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type UserRow = {
  id:            string;
  email:         string;
  name?:         string | null;
  phone?:        string | null;
  platformRole:  string;
  isActive:      boolean;
  emailVerified: boolean;
  createdAt:     string;
  memberships: {
    role:      string;
    workspace: { id: string; name: string; type: string; plan: string };
  }[];
};

type Meta = { page: number; limit: number; total: number; totalPages: number };

const ROLE_BADGE: Record<string, string> = {
  SUPERADMIN: 'bg-red-100 text-red-700',
  SUPPORT:    'bg-amber-100 text-amber-700',
  USER:       'bg-slate-100 text-slate-600',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminUsersPage() {
  const { user: adminUser } = useAuth();
  const isSuperAdmin = adminUser?.platformRole === 'SUPERADMIN';

  const [query,        setQuery]        = useState('');
  const [roleFilter,   setRoleFilter]   = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page,         setPage]         = useState(1);
  const [data,         setData]         = useState<{ items: UserRow[]; meta: Meta } | null>(null);
  const [loading,      setLoading]      = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '25' });
    if (query)        params.set('q',            query);
    if (roleFilter)   params.set('platformRole', roleFilter);
    if (activeFilter) params.set('active',       activeFilter);

    try {
      const res = await apiGet<{ items: UserRow[]; meta: Meta }>(`/admin/users?${params}`);
      setData(res);
    } catch {}
    setLoading(false);
  }, [page, query, roleFilter, activeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchData(); }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function toggleActive(userId: string, current: boolean) {
    if (!isSuperAdmin) return;
    const confirmed = window.confirm(
      current ? 'Deactivate this user?' : 'Reactivate this user?'
    );
    if (!confirmed) return;

    try {
      await apiPatch(`/admin/users/${userId}`, { isActive: !current });
      setData((d) => d ? ({
        ...d,
        items: d.items.map((u) => u.id === userId ? { ...u, isActive: !current } : u),
      }) : d);
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function changePlatformRole(userId: string, role: string) {
    if (!isSuperAdmin) return;
    try {
      await apiPatch(`/admin/users/${userId}`, { platformRole: role });
      setData((d) => d ? ({
        ...d,
        items: d.items.map((u) => u.id === userId ? { ...u, platformRole: role } : u),
      }) : d);
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">

      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-slate-900">Users</h1>
          {data && <p className="text-[13px] text-slate-500 mt-0.5">{data.meta.total.toLocaleString()} total</p>}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email, name, phone…"
            className="h-8 pl-8 pr-3 w-56 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none"
        >
          <option value="">All roles</option>
          <option value="SUPERADMIN">Superadmin</option>
          <option value="SUPPORT">Support</option>
          <option value="USER">User</option>
        </select>
        <select
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
          className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none"
        >
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Deactivated</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {['User', 'Platform role', 'Workspace', 'Status', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-50">
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-5 py-4">
                    <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}

            {!loading && data?.items.map((u) => (
              <tr key={u.id} className="border-b border-slate-50">
                <td className="px-5 py-3.5">
                  <p className="text-[13px] font-semibold text-slate-800">{u.name ?? '—'}</p>
                  <p className="text-[11px] text-slate-400">{u.email}</p>
                </td>

                <td className="px-5 py-3.5">
                  {isSuperAdmin ? (
                    <select
                      value={u.platformRole}
                      onChange={(e) => changePlatformRole(u.id, e.target.value)}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border-0 focus:outline-none cursor-pointer ${ROLE_BADGE[u.platformRole] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      <option value="USER">USER</option>
                      <option value="SUPPORT">SUPPORT</option>
                      <option value="SUPERADMIN">SUPERADMIN</option>
                    </select>
                  ) : (
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_BADGE[u.platformRole] ?? 'bg-slate-100 text-slate-600'}`}>
                      {u.platformRole}
                    </span>
                  )}
                </td>

                <td className="px-5 py-3.5">
                  {u.memberships[0] ? (
                    <div>
                      <p className="text-[12.5px] text-slate-700">{u.memberships[0].workspace.name}</p>
                      <p className="text-[11px] text-slate-400">{u.memberships[0].role} · {u.memberships[0].workspace.plan}</p>
                    </div>
                  ) : <span className="text-[12px] text-slate-400">—</span>}
                </td>

                <td className="px-5 py-3.5">
                  {u.isActive
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    : <XCircle      className="h-4 w-4 text-red-400"     />}
                </td>

                <td className="px-5 py-3.5 text-[12px] text-slate-400">{fmt(u.createdAt)}</td>

                <td className="px-5 py-3.5">
                  {isSuperAdmin && (
                    <button
                      onClick={() => toggleActive(u.id, u.isActive)}
                      className={[
                        'text-[11.5px] font-medium transition-colors',
                        u.isActive ? 'text-red-500 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-800',
                      ].join(' ')}
                    >
                      {u.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {!loading && data?.items.length === 0 && (
              <tr><td colSpan={6}>
                <div className="flex flex-col items-center justify-center py-16">
                  <p className="text-[13px] font-semibold text-slate-700">No users found</p>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>

        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
            <p className="text-[12px] text-slate-400">Page {data.meta.page} of {data.meta.totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="h-7 px-3 rounded-lg border border-slate-200 text-[12px] text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Prev
              </button>
              <button disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}
                className="h-7 px-3 rounded-lg border border-slate-200 text-[12px] text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}