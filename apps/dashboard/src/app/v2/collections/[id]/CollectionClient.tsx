'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { apiDel } from '@/lib/api';
import Link from 'next/link';

function formatPrice(price: any) {
  if (!price) return 'On req.';
  const n = parseInt(price, 10);
  if (isNaN(n) || n <= 0) return 'On req.';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export function CollectionClient({ collection }: { collection: any }) {
  const router   = useRouter();
  const [items,    setItems]    = useState<any[]>(collection.items ?? []);
  const [removing, setRemoving] = useState<string | null>(null);

  async function removeItem(listingId: string) {
    setRemoving(listingId);
    try {
      await apiDel(`/collections/${collection.id}/items/${listingId}`);
      setItems((prev) => prev.filter((i) => i.listingId !== listingId));
    } finally {
      setRemoving(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-24 text-center">
        <span className="text-4xl mb-3">{collection.emoji ?? '📁'}</span>
        <p className="text-[15px] font-semibold text-slate-800">Collection is empty</p>
        <p className="mt-1 text-[13px] text-slate-400">Bookmark properties to add them here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item) => {
        const listing  = item.listing ?? {};
        const title    = [listing.bhk, listing.propertySubType].filter(Boolean).join(' ') || 'Property';
        const location = [listing.area, listing.city].filter(Boolean).join(', ') || '—';

        return (
          <div key={item.id} className="relative rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <Link href={`/v2/properties/${listing.id}`} className="block px-4 py-4">
              <p className="text-[14px] font-semibold text-slate-800 truncate">{title}</p>
              <p className="text-[12px] text-slate-400 mt-0.5 truncate">{location}</p>
              <p className="text-[15px] font-bold text-slate-900 mt-2">
                {formatPrice(listing.price)}
              </p>
              {listing.areaSqft && (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {listing.areaSqft.toLocaleString('en-IN')} sqft
                </p>
              )}
            </Link>
            <button
              onClick={() => removeItem(item.listingId)}
              disabled={removing === item.listingId}
              className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}