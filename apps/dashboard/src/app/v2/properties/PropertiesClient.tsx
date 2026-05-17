'use client';

// apps/dashboard/src/app/v2/properties/PropertiesClient.tsx

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, List, Share2, X, ChevronLeft, ChevronRight, FolderPlus } from 'lucide-react';
// import { apiGet } from '@/lib/api';
import { AddToShortlistModal } from '@/components/v2/shortlists/AddToShortlistModal';
import { apiGet, apiPost } from '@/lib/api';


import PropertyFilters, {
  type PropertyFiltersValue,
  type DatePreset,
} from './PropertyFilters';
import { PropertyCard, type Property } from '@/components/v2/cards/PropertyCard';
import { ShareMultiplePropertiesModal } from '@/components/v2/property/ShareMultiplePropertiesModal';

const LIMIT = 8;
const SCROLL_KEY = 'properties-scroll-y';
const FURNISHING_VALUES = ['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED'] as const;
const DATE_PRESETS: DatePreset[] = ['TODAY', 'LAST_7_DAYS', 'LAST_14_DAYS', 'LAST_30_DAYS'];
const SORT_OPTIONS = [
  { label: 'Last seen',         value: 'last_seen'      },
  { label: 'Last activity',     value: 'last_activity'  },
  { label: 'Newest first',      value: 'createdAt_desc' },
  { label: 'Oldest first',      value: 'createdAt_asc'  },
  { label: 'Urgent',            value: 'urgent'         },
  { label: 'Most shared',       value: 'most_shared'    },
  { label: 'Price: Low to High',value: 'price_asc'      },
  { label: 'Price: High to Low',value: 'price_desc'     },
];

function parseArray(v: string | null): string[] {
  if (!v) return [];
  return v.split(',').filter(Boolean);
}
function serializeArray(v?: string[]): string | undefined {
  if (!v || v.length === 0) return undefined;
  return v.join(',');
}
function parseEnumArray<T extends readonly string[]>(raw: string | null, allowed: T): T[number][] {
  if (!raw) return [];
  const set = new Set(allowed);
  return raw.split(',').filter((v): v is T[number] => set.has(v));
}
function updateParam(params: URLSearchParams, key: string, value: string | number): string {
  const p = new URLSearchParams(params.toString());
  p.set(key, String(value));
  return p.toString();
}
function buildPageRange(current: number, total: number): (number | 'e')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'e')[] = [1];
  if (current > 3) pages.push('e');
  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);
  if (current < total - 2) pages.push('e');
  pages.push(total);
  return pages;
}

