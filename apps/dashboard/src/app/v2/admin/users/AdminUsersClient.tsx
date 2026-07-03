'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Shield, UserX, UserCheck, ChevronDown, X } from 'lucide-react';

interface WorkspaceUsageEvent {
  occurredAt: string;
}

interface Workspace {
  id:           string;
  name:         string;
  slug:         string;
  plan:         string;
  lastActiveAt: string | null;
}

interface Membership {
  role:      string;
  joinedAt:  string;
  workspace: Workspace;
}

interface User {
  id:            string;
  name:          string | null;
  email:         string;
  phone:         string | null;
  avatarUrl:     string | null;
  platformRole:  string;
  emailVerified: boolean;
  isActive:      boolean;
  deactivatedAt: string | null;
  createdAt:     string;
  memberships:   Membership[];
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function getLastActive(user: User): string {
  const dates = user.memberships
    .map(m => (m.workspace as any).lastActiveAt)
    .filter(Boolean);
  if (!dates.length) return '—';
  const latest = dates.sort((a: string, b: string) =>
    new Date(b).getTime() - new Date(a).getTime()
  )[0];
  return timeAgo(latest);
}

function roleBadge(role: string) {
  const map: Record<string, string> = {
    SUPERADMIN: 'bg-violet-100 text-violet-700',
    SUPPORT:    'bg-sky-100 text-sky-700',
    USER:       'bg-slate-100 text-slate-500',
  };
  return map[role] ?? 'bg-slate-100 text-slate-500';
}

function planBadge(plan: string) {
  const map: Record<string, string> = {
    INDIVIDUAL: 'bg-emerald-100 text-emerald-700',
    FIRM:       'bg-amber-100 text-amber-700',
  };
  return map[plan] ?? 'bg-slate-100 text-slate-500';
}

export default function AdminUsersClient() {
  const [users,    setUsers]    = useState<User[]>([]);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [page,     setPage]     = useState(1);
  const [q,        setQ]        = useState('');
  const [role,     setRole]     = useState('');
  const [active,   setActive]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page',  String(page));
    params.set('limit', '20');
    if (q)      params.set('q',            q);
    if (role)   params.set('platformRole', role);
    if (active) params.set('active',       active);
    const res  = await fetch(`/api/admin/users?${params}`, { credentials: 'include' });
    const data = await res.json();
    setUsers(data.items ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, q, role, active]);

  useEffect(() => { load(); }, [load]);

  async function setUserRole(userId: string, newRole: string) {
    setActingOn(userId);
    await fetch(`/api/admin/users/${userId}/role`, {
      method:      'PATCH',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role: newRole }),
    });
    await load();
    setActingOn(null);
  }

  async function toggleActive(user: User) {
    setActingOn(user.id);
    const endpoint = user.isActive ? 'deactivate' : 'activate';
    await fetch(`/api/admin/users/${user.id}/${endpoint}`, {
      method:      'POST',
      credentials: 'include',
    });
    await load();
    setActingOn(null);
  }

  return (
    <div className="space-y-4">

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Search name, email, phone…"
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 bg-white text-[13px] focus:outline-none focus:border-slate-400"
          />
          {q && (
            <button onClick={() => { setQ(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-600 focus:outline-none focus:border-slate-400">
          <option value="">All roles</option>
          <option value="USER">User</option>
          <option value="SUPPORT">Support</option>
          <option value="SUPERADMIN">Superadmin</option>
        </select>

        <select value={active} onChange={e => { setActive(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-600 focus:outline-none focus:border-slate-400">
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Deactivated</option>
        </select>

        <span className="text-[12px] text-slate-400 ml-auto">{total} users</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">User</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Workspace</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Plan</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Platform role</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Last active</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Joined</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-[13px] text-slate-400">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-[13px] text-slate-400">No users found</td></tr>
              ) : users.map(user => {
                const primary = user.memberships?.[0];
                return (
                  <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${!user.isActive ? 'opacity-50' : ''}`}>

                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                          {user.name?.charAt(0)?.toUpperCase() ?? user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate max-w-[160px]">{user.name ?? '—'}</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[160px]">{user.email}</p>
                          {user.phone && <p className="text-[11px] text-slate-400">{user.phone}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Workspace */}
                    <td className="px-4 py-3">
                      {primary ? (
                        <div>
                          <p className="font-medium text-slate-700 truncate max-w-[140px]">{primary.workspace.name}</p>
                          <p className="text-[11px] text-slate-400">{primary.role}</p>
                        </div>
                      ) : <span className="text-slate-300">—</span>}
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      {primary?.workspace.plan ? (
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${planBadge(primary.workspace.plan)}`}>
                          {primary.workspace.plan}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>

                    {/* Platform role */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${roleBadge(user.platformRole)}`}>
                          {user.platformRole}
                        </span>
                        <div className="relative group">
                          <button className="text-slate-300 hover:text-slate-500">
                            <ChevronDown className="h-3 w-3" />
                          </button>
                          <div className="absolute left-0 top-5 z-10 hidden group-hover:block bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[130px]">
                            {['USER', 'SUPPORT', 'SUPERADMIN'].map(r => (
                              <button key={r} onClick={() => setUserRole(user.id, r)}
                                disabled={actingOn === user.id || user.platformRole === r}
                                className="block w-full text-left px-3 py-1.5 text-[12px] text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Last active */}
                    <td className="px-4 py-3 text-[12px] text-slate-400 whitespace-nowrap">
                      {getLastActive(user)}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-[12px] text-slate-400 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                        {user.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(user)}
                        disabled={actingOn === user.id}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11.5px] font-medium text-slate-500 hover:border-slate-400 disabled:opacity-40 transition-colors"
                      >
                        {user.isActive
                          ? <><UserX className="h-3 w-3 text-red-400" /> Deactivate</>
                          : <><UserCheck className="h-3 w-3 text-emerald-500" /> Activate</>
                        }
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-slate-400">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="h-8 px-3 rounded-lg border border-slate-200 text-[12px] text-slate-600 hover:border-slate-400 disabled:opacity-40">
              Previous
            </button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="h-8 px-3 rounded-lg border border-slate-200 text-[12px] text-slate-600 hover:border-slate-400 disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}