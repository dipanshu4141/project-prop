"use client";

import { useState, useTransition } from "react";
import { Calendar, Loader2, X } from "lucide-react";
import { apiPatch } from "@/lib/api";

export function ClientFollowUp({
  clientPropertyId,
  followUpAt,
}: {
  clientPropertyId: string;
  followUpAt?:      string | null;
}) {
  const [date,      setDate]      = useState(followUpAt ? followUpAt.slice(0, 10) : "");
  const [isPending, startTransition] = useTransition();
  const [saved,     setSaved]     = useState(false);

  async function save() {
    if (!date) return;
    startTransition(async () => {
      await apiPatch(`/clients/client-property/${clientPropertyId}/follow-up`, { followUpAt: date });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  async function clear() {
    setDate("");
    startTransition(async () => {
      await apiPatch(`/clients/client-property/${clientPropertyId}/follow-up`, { followUpAt: null });
    });
  }

  // Indicator
  let indicator: "overdue" | "today" | "upcoming" | null = null;
  if (date) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const f     = new Date(date); f.setHours(0, 0, 0, 0);
    if (f < today)                       indicator = "overdue";
    else if (f.getTime() === today.getTime()) indicator = "today";
    else                                 indicator = "upcoming";
  }

  const indicatorStyles = {
    overdue:  "text-red-600 bg-red-50 border-red-200",
    today:    "text-amber-700 bg-amber-50 border-amber-200",
    upcoming: "text-emerald-700 bg-emerald-50 border-emerald-200",
  };

  const indicatorLabel = {
    overdue:  "Overdue",
    today:    "Today",
    upcoming: "Upcoming",
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Date input */}
      <div className="relative flex items-center">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
        <input
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); setSaved(false); }}
          className="h-7 pl-7 pr-2 rounded-lg border border-slate-200 bg-white text-[12px] text-slate-700 focus:outline-none focus:border-slate-400 transition-colors"
        />
      </div>

      {/* Set button */}
      <button
        onClick={save}
        disabled={isPending || !date}
        className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-slate-200 bg-white text-[12px] font-medium text-slate-600 hover:border-slate-400 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : saved ? "✓" : "Set"}
      </button>

      {/* Clear button */}
      {date && (
        <button
          onClick={clear}
          disabled={isPending}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 transition-all"
          title="Clear follow-up"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Status badge */}
      {indicator && (
        <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${indicatorStyles[indicator]}`}>
          {indicatorLabel[indicator]}
        </span>
      )}
    </div>
  );
}