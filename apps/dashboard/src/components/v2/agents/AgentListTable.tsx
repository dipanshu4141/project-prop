"use client";

import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  DataTable,
  DataTableRow,
  DataTableCell,
} from "@/components/v2/tables/DataTable";

type SortOrder = "asc" | "desc";

function SortIcon({
  active,
  order,
}: {
  active: boolean;
  order: SortOrder;
}) {
  if (!active) return null;
  return order === "asc" ? (
    <ChevronUp className="ml-1 h-3 w-3" />
  ) : (
    <ChevronDown className="ml-1 h-3 w-3" />
  );
}

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
    <div className="w-full overflow-x-hidden">
      <table className="w-full table-fixed border-collapse">
        {/* ================= HEADER ================= */}
        <thead className="border-b bg-muted">
          <tr className="text-left text-sm font-medium">
            <th className="w-[22%] px-4 py-3">
              <button
                onClick={() => onSortChange("name")}
                className="flex items-center"
              >
                Agent
                <SortIcon active={sortBy === "name"} order={sortOrder} />
              </button>
            </th>

            <th className="w-[16%] px-4 py-3">Phone</th>

            <th className="w-[34%] px-4 py-3">
              <button
                onClick={() => onSortChange("firmName")}
                className="flex items-center"
              >
                Firm
                <SortIcon active={sortBy === "firmName"} order={sortOrder} />
              </button>
            </th>

            <th className="w-[16%] px-4 py-3 text-right">
                <button
                    onClick={() => onSortChange("propertyCount")}
                    className="flex items-center justify-end gap-1"
                >
                    Shared Property
                    <SortIcon
                    active={sortBy === "propertyCount"}
                    order={sortOrder}
                    />
                </button>
            </th>


            <th className="w-[12%] px-4 py-3">
              <button
                onClick={() => onSortChange("createdAt")}
                className="flex items-center"
              >
                Created
                <SortIcon active={sortBy === "createdAt"} order={sortOrder} />
              </button>
            </th>
          </tr>
        </thead>

        {/* ================= BODY ================= */}
        <tbody>
          {agents.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-10 text-center text-muted-foreground">
                No agents found
              </td>
            </tr>
          ) : (
            agents.map((agent) => (
              <tr
                key={agent.id}
                onClick={() => router.push(`/v2/agents/${agent.id}`)}
                className="cursor-pointer border-b hover:bg-muted/50"
              >
                {/* Agent */}
                <td className="px-4 py-3">
                  <div
                    className="truncate font-medium"
                    title={agent.name || "Unnamed Agent"}
                  >
                    {agent.name || "Unnamed Agent"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {agent.phoneCount} phone
                    {agent.phoneCount > 1 ? "s" : ""}
                  </div>
                </td>

                {/* Phone */}
                <td
                  className="px-4 py-3 truncate"
                  title={agent.primaryPhone || ""}
                >
                  {agent.primaryPhone || "—"}
                </td>

                {/* Firm */}
                <td
                  className="px-4 py-3 truncate"
                  title={agent.firmName || ""}
                >
                  {agent.firmName || "—"}
                </td>

                {/* Properties */}
                <td className="px-4 py-3 text-left">
                  {agent.propertyCount}
                </td>

                {/* Created */}
                <td
                  className="px-4 py-3 truncate text-sm text-muted-foreground"
                  title={new Date(agent.createdAt).toLocaleString()}
                >
                  {new Date(agent.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
