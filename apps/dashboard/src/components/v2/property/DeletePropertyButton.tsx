"use client";

import { useState } from "react";
import { Trash2, X, Loader2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiDel } from "@/lib/api";

type Props = {
  propertyId:    string;
  propertyLabel: string;
  /** If true renders as icon-only button (for use in cards) */
  compact?:      boolean;
};

export function DeletePropertyButton({ propertyId, propertyLabel, compact }: Props) {
  const router = useRouter();
  const [open,     setOpen]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await apiDel(`/properties/${propertyId}`);
      setOpen(false);
      router.push("/v2/properties");
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? "Failed to delete property");
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        title="Delete property"
        className={
          compact
            ? "flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-600 transition-all"
            : "flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-[12.5px] font-medium text-slate-500 hover:border-red-300 hover:text-red-600 transition-all"
        }
      >
        <Trash2 className="h-3.5 w-3.5" />
        {!compact && "Delete"}
      </button>

      {/* Confirm modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </div>
                <p className="text-[14px] font-semibold text-slate-900">Delete property</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-red-800">This cannot be undone</p>
                  <p className="text-[12.5px] text-red-700 mt-0.5">
                    <strong>{propertyLabel}</strong> and all its activity, leads, and agent links will be permanently deleted.
                  </p>
                </div>
              </div>

              {error && (
                <p className="text-[12.5px] text-red-600">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 h-10 rounded-xl border border-slate-200 text-[13.5px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 h-10 rounded-xl bg-red-600 text-[13.5px] font-semibold text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}