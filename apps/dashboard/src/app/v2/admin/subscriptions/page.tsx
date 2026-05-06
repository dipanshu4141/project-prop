// apps/dashboard/src/app/v2/admin/subscriptions/page.tsx
import { serverGet } from '@/lib/serverApi';
import { AdminSubscriptionsClient } from './AdminSubscriptionsClient';

export type SubRow = {
  id: string; plan: string; status: string; interval: string;
  seats: number; seatsUsed: number; createdAt: string;
  currentPeriodStart: string | null; currentPeriodEnd: string | null;
  trialEndsAt: string | null; cancelledAt: string | null;
  gatewayCustomerId: string | null; gatewaySubscriptionId: string | null;
  workspace: { id: string; name: string; slug: string; type: string; email: string | null; logoUrl: string | null; memberCount: number; };
  lastInvoice: { amount: number; status: string; paidAt: string | null; } | null;
};

export type SubStats = { total: number; trialing: number; active: number; pastDue: number; cancelled: number; };
export type SubListResponse = { items: SubRow[]; total: number; pages: number; };

export default async function AdminSubscriptionsPage({ searchParams }: { searchParams: Record<string, string> }) {
  const qs = new URLSearchParams();
  if (searchParams.page)   qs.set('page',   searchParams.page);
  if (searchParams.q)      qs.set('q',      searchParams.q);
  if (searchParams.status) qs.set('status', searchParams.status);
  if (searchParams.plan)   qs.set('plan',   searchParams.plan);
  qs.set('limit', '20');

  const [data, stats] = await Promise.all([
    serverGet<SubListResponse>(`/admin/subscriptions?${qs.toString()}`),
    serverGet<SubStats>('/admin/subscriptions/stats'),
  ]);
  return <AdminSubscriptionsClient initialData={data} stats={stats} searchParams={searchParams} />;
}