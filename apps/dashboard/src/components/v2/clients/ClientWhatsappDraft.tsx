"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Copy } from "lucide-react";
import { API_BASE } from "@/lib/apiBase";


// const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

export function ClientWhatsappDraft({
  clientPropertyId,
  phone,
}: {
  clientPropertyId: string;
  phone: string;
}) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/clients/client-property/${clientPropertyId}/whatsapp-draft`)
      .then((r) => r.json())
      .then((d) => setMessage(d.message));
  }, [clientPropertyId]);

  if (!message) return null;

  const encoded = encodeURIComponent(message);

  return (
    <div className="mt-3 rounded-lg border bg-muted p-3 text-sm">
      <div className="mb-2 font-medium">WhatsApp draft</div>

      <div className="text-muted-foreground">{message}</div>

      <div className="mt-2 flex gap-2">
        <button
          onClick={() => navigator.clipboard.writeText(message)}
          className="inline-flex items-center gap-1 text-xs"
        >
          <Copy className="h-3 w-3" /> Copy
        </button>

        <a
          href={`https://wa.me/${phone}?text=${encoded}`}
          target="_blank"
          className="inline-flex items-center gap-1 text-xs text-green-600"
        >
          <MessageCircle className="h-3 w-3" /> WhatsApp
        </a>
      </div>
    </div>
  );
}
