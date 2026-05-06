"use client";

import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, ChevronsUpDown, Phone, Building2 } from "lucide-react";

type SortOrder = "asc" | "desc";

/* ------------------------------------------------------------------ */
/* SORT BUTTON                                                         */
/* ------------------------------------------------------------------ */

function SortTh({
  label,
  col,
  sortBy,
  sortOrder,
  onSort,
  align = "left",
}: {
  label: string;
  col: string;
  sortBy: string;
  sortOrder: SortOrder;
  onSort: (col: string) => void;
  align?: "left" | "right";
}) {
  const active = sortBy === col;
  const Icon = active
    ? sortOrder === "asc" ? ChevronUp : ChevronDown
    : ChevronsUpDown;

  return (
    <th className={`px-5 py-3 text-${align}`}>
      <button
        onClick={() => onSort(col)}
        className={[
          "inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider transition-colors",
          active ? "text-slate-700" : "text-slate-400 hover:text-slate-600",
        ].join(" ")}
      >
        {label}
        <Icon className="h-3 w-3 flex-shrink-0" />
      </button>
    </th>
  );
}

/* ------------------------------------------------------------------ */
/* AGENT INITIALS AVATAR                                               */
/* ------------------------------------------------------------------ */

function Avatar({ name }: { name?: string | null }) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
      {initials}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TABLE                                                               */
/* ------------------------------------------------------------------ */

export function AgentListTable({
  agents,
  sortBy,
  sortOrder,
  onSortChange,
}: {
  agents: any[];
  sortBy: string;
  sortOrder: SortOrder;
  onSortChange: (column: string) => void;
}) {
  const router = useRouter();

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full table-fixed border-collapse">

        {/* ── HEADER ── */}
        <thead>
          <tr className="border-b border-slate-100">
            <SortTh label="Agent"           col="name"          sortBy={sortBy} sortOrder={sortOrder} onSort={onSortChange} />
            <th className="w-[16%] px-5 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">Phone</th>
            <SortTh label="Firm"            col="firmName"      sortBy={sortBy} sortOrder={sortOrder} onSort={onSortChange} />
            <SortTh label="Shared"          col="propertyCount" sortBy={sortBy} sortOrder={sortOrder} onSort={onSortChange} align="right" />
            <SortTh label="Joined"          col="createdAt"     sortBy={sortBy} sortOrder={sortOrder} onSort={onSortChange} />
          </tr>
        </thead>

        {/* ── BODY ── */}
        <tbody>
          {agents.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">👤</div>
                  <p className="text-[14px] font-semibold text-slate-800">No agents found</p>
                  <p className="mt-1 text-[12.5px] text-slate-400">Try adjusting your search.</p>
                </div>
              </td>
            </tr>
          ) : (
            agents.map((agent) => (
              <tr
                key={agent.id}
                onClick={() => router.push(`/v2/agents/${agent.id}`)}
                className="cursor-pointer border-b border-slate-50 transition-colors duration-100 hover:bg-slate-50/70"
              >
                {/* Agent */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={agent.name} />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-slate-800" title={agent.name || "Unnamed Agent"}>
                        {agent.name || "Unnamed Agent"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {agent.phoneCount} phone{agent.phoneCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Phone */}
                <td className="px-5 py-3.5">
                  {agent.primaryPhone ? (
                    <a
                      href={`tel:${agent.primaryPhone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-[12.5px] text-slate-500 hover:text-emerald-700 transition-colors w-fit"
                    >
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      {agent.primaryPhone}
                    </a>
                  ) : (
                    <span className="text-[12.5px] text-slate-400">—</span>
                  )}
                </td>

                {/* Firm */}
                <td className="px-5 py-3.5">
                  {agent.firmName ? (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Building2 className="h-3 w-3 flex-shrink-0 text-slate-400" />
                      <span className="truncate text-[12.5px] text-slate-600" title={agent.firmName}>
                        {agent.firmName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[12.5px] text-slate-400">—</span>
                  )}
                </td>

                {/* Properties shared */}
                <td className="px-5 py-3.5 text-right">
                  <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-slate-100 px-2 text-[11.5px] font-semibold text-slate-600">
                    {agent.propertyCount}
                  </span>
                </td>

                {/* Created */}
                <td className="px-5 py-3.5">
                  <span className="text-[12px] text-slate-400">
                    {new Date(agent.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}