"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Copy, CheckCircle2, Loader2 } from "lucide-react";
import { apiGet } from "@/lib/api";

export function ClientWhatsappDraft({
  clientPropertyId,
  phone,
}: {
  clientPropertyId: string;
  phone: string;
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    apiGet<{ message: string }>(
      `/clients/client-property/${clientPropertyId}/whatsapp-draft`
    )
      .then((d) => setMessage(d.message ?? ""))
      .catch(() => setMessage(""))
      .finally(() => setLoading(false));
  }, [clientPropertyId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-1 text-[12px] text-slate-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading draft…
      </div>
    );
  }

  if (!message) {
    return (
      <p className="text-[12px] text-slate-400">No draft available.</p>
    );
  }

  const cleanPhone = (phone ?? "").replace(/\D/g, "");
const intlPhone  = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
const waUrl      = cleanPhone.length >= 10
  ? `https://api.whatsapp.com/send/?phone=${intlPhone}&text=${encodeURIComponent(message)}`
  : null;

  async function copy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-2">
      {/* Message text */}
      <pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-slate-700 font-sans">
        {message}
      </pre>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[11.5px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          {copied
            ? <><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Copied</>
            : <><Copy className="h-3 w-3" /> Copy</>
          }
        </button>
        <span className="text-slate-300">·</span>

        {waUrl && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#25D366] hover:text-[#1fb855] transition-colors">
            Open in WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}