// apps/dashboard/src/app/v2/admin/users/page.tsx
import { serverGet } from '@/lib/serverApi';
import AdminUsersClient from './AdminUsersClient';

export type UserRow = {
  id: string; name: string | null; email: string; phone: string | null;
  avatarUrl: string | null; platformRole: string; emailVerified: boolean;
  isActive: boolean; deactivatedAt: string | null; createdAt: string;
  memberships: {
    role: string; joinedAt: string;
    workspace: { id: string; name: string; slug: string; plan: string; };
  }[];
};

export type UserListResponse = { items: UserRow[]; total: number; pages: number; };

export default async function AdminUsersPage() {
  return <AdminUsersClient />;
}