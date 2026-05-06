"use client";

import { useState } from "react";
import { Phone, Trash2, Pencil, UserCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiDel } from "@/lib/api";
import { EditAgentModal } from "@/components/v2/agents/EditAgentModal";

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

type AgentPhone = { phone: string };

type Agent = {
  id:        string;
  name?:     string | null;
  firmName?: string | null;
  phones?:   AgentPhone[] | string[] | null;
};

type Props = {
  propertyId:  string;
  firmName:    string | null;
  agents:      Agent[] | null | undefined;
  confidence:  number;
  editable?:   boolean;
};

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

function getPhoneStrings(agent: Agent): string[] {
  if (!Array.isArray(agent.phones) || agent.phones.length === 0) return [];
  // phones can be AgentPhone[] or string[]
  return agent.phones.map((p) =>
    typeof p === "string" ? p : (p as AgentPhone).phone
  );
}

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */

export function PropertyAgentsTable({
  propertyId,
  firmName,
  agents,
  confidence,
  editable = false,
}: Props) {
  const router = useRouter();
  const safeAgents: Agent[] = Array.isArray(agents) ? agents : [];

  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  async function removeAgent(agentId: string) {
    if (!confirm("Remove this agent from the property?")) return;
    try {
      await apiDel(`/properties/${propertyId}/agents/${agentId}`);
      router.refresh();
    } catch {
      alert("Failed to remove agent.");
    }
  }

  if (safeAgents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <UserCircle2 className="h-8 w-8 text-slate-300 mb-2" />
        <p className="text-[12.5px] font-medium text-slate-600">No agents attached</p>
        <p className="text-[11.5px] text-slate-400 mt-0.5">
          {editable ? "Use the button above to attach an agent by phone." : "No agent info available."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {safeAgents.map((agent) => {
          const phones = getPhoneStrings(agent);

          return (
            <div
              key={agent.id}
              className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-700">
                  {initials(agent.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-slate-800">
                    {agent.name ?? "Unnamed agent"}
                  </p>
                  {agent.firmName && (
                    <p className="text-[11.5px] text-slate-400">{agent.firmName}</p>
                  )}

                  {/* Phone numbers */}
                  {phones.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {phones.map((phone) => (
                        <a
                          key={phone}
                          href={`tel:${phone}`}
                          className="flex items-center gap-1 text-[11.5px] text-emerald-700 hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {phone}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {editable && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Edit */}
                    <button
                      onClick={() => setEditingAgent(agent)}
                      className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-slate-200 bg-white text-[11.5px] font-medium text-slate-500 hover:border-sky-300 hover:text-sky-700 transition-all"
                      title="Edit agent"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>

                    {/* Remove */}
                    <button
                      onClick={() => removeAgent(agent.id)}
                      className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-slate-200 bg-white text-[11.5px] font-medium text-slate-400 hover:border-red-300 hover:text-red-600 transition-all"
                      title="Remove from property"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Non-editable: call button only */}
                {!editable && phones.length > 0 && (
                  <a
                    href={`tel:${phones[0]}`}
                    className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-slate-200 bg-white text-[11.5px] font-medium text-slate-500 hover:border-emerald-300 hover:text-emerald-700 transition-all flex-shrink-0"
                  >
                    <Phone className="h-3 w-3" />
                    Call
                  </a>
                )}
              </div>
            </div>
          );
        })}

        {/* Confidence */}
        {Number.isFinite(confidence) && confidence > 0 && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-400">AI confidence</p>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 rounded-full bg-slate-100">
                <div
                  className="h-1.5 rounded-full bg-emerald-400"
                  style={{ width: `${Math.min(confidence * 100, 100)}%` }}
                />
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                {(confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Edit agent modal */}
      {editingAgent && (
        <EditAgentModal
          agent={{
            id:        editingAgent.id,
            name:      editingAgent.name,
            firmName:  editingAgent.firmName,
            phones:    getPhoneStrings(editingAgent),
          }}
          onClose={() => setEditingAgent(null)}
          onSaved={() => { setEditingAgent(null); router.refresh(); }}
        />
      )}
    </>
  );
}