"use client";

import { Phone, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/apiBase";

/* ============================================================
   TYPES
============================================================ */

type AgentPhone = {
  phone: string;
};

type Agent = {
  id: string;
  name?: string | null;
  phones?: AgentPhone[] | null;
};

type Props = {
  propertyId: string;
  firmName: string | null;
  agents: Agent[] | null | undefined;
  confidence: number;
  editable?: boolean;
};

/* ============================================================
   COMPONENT
============================================================ */

export function PropertyAgentsTable({
  propertyId,
  firmName,
  agents,
  confidence,
  editable = false,
}: Props) {
  const router = useRouter();
  const safeAgents: Agent[] = Array.isArray(agents) ? agents : [];

  /* ============================================================
     REMOVE AGENT (DETACH ONLY)
  ============================================================ */

  async function removeAgent(agentId: string) {
    if (!confirm("Remove this agent from the property?")) return;

    try {
      const res = await fetch(
        `${API_BASE}/properties/${propertyId}/agents/${agentId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        throw new Error("REMOVE_FAILED");
      }

      router.refresh();
    } catch (err) {
      console.error("Remove agent failed:", err);
      alert("Failed to remove agent from property.");
    }
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="space-y-4">
      {/* ================= AGENTS TABLE ================= */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-3 py-2">Agent</th>
              <th className="px-3 py-2">Contact No.</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {safeAgents.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-4 text-center text-muted-foreground"
                >
                  No agents attached
                </td>
              </tr>
            ) : (
              safeAgents.map((agent) => {
                const phones =
                  Array.isArray(agent.phones) && agent.phones.length > 0
                    ? agent.phones
                    : [{ phone: "—" }];

                return phones.map((p, idx) => (
                  <tr
                    key={`${agent.id}-${idx}`}
                    className="border-t"
                  >
                    <td className="px-3 py-2 font-medium">
                      {agent.name || "—"}
                    </td>

                    <td className="px-3 py-2">
                      {p.phone !== "—" ? p.phone : "—"}
                    </td>

                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        {p.phone !== "—" && (
                          <a
                            href={`tel:${p.phone}`}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted"
                          >
                            <Phone size={14} />
                            Call
                          </a>
                        )}

                        {editable && (
                          <button
                            onClick={() => removeAgent(agent.id)}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ));
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================= CONFIDENCE ================= */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Confidence</div>
        <div className="text-sm font-medium">
          {Number.isFinite(confidence) ? confidence.toFixed(2) : "—"}
        </div>
      </div>
    </div>
  );
}
