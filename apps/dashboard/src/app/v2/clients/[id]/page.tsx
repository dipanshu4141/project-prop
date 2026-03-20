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
// import ClientPropertiesTable from "../ClientPropertiesTable";
// import { ClientTimeline } from "@/components/v2/clients/ClientTimeline";
// import { ClientNotes } from "@/components/v2/clients/ClientNotes";
// import { ClientWhatsAppAction } from "@/components/v2/clients/ClientWhatsAppAction";
// import { getServerApiBase } from "@/lib/serverApi";

// const API = getServerApiBase();

// // const API_BASE = process.env.API_URL!;

// /* ===================== TYPES ===================== */

// type ClientEvent = {
//   id: string;
//   type: string;
//   metadata?: {
//     note?: string;
//   };
//   createdAt: string;
// };

// type ClientResponse = {
//   id: string;
//   name?: string | null;
//   phone: string;
//   properties: any[];
//   events: ClientEvent[];
// };

// /* ===================== DATA ===================== */

// async function getClient(id: string): Promise<ClientResponse> {
//   const res = await fetch(`${API}/clients/${id}`, {
//     cache: "no-store",
//   });

//   if (!res.ok) {
//     throw new Error(`Failed to fetch client (${res.status})`);
//   }

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
//       .filter((e) => e.type === "NOTE_ADDED" && e.metadata?.note)
//       .map((e) => ({
//         id: e.id,
//         note: e.metadata!.note!,
//         createdAt: e.createdAt,
//       })) ?? [];

//   return (
//     <div className="px-6 py-6 h-screen overflow-hidden flex flex-col gap-8">
//       {/* ================= HEADER ================= */}
//       <div className="flex items-start justify-between">
//         <div className="flex items-start gap-4">
//           <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">
//             {client.name?.charAt(0) ?? "C"}
//           </div>

//           <div>
//             <h1 className="text-2xl font-semibold">
//               {client.name || "Unnamed Client"}
//             </h1>
//             <p className="text-sm text-muted-foreground">
//               {client.phone}
//             </p>
//           </div>
          
//         </div>
//       </div>

//       {/* ================= STATS ================= */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//         <Stat label="Active Leads" value={client.properties.length} />
//         <Stat label="Properties Shared" value={client.properties.length} />
//         <Stat label="Past Activities" value={client.events.length} />
//         <Stat label="Notes" value={notes.length} />
//       </div>

//       {/* ================= MAIN GRID ================= */}
//       <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
//         {/* ================= LEFT ================= */}
//         <div className="col-span-12 lg:col-span-8 space-y-8 overflow-y-auto pr-2">
//           {/* PROPERTIES */}
//           <Section title="Properties Shared">
//             <ClientPropertiesTable
//               properties={client.properties}
//               phone={client.phone}
//             />
//           </Section>

//           {/* ACTIVITY */}
//           <Section title="Recent Activities">
//             <ClientTimeline events={client.events} />
//           </Section>
//         </div>

//         {/* ================= RIGHT ================= */}
//         <aside className="col-span-12 lg:col-span-4 space-y-6 sticky top-6 h-fit">
//           {/* NOTES */}
//           <Section title="Add Note">
//             <ClientNotes clientId={client.id} notes={notes} />
//           </Section>

//           {/* ACTIONS */}
//           <div className="rounded-xl border bg-card p-4 space-y-3">
//             <ClientWhatsAppAction
//               clientId={client.id}
//               defaultClientPropertyId={
//                 client.properties.length === 1
//                   ? client.properties[0].id
//                   : null
//               }
//               fullWidth
//             />

//             <a
//               href={`https://wa.me/${client.phone.replace(/\D/g, "")}`}
//               target="_blank"
//               rel="noopener noreferrer"
//               className={[
//                 "inline-flex items-center justify-center gap-2 rounded-lg",
//                 "bg-green-600 text-white hover:bg-green-700",
//                 "px-4 py-2 text-sm font-medium transition",
//                  "w-full" ,
//               ].join(" ")}
//             >
//               WhatsApp
//             </a>


//             <a
//               href={`tel:${client.phone}`}
//               className="block w-full rounded-lg border px-4 py-2 text-center font-medium hover:bg-muted"
//             >
//               Call
//             </a>
//           </div>
//         </aside>
//       </div>
//     </div>
//   );
// }

// /* ===================== UI HELPERS ===================== */

// function Stat({ label, value }: { label: string; value: number }) {
//   return (
//     <div className="rounded-xl border bg-card p-4">
//       <div className="text-sm text-muted-foreground">{label}</div>
//       <div className="mt-1 text-2xl font-semibold">{value}</div>
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


import ClientPropertiesTable from "../ClientPropertiesTable";
import { ClientTimeline } from "@/components/v2/clients/ClientTimeline";
import { ClientNotes } from "@/components/v2/clients/ClientNotes";
import { ClientWhatsAppAction } from "@/components/v2/clients/ClientWhatsAppAction";
import { serverGet } from "@/lib/serverApi";
import { ChevronLeft, Phone, MessageSquare, Building2, Activity, StickyNote, FileText } from "lucide-react";
import Link from "next/link";


import { ClientPropertiesTabs } from '@/components/v2/clients/ClientPropertiesTabs';
import { ShareButton } from '@/components/v2/clients/ShareButton';

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

type ClientEvent = {
  id: string;
  type: string;
  metadata?: { note?: string };
  createdAt: string;
};

type ClientResponse = {
  id: string;
  name?: string | null;
  phone: string;
  properties: any[];
  events: ClientEvent[];
};

/* ------------------------------------------------------------------ */
/* DATA                                                                */
/* ------------------------------------------------------------------ */

