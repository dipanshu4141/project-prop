"use client";

import { useState } from "react";
import {
  X, ClipboardPaste, Loader2, CheckCircle2,
  AlertTriangle, Building2,
} from "lucide-react";
import { apiPost } from "@/lib/api";

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

type Props = {
  onClose:   () => void;
  onSuccess: (count: number) => void;
};

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */

export function ManualMessageModal({ onClose, onSuccess }: Props) {
  const [text,         setText]         = useState("");
  const [senderPhone,  setSenderPhone]  = useState("");
  const [senderName,   setSenderName]   = useState("");
  const [firmName,     setFirmName]     = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [result,       setResult]       = useState<{ count: number } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setError("");
    setLoading(true);

    try {
      await apiPost("/messages/manual", {
        text: text.trim(),
        source: {
          type:          "MANUAL_PASTE",
          contactNumber: senderPhone.trim() || "0000000000",
          name:          senderName.trim()  || undefined,
          firmName:      firmName.trim()    || undefined,
        },
      });

      // Count approximate properties from text (heuristic — backend does the real count)
      const count = 1;
      setResult({ count });
      onSuccess(count);
    } catch (e: any) {
      setError(e.message ?? "Failed to process message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <ClipboardPaste className="h-4 w-4 text-emerald-700" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-900">Paste WhatsApp message</p>
              <p className="text-[11.5px] text-slate-400">AI will extract and save the property details</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success state */}
        {result ? (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="text-[17px] font-bold text-slate-900 mb-1">Message processed!</p>
            <p className="text-[13px] text-slate-500 mb-6">
              The AI is extracting properties from your message.
              They'll appear in your listings shortly.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => { setResult(null); setText(""); setSenderPhone(""); setSenderName(""); setFirmName(""); }}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-[13.5px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Paste another
              </button>
              <button
                onClick={onClose}
                className="flex-1 h-10 rounded-xl bg-[#0B1F14] text-[13.5px] font-semibold text-white hover:bg-[#1A3525] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">

            {/* Message textarea */}
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">
                WhatsApp message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Paste the full WhatsApp message here…\n\nExample:\n2BHK Furnished\nAndheri West\nRent: 45,000\nVandana Real Estate\nVikas 9819992707`}
                rows={8}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white resize-none transition-colors"
              />
            </div>

            {/* Optional sender info */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
              <p className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
                Sender info (optional)
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-500 mb-1">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="9819992707"
                    className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[12.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-500 mb-1">
                    Agent name
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Vikas Agarwal"
                    className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[12.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1">
                  Firm name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    placeholder="Vandana Real Estate"
                    className="w-full h-8 pl-7 pr-2.5 rounded-lg border border-slate-200 bg-white text-[12.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <p className="text-[12.5px] text-red-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-[13.5px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="flex-1 h-10 rounded-xl bg-[#0B1F14] text-[13.5px] font-semibold text-white hover:bg-[#1A3525] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                  : <><ClipboardPaste className="h-4 w-4" /> Process message</>
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}