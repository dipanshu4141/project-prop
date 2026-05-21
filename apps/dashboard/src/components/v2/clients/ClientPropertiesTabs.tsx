'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiPatch } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ClientPropertyStatus = 'PENDING' | 'INTERESTED' | 'NOT_INTERESTED';
export type LeadStage = 'NEW' | 'CONTACTED' | 'VISIT' | 'NEGOTIATION' | 'CLOSED' | 'LOST';

export type ClientPropertyListing = {
  id:              string;
  bhk:             string | null;
  propertySubType: string | null;
  areaSqft:        number | null;
  city:            string | null;
  area:            string | null;
  price:           string | null;
};

export type ClientPropertyItem = {
  id:           string;
  status:       LeadStage;
  clientStatus: ClientPropertyStatus;
  sharedAt:     string;
  listing:      ClientPropertyListing;
};

type ClientPropertiesTabsProps = {
  clientProperties: ClientPropertyItem[];
};

// ── Static maps ───────────────────────────────────────────────────────────────

const CLIENT_STATUS_BADGE: Record<ClientPropertyStatus, string> = {
  INTERESTED:     'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700',
  NOT_INTERESTED: 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-red-100 text-red-600',
  PENDING:        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-700',
};

const CLIENT_STATUS_LABELS: Record<ClientPropertyStatus, string> = {
  INTERESTED:     'Interested',
  NOT_INTERESTED: 'Not Interested',
  PENDING:        'Pending',
};

const LEAD_STAGE_BADGE: Record<LeadStage, string> = {
  NEW:         'inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500',
  CONTACTED:   'inline-flex px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600',
  VISIT:       'inline-flex px-2 py-0.5 rounded text-xs bg-violet-50 text-violet-600',
  NEGOTIATION: 'inline-flex px-2 py-0.5 rounded text-xs bg-orange-50 text-orange-600',
  CLOSED:      'inline-flex px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700',
  LOST:        'inline-flex px-2 py-0.5 rounded text-xs bg-red-50 text-red-400',
};

type Tab = ClientPropertyStatus;
const TABS: { key: Tab; label: string; shortLabel: string }[] = [
  { key: 'PENDING',        label: 'Pending',        shortLabel: 'Pending'  },
  { key: 'INTERESTED',     label: 'Interested',     shortLabel: 'Interest' },
  { key: 'NOT_INTERESTED', label: 'Not Interested', shortLabel: 'Not Int.' },
];


// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(price: string | null | undefined): string {
  if (!price) return '—';
  const n = Number(price);
  if (isNaN(n) || n <= 0) return '—';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

// ── Client status dropdown ────────────────────────────────────────────────────

