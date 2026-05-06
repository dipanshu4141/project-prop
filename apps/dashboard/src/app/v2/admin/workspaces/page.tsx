// apps/dashboard/src/app/v2/admin/workspaces/page.tsx
import { serverGet } from '@/lib/serverApi';
import { AdminWorkspacesClient } from './AdminWorkspacesClient';

export type WorkspaceRow = {
  id: string; name: string; slug: string; type: string;
  email: string | null; phone: string | null; city: string | null;
  plan: string; isActive: boolean; suspendedAt: string | null;
  suspendedReason: string | null; logoUrl: string | null; createdAt: string;
  memberCount: number; listingCount: number; clientCount: number;
  subscription: {
    status: string; interval: string; seats: number; seatsUsed: number;
    trialEndsAt: string | null; currentPeriodEnd: string | null;
  } | null;
};

export type WorkspaceListResponse = {
  items: WorkspaceRow[]; total: number; pages: number;
};

export default async function AdminWorkspacesPage({
  searchParams,
}: { searchParams: Record<string, string> }) {
  const qs = new URLSearchParams();
  if (searchParams.page)   qs.set('page',   searchParams.page);
  if (searchParams.q)      qs.set('q',      searchParams.q);
  if (searchParams.type)   qs.set('type',   searchParams.type);
  if (searchParams.plan)   qs.set('plan',   searchParams.plan);
  if (searchParams.active) qs.set('active', searchParams.active);
  qs.set('limit', '20');

  const data = await serverGet<WorkspaceListResponse>(`/admin/workspaces?${qs.toString()}`);
  return <AdminWorkspacesClient initialData={data} searchParams={searchParams} />;
}