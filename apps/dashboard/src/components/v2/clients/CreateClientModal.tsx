"use client";

import { useState } from "react";
import { X, UserPlus, Loader2, Phone, User } from "lucide-react";
import { apiPost } from "@/lib/api";
import { useRouter } from "next/navigation";

type Props = {
  onClose:    () => void;
  onCreated?: (client: { id: string; phone: string; name?: string | null }) => void;
};

export function CreateClientModal({ onClose, onCreated }: Props) {
  const router = useRouter();
  const [phone,   setPhone]   = useState("");
  const [name,    setName]    = useState("");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const client = await apiPost<{ id: string; phone: string; name?: string | null }>(
        "/clients",
        { phone: cleanPhone, name: name.trim() || undefined },
      );
      onCreated?.(client);
      router.push(`/v2/clients/${client.id}`);
    } catch (e: any) {
      setError(e.message ?? "Failed to create client");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <UserPlus className="h-4 w-4 text-emerald-700" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-900">Add client</p>
              <p className="text-[11.5px] text-slate-400">Create a client to track leads</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Phone — required */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">
              Phone number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9819992707"
                required
                className="w-full h-10 pl-8 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              If this number already exists, their existing record will be opened.
            </p>
          </div>

          {/* Name — optional */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">
              Name <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full h-10 pl-8 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

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
              disabled={saving}
              className="flex-1 h-10 rounded-xl bg-[#0B1F14] text-[13.5px] font-semibold text-white hover:bg-[#1A3525] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" />Creating…</>
                : <><UserPlus className="h-4 w-4" />Add client</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}