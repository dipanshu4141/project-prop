// import { PageContainer } from "@/components/v2/layout/PageContainer";
// import { PageHeader } from "@/components/v2/layout/PageHeader";
// import { ClientNotes } from "@/components/v2/clients/ClientNotes";
// import { ClientTimeline } from "@/components/v2/clients/ClientTimeline";
// import { ClientWhatsAppAction } from "@/components/v2/clients/ClientWhatsAppAction";
// import ClientPropertiesGrid from "../ClientPropertiesGrid";

// const API_BASE = process.env.API_URL!;

// /* ===================== TYPES ===================== */

// type ClientProperty = {
//   id: string;
//   status: string;
//   sharedAt: string;
//   followUpAt?: string | null;
//   property: {
//     id: string;
//     propertySubType?: string | null;
//     bhk?: string | null;
//     area?: string | null;
//     city?: string | null;
//     price?: string | number | null;
//   };
// };

// type ClientEvent = {
//   id: string;
//   type: string;
//   metadata: { note?: string };
//   createdAt: string;
// };

// type ClientResponse = {
//   id: string;
//   name?: string | null;
//   phone: string;
//   properties: ClientProperty[];
//   events: ClientEvent[];
// };

// /* ===================== DATA ===================== */

// async function getClient(id: string): Promise<ClientResponse> {
//   const res = await fetch(`${API_BASE}/clients/${id}`, { cache: "no-store" });
//   if (!res.ok) throw new Error("Failed to fetch client");
//   return res.json();
// }

// /* ===================== PAGE ===================== */

// export default async function ClientPage({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   const { id } = await params;
//   const client = await getClient(id);

//   const notes =
//     client.events
//       ?.filter((e) => e.type === "NOTE_ADDED" && e.metadata?.note)
//       .map((e) => ({
//         id: e.id,
//         note: e.metadata.note!,
//         createdAt: e.createdAt,
//       })) ?? [];

//   return (
//     <PageContainer>
//   {/* HEADER */}
//   <PageHeader
//     title={client.name || "Unnamed Client"}
//     subtitle={
//       <span className="text-muted-foreground no-underline decoration-transparent">
//         {client.phone}
//       </span>
//     }
//     actions={
//       <div className="flex items-center gap-2">
//         <ClientWhatsAppAction
//           clientId={client.id}
//           defaultClientPropertyId={
//             client.properties.length === 1
//               ? client.properties[0].id
//               : null
//           }
//         />
//         <a
//           href={`tel:${client.phone}`}
//           className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
//         >
//           Call
//         </a>
//       </div>
//     }
//   />

//   {/* SUMMARY STRIP */}
//   <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
//     <SummaryCard label="Active Leads" value={client.properties.length} />
//     <SummaryCard label="Properties Shared" value={client.properties.length} />
//     <SummaryCard label="Activities" value={client.events.length} />
//     <SummaryCard label="Notes" value={notes.length} />
//   </div>

//   {/* MAIN GRID */}
//   <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
//     {/* LEFT COLUMN */}
//     <div className="space-y-6 lg:col-span-2">
//       <Section title="Properties">
//         <ClientPropertiesGrid
//           properties={client.properties}
//           phone={client.phone}
//         />
//       </Section>

//       <Section title="Activity Timeline">
//         <ClientTimeline events={client.events} />
//       </Section>
//     </div>

//     {/* RIGHT COLUMN */}
//     <div className="space-y-6">
//       <Section title="Notes">
//         <ClientNotes clientId={client.id} notes={notes} />
//       </Section>

//       {/* QUICK ACTIONS */}
//       <div className="rounded-xl border bg-card p-4 space-y-3">
//         <ClientWhatsAppAction
//           clientId={client.id}
//           defaultClientPropertyId={
//             client.properties.length === 1
//               ? client.properties[0].id
//               : null
//           }
//           fullWidth
//         />

//         <a
//           href={`tel:${client.phone}`}
//           className="block w-full rounded-lg border px-4 py-2 text-center text-sm font-medium hover:bg-muted"
//         >
//           Call Client
//         </a>
//       </div>
//     </div>
//   </div>
// </PageContainer>

