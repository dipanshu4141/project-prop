'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPatch } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

type DealStatus = 'INITIATED' | 'NEGOTIATING' | 'AGREED' | 'COMPLETED' | 'FALLEN_THROUGH';

interface Deal {
  id: string;
  status: DealStatus;
  dealValue: number | null;
  commissionRate: number | null;
  totalCommission: number | null;
  notes: string | null;
  initiatedAt: string;
  agreedAt: string | null;
  completedAt: string | null;
  fallenAt: string | null;
  listing: {
    id: string;
    bhk: number | null;
    city: string | null;
    area: string | null;
    building: string | null;
    listingType: string | null;
    price: string | null;
    availability: string | null;
  } | null;
  chain: {
    id: string;
    workspaceName: string | null;
    role: string;
    position: number;
    joinedAt: string;
    commission: { percentage: number; amount: number | null; status: string } | null;
  }[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_PIPELINE: DealStatus[] = ['INITIATED', 'NEGOTIATING', 'AGREED', 'COMPLETED'];

const STATUS_META: Record<DealStatus, { label: string; color: string }> = {
  INITIATED:      { label: 'Initiated',      color: 'bg-blue-100 text-blue-700' },
  NEGOTIATING:    { label: 'Negotiating',    color: 'bg-amber-100 text-amber-700' },
  AGREED:         { label: 'Agreed',         color: 'bg-violet-100 text-violet-700' },
  COMPLETED:      { label: 'Completed',      color: 'bg-emerald-100 text-emerald-700' },
  FALLEN_THROUGH: { label: 'Fallen Through', color: 'bg-red-100 text-red-600' },
};

const NEXT_STATUS: Partial<Record<DealStatus, DealStatus>> = {
  INITIATED:   'NEGOTIATING',
  NEGOTIATING: 'AGREED',
  AGREED:      'COMPLETED',
};

function fmt(n: number | null) {
  if (n === null) return '—';
  return '₹' + new Intl.NumberFormat('en-IN').format(n);
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [dropping, setDropping] = useState(false);

  // Edit financials state
  const [editing, setEditing] = useState(false);
  const [dealValue, setDealValue] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    apiGet<Deal>(`/deals/${id}`)
      .then((d) => {
        setDeal(d);
        setDealValue(d.dealValue?.toString() ?? '');
        setCommissionRate(d.commissionRate?.toString() ?? '');
        setNotes(d.notes ?? '');
      })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  const isClosed = deal?.status === 'COMPLETED' || deal?.status === 'FALLEN_THROUGH';

  const advanceStatus = async () => {
    if (!deal || !NEXT_STATUS[deal.status]) return;
    setAdvancing(true);
    try {
      await apiPatch(`/deals/${id}/status`, { status: NEXT_STATUS[deal.status] });
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to advance status');
    } finally {
      setAdvancing(false);
    }
  };

  const markFallenThrough = async () => {
    if (!deal) return;
    setDropping(true);
    try {
      await apiPatch(`/deals/${id}/status`, { status: 'FALLEN_THROUGH' });
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update status');
    } finally {
      setDropping(false);
    }
  };

  const saveFinancials = async () => {
    setSaving(true);
    setError('');
    try {
      await apiPatch(`/deals/${id}/financials`, {
        dealValue:      dealValue      ? Number(dealValue)      : undefined,
        commissionRate: commissionRate ? Number(commissionRate) : undefined,
        notes:          notes || undefined,
      });
      setEditing(false);
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <p className="text-stone-400">Deal not found.</p>
      </div>
    );
  }

  const meta = STATUS_META[deal.status];
  const nextStatus = NEXT_STATUS[deal.status];
  const pipelineIndex = STATUS_PIPELINE.indexOf(deal.status);

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* Back */}
        <button
          onClick={() => router.push('/v2/deals')}
          className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          ← All Deals
        </button>

        {/* Header card */}
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">
                {deal.listing?.listingType ?? 'Property'}
              </p>
              <h1 className="text-xl font-bold text-[#0B1F14]">
                {[
                  deal.listing?.bhk ? `${deal.listing.bhk} BHK` : null,
                  deal.listing?.area,
                  deal.listing?.city,
                ].filter(Boolean).join(', ') || 'Unknown Property'}
              </h1>
              {deal.listing?.building && (
                <p className="text-sm text-stone-400 mt-0.5">{deal.listing.building}</p>
              )}
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium flex-shrink-0 ${meta.color}`}>
              {meta.label}
            </span>
          </div>

          {/* Pipeline progress bar */}
          {deal.status !== 'FALLEN_THROUGH' && (
            <div className="mt-5">
              <div className="flex items-center gap-0">
                {STATUS_PIPELINE.map((s, i) => {
                  const done = i <= pipelineIndex;
                  const current = i === pipelineIndex;
                  return (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                      <div className={`flex-shrink-0 w-2.5 h-2.5 rounded-full border-2 ${
                        done
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'bg-white border-stone-300'
                      } ${current ? 'ring-2 ring-emerald-200' : ''}`} />
                      {i < STATUS_PIPELINE.length - 1 && (
                        <div className={`h-0.5 flex-1 ${i < pipelineIndex ? 'bg-emerald-500' : 'bg-stone-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                {STATUS_PIPELINE.map((s) => (
                  <p key={s} className={`text-xs ${s === deal.status ? 'text-emerald-600 font-medium' : 'text-stone-400'}`}>
                    {STATUS_META[s].label}
                  </p>
                ))}
              </div>
            </div>
          )}

          {deal.status === 'FALLEN_THROUGH' && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">
              This deal has fallen through.
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Actions */}
        {!isClosed && (
          <div className="flex gap-3">
            {nextStatus && (
              <button
                onClick={advanceStatus}
                disabled={advancing}
                className="flex-1 bg-emerald-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors"
              >
                {advancing ? 'Updating…' : `Move to ${STATUS_META[nextStatus].label}`}
              </button>
            )}
            {deal.status !== 'AGREED' && (
              <button
                onClick={markFallenThrough}
                disabled={dropping}
                className="text-sm text-red-500 border border-red-200 px-4 py-2.5 rounded-lg hover:bg-red-50 disabled:opacity-60 transition-colors"
              >
                {dropping ? '…' : 'Mark Fallen Through'}
              </button>
            )}
            {deal.status === 'AGREED' && (
              <button
                onClick={markFallenThrough}
                disabled={dropping}
                className="text-sm text-red-500 border border-red-200 px-3 py-2.5 rounded-lg hover:bg-red-50 disabled:opacity-60 transition-colors"
              >
                {dropping ? '…' : 'Fallen Through'}
              </button>
            )}
          </div>
        )}

        {/* Financials */}
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#0B1F14]">Financials</h2>
            {!isClosed && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-emerald-600 hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-stone-400 mb-1">Deal Value (₹)</label>
                <input
                  type="number"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  placeholder="e.g. 8500000"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
                />
                {dealValue && commissionRate && (
                  <p className="text-xs text-emerald-600 mt-1">
                    Commission: ₹{new Intl.NumberFormat('en-IN').format(
                      Math.round(Number(dealValue) * Number(commissionRate) / 100)
                    )}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any notes about this deal…"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveFinancials}
                  disabled={saving}
                  className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditing(false); setError(''); }}
                  className="text-sm text-stone-500 px-4 py-2 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Deal Value</p>
                <p className="font-semibold text-[#0B1F14]">{fmt(deal.dealValue)}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Commission Rate</p>
                <p className="font-semibold text-[#0B1F14]">
                  {deal.commissionRate != null ? `${deal.commissionRate}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Total Commission</p>
                <p className="font-semibold text-emerald-600">{fmt(deal.totalCommission)}</p>
              </div>
              {deal.notes && (
                <div className="col-span-3 pt-2 border-t border-stone-100">
                  <p className="text-xs text-stone-400 mb-0.5">Notes</p>
                  <p className="text-sm text-stone-600">{deal.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <h2 className="font-semibold text-[#0B1F14] mb-4">Timeline</h2>
          <div className="space-y-3">
            {[
              { label: 'Initiated',      date: deal.initiatedAt },
              { label: 'Agreed',         date: deal.agreedAt },
              { label: 'Completed',      date: deal.completedAt },
              { label: 'Fallen Through', date: deal.fallenAt },
            ].map(({ label, date }) => (
              date && (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-stone-600 w-32">{label}</span>
                  <span className="text-sm text-stone-400">{fmtDate(date)}</span>
                </div>
              )
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}