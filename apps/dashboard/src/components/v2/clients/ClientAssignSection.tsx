'use client';
// apps/dashboard/src/components/v2/clients/ClientAssignSection.tsx
//
// Thin client wrapper around ClientAssignDropdown.
// Server component passes initial values; this component manages
// its own state for optimistic UI — no setClient needed in page.tsx.

import { useState } from 'react';
import { ClientAssignDropdown } from './ClientAssignDropdown';

type Props = {
  clientId:         string;
  initialOwnerId:   string | null;
  initialOwnerName: string | null;
};

export function ClientAssignSection({ clientId, initialOwnerId, initialOwnerName }: Props) {
  const [ownerId,   setOwnerId]   = useState(initialOwnerId);
  const [ownerName, setOwnerName] = useState(initialOwnerName);

  return (
    <ClientAssignDropdown
      clientId={clientId}
      currentOwnerId={ownerId}
      currentOwnerName={ownerName}
      onReassigned={(newId, newName) => {
        setOwnerId(newId);
        setOwnerName(newName);
      }}
    />
  );
}