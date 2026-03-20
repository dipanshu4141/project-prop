"use client";

import { Phone, ChevronRight } from "lucide-react";
import { LeadStageBadge } from "@/components/v2/utils/leadStage";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function PropertyLeadsDropdown({
  leads,
}: {
  leads: any[];
}) {
  if (!leads || leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="mb-2 text-2xl">📋</div>
        <p className="text-[13px] font-medium text-slate-700">No leads yet</p>
        <p className="text-[11.5px] text-slate-400 mt-0.5">
          Share this property with a client to create a lead.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-50">
      {leads.map((lead: any) => (
        <div
          key={lead.id}
          className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
        >
          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
              {(lead.targetName ?? lead.targetContact ?? "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-800 truncate">
                {lead.targetName || "Unnamed"}
              </p>
              {lead.targetContact && (
                <a
                  href={`tel:${lead.targetContact}`}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-700 transition-colors w-fit"
                >
                  <Phone className="h-3 w-3" />
                  {lead.targetContact}
                </a>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <LeadStageBadge stage={lead.leadStage ?? "NEW"} />
            {lead.followUpAt && (
              <span className="text-[11px] text-slate-400">
                {fmt(lead.followUpAt)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}