import { notFound } from "next/navigation";
import { serverGet } from "@/lib/serverApi";
import { unwrap } from "@/lib/unwrap";
import Link from "next/link";
import { ChevronLeft, Phone, MessageSquare, Building2, Calendar } from "lucide-react";
import { AgentPropertiesSection } from "@/components/v2/agents/AgentPropertiesSection";
import { AgentMergeButton } from "@/components/v2/agents/AgentMergeButton";
import { EditAgentButton } from "@/components/v2/agents/EditAgentButton";

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

type AgentProperty = {
  id: string;
  city?: string | null;
  area?: string | null;
  price?: number | null;
  bhk?: string | null;
  propertySubType?: string | null;
};

type AgentResponse = {
  id: string;
  name?: string | null;
  firmName?: string | null;
  phones: string[];
  properties: AgentProperty[];
  createdAt: string;
};

/* ------------------------------------------------------------------ */
/* DATA                                                                */
/* ------------------------------------------------------------------ */

async function getAgent(agentId: string): Promise<AgentResponse> {
  try {
    return await serverGet<AgentResponse>(`/agents/${agentId}`);
  } catch (err: any) {
    if (err.status === 404 || err.message?.includes('404')) notFound();
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }> | { agentId: string };
}) {
  const { agentId } = await unwrap(params);
  const agent = await getAgent(agentId);

  const initials = agent.name
    ? agent.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "A";

  const primaryPhone = agent.phones[0] ?? null;

  const stats = [
    { label: "Properties",  value: agent.properties.length, icon: Building2 },
    { label: "Phone numbers", value: agent.phones.length,  icon: Phone      },
    { label: "Since",        value: new Date(agent.createdAt).getFullYear(), icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F0]">

      {/* ── STICKY TOP NAV ── */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-3">
        <Link
          href="/v2/agents"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Agents
        </Link>

        <p className="absolute left-1/2 -translate-x-1/2 text-[13px] font-semibold text-slate-700 truncate max-w-xs">
          {agent.name ?? "Unnamed Agent"}
        </p>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          {primaryPhone && (
            <>
              <a
                href={`tel:${primaryPhone}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:text-emerald-700 transition-all"
                title="Call"
              >
                <Phone className="h-3.5 w-3.5" />
              </a>
              <a
                href={`https://wa.me/${primaryPhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 items-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-xs font-semibold text-white hover:bg-[#1fb855] transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            </>
          )}
          <EditAgentButton agent={agent} />
          <AgentMergeButton agent={agent} />
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-6 space-y-5">

        {/* ── PROFILE HEADER ── */}
        <div className="flex items-center gap-4 rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-6 py-5">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-[16px] font-bold text-violet-700">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[20px] font-bold text-slate-900 leading-tight">
              {agent.name ?? "Unnamed Agent"}
            </h1>
            <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-slate-500">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              {agent.firmName ?? "Independent"}
            </div>
          </div>

          {/* Stat pills */}
          <div className="hidden lg:flex items-center gap-3">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                  <Icon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-[18px] font-bold text-slate-900 leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      {s.value}
                    </p>
                    <p className="text-[10.5px] text-slate-400 mt-0.5 whitespace-nowrap">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-12 gap-5">

          {/* ── LEFT — properties ── */}
          <div className="col-span-12 lg:col-span-8">
            <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <p className="text-[13px] font-semibold text-slate-800">Linked properties</p>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                  {agent.properties.length}
                </span>
              </div>
              <div className="px-5 py-4">
                <AgentPropertiesSection
                  agentId={agent.id}
                  initialProperties={agent.properties}
                />
              </div>
            </div>
          </div>

          {/* ── RIGHT — contact numbers ── */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <p className="text-[13px] font-semibold text-slate-800">Contact numbers</p>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                  {agent.phones.length}
                </span>
              </div>

              <div className="px-5 py-4">
                {agent.phones.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-2 text-xl">📵</div>
                    <p className="text-[12.5px] text-slate-500">No phone numbers on file.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {agent.phones.map((phone, i) => (
                      <li
                        key={phone}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-[9px] font-bold text-slate-500">
                            {i + 1}
                          </div>
                          <span className="text-[13px] font-medium text-slate-700">{phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${phone}`}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-emerald-300 hover:text-emerald-700 transition-all"
                            title="Call"
                          >
                            <Phone className="h-3 w-3" />
                          </a>
                          <a
                            href={`https://wa.me/${phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#25D366] text-white hover:bg-[#1fb855] transition-colors"
                            title="WhatsApp"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}