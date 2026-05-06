'use client';

// apps/dashboard/src/components/deals/StartDealModal.tsx
//
// Usage on listing detail page:
//   import { StartDealModal } from '@/components/deals/StartDealModal';
//   <StartDealModal listingId={listing.id} onSuccess={(dealId) => router.push(`/v2/deals/${dealId}`)} />

import { useState } from 'react';
import { apiPost } from '@/lib/api';

interface InterestedProperty {
  id: string;
  listing: {
    id: string;
    bhk: string | null;
    propertySubType: string | null;
    area: string | null;
    city: string | null;
    price: string | null;
  };
}

interface Props {
  listingId?: string;
  clientId?: string;
  clientName?: string | null;
  interestedProperties?: InterestedProperty[];
  onSuccess: (dealId: string) => void;
  onClose: () => void;
}

export function StartDealModal({ listingId, clientId, clientName, interestedProperties, onSuccess, onClose }: Props) {
  const [selectedListingId, setSelectedListingId] = useState(listingId ?? interestedProperties?.[0]?.listing?.id ?? '');
  const [dealValue, setDealValue] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [notes, setNotes]                 = useState('');
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState('');

  const commission =
    dealValue && commissionRate
      ? Math.round(Number(dealValue) * Number(commissionRate) / 100)
      : null;

  const handleSubmit = async () => {
    if (!selectedListingId) { setError('Please select a property'); return; }
    setSaving(true);
    setError('');
    try {
      const deal = await apiPost<{ id: string }>('/deals', {
        listingId:      selectedListingId,
        clientId:       clientId ?? undefined,
        dealValue:      dealValue      ? Number(dealValue)      : undefined,
        commissionRate: commissionRate ? Number(commissionRate) : undefined,
        notes:          notes || undefined,
      });
      onSuccess(deal.id);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to start deal');
    } finally {
      setSaving(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#0B1F14]">Start a Deal</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Property selector — only shown when coming from client page */}
        {interestedProperties && interestedProperties.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">
              Property <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedListingId}
              onChange={(e) => setSelectedListingId(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 transition-colors bg-white"
            >
              <option value="">Select a property…</option>
              {interestedProperties.map((cp) => {
                const l = cp.listing;
                const label = [l.bhk, l.propertySubType, l.area, l.city].filter(Boolean).join(' · ');
                return <option key={cp.id} value={l.id}>{label}</option>;
              })}
            </select>
          </div>
        )}

        <div className="space-y-4">
          {/* Deal Value */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">
              Deal Value (₹) <span className="text-stone-300 font-normal">optional</span>
            </label>
            <input
              type="number"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              placeholder="e.g. 8500000"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          {/* Commission Rate */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">
              Your Commission Rate (%) <span className="text-stone-300 font-normal">optional</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              placeholder="e.g. 2"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
            />
            {commission !== null && (
              <p className="text-xs text-emerald-600 mt-1.5 font-medium">
                Commission: ₹{new Intl.NumberFormat('en-IN').format(commission)}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">
              Notes <span className="text-stone-300 font-normal">optional</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Client name, offer details, anything relevant…"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 transition-colors resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Caveat about canonical property */}
          <p className="text-xs text-stone-400 bg-stone-50 rounded-lg px-3 py-2">
            This deal will be linked to the canonical property record for this listing. 
            All financial details can be updated later.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-emerald-600 text-white font-medium text-sm py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Starting…' : 'Start Deal'}
          </button>
          <button
            onClick={onClose}
            className="text-sm text-stone-500 border border-stone-200 px-4 py-2.5 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}