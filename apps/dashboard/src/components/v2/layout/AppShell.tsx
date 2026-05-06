"use client";

import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";

const STORAGE_KEY = "sidebar_collapsed";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
    } catch {}
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F7F5F0]">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <main
        className={[
          "flex-1 min-w-0 overflow-y-auto transition-all duration-300",
        ].join(" ")}
      >
        {children}
      </main>
    </div>
  );
}