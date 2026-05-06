"use client";

import { useState } from "react";
import { ClipboardPaste } from "lucide-react";
import { ManualMessageModal } from "@/components/v2/messages/ManualMessageModal";
import { useRouter } from "next/navigation";

export function PasteMessageButton() {
  const [open,  setOpen]  = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-[9px] border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-slate-400 hover:text-slate-800 hover:-translate-y-[1px]"
      >
        <ClipboardPaste className="h-4 w-4" />
        Paste message
      </button>

      {open && (
        <ManualMessageModal
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            // Refresh properties list after a short delay to allow AI processing
            setTimeout(() => router.refresh(), 3000);
          }}
        />
      )}
    </>
  );
}