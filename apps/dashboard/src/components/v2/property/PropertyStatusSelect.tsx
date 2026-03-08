"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/apiBase";

/* ------------------------------------------------------------------ */
/* CONFIG */
/* ------------------------------------------------------------------ */

const STATUSES = ["APPROVED", "REVIEW", "REJECTED"] as const;

type Status = (typeof STATUSES)[number];

/* ------------------------------------------------------------------ */
/* COMPONENT */
/* ------------------------------------------------------------------ */

export function PropertyStatusSelect({
  propertyId,
  currentStatus,
}: {
  propertyId: string;
  currentStatus: Status;
}) {
  const router = useRouter();

  const [status, setStatus] = useState<Status>(currentStatus);
  const [loading, setLoading] = useState(false);

  /* ------------------------------------------------------------------ */
  /* UPDATE */
  /* ------------------------------------------------------------------ */

  async function updateStatus(next: Status) {
    if (next === status || loading) return;

    const previous = status;
    setStatus(next); // optimistic
    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/properties/${propertyId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      // 🔄 refresh server data
      router.refresh();
    } catch (err) {
      console.error("Status update failed:", err);
      setStatus(previous); // rollback
      alert("Failed to update status. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /* UI */
  /* ------------------------------------------------------------------ */

  return (
    <select
      value={status}
      disabled={loading}
      onChange={(e) => updateStatus(e.target.value as Status)}
      className="h-9 rounded-md border bg-background px-3 text-sm disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
