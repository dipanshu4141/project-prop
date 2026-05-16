'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, Trash2, Phone, X } from 'lucide-react';
import { apiDel, apiPost } from '@/lib/api';
import { ShareMultiplePropertiesModal } from '@/components/v2/property/ShareMultiplePropertiesModal';

function formatPrice(price: any) {
  if (!price) return 'On req.';
  const n = parseInt(price, 10);
  if (isNaN(n) || n <= 0) return 'On req.';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function agentPhone(listing: any): string | null {
  return listing?.listingAgents?.[0]?.agent?.phones?.[0]?.phone ?? null;
}

export function ShortlistClient({ shortlist }: { shortlist: any }) {
  const router = useRouter();
  const [items,       setItems]       = useState<any[]>(shortlist.items ?? []);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [shareOpen,   setShareOpen]   = useState(false);
  const [removing,    setRemoving]    = useState<string | null>(null);

  const client     = shortlist.client;
  const clientPhone = client?.phones?.[0]?.phone ?? '';

  function toggleSelect(listingId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(listingId) ? next.delete(listingId) : next.add(listingId);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(items.map((i) => i.listingId)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function removeItem(listingId: string) {
    setRemoving(listingId);
    try {
      await apiDel(`/shortlists/${shortlist.id}/items/${listingId}`);
      setItems((prev) => prev.filter((i) => i.listingId !== listingId));
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(listingId); return n; });
    } finally {
      setRemoving(null);
    }
  }

  // Build propertiesMap for ShareMultiplePropertiesModal
  const propertiesMap: Record<string, any> = {};
  items.forEach((item) => {
    if (selectedIds.has(item.listingId)) {
      propertiesMap[item.listingId] = {
        ...item.listing,
        id:    item.listingId,
        price: item.listing?.price?.toString() ?? null,
      };
    }
  });

  return (
    <>
      {/* Info bar */}
      <div className="mb-4 rounded-2xl bg-white border border-slate-100 shadow-sm px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[15px] font-bold text-slate-900">{client?.name ?? 'Client'}</p>
          <p className="text-[12px] text-slate-400 mt-0.5">{items.length} properties in shortlist</p>
        </div>
        {clientPhone && (
          <a
            href={`tel:${clientPhone}`}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] font-medium text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
          >
            <Phone className="h-3.5 w-3.5" />
            {clientPhone}
          </a>
        )}
      </div>

      {/* Select all / actions row */}
      {items.length > 0 && (
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={selectedIds.size === items.length ? clearSelection : selectAll}
            className="text-[12px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            {selectedIds.size === items.length ? 'Deselect all' : 'Select all'}
          </button>
          {selectedIds.size > 0 && (
            <span className="text-[12px] text-slate-400">{selectedIds.size} selected</span>
          )}
        </div>
      )}

      {/* Property list */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
          <div className="mb-3 text-3xl">📋</div>
          <p className="text-[15px] font-semibold text-slate-800">No properties in shortlist</p>
          <p className="mt-1 text-[13px] text-slate-400">Go to properties page and add more.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const listing  = item.listing ?? {};
            const selected = selectedIds.has(item.listingId);
            const phone    = agentPhone(listing);
            const title    = [listing.bhk, listing.propertySubType].filter(Boolean).join(' ') || 'Property';
            const location = [listing.area, listing.city].filter(Boolean).join(', ') || '—';

            return (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.listingId)}
                className={[
                  'flex items-center gap-4 rounded-2xl bg-white border px-4 py-3.5 cursor-pointer transition-all',
                  selected
                    ? 'border-emerald-400 shadow-[0_0_0_2px_rgba(52,211,153,0.15)]'
                    : 'border-slate-100 shadow-sm hover:border-slate-200',
                ].join(' ')}
              >
                {/* Checkbox */}
                <div className={[
                  'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all',
                  selected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white',
                ].join(' ')}>
                  {selected && <span className="text-white text-[10px] font-bold">✓</span>}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 truncate">{title}</p>
                  <p className="text-[11px] text-slate-400 truncate">{location}</p>
                </div>

                {/* Price */}
                <p className="text-[13px] font-bold text-slate-900 flex-shrink-0">
                  {formatPrice(listing.price)}
                </p>

                {/* Agent phone — tap to call */}
                {phone && (
                  < a
                    href={`tel:${phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
                    title={`Call agent: ${phone}`}
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                )}

                {/* Remove */}
                <button
                  onClick={(e) => { e.stopPropagation(); removeItem(item.listingId); }}
                  disabled={removing === item.listingId}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating send bar */}
      <div className={[
        'fixed bottom-6 left-1/2 z-50 -translate-x-1/2',
        'flex min-w-[320px] items-center gap-4 rounded-2xl',
        'bg-[#0B1F14] px-5 py-3.5',
        'border border-white/10 shadow-2xl',
        'transition-all duration-300 ease-out',
        selectedIds.size > 0
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-6 opacity-0 pointer-events-none',
      ].join(' ')}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">
            {selectedIds.size}
          </span>
          <span className="text-[13px] font-medium text-white/90">
            {selectedIds.size === 1 ? 'property' : 'properties'} selected
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={clearSelection}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-1.5 text-[13px] font-semibold text-white transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share via WhatsApp
          </button>
        </div>
      </div>

      {/* Reuse existing modal — zero changes */}
      {shareOpen && (
        <ShareMultiplePropertiesModal
          propertiesMap={propertiesMap}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}