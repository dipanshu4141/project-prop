"use client";

import { useState } from "react";
import { PropertyLeadsTable } from "./PropertyLeadsTable";

export function PropertyLeadsDropdown({
  leads,
  defaultOpen = false,
}: {
  leads: any[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border bg-white">
      {/* HEADER */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-slate-50"
      >
        <div className="font-medium">Leads</div>
        <span className="text-xs text-muted-foreground">
          {open ? "Hide" : "View"}
        </span>
      </button>

      {/* BODY */}
      {open && (
        <div className="border-t">
          <PropertyLeadsTable leads={leads} />
        </div>
      )}
    </div>
  );
}
