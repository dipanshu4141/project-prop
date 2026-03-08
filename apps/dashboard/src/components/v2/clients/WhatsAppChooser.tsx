"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/apiBase";


type Option = {
  clientPropertyId: string;
  label: string;
  price?: number | null;
};

export function WhatsAppChooser({
  clientId,
  onSelect,
}: {
  clientId: string;
  onSelect: (clientPropertyId: string) => void;
}) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/clients/${clientId}/whatsapp-options`)
      .then((r) => r.json())
      .then(setOptions)
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return null;

  // ✅ Auto-select if only one
  if (options.length === 1) {
    onSelect(options[0].clientPropertyId);
    return null;
  }

  // ❌ Nothing to send
  if (options.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="text-sm font-medium">
        Choose property to WhatsApp
      </div>

      {options.map((o) => (
        <button
          key={o.clientPropertyId}
          onClick={() => onSelect(o.clientPropertyId)}
          className="w-full rounded-lg border px-3 py-2 text-left hover:bg-muted"
        >
          <div className="font-medium text-sm">{o.label}</div>
          {o.price && (
            <div className="text-xs text-muted-foreground">
              ₹{Number(o.price).toLocaleString()}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
