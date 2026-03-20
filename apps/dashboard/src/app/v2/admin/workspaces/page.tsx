"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Building2, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { apiGet } from '@/lib/api';

type Workspace = {
  id:           string;
  name:         string;
  slug:         string;
  type:         'INDIVIDUAL' | 'FIRM';
  plan:         string;
  isActive:     boolean;
  email?:       string | null;
  city?:        string | null;
  createdAt:    string;
  memberCount:  number;
  listingCount: number;
  clientCount:  number;
  subscription?: { status: string; trialEndsAt?: string | null } | null;
};

type Meta = { page: number; limit: number; total: number; totalPages: number };

const PLAN_COLORS: Record<string, string> = {
  FREE:       'bg-slate-100 text-slate-600',
  INDIVIDUAL: 'bg-sky-100 text-sky-700',
  FIRM_5:     'bg-emerald-100 text-emerald-700',
  FIRM_20:    'bg-violet-100 text-violet-700',
  ENTERPRISE: 'bg-amber-100 text-amber-700',
};

export default function AdminWorkspacesPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [query,      setQuery]      = useState(searchParams.get('q')      ?? '');
  const [planFilter, setPlanFilter] = useState(searchParams.get('plan')   ?? '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type')   ?? '');
  const [activeFilter, setActive]   = useState(searchParams.get('active') ?? '');
  const [page,       setPage]       = useState(1);
  const [data,       setData]       = useState<{ items: Workspace[]; meta: Meta } | null>(null);
  const [loading,    setLoading]    = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (query)       params.set('q',      query);
    if (planFilter)  params.set('plan',   planFilter);
    if (typeFilter)  params.set('type',   typeFilter);
    if (activeFilter) params.set('active', activeFilter);

    try {
      const res = await apiGet<{ items: Workspace[]; meta: Meta }>(`/admin/workspaces?${params}`);
      setData(res);
    } catch {}
    setLoading(false);
  }, [page, query, planFilter, typeFilter, activeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchData(); }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">

      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-slate-900">Workspaces</h1>
          {data && <p className="text-[13px] text-slate-500 mt-0.5">{data.meta.total.toLocaleString()} total</p>}
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, slug…"
            className="h-8 pl-8 pr-3 w-56 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
          />
        </div>

        {[
          { label: 'Type', value: typeFilter,   onChange: setTypeFilter,  options: [['', 'All types'], ['INDIVIDUAL', 'Individual'], ['FIRM', 'Firm']] },
          { label: 'Plan', value: planFilter,   onChange: setPlanFilter,  options: [['', 'All plans'], ['FREE', 'Free'], ['INDIVIDUAL', 'Individual'], ['FIRM_5', 'Firm 5'], ['FIRM_20', 'Firm 20']] },
          { label: 'Status', value: activeFilter, onChange: setActive,   options: [['', 'All'], ['true', 'Active'], ['false', 'Suspended']] },
        ].map((f) => (
          <select
            key={f.label}
            value={f.value}
            onChange={(e) => { f.onChange(e.target.value); setPage(1); }}
            className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none"
          >
            {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
      </div>

      {/* ── TABLE ── */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {['Workspace', 'Type', 'Plan', 'Status', 'Members', 'Listings', 'Created', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-50">
                {Array.from({ length: 8 }).map((_, j) => (
                  <td key={j} className="px-5 py-4">
                    <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}

            {!loading && data?.items.map((w) => (
              <tr
                key={w.id}
                onClick={() => router.push(`/admin/workspaces/${w.id}`)}
                className="border-b border-slate-50 cursor-pointer hover:bg-slate-50/70 transition-colors"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <Building2 className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-800">{w.name}</p>
                      <p className="text-[11px] text-slate-400">{w.email ?? w.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-[12px] text-slate-600">{w.type}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PLAN_COLORS[w.plan] ?? 'bg-slate-100 text-slate-600'}`}>
                    {w.plan}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {w.isActive
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    : <XCircle      className="h-4 w-4 text-red-400"     />}
                </td>
                <td className="px-5 py-3.5 text-[12.5px] text-slate-600">{w.memberCount}</td>
                <td className="px-5 py-3.5 text-[12.5px] text-slate-600">{w.listingCount}</td>
                <td className="px-5 py-3.5 text-[12px] text-slate-400">
                  {new Date(w.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-5 py-3.5">
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </td>
              </tr>
            ))}

            {!loading && data?.items.length === 0 && (
              <tr><td colSpan={8}>
                <div className="flex flex-col items-center justify-center py-16">
                  <p className="text-[13px] font-semibold text-slate-700">No workspaces found</p>
                  <p className="text-[12px] text-slate-400 mt-0.5">Try adjusting your filters</p>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
            <p className="text-[12px] text-slate-400">
              Page {data.meta.page} of {data.meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-7 px-3 rounded-lg border border-slate-200 text-[12px] text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <button
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 px-3 rounded-lg border border-slate-200 text-[12px] text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}