"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { apiPatch } from "@/lib/api";

type Status = "NEW" | "REVIEW" | "APPROVED" | "REJECTED";

const STATUS_STYLES: Record<Status, { label: string; class: string; dot: string }> = {
  NEW:      { label: "New",      class: "bg-slate-100 text-slate-600 border-slate-200",       dot: "bg-slate-400"   },
  REVIEW:   { label: "Review",   class: "bg-amber-50 text-amber-700 border-amber-200",         dot: "bg-amber-400"   },
  APPROVED: { label: "Approved", class: "bg-emerald-50 text-emerald-700 border-emerald-200",   dot: "bg-emerald-500" },
  REJECTED: { label: "Rejected", class: "bg-red-50 text-red-600 border-red-200",               dot: "bg-red-400"     },
};

const STATUSES: Status[] = ["NEW", "REVIEW", "APPROVED", "REJECTED"];

type Props = {
  propertyId:    string;
  currentStatus: string;
  /** Callback so parent can update its own state without a full refresh */
  onChanged?:    (newStatus: Status) => void;
};

export function PropertyStatusSelect({ propertyId, currentStatus, onChanged }: Props) {
  const [status,    setStatus]    = useState<Status>((currentStatus as Status) ?? "NEW");
  const [open,      setOpen]      = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSelect(newStatus: Status) {
    setOpen(false);
    if (newStatus === status) return;

    startTransition(async () => {
      try {
        await apiPatch(`/properties/${propertyId}/status`, { status: newStatus });
        setStatus(newStatus);
        onChanged?.(newStatus);
      } catch {
        // revert on failure — state unchanged
      }
    });
  }

  const s = STATUS_STYLES[status] ?? STATUS_STYLES.NEW;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11.5px] font-semibold transition-all ${s.class}`}
      >
        {isPending
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
        }
        {s.label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-8 z-20 w-36 rounded-xl border border-slate-100 bg-white shadow-lg overflow-hidden">
            {STATUSES.map((st) => {
              const opt = STATUS_STYLES[st];
              return (
                <button
                  key={st}
                  onClick={() => handleSelect(st)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-[12px] font-medium hover:bg-slate-50 transition-colors ${
                    st === status ? "bg-slate-50" : ""
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${opt.dot}`} />
                  <span className={opt.class.split(" ").filter(c => c.startsWith("text-")).join(" ")}>
                    {opt.label}
                  </span>
                  {st === status && <span className="ml-auto text-[10px] text-slate-400">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}