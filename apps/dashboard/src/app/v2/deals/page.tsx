'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

type DealStatus = 'INITIATED' | 'NEGOTIATING' | 'AGREED' | 'COMPLETED' | 'FALLEN_THROUGH';

interface Deal {
  id: string;
  status: DealStatus;
  clientName?: string | null;
  dealValue: number | null;
  commissionRate: number | null;
  totalCommission: number | null;
  initiatedAt: string;
  agreedAt: string | null;
  completedAt: string | null;
  fallenAt: string | null;
  listing: {
    id: string;
    bhk: number | null;
    city: string | null;
    area: string | null;
    listingType: string | null;
    price: string | null;
    availability: string | null;
  } | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<DealStatus, { label: string; color: string; dot: string }> = {
  INITIATED:      { label: 'Initiated',      color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-400' },
  NEGOTIATING:    { label: 'Negotiating',    color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  AGREED:         { label: 'Agreed',         color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-400' },
  COMPLETED:      { label: 'Completed',      color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  FALLEN_THROUGH: { label: 'Fallen Through', color: 'bg-red-100 text-red-600',     dot: 'bg-red-400' },
};

const ALL_STATUSES = Object.keys(STATUS_META) as DealStatus[];

function fmt(n: number | null, prefix = '₹') {
  if (n === null) return '—';
  return prefix + new Intl.NumberFormat('en-IN').format(n);
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function listingLabel(l: Deal['listing']) {
  if (!l) return 'Unknown property';
  const parts = [l.bhk ? `${l.bhk} BHK` : null, l.listingType, l.area, l.city].filter(Boolean);
  return parts.join(' · ');
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<DealStatus | ''>('');

  const load = (status?: DealStatus | '') => {
    setLoading(true);
    const qs = status ? `?status=${status}` : '';
    apiGet<{ items: Deal[]; total: number }>(`/deals${qs}`)
      .then((r) => { setDeals(r.items); setTotal(r.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(filterStatus); }, [filterStatus]);

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0B1F14]">Deals</h1>
            <p className="text-sm text-stone-400 mt-0.5">{total} deal{total !== 1 ? 's' : ''} in your workspace</p>
          </div>
          <Link
            href="/v2/properties"
            className="text-sm bg-[#0B1F14] text-white px-4 py-2 rounded-lg hover:bg-emerald-900 transition-colors"
          >
            + Start Deal
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setFilterStatus('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === '' ? 'bg-[#0B1F14] text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            All
          </button>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === s ? 'bg-[#0B1F14] text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {STATUS_META[s].label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : deals.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl p-16 text-center">
            <p className="text-4xl mb-3">🤝</p>
            <p className="text-[#0B1F14] font-semibold">No deals yet</p>
            <p className="text-stone-400 text-sm mt-1">
              Go to a property listing and click <strong>Start Deal</strong>.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => {
              const meta = STATUS_META[deal.status];
              return (
                <Link key={deal.id} href={`/v2/deals/${deal.id}`}>
                  <div className="bg-white border border-stone-200 rounded-xl px-5 py-4 hover:border-emerald-300 hover:shadow-sm transition-all flex items-center gap-4 cursor-pointer">
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${meta.dot}`} />

                    {/* Property info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#0B1F14] truncate">
                        {deal.clientName ?? listingLabel(deal.listing)}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {deal.clientName && <span className="mr-1">{listingLabel(deal.listing)} · </span>}
                        Started {fmtDate(deal.initiatedAt)}
                      </p>
                    </div>

                    {/* Financials */}
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-[#0B1F14]">{fmt(deal.dealValue)}</p>
                      {deal.commissionRate && (
                        <p className="text-xs text-stone-400">{deal.commissionRate}% · {fmt(deal.totalCommission)}</p>
                      )}
                    </div>

                    {/* Status badge */}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${meta.color}`}>
                      {meta.label}
                    </span>

                    <span className="text-stone-300 text-sm">›</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}