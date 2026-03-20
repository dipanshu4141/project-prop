"use client";

import { useTransition, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { apiPatch } from "@/lib/api";

type LeadStage =
  | "NEW" | "CONTACTED" | "VISIT"
  | "NEGOTIATION" | "CLOSED" | "LOST"
  | "INTERESTED" | "NOT_INTERESTED";

const STAGES: { value: LeadStage; label: string; color: string }[] = [
  { value: "NEW",            label: "New",            color: "text-slate-600"   },
  { value: "CONTACTED",      label: "Contacted",      color: "text-sky-700"     },
  { value: "INTERESTED",     label: "Interested",     color: "text-emerald-700" },
  { value: "VISIT",          label: "Visit",          color: "text-violet-700"  },
  { value: "NEGOTIATION",    label: "Negotiation",    color: "text-amber-700"   },
  { value: "CLOSED",         label: "Closed",         color: "text-emerald-700" },
  { value: "LOST",           label: "Lost",           color: "text-red-600"     },
  { value: "NOT_INTERESTED", label: "Not interested", color: "text-red-600"     },
];

export function ClientPropertyActions({
  clientPropertyId,
  currentStatus,
}: {
  clientPropertyId: string;
  currentStatus:    string;
}) {
  const [status,    setStatus]    = useState(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [open,      setOpen]      = useState(false);

  function updateStatus(newStatus: LeadStage) {
    if (newStatus === status) { setOpen(false); return; }
    setOpen(false);
    startTransition(async () => {
      try {
        await apiPatch(`/clients/client-property/${clientPropertyId}/status`, { status: newStatus });
        setStatus(newStatus);
      } catch {
        // silently fail — status reverts
      }
    });
  }

  const current = STAGES.find((s) => s.value === status) ?? STAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="flex items-center gap-1.5 h-7 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] font-medium text-slate-700 hover:border-slate-400 transition-all"
      >
        {isPending
          ? <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
          : <span className={`text-[11px] font-semibold ${current.color}`}>{current.label}</span>
        }
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-slate-100 bg-white shadow-lg overflow-hidden">
            {STAGES.map((s) => (
              <button
                key={s.value}
                onClick={() => updateStatus(s.value)}
                className={[
                  "flex w-full items-center px-3 py-2 text-[12.5px] font-medium transition-colors hover:bg-slate-50",
                  s.value === status ? "bg-slate-50" : "",
                  s.color,
                ].join(" ")}
              >
                {s.value === status && (
                  <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current flex-shrink-0" />
                )}
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}