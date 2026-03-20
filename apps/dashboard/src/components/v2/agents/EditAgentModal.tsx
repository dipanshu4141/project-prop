"use client";

import { useState } from "react";
import { X, Pencil, Loader2, Check, Plus, Trash2 } from "lucide-react";
import { apiPatch } from "@/lib/api";
import { useRouter } from "next/navigation";

type Agent = {
  id:        string;
  name?:     string | null;
  firmName?: string | null;
  phones:    string[];
};

type Props = {
  agent:    Agent;
  onClose:  () => void;
  onSaved?: (updated: Agent) => void;
};

export function EditAgentModal({ agent, onClose, onSaved }: Props) {
  const router = useRouter();
  const [name,     setName]     = useState(agent.name     ?? "");
  const [firmName, setFirmName] = useState(agent.firmName ?? "");
  const [phones,   setPhones]   = useState<string[]>([...agent.phones]);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  function addPhone() {
    setPhones((p) => [...p, ""]);
  }

  function updatePhone(i: number, val: string) {
    setPhones((p) => p.map((v, idx) => idx === i ? val : v));
  }

  function removePhone(i: number) {
    if (phones.length <= 1) return; // keep at least one
    setPhones((p) => p.filter((_, idx) => idx !== i));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const cleanPhones = phones.map((p) => p.replace(/\D/g, "")).filter((p) => p.length >= 10);
      if (cleanPhones.length === 0) {
        setError("At least one valid phone number is required");
        setSaving(false);
        return;
      }

      const updated = await apiPatch<Agent>(`/agents/${agent.id}`, {
        name:     name.trim()     || null,
        firmName: firmName.trim() || null,
        phones:   cleanPhones,
      });

      onSaved?.(updated);
      onClose();
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? "Failed to save agent");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
              <Pencil className="h-4 w-4 text-sky-700" />
            </div>
            <p className="text-[14px] font-semibold text-slate-900">Edit agent</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">

          {/* Name */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">
              Agent name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vikas Agarwal"
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
            />
          </div>

          {/* Firm */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">
              Firm name
            </label>
            <input
              type="text"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              placeholder="Vandana Real Estate"
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
            />
          </div>

          {/* Phones */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12.5px] font-semibold text-slate-600">Phone numbers</label>
              <button
                type="button"
                onClick={addPhone}
                className="flex items-center gap-1 text-[11.5px] text-emerald-700 font-medium hover:underline"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {phones.map((phone, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => updatePhone(i, e.target.value)}
                    placeholder="9819992707"
                    className="flex-1 h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
                  />
                  {phones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePhone(i)}
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-600 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
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
                ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
                : <><Check className="h-4 w-4" />Save</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}