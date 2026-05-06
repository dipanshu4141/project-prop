// apps/dashboard/src/app/v2/admin/properties/page.tsx
// SuperAdmin only — shows deduplicated canonical properties

import { serverGet } from '@/lib/serverApi';
import { AdminPropertiesClient } from './AdminPropertiesClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CanonicalPropertyRow = {
  id:                  string;
  globalRefCode:       string;
  verified:            boolean;
  verifiedAt:          string | null;
  listingCount:        number;
  totalDealsCompleted: number;
  lastDealAt:          string | null;
  createdAt:           string;
  bhk:                 string | null;
  city:                string | null;
  area:                string | null;
  propertySubType:     string | null;
  listingType:         'RENT' | 'SALE' | null;
  price:               string | null;
  availability:        string | null;
  pendingDuplicates:   number;
};

export type AdminStats = {
  totalCanonical:   number;
  verified:         number;
  unverified:       number;
  multiListed:      number;
  pendingDuplicates: number;
};

export type CanonicalListResponse = {
  items: CanonicalPropertyRow[];
  total: number;
  pages: number;
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
const params = await searchParams;
const qs = new URLSearchParams();
if (params.page)           qs.set('page',           params.page);
if (params.q)              qs.set('q',              params.q);
if (params.verified)       qs.set('verified',       params.verified);
if (params.duplicatesOnly) qs.set('duplicatesOnly', params.duplicatesOnly);
if (params.sortBy)         qs.set('sortBy',         params.sortBy);
if (params.sortOrder)      qs.set('sortOrder',      params.sortOrder);
qs.set('limit', '20');

  const [listData, stats] = await Promise.all([
    serverGet<CanonicalListResponse>(`/admin/properties?${qs.toString()}`),
    serverGet<AdminStats>('/admin/properties/stats'),
  ]);

  return (
    <AdminPropertiesClient
      initialData={listData}
      stats={stats}
      searchParams={params}
    />
  );
}