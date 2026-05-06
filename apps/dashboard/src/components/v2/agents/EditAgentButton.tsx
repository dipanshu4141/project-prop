"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { EditAgentModal } from "@/components/v2/agents/EditAgentModal";

type Agent = {
  id:        string;
  name?:     string | null;
  firmName?: string | null;
  phones:    string[];
};

export function EditAgentButton({ agent }: { agent: Agent }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-500 hover:border-sky-300 hover:text-sky-700 transition-all"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </button>

      {open && (
        <EditAgentModal
          agent={agent}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}