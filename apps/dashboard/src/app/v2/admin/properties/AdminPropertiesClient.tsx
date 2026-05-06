'use client';

// apps/dashboard/src/app/v2/admin/properties/AdminPropertiesClient.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type {
  AdminStats,
  CanonicalListResponse,
  CanonicalPropertyRow,
} from './page';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(price: string | null): string {
  if (!price) return '—';
  const n = Number(price);
  if (isNaN(n) || n <= 0) return '—';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30)  return `${d}d ago`;
  const m = Math.floor(d / 30);
  if (m < 12)  return `${m}mo ago`;
  return `${Math.floor(m / 12)}y ago`;
}

function buildPageRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  if (current > 3) pages.push('…');
  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: {
  label: string; value: number; sub?: string; accent?: string;
}) {
  return (
    <div className="rounded-2xl px-5 py-4 flex flex-col gap-1"
      style={{ background: '#fff', border: '1px solid rgba(11,31,20,0.07)' }}>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold leading-none mt-1" style={{ color: accent ?? '#0B1F14' }}>
        {value.toLocaleString('en-IN')}
      </p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function FirmsBadge({ count }: { count: number }) {
  if (count <= 1) return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-500">
      1 workspace
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-700">
      {count} workspaces
    </span>
  );
}

function VerifiedBadge({ verified }: { verified: boolean }) {
  if (verified) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M2 5l2.5 2.5L8 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Verified
    </span>
  );
  return (
    <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-400">
      Unverified
    </span>
  );
}

function SortIcon({ column, current, order }: { column: string; current: string; order: string }) {
  if (current !== column) return <span className="ml-1 text-gray-300">↕</span>;
  return <span className="ml-1 text-emerald-600">{order === 'asc' ? '↑' : '↓'}</span>;
}

function PropertyRow({ row }: { row: CanonicalPropertyRow }) {
  const bhkStr   = row.bhk ? (row.bhk.toUpperCase().includes('BHK') ? row.bhk : `${row.bhk} BHK`) : null;
  const title    = [bhkStr, row.propertySubType].filter(Boolean).join(' ') || 'Property';
  const location = [row.area, row.city].filter(Boolean).join(', ') || '—';
  return (
    <tr className="border-b border-gray-50 hover:bg-[#F7F5F0]/60 transition-colors group">
      <td className="py-4 pl-6 pr-4">
        <Link href={`/v2/admin/properties/${row.id}`} className="block">
          <p className="text-[10px] font-mono text-gray-400 mb-0.5 tracking-wide">{row.globalRefCode}</p>
          <p className="text-sm font-semibold text-[#0B1F14] group-hover:text-emerald-700 transition-colors leading-tight">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{location}</p>
        </Link>
      </td>
      <td className="py-4 px-4">
        <FirmsBadge count={row.listingCount} />
        {row.pendingDuplicates > 0 && (
          <p className="text-[10px] text-amber-600 mt-1 font-medium">
            {row.pendingDuplicates} flag{row.pendingDuplicates > 1 ? 's' : ''}
          </p>
        )}
      </td>
      <td className="py-4 px-4">
        <span className="text-sm font-semibold text-[#0B1F14]">{formatPrice(row.price)}</span>
        {row.listingType === 'RENT' && <span className="text-xs text-gray-400 ml-1">/ mo</span>}
      </td>
      <td className="py-4 px-4 text-sm">
        {row.totalDealsCompleted > 0
          ? <span className="font-semibold text-emerald-700">{row.totalDealsCompleted}</span>
          : <span className="text-gray-300">—</span>}
      </td>
      <td className="py-4 px-4"><VerifiedBadge verified={row.verified} /></td>
      <td className="py-4 px-4 text-xs text-gray-400 whitespace-nowrap">{timeAgo(row.createdAt)}</td>
      <td className="py-4 pl-4 pr-6">
        <Link href={`/v2/admin/properties/${row.id}`}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors whitespace-nowrap">
          View →
        </Link>
      </td>
    </tr>
  );
}

function PageBtn({ children, active, disabled, onClick, 'aria-label': ariaLabel }: {
  children: React.ReactNode; active?: boolean; disabled?: boolean;
  onClick?: () => void; 'aria-label'?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel}
      className={[
        'flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition-all',
        active   ? 'border-[#0B1F14] bg-[#0B1F14] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400',
        disabled ? 'opacity-40 cursor-not-allowed' : '',
      ].join(' ')}>
      {children}
    </button>
  );
}

const COLUMNS = [
  { label: 'Property', cls: 'pl-6 pr-4', col: '' },
  { label: 'Firms',    cls: 'px-4',      col: 'listingCount'        },
  { label: 'Price',    cls: 'px-4',      col: 'price'               },
  { label: 'Deals',    cls: 'px-4',      col: 'totalDealsCompleted' },
  { label: 'Status',   cls: 'px-4',      col: ''                    },
  { label: 'Added',    cls: 'px-4',      col: 'createdAt'           },
  { label: '',         cls: 'pl-4 pr-6', col: ''                    },
];

