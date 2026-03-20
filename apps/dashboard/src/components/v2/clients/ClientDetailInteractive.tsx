'use client';

import { useState } from 'react';
import { ClientPropertiesTabs } from './ClientPropertiesTabs';
import { ShareTokenModal } from './ShareTokenModal';
import type { ClientPropertyItem } from './ClientPropertiesTabs';

type Props = {
  clientId:          string;
  clientName:        string;
  clientPhone:       string | null;
  clientProperties:  ClientPropertyItem[];
};

export function ClientDetailInteractive({
  clientId,
  clientName,
  clientPhone,
  clientProperties,
}: Props) {
  const [shareModalOpen, setShareModalOpen] = useState(false);

  return (
    <>
      {/* Share button — put this wherever your quick actions section is */}
      <button
        onClick={() => setShareModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        style={{ background: '#0B1F14', color: '#fff' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M11 1a3 3 0 110 6 3 3 0 010-6zM5 8a3 3 0 110 6A3 3 0 015 8zM14 5.5l-6 3.25M8 7.75L14 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        Share with Client
      </button>

      {/* Modal */}
      <ShareTokenModal
        clientId={clientId}
        clientName={clientName}
        clientPhone={clientPhone}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />

      {/* Tabbed properties table */}
      <ClientPropertiesTabs clientProperties={clientProperties} />
    </>
  );
}