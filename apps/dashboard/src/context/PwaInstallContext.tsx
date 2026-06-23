// apps/dashboard/src/context/PwaInstallContext.tsx
'use client';

import { createContext, useContext } from 'react';
import { usePwaInstall as usePwaInstallHook } from '@/hooks/usePwaInstall';

const PwaInstallContext = createContext<ReturnType<typeof usePwaInstallHook> | null>(null);

export function PwaInstallProvider({ children }: { children: React.ReactNode }) {
  const value = usePwaInstallHook();
  return (
    <PwaInstallContext.Provider value={value}>
      {children}
    </PwaInstallContext.Provider>
  );
}

export function usePwaInstall() {
  const ctx = useContext(PwaInstallContext);
  if (!ctx) throw new Error('usePwaInstall must be used within PwaInstallProvider');
  return ctx;
}