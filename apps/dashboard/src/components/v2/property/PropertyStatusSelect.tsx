'use client';

// apps/dashboard/src/components/v2/property/PropertyStatusSelect.tsx

import { useState, useRef, useEffect } from 'react';
import { apiPatch } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AvailabilityStatus =
  | 'AVAILABLE'
  | 'UNDER_NEGOTIATION'
  | 'CLOSED'
  | 'ON_HOLD';

export type PropertyStatusSelectProps = {
  listingId:      string;
  current:        AvailabilityStatus;
  onChange?:      (status: AvailabilityStatus) => void;
  onConfirmed?:   (status: AvailabilityStatus) => void;
  onError?:       (revertedTo: AvailabilityStatus) => void;
  onOpenChange?:  (open: boolean) => void;
  variant?:       'default' | 'compact';
  disabled?:      boolean;
};

// ── Config ────────────────────────────────────────────────────────────────────

export const AVAILABILITY_STATUSES: AvailabilityStatus[] = [
  'AVAILABLE',
  'UNDER_NEGOTIATION',
  'CLOSED',
  'ON_HOLD',
];

type StatusMeta = {
  label:      string;
  shortLabel: string;
  dot:        string;
  badge:      string;
  menuItem:   string;
};

const STATUS_STYLES: Record<AvailabilityStatus, StatusMeta> = {
  AVAILABLE: {
    label:      'Available',
    shortLabel: 'Available',
    dot:        'bg-emerald-500',
    badge:      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200',
    menuItem:   'hover:bg-emerald-50',
  },
  UNDER_NEGOTIATION: {
    label:      'Under Negotiation',
    shortLabel: 'Negotiating',
    dot:        'bg-amber-400',
    badge:      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200',
    menuItem:   'hover:bg-amber-50',
  },
  CLOSED: {
    label:      'Closed',
    shortLabel: 'Closed',
    dot:        'bg-slate-400',
    badge:      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200',
    menuItem:   'hover:bg-slate-50',
  },
  ON_HOLD: {
    label:      'On Hold',
    shortLabel: 'On Hold',
    dot:        'bg-orange-400',
    badge:      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200',
    menuItem:   'hover:bg-orange-50',
  },
};

// ── Safe normaliser ───────────────────────────────────────────────────────────
// Coerces any incoming value (null, undefined, unknown string) to a valid key.
// This is the single place that absorbs stale DB rows, unset fields, and
// any future values that arrive before a schema migration runs.

function normalise(raw: unknown): AvailabilityStatus {
  if (typeof raw === 'string' && raw in STATUS_STYLES) {
    return raw as AvailabilityStatus;
  }
  return 'AVAILABLE';
}

// ── Dot ───────────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: AvailabilityStatus }) {
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_STYLES[status].dot}`} />;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PropertyStatusSelect({
  listingId,
  current,
  onChange,
  onConfirmed,
  onError,
  onOpenChange,
  variant  = 'default',
  disabled = false,
}: PropertyStatusSelectProps) {
  // normalise() guards against null / undefined / unknown strings on initialisation
  const [status,   setStatus]   = useState<AvailabilityStatus>(() => normalise(current));
  const [open,     setOpen]     = useState(false);
  const [dropUp,   setDropUp]   = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [hasError, setHasError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Also normalise on prop updates (e.g. parent refetches data)
  useEffect(() => { setStatus(normalise(current)); }, [current]);

  useEffect(() => { onOpenChange?.(open); }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const handleSelect = async (next: AvailabilityStatus) => {
    if (next === status || disabled) return;
    const prev = status;
    setOpen(false);
    setStatus(next);
    setHasError(false);
    setSaving(true);
    onChange?.(next);

    try {
      await apiPatch(`/properties/${listingId}/availability`, { availability: next });
      onConfirmed?.(next);
    } catch {
      setStatus(prev);
      setHasError(true);
      onError?.(prev);
      setTimeout(() => setHasError(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  // Safe lookup — will never be undefined now that status is normalised
  const meta = STATUS_STYLES[status];

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) {
            if (!open && ref.current) {
              const rect = ref.current.getBoundingClientRect();
              setDropUp(window.innerHeight - rect.bottom < 220);
            }
            setOpen((o) => !o);
          }
        }}
        className={meta.badge}
        style={{ cursor: disabled ? 'default' : 'pointer' }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <StatusDot status={status} />
        {variant === 'compact' ? meta.shortLabel : meta.label}
        {!disabled && (
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            className="opacity-50 flex-shrink-0"
            style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }}
          >
            <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {(saving || hasError) && (
          <span className="ml-0.5 text-xs" style={{ color: hasError ? '#ef4444' : '#9ca3af' }}>
            {hasError ? '!' : '…'}
          </span>
        )}
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute left-0 z-[200] rounded-xl overflow-hidden min-w-[190px] ${dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}
          style={{
            background: '#fff',
            boxShadow:  '0 4px 24px rgba(11,31,20,0.13)',
            border:     '1px solid rgba(11,31,20,0.07)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-1">
            {AVAILABILITY_STATUSES.map((s) => {
              const m = STATUS_STYLES[s];
              return (
                <button
                  key={s}
                  role="option"
                  aria-selected={s === status}
                  onClick={() => handleSelect(s)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${m.menuItem}`}
                >
                  <span className={m.badge} style={{ pointerEvents: 'none' }}>
                    <StatusDot status={s} />
                    {m.label}
                  </span>
                  {s === status && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7l3.5 3.5 5.5-7" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Display-only badge ────────────────────────────────────────────────────────

export function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  const safe = normalise(status);
  return (
    <span className={STATUS_STYLES[safe].badge}>
      <StatusDot status={safe} />
      {STATUS_STYLES[safe].label}
    </span>
  );
}