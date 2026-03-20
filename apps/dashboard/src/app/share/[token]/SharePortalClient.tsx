'use client';

// apps/dashboard/src/app/share/[token]/SharePortalClient.tsx

import { useState, useCallback } from 'react';
import type { ShareData, ShareProperty } from './page';

// ── Config ────────────────────────────────────────────────────────────────────

const API_BASE = ''

// ── Static class maps (no dynamic Tailwind) ───────────────────────────────────

const BTN_INTERESTED_DEFAULT =
  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-emerald-400 text-emerald-700 bg-white font-semibold text-sm transition-all active:scale-95';
const BTN_INTERESTED_ACTIVE =
  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-emerald-500 text-white bg-emerald-500 font-semibold text-sm transition-all active:scale-95';
const BTN_INTERESTED_MUTED =
  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-gray-300 bg-gray-50 font-semibold text-sm cursor-default';

const BTN_NOT_DEFAULT =
  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-300 text-red-500 bg-white font-semibold text-sm transition-all active:scale-95';
const BTN_NOT_ACTIVE =
  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-500 text-white bg-red-500 font-semibold text-sm transition-all active:scale-95';
const BTN_NOT_MUTED =
  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-gray-300 bg-gray-50 font-semibold text-sm cursor-default';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(price: string | number | null | undefined): string {
  if (price == null || price === '') return 'Price on request';
  const n = Number(price);
  if (isNaN(n) || n <= 0) return 'Price on request';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatArea(area: number | null, unit: string | null): string {
  if (!area) return '';
  return `${area.toLocaleString('en-IN')} ${unit ?? 'sq ft'}`;
}

const PROPERTY_TYPE_ICONS: Record<string, string> = {
  APARTMENT:  '🏢',
  VILLA:      '🏡',
  OFFICE:     '🏢',
  SHOP:       '🏪',
  WAREHOUSE:  '🏭',
  SHOWROOM:   '🏪',
  PLOT:       '🗺️',
  OTHER:      '🏠',
};

function propertyIcon(type: string | null): string {
  if (!type) return '🏠';
  return PROPERTY_TYPE_ICONS[type.toUpperCase()] ?? '🏠';
}

// ── Card ──────────────────────────────────────────────────────────────────────

type ClientStatus = 'PENDING' | 'INTERESTED' | 'NOT_INTERESTED';