// ── Main component ────────────────────────────────────────────────────────────

export function AdminPropertiesClient({
  initialData,
  stats,
  searchParams,
}: {
  initialData:  CanonicalListResponse;
  stats:        AdminStats;
  searchParams: Record<string, string>;
}) {
  const router = useRouter();
  const [q, setQ] = useState(searchParams.q ?? '');

  const page           = Number(searchParams.page   ?? 1);
  const duplicatesOnly = searchParams.duplicatesOnly === 'true';
  const verifiedFilter = searchParams.verified       ?? '';
  const sortBy         = searchParams.sortBy         ?? '';
  const sortOrder      = searchParams.sortOrder      ?? 'desc';

  function navigate(updates: Record<string, string | undefined>) {
    const merged = { ...searchParams, ...updates };
    const p = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v); });
    router.push(`?${p.toString()}`);
  }

  function handleSort(column: string) {
    if (!column) return;
    if (sortBy === column) {
      navigate({ sortBy: column, sortOrder: sortOrder === 'asc' ? 'desc' : 'asc', page: '1' });
    } else {
      navigate({ sortBy: column, sortOrder: 'asc', page: '1' });
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ q: q.trim() || undefined, page: '1' });
  }

  const FILTER_BTNS = [
    { label: 'All',        value: ''      },
    { label: 'Verified',   value: 'true'  },
    { label: 'Unverified', value: 'false' },
  ];

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#0B1F14' }}>Canonical Properties</h1>
        <p className="text-sm text-gray-400 mt-1">
          One row = one real-world property, regardless of how many firms listed it.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Unique"  value={stats.totalCanonical}    sub="distinct real-world properties" />
        <StatCard label="Verified"      value={stats.verified}          sub="admin-confirmed unique"         accent="#059669" />
        <StatCard label="Unverified"    value={stats.unverified}        sub="needs review"                   accent="#b45309" />
        <StatCard label="Multi-listed"  value={stats.multiListed}       sub="2+ firms have same property"    accent="#7c3aed" />
        <StatCard label="Pending Flags" value={stats.pendingDuplicates} sub="unresolved duplicate links"     accent="#dc2626" />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl px-5 py-3.5"
        style={{ background: '#fff', border: '1px solid rgba(11,31,20,0.07)' }}>
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-[220px]">
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search ref code, city, area…"
            className="flex-1 h-8 rounded-lg border border-gray-200 px-3 text-sm bg-gray-50 focus:outline-none focus:border-gray-400" />
          <button type="submit" className="h-8 px-4 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#0B1F14' }}>Search</button>
        </form>

        <div className="flex items-center gap-1">
          {FILTER_BTNS.map((btn) => (
            <button key={btn.label}
              onClick={() => navigate({ verified: btn.value || undefined, page: '1' })}
              className="h-8 px-3 rounded-lg text-xs font-semibold border transition-colors"
              style={verifiedFilter === btn.value
                ? { background: '#0B1F14', color: '#fff', borderColor: '#0B1F14' }
                : { background: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }}>
              {btn.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate({ duplicatesOnly: duplicatesOnly ? undefined : 'true', page: '1' })}
          className="h-8 px-3 rounded-lg text-xs font-semibold border transition-colors"
          style={duplicatesOnly
            ? { background: '#7c3aed', color: '#fff', borderColor: '#7c3aed' }
            : { background: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }}>
          Multi-listed only
        </button>

        <p className="text-xs text-gray-400 ml-auto">
          {initialData.total.toLocaleString('en-IN')} properties
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden"
        style={{ background: '#fff', border: '1px solid rgba(11,31,20,0.07)' }}>
        {initialData.items.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-400 text-sm">No properties found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F7F5F0', borderBottom: '1px solid rgba(11,31,20,0.07)' }}>
                  {COLUMNS.map(({ label, cls, col }) => (
                    <th key={label || 'action'}
                      onClick={() => handleSort(col)}
                      className={[
                        'py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400',
                        cls,
                        col ? 'cursor-pointer hover:text-gray-600 select-none' : '',
                      ].join(' ')}>
                      {label}
                      {col && <SortIcon column={col} current={sortBy} order={sortOrder} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {initialData.items.map((row) => <PropertyRow key={row.id} row={row} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {initialData.pages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-4">
          <PageBtn disabled={page <= 1} onClick={() => navigate({ page: String(page - 1) })} aria-label="Previous page">
            <ChevronLeft className="h-3.5 w-3.5" />
          </PageBtn>
          {buildPageRange(page, initialData.pages).map((p, i) =>
            p === '…' ? (
              <span key={`el-${i}`} className="w-8 text-center text-xs text-gray-400">…</span>
            ) : (
              <PageBtn key={p} active={p === page} onClick={() => navigate({ page: String(p) })}>
                {p}
              </PageBtn>
            )
          )}
          <PageBtn disabled={page >= initialData.pages} onClick={() => navigate({ page: String(page + 1) })} aria-label="Next page">
            <ChevronRight className="h-3.5 w-3.5" />
          </PageBtn>
        </div>
      )}
    </div>
  );
}