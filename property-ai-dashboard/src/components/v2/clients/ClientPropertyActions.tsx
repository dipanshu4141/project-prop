"use client";

import { useTransition } from "react";
import { API_BASE } from "@/lib/apiBase";


// const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

type LeadStage =
  | "NEW"
  | "CONTACTED"
  | "VISIT"
  | "NEGOTIATION"
  | "CLOSED"
  | "LOST"
  | "INTERESTED"
  | "REJECTED"
;


export function ClientPropertyActions({
  clientPropertyId,
  currentStatus,
}: {
  clientPropertyId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();

  function updateStatus(status: LeadStage) {
    startTransition(async () => {
      await fetch(
        `${API_BASE}/clients/client-property/${clientPropertyId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );
    });
  }  

  return (
    <div className="flex gap-2">
      <button
          disabled={isPending || currentStatus === "INTERESTED"}
          onClick={() => updateStatus("INTERESTED")}
        >
          Interested
      </button>

      <button
          disabled={isPending || currentStatus === "REJECTED"}
          onClick={() => updateStatus("REJECTED")}
        >
          Reject
      </button>

    </div>
  );
}