function PropertyCard({
  property,
  onRespond,
}: {
  property: ShareProperty & { clientStatus: ClientStatus };
  onRespond: (id: string, status: 'INTERESTED' | 'NOT_INTERESTED') => void;
}) {
  const { listing, clientStatus } = property;

  const interestedClass =
    clientStatus === 'INTERESTED'     ? BTN_INTERESTED_ACTIVE :
    clientStatus === 'NOT_INTERESTED' ? BTN_INTERESTED_MUTED  : BTN_INTERESTED_DEFAULT;

  const notInterestedClass =
    clientStatus === 'NOT_INTERESTED' ? BTN_NOT_ACTIVE :
    clientStatus === 'INTERESTED'     ? BTN_NOT_MUTED   : BTN_NOT_DEFAULT;

  const detailParts = [
    listing.bhk ? `${listing.bhk} BHK` : null,
    listing.propertyType,
    formatArea(listing.area, listing.areaUnit),
  ].filter(Boolean).join('  ·  ');

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#fff', boxShadow: '0 2px 12px rgba(11,31,20,0.08)' }}
    >
      {/* Image / placeholder */}
      <div
        className="relative w-full"
        style={{ aspectRatio: '16/9', background: '#E8E4DB' }}
      >
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt={listing.propertyType ?? 'Property'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-40">{propertyIcon(listing.propertyType)}</span>
          </div>
        )}

        {/* Status badge overlay */}
        {clientStatus !== 'PENDING' && (
          <div
            className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold"
            style={
              clientStatus === 'INTERESTED'
                ? { background: '#10b981', color: '#fff' }
                : { background: '#ef4444', color: '#fff' }
            }
          >
            {clientStatus === 'INTERESTED' ? '✓ Interested' : '✗ Not Interested'}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3
            className="font-bold text-base leading-tight"
            style={{ color: '#0B1F14' }}
          >
            {[listing.bhk ? `${listing.bhk} BHK` : null, listing.propertyType]
              .filter(Boolean)
              .join(' ') || 'Property'}
          </h3>
          <span className="font-bold text-base whitespace-nowrap" style={{ color: '#059669' }}>
            {formatPrice(listing.price)}
          </span>
        </div>

        {(listing.city || listing.locality) && (
          <p className="text-gray-500 text-sm mb-1">
            📍 {[listing.locality, listing.city].filter(Boolean).join(', ')}
          </p>
        )}

        {detailParts && (
          <p className="text-gray-400 text-xs mb-3">{detailParts}</p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            className={interestedClass}
            onClick={() => clientStatus !== 'INTERESTED' && onRespond(property.id, 'INTERESTED')}
            aria-label="Mark as interested"
          >
            <span className="text-base">✅</span>
            Interested
          </button>

          <button
            className={notInterestedClass}
            onClick={() => clientStatus !== 'NOT_INTERESTED' && onRespond(property.id, 'NOT_INTERESTED')}
            aria-label="Mark as not interested"
          >
            <span className="text-base">❌</span>
            Not Interested
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ total, responded }: { total: number; responded: number }) {
  const pct = total === 0 ? 0 : Math.round((responded / total) * 100);
  return (
    <div className="px-1 mb-2">
      <div className="flex justify-between text-xs mb-1" style={{ color: '#0B1F14' }}>
        <span className="font-medium">{responded} of {total} reviewed</span>
        <span className="opacity-60">{pct}%</span>
      </div>
      <div className="w-full rounded-full" style={{ height: 4, background: 'rgba(11,31,20,0.1)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: '#10b981' }}
        />
      </div>
    </div>
  );
}

// ── Completion screen ─────────────────────────────────────────────────────────

function CompletionScreen({ brokerName }: { brokerName: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 text-center py-16">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: '#d1fae5' }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path
            d="M8 21l8 8L32 12"
            stroke="#10b981"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-3" style={{ color: '#0B1F14' }}>
        All done!
      </h2>
      <p className="text-gray-500 leading-relaxed max-w-xs">
        Thanks for sharing your preferences.{' '}
        <strong>{brokerName}</strong> has been notified and will follow up shortly.
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SharePortalClient({
  token,
  initialData,
}: {
  token:       string;
  initialData: ShareData;
}) {
  // Optimistic map: clientPropertyId → clientStatus
  const [statuses, setStatuses] = useState<Record<string, ClientStatus>>(() => {
    const m: Record<string, ClientStatus> = {};
    for (const p of initialData.properties) {
      m[p.id] = p.clientStatus as ClientStatus;
    }
    return m;
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const total     = initialData.properties.length;
  const responded = Object.values(statuses).filter(
    (s) => s === 'INTERESTED' || s === 'NOT_INTERESTED',
  ).length;
  const allDone = responded === total && total > 0;

  const handleRespond = useCallback(
    async (clientPropertyId: string, status: 'INTERESTED' | 'NOT_INTERESTED') => {
      const prev = statuses[clientPropertyId];

      // Optimistic update — instant feedback
      setStatuses((s) => ({ ...s, [clientPropertyId]: status }));
      setErrors((e)  => ({ ...e, [clientPropertyId]: false }));

      try {
        const res = await fetch(`/api/public/share/${token}/respond`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ clientPropertyId, status }),
        });
        if (!res.ok) throw new Error('Request failed');
      } catch {
        // Revert on failure
        setStatuses((s) => ({ ...s, [clientPropertyId]: prev }));
        setErrors((e)  => ({ ...e, [clientPropertyId]: true }));
      }
    },
    [token, statuses],
  );

  const properties = initialData.properties.map((p) => ({
    ...p,
    clientStatus: (statuses[p.id] ?? p.clientStatus) as ClientStatus,
  }));

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F7F5F0' }}>

      {/* Header */}
      <header className="sticky top-0 z-20 px-4 py-4" style={{ background: '#0B1F14' }}>
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" fill="#fff" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">{initialData.workspaceName}</p>
              <p className="text-emerald-400 text-xs">Properties for {initialData.clientName}</p>
            </div>
          </div>
          <div
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}
          >
            {total} {total === 1 ? 'property' : 'properties'}
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-5 pb-10">

        {total > 0 && <ProgressBar total={total} responded={responded} />}

        {allDone ? (
          <>
            <CompletionScreen brokerName={initialData.workspaceName} />
            {/* Show all cards below completion screen so client can change mind */}
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3 px-1"
              style={{ color: '#0B1F14', opacity: 0.4 }}
            >
              Your responses
            </p>
          </>
        ) : null}

        <div className="flex flex-col gap-4 mt-3">
          {properties.map((p) => (
            <div key={p.id}>
              <PropertyCard property={p} onRespond={handleRespond} />
              {errors[p.id] && (
                <p className="text-red-500 text-xs mt-1 px-1">
                  ⚠️ Couldn't save — tap again to retry.
                </p>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-6 pt-2 text-center">
        <p className="text-gray-400 text-xs">
          Powered by <span style={{ color: '#0B1F14' }} className="font-semibold">PropertyAI</span>
        </p>
      </footer>
    </div>
  );
}