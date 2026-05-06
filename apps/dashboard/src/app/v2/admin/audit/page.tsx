// apps/dashboard/src/app/v2/admin/audit/page.tsx
import { serverGet } from '@/lib/serverApi';
import { AdminAuditClient } from './AdminAuditClient';

export type AuditRow = {
  id: string; action: string; entity: string; entityId: string | null;
  workspaceId: string | null; ipAddress: string | null;
  before: any; after: any; requestId: string | null; createdAt: string;
  user: { id: string; name: string | null; email: string; platformRole: string; } | null;
};

export type AuditMeta = { actions: string[]; entities: string[]; };
export type AuditListResponse = { items: AuditRow[]; total: number; pages: number; };

export default async function AdminAuditPage({ searchParams }: { searchParams: Record<string, string> }) {
  const qs = new URLSearchParams();
  if (searchParams.page)        qs.set('page',        searchParams.page);
  if (searchParams.action)      qs.set('action',      searchParams.action);
  if (searchParams.entity)      qs.set('entity',      searchParams.entity);
  if (searchParams.workspaceId) qs.set('workspaceId', searchParams.workspaceId);
  if (searchParams.fromDate)    qs.set('fromDate',    searchParams.fromDate);
  if (searchParams.toDate)      qs.set('toDate',      searchParams.toDate);
  qs.set('limit', '50');

  const [data, meta] = await Promise.all([
    serverGet<AuditListResponse>(`/admin/audit?${qs.toString()}`),
    serverGet<AuditMeta>('/admin/audit/meta'),
  ]);
  return <AdminAuditClient initialData={data} meta={meta} searchParams={searchParams} />;
}