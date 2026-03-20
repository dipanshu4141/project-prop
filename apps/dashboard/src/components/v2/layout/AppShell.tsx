"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-[#F7F5F0]">
      {/* Sidebar — renders nothing visible on mobile (it uses fixed bars instead) */}
      <Sidebar />

      {/* Main — on mobile: full width since sidebar is hidden.
          PageContainer handles the top/bottom offset for the fixed bars. */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}