//   );
// }

// /* ===================== UI HELPERS ===================== */

// function SummaryCard({
//   label,
//   value,
// }: {
//   label: string;
//   value: number;
// }) {
//   return (
//     <div className="rounded-xl border bg-card p-4">
//       <div className="text-xs text-muted-foreground">{label}</div>
//       <div className="mt-1 text-xl font-semibold">{value}</div>
//     </div>
//   );
// }

// function Section({
//   title,
//   children,
// }: {
//   title: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="rounded-xl border bg-card p-4">
//       <div className="mb-4 text-sm font-semibold">{title}</div>
//       {children}
//     </div>
//   );
// }

// import ClientPropertiesGrid from "../ClientPropertiesGrid";
import ClientPropertiesTable from "../ClientPropertiesTable";
import { ClientTimeline } from "@/components/v2/clients/ClientTimeline";
import { ClientNotes } from "@/components/v2/clients/ClientNotes";
import { ClientWhatsAppAction } from "@/components/v2/clients/ClientWhatsAppAction";
import { getServerApiBase } from "@/lib/serverApi";

const API = getServerApiBase();

// const API_BASE = process.env.API_URL!;

/* ===================== TYPES ===================== */

type ClientEvent = {
  id: string;
  type: string;
  metadata?: {
    note?: string;
  };
  createdAt: string;
};

type ClientResponse = {
  id: string;
  name?: string | null;
  phone: string;
  properties: any[];
  events: ClientEvent[];
};

/* ===================== DATA ===================== */

async function getClient(id: string): Promise<ClientResponse> {
  const res = await fetch(`${API}/clients/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch client (${res.status})`);
  }

  return res.json();
}

/* ===================== PAGE ===================== */

export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);

  const notes =
    client.events
      .filter((e) => e.type === "NOTE_ADDED" && e.metadata?.note)
      .map((e) => ({
        id: e.id,
        note: e.metadata!.note!,
        createdAt: e.createdAt,
      })) ?? [];

  return (
    <div className="px-6 py-6 h-screen overflow-hidden flex flex-col gap-8">
      {/* ================= HEADER ================= */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">
            {client.name?.charAt(0) ?? "C"}
          </div>

          <div>
            <h1 className="text-2xl font-semibold">
              {client.name || "Unnamed Client"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {client.phone}
            </p>
          </div>
          
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Active Leads" value={client.properties.length} />
        <Stat label="Properties Shared" value={client.properties.length} />
        <Stat label="Past Activities" value={client.events.length} />
        <Stat label="Notes" value={notes.length} />
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
        {/* ================= LEFT ================= */}
        <div className="col-span-12 lg:col-span-8 space-y-8 overflow-y-auto pr-2">
          {/* PROPERTIES */}
          <Section title="Properties Shared">
            <ClientPropertiesTable
              properties={client.properties}
              phone={client.phone}
            />
          </Section>

          {/* ACTIVITY */}
          <Section title="Recent Activities">
            <ClientTimeline events={client.events} />
          </Section>
        </div>

        {/* ================= RIGHT ================= */}
        <aside className="col-span-12 lg:col-span-4 space-y-6 sticky top-6 h-fit">
          {/* NOTES */}
          <Section title="Add Note">
            <ClientNotes clientId={client.id} notes={notes} />
          </Section>

          {/* ACTIONS */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <ClientWhatsAppAction
              clientId={client.id}
              defaultClientPropertyId={
                client.properties.length === 1
                  ? client.properties[0].id
                  : null
              }
              fullWidth
            />

            <a
              href={`https://wa.me/${client.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className={[
                "inline-flex items-center justify-center gap-2 rounded-lg",
                "bg-green-600 text-white hover:bg-green-700",
                "px-4 py-2 text-sm font-medium transition",
                 "w-full" ,
              ].join(" ")}
            >
              WhatsApp
            </a>


            <a
              href={`tel:${client.phone}`}
              className="block w-full rounded-lg border px-4 py-2 text-center font-medium hover:bg-muted"
            >
              Call
            </a>
          </div>
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
