'use client';

import { useState } from 'react';
import { ShareTokenModal } from './ShareTokenModal';

type Props = {
  clientId:   string;
  clientName: string;
  clientPhone: string | null;
};

export function ShareButton({ clientId, clientName, clientPhone }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors hover:opacity-90"
        style={{ background: '#0B1F14', color: '#fff' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13 8a5 5 0 11-10 0 5 5 0 0110 0z" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        Share with Client
      </button>

      <ShareTokenModal
        clientId={clientId}
        clientName={clientName}
        clientPhone={clientPhone}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}