function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-[14px] bg-white border border-slate-100 overflow-hidden">
      <div className="h-[3px] w-full bg-slate-100 animate-pulse" />
      <div className="w-full bg-slate-100 animate-pulse" style={{ aspectRatio: '16/9' }} />
      <div className="px-3.5 pt-3 pb-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-3 w-32 rounded bg-slate-100 animate-pulse" />
          <div className="h-3 w-14 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="h-2.5 w-28 rounded bg-slate-100 animate-pulse" />
        <div className="h-2.5 w-20 rounded bg-slate-100 animate-pulse" />
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-50">
          <div className="h-6 w-24 rounded-lg bg-slate-100 animate-pulse" />
          <div className="h-2.5 w-16 rounded bg-slate-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function PageBtn({
  children, active, disabled, onClick, 'aria-label': ariaLabel,
}: {
  children: React.ReactNode; active?: boolean; disabled?: boolean;
  onClick?: () => void; 'aria-label'?: string;
}) {
  return (
    <button
      onClick={onClick} disabled={disabled} aria-label={ariaLabel}
      className={[
        'flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition-all duration-150',
        active  ? 'border-[#0B1F14] bg-[#0B1F14] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900',
        disabled ? 'opacity-40 cursor-not-allowed' : '',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export default function PropertiesClient() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [items,   setItems]   = useState<Property[]>([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(false);
  const lastQueryRef = useRef(searchParams.toString());
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});


  const [selectedMap,   setSelectedMap]   = useState<Record<string, Property | null>>({});
  const [selectionMode, setSelectionMode] = useState(false);
  const [shareOpen,     setShareOpen]     = useState(false);
  const [shortlistOpen, setShortlistOpen] = useState(false);

  const page          = Number(searchParams.get('page') || 1);
  const sort = searchParams.get('sort') || 'last_seen';
  const selectedCount = Object.keys(selectedMap).length;

  const selectedIdsFromUrl = useMemo(() => {
    const raw = searchParams.get('selected');
    return raw ? raw.split(',') : [];
  }, [searchParams]);

  function toggleSelect(property: Property) {
    setSelectedMap((prev) => {
      const copy = { ...prev };
      if (copy[property.id]) delete copy[property.id];
      else copy[property.id] = property;
      return copy;
    });
  }
  function clearSelection() { setSelectedMap({}); setSelectionMode(false); }

  useEffect(() => {
    const currentQuery = searchParams.toString();
    if (lastQueryRef.current !== currentQuery) {
      sessionStorage.removeItem(SCROLL_KEY);
      lastQueryRef.current = currentQuery;
    }
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  useEffect(() => { if (selectedCount > 0) setSelectionMode(true); }, [selectedCount]);

  useEffect(() => {
    if (selectedIdsFromUrl.length === 0) return;
    setSelectedMap((prev) => {
      const copy = { ...prev };
      selectedIdsFromUrl.forEach((id) => { if (!(id in copy)) copy[id] = null; });
      return copy;
    });
  }, [selectedIdsFromUrl]);

  useEffect(() => {
    if (items.length === 0) return;
    setSelectedMap((prev) => {
      let changed = false;
      const copy = { ...prev };
      items.forEach((p) => { if (copy[p.id] === null) { copy[p.id] = p; changed = true; } });
      return changed ? copy : prev;
    });
  }, [items]);

  useEffect(() => {
    const ids     = Object.keys(selectedMap);
    const params  = new URLSearchParams(searchParams.toString());
    const current = params.get('selected') || '';
    if (ids.join(',') === current) return;
    if (ids.length > 0) { params.set('selected', ids.join(',')); params.set('select', '1'); }
    else { params.delete('selected'); params.delete('select'); }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [selectedMap, router, searchParams]);

  const filters: PropertyFiltersValue = useMemo(() => {
    const rawPreset = searchParams.get('datePreset');
    return {
      listingType:
        searchParams.get('listingType') === 'RENT' || searchParams.get('listingType') === 'SALE'
          ? (searchParams.get('listingType') as 'RENT' | 'SALE') : undefined,
      propertyCategory:
        searchParams.get('propertyCategory') === 'RESIDENTIAL' || searchParams.get('propertyCategory') === 'COMMERCIAL'
          ? (searchParams.get('propertyCategory') as 'RESIDENTIAL' | 'COMMERCIAL') : undefined,
      q:          searchParams.get('q')        || undefined,
      minPrice:   searchParams.get('minPrice') || undefined,
      maxPrice:   searchParams.get('maxPrice') || undefined,
      bhk:        parseArray(searchParams.get('bhk')),
      furnishing: parseEnumArray(searchParams.get('furnishing'), FURNISHING_VALUES),
      tenantTypes:        parseArray(searchParams.get('tenantTypes')),
      tenantRestrictions: parseArray(searchParams.get('tenantRestrictions')),
      datePreset: DATE_PRESETS.includes(rawPreset as DatePreset) ? (rawPreset as DatePreset) : undefined,
      fromDate:   searchParams.get('fromDate') || undefined,
      toDate:     searchParams.get('toDate')   || undefined,
    };
  }, [searchParams]);

  function applyFilters(next: PropertyFiltersValue) {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('sort', sort);
    if (next.listingType)      params.set('listingType',      next.listingType);
    if (next.propertyCategory) params.set('propertyCategory', next.propertyCategory);
    if (next.q)                params.set('q',                next.q);
    if (next.minPrice)         params.set('minPrice',         next.minPrice);
    if (next.maxPrice)         params.set('maxPrice',         next.maxPrice);
    const bhk = serializeArray(next.bhk);
    if (bhk) params.set('bhk', bhk);
    const furnishing = serializeArray(next.furnishing);
    if (furnishing) params.set('furnishing', furnishing);
    const tenantTypes = serializeArray(next.tenantTypes);
    if (tenantTypes) params.set('tenantTypes', tenantTypes);
    const tenantRestrictions = serializeArray(next.tenantRestrictions);
    if (tenantRestrictions) params.set('tenantRestrictions', tenantRestrictions);
    if (next.datePreset) { params.set('datePreset', next.datePreset); }
    else {
      if (next.fromDate) params.set('fromDate', next.fromDate);
      if (next.toDate)   params.set('toDate',   next.toDate);
    }
    router.push(`?${params.toString()}`);
  }


  // ADD effect after fetchProperties sets items — replace the existing fetchProperties function:
  async function fetchProperties() {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set('limit', LIMIT.toString());
      if (sort === 'urgent' || sort === 'most_shared' || sort === 'last_activity' || sort === 'last_seen') {
        params.set('sort', sort);
        params.delete('sortBy'); params.delete('sortOrder');
      } else {
        const [sortBy, sortOrder] = sort.split('_');
        params.delete('sort');
        params.set('sortBy', sortBy);
        params.set('sortOrder', sortOrder);
      }
      const data = await apiGet<{ items: Property[]; total: number; pages: number }>(
        `/properties?${params.toString()}`,
      );
      const fetchedItems = data.items || [];
      setItems(fetchedItems);
      setTotal(data.total  || 0);
      setPages(data.pages  || 1);

      // Fetch saved status for all visible listings
      if (fetchedItems.length > 0) {
        try {
          const { apiPost } = await import('@/lib/api');
          const saved = await apiPost<Record<string, boolean>>(
            '/collections/saved-status/batch',
            { listingIds: fetchedItems.map((p) => p.id) },
          );
          setSavedMap(saved);
        } catch {
          // non-fatal
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* FULL-BLEED BREAKOUT — -mx-6 cancels PageContainer padding */}
      <div className="-mx-6">
        {/* Filter bar — z-20 so z-30 dropdowns inside it clear the z-10 toolbar */}
        <div className="relative z-20">
          <PropertyFilters value={filters} onChange={applyFilters} isOpen={true} onToggle={() => {}} />
        </div>

        {/* Toolbar — z-10, below filter bar stacking context */}
        <div className="relative z-10 flex items-center justify-between px-6 py-3 bg-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            {!loading && total > 0 && (
              <p className="text-[13px] text-slate-500">
                <span className="font-semibold text-slate-800">{total.toLocaleString('en-IN')}</span> properties
              </p>
            )}
            <button
              onClick={() => { if (selectionMode) clearSelection(); else setSelectionMode(true); }}
              className={[
                'h-7 rounded-lg px-3 text-xs font-semibold border transition-all duration-150',
                selectionMode
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700',
              ].join(' ')}
            >
              {selectionMode ? 'Cancel' : 'Select'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('sort', e.target.value);
                params.set('page', '1');
                router.push(`?${params.toString()}`);
              }}
              className="h-8 rounded-lg border border-slate-200 bg-white px-3 pr-7 text-xs font-medium text-slate-600 focus:outline-none focus:border-slate-400 appearance-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="flex gap-1">
              <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#0B1F14] bg-[#0B1F14] text-white">
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-600 transition-all">
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* END BREAKOUT */}

      <div className="mt-5">
        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: LIMIT }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty */}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">🏠</div>
            <p className="text-[15px] font-semibold text-slate-800">No properties found</p>
            <p className="mt-1 text-[13px] text-slate-400">Try adjusting your filters or add a new listing.</p>
          </div>
        )}

        {/*
          Grid — each card owns its own availability state (Option B).
          Tapping the status badge fires stopPropagation so the card-level
          onClick (which navigates to detail) does NOT trigger.
          The grid reflects fresh availability on the next fetch only.
        */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((property) => (
              <div
                key={property.id}
                className="cursor-pointer"
                onClick={() => {
                  if (!selectionMode) {
                    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
                    router.push(`/v2/properties/${property.id}`);
                  }
                }}
              >
                <PropertyCard
                  property={property}
                  selectionMode={selectionMode}
                  selected={Boolean(selectedMap[property.id])}
                  savedInCollection={savedMap[property.id] ?? false}
                  onToggleSelect={() => toggleSelect(property)}
                  onView={() => {
                    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
                    router.push(`/v2/properties/${property.id}`);
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-1.5">
            <PageBtn disabled={page <= 1} onClick={() => router.push(`?${updateParam(searchParams, 'page', page - 1)}`)} aria-label="Previous">
              <ChevronLeft className="h-3.5 w-3.5" />
            </PageBtn>
            {buildPageRange(page, pages).map((p, i) =>
              p === 'e' ? (
                <span key={`el-${i}`} className="w-8 text-center text-xs text-slate-400">…</span>
              ) : (
                <PageBtn key={p} active={p === page} onClick={() => router.push(`?${updateParam(searchParams, 'page', p as number)}`)}>
                  {p}
                </PageBtn>
              )
            )}
            <PageBtn disabled={page >= pages} onClick={() => router.push(`?${updateParam(searchParams, 'page', page + 1)}`)} aria-label="Next">
              <ChevronRight className="h-3.5 w-3.5" />
            </PageBtn>
          </div>
        )}
      </div>

      {/* FLOATING SHARE BAR */}
      <div
        className={[
          'fixed bottom-6 left-1/2 z-50 -translate-x-1/2',
          'flex min-w-[340px] items-center gap-4 rounded-2xl',
          'bg-[#0B1F14] px-5 py-3.5',
          'border border-white/10 shadow-2xl',
          'transition-all duration-300 ease-out',
          selectedCount > 0
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-6 opacity-0 pointer-events-none',
        ].join(' ')}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">
            {selectedCount}
          </span>
          <span className="text-[13px] font-medium text-white/90">
            {selectedCount === 1 ? 'property' : 'properties'} selected
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={clearSelection} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
         <button
            onClick={() => setShortlistOpen(true)}
            disabled={selectedCount > 20}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-1.5 text-[13px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            Add to shortlist
          </button>
        </div>
      </div>

      {shortlistOpen && (
        <AddToShortlistModal
          listingIds={Object.keys(selectedMap)}
          onClose={() => { setShortlistOpen(false); setSelectedMap({}); setSelectionMode(false); }}
        />
      )}
    </>
  );
}