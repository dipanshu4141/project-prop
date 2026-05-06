'use client';

// apps/dashboard/src/components/v2/deals/StartDealButton.tsx
//
// Drop this anywhere in a server component — it owns all client state.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StartDealModal } from './StartDealModal';

interface Props {
  listingId: string;
}

export function StartDealButton({ listingId }: Props) {
  const router = useRouter();
  const [showDeal, setShowDeal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowDeal(true)}
        className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
      >
        Start Deal
      </button>

      {showDeal && (
        <StartDealModal
          listingId={listingId}
          onSuccess={(dealId) => router.push(`/v2/deals/${dealId}`)}
          onClose={() => setShowDeal(false)}
        />
      )}
    </>
  );
}