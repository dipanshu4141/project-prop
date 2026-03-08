"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { WhatsAppChooser } from "@/components/v2/clients/WhatsAppChooser";
import { API_BASE } from "@/lib/apiBase";

type Props = {
  clientId: string;
  defaultClientPropertyId?: string | null;
  fullWidth?: boolean;
};

export function ClientWhatsAppAction({
  clientId,
  defaultClientPropertyId,
  fullWidth = false,
}: Props) {
  const [showChooser, setShowChooser] = useState(false);

  async function openWhatsApp(clientPropertyId: string) {
    const popup = window.open("", "_blank");

    try {
      const draftRes = await fetch(
        `${API_BASE}/clients/client-property/${clientPropertyId}/whatsapp-draft`
      );

      if (!draftRes.ok) {
        throw new Error("Failed to fetch WhatsApp draft");
      }

      const data = await draftRes.json();

      const rawMessage =
        typeof data.message === "string"
          ? decodeURIComponentSafe(data.message)
          : "";

      const encodedMessage = encodeURIComponent(rawMessage);

      const phone =
        typeof data.phone === "string"
          ? data.phone.replace(/\D/g, "")
          : "";

      if (!phone) {
        throw new Error("Client phone number missing");
      }

      const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

      if (popup) {
        popup.location.href = whatsappUrl;
      } else {
        window.location.href = whatsappUrl;
      }

      fetch(
        `${API_BASE}/clients/client-property/${clientPropertyId}/whatsapp-sent`,
        { method: "POST" }
      );

      setShowChooser(false);
    } catch (err) {
      console.error("WhatsApp share failed:", err);
      popup?.close();
    }
  }

  // ✅ SIMPLE, CLEAN, RELIABLE
  function handleClick() {
  
}
  
  


  return (
    <>
      {/* <button
        type="button"
        onClick={handleClick}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-lg",
          "bg-green-600 text-white hover:bg-green-700",
          "px-4 py-2 text-sm font-medium transition",
          fullWidth ? "w-full" : "",
        ].join(" ")}
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </button> */}

      {showChooser && (
        <div className="mt-3">
          <WhatsAppChooser
            clientId={clientId}
            onSelect={openWhatsApp}
          />
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* UTILS */
/* ------------------------------------------------------------------ */

function decodeURIComponentSafe(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
