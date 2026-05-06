"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/apiBase";

/* ------------------------------------------------------------------ */
/* COMPONENT */
/* ------------------------------------------------------------------ */

export function SharePropertyModal({
  propertyId,
  onClose,
}: {
  propertyId: string;
  onClose: () => void;
}) {
  const router = useRouter();

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [loading, setLoading] = useState(false);

  /* ------------------------------------------------------------------ */
  /* SHARE */
  /* ------------------------------------------------------------------ */

  async function share() {
    if (!clientPhone || loading) return;

    setLoading(true);

    try {
      const phone = clientPhone.replace(/\D/g, "");
      if (!phone) throw new Error("Invalid phone");

      const res = await fetch(
        `${API_BASE}/properties/${propertyId}/share`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: "WHATSAPP",
            clientName: clientName || null,
            clientPhone: phone,
            teamMemberIds: [],
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Share failed");
      }

      // 🔄 refresh server components
      router.refresh();

      onClose();
    } catch (err) {
      console.error("Share property failed:", err);
      alert("Failed to share property. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /* UI */
  /* ------------------------------------------------------------------ */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-background p-5">
        {/* HEADER */}
        <div className="mb-4 flex items-center justify-between">
          <div className="font-medium">Share Property</div>
          <button onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* FORM */}
        <div className="space-y-3">
          <input
            placeholder="Client name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="h-9 w-full rounded-md border px-3 text-sm"
          />

          <input
            placeholder="Client phone"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            className="h-9 w-full rounded-md border px-3 text-sm"
          />
        </div>

        {/* ACTIONS */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm"
          >
            Cancel
          </button>

          <button
            onClick={share}
            disabled={loading}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Sharing…" : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
}
