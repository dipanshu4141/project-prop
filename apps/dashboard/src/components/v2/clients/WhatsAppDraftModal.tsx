"use client";

import { useState } from "react";
import {
  X, MessageSquare, Copy, CheckCircle2,
  ExternalLink, Loader2, Phone,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

type Props = {
  clientPropertyId: string;
  clientName?:      string | null;
  clientPhone:      string;
  propertyLabel:    string;
  onClose:          () => void;
  onSent?:          () => void;
};

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */

export function WhatsAppDraftModal({
  clientPropertyId,
  clientName,
  clientPhone,
  propertyLabel,
  onClose,
  onSent,
}: Props) {
  const [draft,     setDraft]     = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [marking,   setMarking]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [error,     setError]     = useState("");

  // Load draft on mount
  useState(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await apiGet<{ message: string }>(
          `/clients/client-property/${clientPropertyId}/whatsapp-draft`
        );
        setDraft(res.message);
      } catch (e: any) {
        setError(e.message ?? "Failed to load draft");
      } finally {
        setLoading(false);
      }
    })();
  });

  async function copyToClipboard() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openWhatsApp() {
    if (!draft) return;
    const phone   = clientPhone.replace(/\D/g, "");
    const intl    = phone.startsWith("91") ? phone : `91${phone}`;
    const url     = `https://api.whatsapp.com/send/?phone=${intl}&text=${encodeURIComponent(draft)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function markAsSent() {
    setMarking(true);
    try {
      await apiPost(`/clients/client-property/${clientPropertyId}/whatsapp-sent`, {});
      setSent(true);
      onSent?.();
      setTimeout(onClose, 1500);
    } catch (e: any) {
      setError(e.message ?? "Failed to mark as sent");
    } finally {
      setMarking(false);
    }
  }

  const cleanPhone = clientPhone.replace(/\D/g, "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366]/15">
              <MessageSquare className="h-4 w-4 text-[#25D366]" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-900">WhatsApp draft</p>
              <p className="text-[11.5px] text-slate-400">{propertyLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">

          {/* Client info */}
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
              {(clientName ?? clientPhone)[0].toUpperCase()}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-800">{clientName ?? "Client"}</p>
              <a
                href={`tel:${clientPhone}`}
                className="flex items-center gap-1 text-[11.5px] text-slate-400 hover:text-emerald-700 transition-colors"
              >
                <Phone className="h-3 w-3" />
                {clientPhone}
              </a>
            </div>
          </div>

          {/* Draft message */}
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          )}

          {error && (
            <p className="text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {draft && !loading && (
            <>
              {/* Message preview */}
              <div className="relative rounded-xl bg-[#0b141a] overflow-hidden">
                <div className="flex items-center justify-between bg-[#202c33] px-4 py-2.5">
                  <span className="text-[12px] font-medium text-[#25D366]">Message preview</span>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 text-[11.5px] text-slate-400 hover:text-white transition-colors"
                  >
                    {copied
                      ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Copied</>
                      : <><Copy className="h-3.5 w-3.5" /> Copy</>
                    }
                  </button>
                </div>
                <div className="p-4 max-h-64 overflow-y-auto">
                  <div className="relative max-w-[90%] rounded-lg rounded-tl-none bg-[#202c33] px-4 py-3 shadow">
                    <div className="absolute -left-2 top-0 h-0 w-0 border-r-[8px] border-t-[8px] border-r-[#202c33] border-t-transparent" />
                    <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-slate-100">
                      {draft}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Edit draft */}
              <div>
                <label className="block text-[11.5px] font-semibold text-slate-400 mb-1.5">
                  Edit before sending
                </label>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12.5px] text-slate-800 focus:outline-none focus:border-slate-400 resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {draft && !loading && (
          <div className="border-t border-slate-100 px-5 py-4 flex items-center gap-3">
            {/* Open in WhatsApp */}
            <button
              onClick={openWhatsApp}
              className="flex flex-1 items-center justify-center gap-2 h-10 rounded-xl bg-[#25D366] text-[13.5px] font-semibold text-white hover:bg-[#22c55e] transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              Open in WhatsApp
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </button>

            {/* Mark sent */}
            {!sent ? (
              <button
                onClick={markAsSent}
                disabled={marking}
                className="flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-50 transition-all"
              >
                {marking
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <CheckCircle2 className="h-4 w-4" />}
                {marking ? "Saving…" : "Mark sent"}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                Sent!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}