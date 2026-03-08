import { notFound } from "next/navigation";
import { serverFetch } from "@/lib/serverFetch";
import { unwrap } from "@/lib/unwrap";
import Link from "next/link";
import { AgentPropertiesSection } from "@/components/v2/agents/AgentPropertiesSection";


/* ===================== TYPES ===================== */

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

/* ===================== DATA ===================== */

async function getAgent(agentId: string): Promise<AgentResponse> {
  try {
    return await serverFetch<AgentResponse>(`/agents/${agentId}`);
  } catch (err: any) {
    if (err.message === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }
}

/* ===================== PAGE ===================== */

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }> | { agentId: string };
}) {
  // ✅ SAFE for both Promise + object
  const { agentId } = await unwrap(params);

  const agent = await getAgent(agentId);

  return (
    <div className="px-6 py-6 h-screen overflow-hidden flex flex-col gap-8">
      {/* ================= HEADER ================= */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">
            {agent.name?.charAt(0) ?? "A"}
          </div>

          <div>
            <h1 className="text-2xl font-semibold">
              {agent.name ?? "Unnamed Agent"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {agent.firmName ?? "Independent"}
            </p>
          </div>
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Phones" value={agent.phones.length} />
        <Stat label="Properties" value={agent.properties.length} />
        <Stat label="Firm" value={agent.firmName ? 1 : 0} />
        <Stat
          label="Since"
          value={new Date(agent.createdAt).getFullYear()}
        />
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
        {/* ================= LEFT ================= */}
        <div className="col-span-12 lg:col-span-8 space-y-8 overflow-y-auto pr-2">
          {/* PROPERTIES */}
          <Section title="Linked Properties">
            <AgentPropertiesSection
              agentId={agent.id}
              initialProperties={agent.properties}
            />
          </Section>



        </div>

        {/* ================= RIGHT ================= */}
        <aside className="col-span-12 lg:col-span-4 space-y-6 sticky top-6 h-fit">
          {/* PHONES */}
          <Section title="Contact Numbers">
            <ul className="space-y-2 text-sm">
              {agent.phones.map((phone) => (
                <li
                  key={phone}
                  className="flex items-center justify-between rounded border px-3 py-2"
                >
                  <span>{phone}</span>
                  <div className="flex gap-2">
                    <a
                      href={`tel:${phone}`}
                      className="text-primary hover:underline"
                    >
                      Call
                    </a>
                    <a
                      href={`https://wa.me/${phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline"
                    >
                      WhatsApp
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        </aside>
      </div>
    </div>
  );
}

/* ===================== UI HELPERS ===================== */

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-4 text-sm font-semibold">{title}</div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-sm text-muted-foreground">{text}</div>;
}

function PropertyCard({ property }: { property: AgentProperty }) {
  return (
    <Link
      href={`/v2/properties/${property.id}`}
      className="block rounded-lg border p-4 hover:bg-muted transition"
    >
      <div className="text-sm font-medium">
        {property.bhk
          ? `${property.bhk} ${property.propertySubType ?? ""}`
          : property.propertySubType ?? "Property"}
      </div>

      <div className="mt-1 text-sm text-muted-foreground">
        {property.city ?? "—"} · {property.area ?? "—"}
      </div>

      <div className="mt-2 text-sm font-semibold">
        {property.price ? `₹${property.price}` : "Price on request"}
      </div>
    </Link>
  );
}