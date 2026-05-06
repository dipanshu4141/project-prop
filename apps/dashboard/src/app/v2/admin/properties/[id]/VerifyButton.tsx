'use client';

// apps/dashboard/src/app/v2/admin/properties/[id]/VerifyButton.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPatch } from '@/lib/api';

export function VerifyButton({ propertyId }: { propertyId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleVerify() {
    if (!confirm('Mark this canonical property as verified?')) return;
    setLoading(true);
    try {
      await apiPatch(`/admin/properties/${propertyId}/verify`, {});
      router.refresh();
    } catch {
      alert('Failed to verify. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleVerify}
      disabled={loading}
      className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: '#0B1F14' }}
    >
      {loading ? 'Verifying…' : 'Mark as Verified'}
    </button>
  );
}