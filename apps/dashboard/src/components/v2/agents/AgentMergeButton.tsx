"use client";

import { useState } from "react";
import { GitMerge } from "lucide-react";
import { AgentMergeModal } from "@/components/v2/agents/AgentMergeModal";

type Agent = {
  id:        string;
  name?:     string | null;
  firmName?: string | null;
  phones:    string[];
};

export function AgentMergeButton({ agent }: { agent: Agent }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-500 hover:border-violet-300 hover:text-violet-700 transition-all"
        title="Merge with another agent"
      >
        <GitMerge className="h-3.5 w-3.5" />
        Merge
      </button>

      {open && (
        <AgentMergeModal
          sourceAgent={agent}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}