"use client";

import { useState } from "react";
import { Phone, Trash2, Pencil, UserCircle2, MessageCircle } from "lucide-react";
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
  property?:   any;
};

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

function getPhoneStrings(agent: Agent): string[] {
  if (!Array.isArray(agent.phones) || agent.phones.length === 0) return [];
  return agent.phones.map((p) =>
    typeof p === "string" ? p : (p as AgentPhone).phone
  );
}

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function normalizePhoneForLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function buildWhatsAppPrefill(property: any): string {
  if (!property) return "Hi, is this property still available?";
  const title = [property.bhk, property.propertySubType].filter(Boolean).join(" ") || "your property";
  const location = property.area || property.city || property.location || "";
  return `Hi, I'm interested in the ${title}${location ? ` in ${location}` : ""} (${property.refCode ?? ""}). Is it still available?`;
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
  property,
}: Props) {
  const router = useRouter();
  const safeAgents: Agent[] = Array.isArray(agents) ? agents : [];

  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  async function removeAgent(agentId: string) {
    if (!confirm("Remove this realtor from the property?")) return;
    try {
      await apiDel(`/properties/${propertyId}/agents/${agentId}`);
      router.refresh();
    } catch {
      alert("Failed to remove realtor.");
    }
  }

  if (safeAgents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <UserCircle2 className="h-8 w-8 text-slate-300 mb-2" />
        <p className="text-[12.5px] font-medium text-slate-600">No realtors attached</p>
        <p className="text-[11.5px] text-slate-400 mt-0.5">
          {editable ? "Use the button above to attach a realtor by phone." : "No realtor info available."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {safeAgents.map((agent) => {
          const phones = getPhoneStrings(agent);
          const waMessage = buildWhatsAppPrefill(property);

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
                    {agent.name ?? "Unnamed realtor"}
                  </p>
                  {agent.firmName && (
                    <p className="text-[11.5px] text-slate-400">{agent.firmName}</p>
                  )}

                  {/* Phone numbers — each with Call + WhatsApp */}
                  {phones.length > 0 && (
                    <div className="mt-1.5 space-y-1.5">
                      {phones.map((phone) => (
                        <div key={phone} className="flex items-center gap-2">
                          <span className="text-[11.5px] text-slate-600 font-medium">{phone}</span>
                          <a
                            href={`tel:${phone}`}
                            className="flex items-center gap-1 h-6 px-2 rounded-md border border-slate-200 bg-white text-[10.5px] font-medium text-slate-500 hover:border-emerald-300 hover:text-emerald-700 transition-all"
                          >
                            <Phone className="h-2.5 w-2.5" />
                            Call
                          </a>
                          <a
                            href={`https://api.whatsapp.com/send/?phone=${normalizePhoneForLink(phone)}&text=${encodeURIComponent(waMessage)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 h-6 px-2 rounded-md bg-[#25D366] text-[10.5px] font-medium text-white hover:bg-[#1fb855] transition-all"
                          >
                            <MessageCircle className="h-2.5 w-2.5" />
                            
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Edit/Remove actions */}
                {editable && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setEditingAgent(agent)}
                      className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-slate-200 bg-white text-[11.5px] font-medium text-slate-500 hover:border-sky-300 hover:text-sky-700 transition-all"
                      title="Edit realtor"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>

                    <button
                      onClick={() => removeAgent(agent.id)}
                      className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-slate-200 bg-white text-[11.5px] font-medium text-slate-400 hover:border-red-300 hover:text-red-600 transition-all"
                      title="Remove from property"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
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