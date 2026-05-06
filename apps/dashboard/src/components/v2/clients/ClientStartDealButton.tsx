'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Handshake } from 'lucide-react';
import { StartDealModal } from '@/components/v2/deals/StartDealModal';

interface Props {
  clientId: string;
  clientName: string | null;
  interestedProperties: any[];
}

export function ClientStartDealButton({ clientId, clientName, interestedProperties }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (interestedProperties.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
      >
        <Handshake className="h-3.5 w-3.5" />
        Start Deal
      </button>
      {open && (
        <StartDealModal
          clientId={clientId}
          clientName={clientName}
          interestedProperties={interestedProperties}
          onSuccess={(dealId) => router.push(`/v2/deals/${dealId}`)}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}