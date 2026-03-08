"use client";

import { useState, useTransition } from "react";
import { API_BASE } from "@/lib/apiBase";


export function ClientFollowUp({
  clientPropertyId,
  followUpAt,
}: {
  clientPropertyId: string;
  followUpAt?: string | null;
}) {
  const [date, setDate] = useState(
    followUpAt ? followUpAt.slice(0, 10) : ""
  );
  const [isPending, startTransition] = useTransition();

  function saveFollowUp() {
    if (!date) return;

    startTransition(async () => {
      await fetch(
        `${API_BASE}/clients/client-property/${clientPropertyId}/follow-up`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followUpAt: date }),
        }
      );

      window.location.reload(); // simple & reliable for v1
    });
  }

  function getIndicator() {
    if (!followUpAt) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const f = new Date(followUpAt);
    f.setHours(0, 0, 0, 0);

    if (f < today) return "overdue";
    if (f.getTime() === today.getTime()) return "today";
    return "upcoming";
  }

  const indicator = getIndicator();

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-md border px-2 py-1 text-xs"
      />

      <button
        onClick={saveFollowUp}
        disabled={isPending}
        className="rounded-md border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
      >
        Set
      </button>

      {indicator === "overdue" && (
        <span className="text-xs text-red-600">Overdue</span>
      )}
      {indicator === "today" && (
        <span className="text-xs text-yellow-600">Today</span>
      )}
      {indicator === "upcoming" && (
        <span className="text-xs text-green-600">Upcoming</span>
      )}
    </div>
  );
}