function ClientStatusDropdown({
  propertyId, current, onChange,
}: {
  propertyId: string;
  current:    ClientPropertyStatus;
  onChange:   (id: string, status: ClientPropertyStatus) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 group"
      >
        <span className={CLIENT_STATUS_BADGE[current]}>
          {CLIENT_STATUS_LABELS[current]}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          className="text-gray-400 group-hover:text-gray-600 transition-colors">
          <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 rounded-xl py-1 min-w-[170px]"
            style={{ background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.06)' }}>
            {(['PENDING', 'INTERESTED', 'NOT_INTERESTED'] as ClientPropertyStatus[]).map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(propertyId, opt); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <span className={CLIENT_STATUS_BADGE[opt]}>{CLIENT_STATUS_LABELS[opt]}</span>
                {opt === current && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Property row ──────────────────────────────────────────────────────────────

function PropertyRow({
  item, onClientStatusChange,
}: {
  item:                 ClientPropertyItem;
  onClientStatusChange: (id: string, status: ClientPropertyStatus) => void;
}) {
  const router = useRouter();
  const { listing } = item;
  const locationLine = [listing.area, listing.city].filter(Boolean).join(', ');
  const title = [
    listing.bhk ? `${listing.bhk}` : null,
    listing.propertySubType,
  ].filter(Boolean).join(' ') || 'Property';

  return (
    <tr
      onClick={() => router.push(`/v2/properties/${listing.id}`)}
      className="border-b border-gray-50 hover:bg-slate-50/70 cursor-pointer transition-colors"
    >
      <td className="py-3.5 pl-4 pr-2">
        <p className="font-semibold text-sm leading-tight text-slate-800">{title}</p>
        {locationLine && <p className="text-xs text-gray-400 mt-0.5">{locationLine}</p>}
      </td>

      <td className="py-3.5 px-2 text-sm text-gray-600 hidden sm:table-cell whitespace-nowrap">
        {listing.areaSqft ? `${listing.areaSqft.toLocaleString('en-IN')} sq ft` : '—'}
      </td>

      <td className="py-3.5 px-2 text-sm font-semibold text-slate-900 whitespace-nowrap">
        {formatPrice(listing.price)}
      </td>

      <td className="py-3.5 px-2 hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
        <span className={LEAD_STAGE_BADGE[item.status] ?? LEAD_STAGE_BADGE.NEW}>
          {item.status}
        </span>
      </td>

      <td className="py-3.5 pl-2 pr-4">
        <ClientStatusDropdown
          propertyId={item.id}
          current={item.clientStatus}
          onChange={onClientStatusChange}
        />
      </td>
    </tr>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyTab({ tab }: { tab: Tab }) {
  const messages: Record<Tab, string> = {
    PENDING:        'No properties pending client review.',
    INTERESTED:     "Client hasn't marked any properties as interested yet.",
    NOT_INTERESTED: 'No properties marked as not interested.',
  };
  return (
    <div className="py-12 text-center">
      <p className="text-gray-400 text-sm">{messages[tab]}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ClientPropertiesTabs({ clientProperties }: ClientPropertiesTabsProps) {
  const defaultTab = clientProperties.some((p) => p.clientStatus === 'INTERESTED')
    ? 'INTERESTED'
    : clientProperties.some((p) => p.clientStatus === 'PENDING')
    ? 'PENDING'
    : 'NOT_INTERESTED';

  const [items, setItems]         = useState<ClientPropertyItem[]>(clientProperties);
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [, startTransition]       = useTransition();

  const counts: Record<Tab, number> = {
    PENDING:        items.filter((i) => i.clientStatus === 'PENDING').length,
    INTERESTED:     items.filter((i) => i.clientStatus === 'INTERESTED').length,
    NOT_INTERESTED: items.filter((i) => i.clientStatus === 'NOT_INTERESTED').length,
  };

  const handleClientStatusChange = useCallback(
    async (propertyId: string, newStatus: ClientPropertyStatus) => {
      const prev = items.find((i) => i.id === propertyId)?.clientStatus;
      startTransition(() => {
        setItems((curr) =>
          curr.map((i) => i.id === propertyId ? { ...i, clientStatus: newStatus } : i),
        );
      });
      try {
        await apiPatch(`/client-properties/${propertyId}`, { clientStatus: newStatus });
      } catch {
        startTransition(() => {
          setItems((curr) =>
            curr.map((i) => i.id === propertyId ? { ...i, clientStatus: prev! } : i),
          );
        });
      }
    },
    [items],
  );

  const tabItems = items.filter((i) => i.clientStatus === activeTab);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-100">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 py-3 border-b border-gray-100 bg-[#F7F5F0]">
        <span className="text-xs font-semibold text-gray-400 mr-2 hidden sm:inline">
          Client Response:
        </span>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#0B1F14] text-white font-semibold'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
              ].join(' ')}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
              {counts[tab.key] > 0 && (
                <span className={[
                  'ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold',
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600',
                ].join(' ')}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      {tabItems.length === 0 ? (
        <EmptyTab tab={activeTab} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-2.5 pl-4 pr-2 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide">Property</th>
                <th className="py-2.5 px-2 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Area</th>
                <th className="py-2.5 px-2 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide">Price</th>
                <th className="py-2.5 px-2 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Pipeline</th>
                <th className="py-2.5 pl-2 pr-4 text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {tabItems.map((item) => (
                <PropertyRow
                  key={item.id}
                  item={item}
                  onClientStatusChange={handleClientStatusChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}