async function getClient(id: string): Promise<ClientResponse> {
  return serverGet<ClientResponse>(`/clients/${id}`);
}

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */

export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }   = await params;
  const client   = await getClient(id);


  const notes = client.events
    .filter((e) => e.type === "NOTE_ADDED" && e.metadata?.note)
    .map((e) => ({ id: e.id, note: e.metadata!.note!, createdAt: e.createdAt }));

  const initials = client.name
    ? client.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const stats = [
    { label: "Properties",  value: client.properties.length, icon: Building2  },
    { label: "Activities",  value: client.events.length,     icon: Activity   },
    { label: "Notes",       value: notes.length,             icon: StickyNote },
    { label: "Leads",       value: client.properties.length, icon: FileText   },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F0] pt-14 lg:pt-0">
      {/*
        pt-14 on mobile: pushes ALL content below the fixed app top bar (h-14 = 56px).
        Without this, the sticky nav starts at y=0 and the fixed bar covers it.
        On lg+ the sidebar is static so no offset needed.
      */}

      {/* ── STICKY TOP NAV ──
          On mobile: sticks at top-14 so it sits flush under the fixed app bar.
          On desktop: sticks at top-0 (no fixed bar).                          */}
      <div className="sticky top-14 lg:top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white px-4 sm:px-6 py-2.5 sm:py-3">

        <Link
          href="/v2/leads"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Leads</span>
        </Link>

        {/* Name centred */}
        <p className="absolute left-1/2 -translate-x-1/2 text-[13px] font-semibold text-slate-700 truncate max-w-[180px] sm:max-w-xs">
          {client.name || "Unnamed Client"}
        </p>

        {/* Quick actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <a
            href={`tel:${client.phone}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:text-emerald-700 transition-all"
            title="Call"
          >
            <Phone className="h-3.5 w-3.5" />
          </a>
          <a
            href={`https://wa.me/${(client.phone ?? "").replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 items-center gap-1.5 rounded-lg bg-[#25D366] px-2.5 sm:px-3 text-xs font-semibold text-white hover:bg-[#1fb855] transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
        <ShareButton
          clientId={client.id}
          clientName={client.name || 'Unnamed Client'}
          clientPhone={client.phone ?? null}
        />
      </div>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 space-y-4 sm:space-y-5">

        {/* ── PROFILE HEADER ── */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-4 sm:px-6 py-4 sm:py-5">

          {/* Top row: avatar + name + phone */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-[15px] sm:text-[16px] font-bold text-sky-700">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[17px] sm:text-[20px] font-bold text-slate-900 leading-tight truncate">
                {client.name || "Unnamed Client"}
              </h1>
              <a
                href={`tel:${client.phone}`}
                className="mt-0.5 flex items-center gap-1.5 text-[12px] sm:text-[13px] text-slate-500 hover:text-emerald-700 transition-colors w-fit"
              >
                <Phone className="h-3 w-3 flex-shrink-0" />
                {client.phone}
              </a>
            </div>

            {/* Stat pills — hidden on mobile (shown in 2×2 grid below) */}
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

          {/* Stat grid — mobile only (2×2), hidden on lg+ */}
          <div className="mt-4 grid grid-cols-2 gap-2 lg:hidden">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <Icon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-[16px] font-bold text-slate-900 leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      {s.value}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── MAIN GRID ──
            Mobile: single column, actions + notes come FIRST (above fold),
            then properties + activity below.
            Desktop: 8/4 split, properties left, actions+notes right.     */}
        <div className="grid grid-cols-12 gap-4 sm:gap-5">

          {/* Quick actions + Notes — top on mobile, right column on desktop */}
          <aside className="col-span-12 lg:col-span-4 lg:order-2 space-y-4 sm:space-y-5">

            {/* Quick actions */}
            <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-4 sm:px-5 py-4 space-y-2">
              <p className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                Quick actions
              </p>

              {/* On mobile: buttons side-by-side. On sm+: full-width stacked. */}
              <div className="flex gap-2 sm:block sm:space-y-2">
                <ClientWhatsAppAction
                  clientId={client.id}
                  defaultClientPropertyId={
                    client.properties.length === 1 ? client.properties[0].id : null
                  }
                  fullWidth
                />

                <a
                  href={`https://wa.me/${(client.phone ?? "").replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 sm:w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-3 sm:px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1fb855] transition-colors"
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={`tel:${client.phone}`}
                  className="flex flex-1 sm:w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>Call</span>
                </a>
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-5 py-3.5">
                <p className="text-[13px] font-semibold text-slate-800">Notes</p>
                {notes.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                    {notes.length}
                  </span>
                )}
              </div>
              <div className="px-4 sm:px-5 py-4">
                <ClientNotes clientId={client.id} notes={notes} />
              </div>
            </div>
          </aside>

          {/* Properties + Activity — below actions on mobile, left col on desktop */}
          <div className="col-span-12 lg:col-span-8 lg:order-1 space-y-4 sm:space-y-5">

            {/* Properties shared */}
            <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-5 py-3.5">
                <p className="text-[13px] font-semibold text-slate-800">Properties shared</p>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                  {client.properties.length}
                </span>
              </div>
              <div className="px-4 sm:px-5 py-4">
                {/* <ClientPropertiesTable properties={client.properties} phone={client.phone} /> */}
                <ClientPropertiesTabs clientProperties={client.properties} />
              </div>
            </div>

            {/* Activity timeline */}
            <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-5 py-3.5">
                <p className="text-[13px] font-semibold text-slate-800">Activity</p>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                  {client.events.length}
                </span>
              </div>
              <div className="px-4 sm:px-5 py-4">
                <ClientTimeline events={client.events} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}