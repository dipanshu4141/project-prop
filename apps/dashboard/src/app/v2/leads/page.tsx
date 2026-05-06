// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";
// import { PageContainer } from "@/components/v2/layout/PageContainer";
// import { PageHeader } from "@/components/v2/layout/PageHeader";
// import { Input } from "@/components/v2/ui/Input";
// import {
//   DataTable,
//   DataTableRow,
//   DataTableCell,
// } from "@/components/v2/tables/DataTable";

// const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

// type LeadInboxItem = {
//   clientId: string;
//   name?: string | null;
//   phone: string;
//   activePropertiesCount: number;
//   nearestFollowUpAt?: string | null;
//   lastActivity?: {
//     summary: string;
//     createdAt: string;
//   } | null;
// };

// function getFollowUpLabel(date?: string | null) {
//   if (!date) return null;

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   const d = new Date(date);
//   d.setHours(0, 0, 0, 0);

//   const diffDays = Math.round(
//     (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
//   );

//   if (diffDays < 0) return { text: "Overdue", color: "text-red-600" };
//   if (diffDays === 0) return { text: "Today", color: "text-yellow-600" };
//   if (diffDays === 1) return { text: "Tomorrow", color: "text-muted-foreground" };

//   return {
//     text: `In ${diffDays} days`,
//     color: "text-muted-foreground",
//   };
// }

// export default function LeadsPage() {
//   const [leads, setLeads] = useState<LeadInboxItem[]>([]);
//   const [query, setQuery] = useState("");

//   useEffect(() => {
//     fetch(`${API_BASE}/clients/leads`, { cache: "no-store" })
//       .then((r) => r.json())
//       .then((d) => setLeads(d.items || []))
//       .catch(() => setLeads([]));
//   }, []);

//   const filtered = leads.filter((l) => {
//     const q = query.toLowerCase();
//     return (
//       (l.name || "").toLowerCase().includes(q) ||
//       l.phone.includes(q)
//     );
//   });

//   return (
//     <PageContainer>
//       <PageHeader title="Leads" />

//       {/* Search */}
//       <div className="mb-3">
//         <Input
//           placeholder="Search by name or phone…"
//           className="w-72"
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//         />
//       </div>

//       <div className="rounded-xl border bg-card">
//         <DataTable columns={["Client"]}>
//           {filtered.length === 0 ? (
//             <DataTableRow>
//               <DataTableCell>
//                 <div className="py-12 text-center text-muted-foreground">
//                   No conversations found
//                 </div>
//               </DataTableCell>
//             </DataTableRow>
//           ) : (
//             filtered.map((lead) => {
//               const followUp = getFollowUpLabel(lead.nearestFollowUpAt);

//               return (
//                 <DataTableRow
//                   key={lead.clientId}
//                 //   className="hover:bg-muted"
//                 >
//                   <DataTableCell>
//                     <Link
//                       href={`/clients/${lead.clientId}`}
//                       className="block"
//                     >
//                       <div className="flex items-start justify-between">
//                         <div>
//                           <div className="font-medium">
//                             {lead.name || "Unnamed Client"}
//                           </div>
//                           <div className="text-xs text-muted-foreground">
//                             {lead.phone}
//                           </div>
//                         </div>

//                         {followUp && (
//                           <span
//                             className={`text-xs font-medium ${followUp.color}`}
//                           >
//                             {followUp.text}
//                           </span>
//                         )}
//                       </div>

//                       <div className="mt-1 text-xs text-muted-foreground">
//                         {lead.lastActivity?.summary || "No recent activity"}
//                       </div>

//                       <div className="mt-1 text-xs text-muted-foreground">
//                         {lead.activePropertiesCount} active{" "}
//                         {lead.activePropertiesCount === 1
//                           ? "property"
//                           : "properties"}
//                       </div>
//                     </Link>
//                   </DataTableCell>
//                 </DataTableRow>
//               );
//             })
//           )}
//         </DataTable>
//       </div>
//     </PageContainer>
//   );
// // }
// "use client";

// import { useEffect, useMemo, useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { Eye, Phone, Plus } from "lucide-react";

// import { PageContainer } from "@/components/v2/layout/PageContainer";
// import { PageHeader } from "@/components/v2/layout/PageHeader";
// import { Input } from "@/components/v2/ui/Input";
// import { Select } from "@/components/v2/ui/Select";
// import {
//   DataTable,
//   DataTableRow,
//   DataTableCell,
// } from "@/components/v2/tables/DataTable";
// import { API_BASE } from "@/lib/apiBase";


// // const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

// /* =====================================================
//  * TYPES (MATCH BACKEND EXACTLY)
//  * ===================================================== */

// type LeadRow = {
//   clientId: string;
//   name?: string | null;
//   phone: string;
//   requirementLabel: string;
//   propertiesCount: number;
//   nearestFollowUpAt?: string | null;
// };

// type FollowUpMeta = {
//   label: string;
//   color: string;
//   category: "NONE" | "OVERDUE" | "TODAY" | "UPCOMING";
// };

// /* =====================================================
//  * HELPERS
//  * ===================================================== */

// function getFollowUpMeta(date?: string | null): FollowUpMeta {
//   if (!date) {
//     return {
//       label: "—",
//       color: "text-muted-foreground",
//       category: "NONE",
//     };
//   }

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   const d = new Date(date);
//   d.setHours(0, 0, 0, 0);

//   if (d < today) {
//     return {
//       label: "Overdue",
//       color: "text-red-600",
//       category: "OVERDUE",
//     };
//   }

//   if (d.getTime() === today.getTime()) {
//     return {
//       label: "Today",
//       color: "text-yellow-600",
//       category: "TODAY",
//     };
//   }

//   return {
//     label: d.toLocaleDateString(),
//     color: "text-muted-foreground",
//     category: "UPCOMING",
//   };
// }

// function getRowBg(category: FollowUpMeta["category"]) {
//   if (category === "OVERDUE") return "bg-red-50 hover:bg-red-100";
//   if (category === "TODAY") return "bg-yellow-50 hover:bg-yellow-100";
//   return "";
// }

// /* =====================================================
//  * PAGE
//  * ===================================================== */

// export default function LeadsPage() {
//   const router = useRouter();

//   const [leads, setLeads] = useState<LeadRow[]>([]);
//   const [query, setQuery] = useState("");
//   const [filter, setFilter] = useState<
//     "ALL" | "ATTENTION" | "UPCOMING" | "NONE"
//   >("ALL");

//   /* ---------------- FETCH ---------------- */

//   useEffect(() => {
//     fetch(`${API_BASE}/clients/leads`, { cache: "no-store" })
//       .then(async (res) => {
//         const json = await res.json();
//         console.log("LEADS API RESPONSE 👉", json);
//         return json;
//       })
//       .then((data) => {
//         setLeads(Array.isArray(data) ? data : []);
//       })
//       .catch((err) => {
//         console.error("LEADS API ERROR ❌", err);
//         setLeads([]);
//       });
//   }, []);
  

//   /* ---------------- FILTER ---------------- */

//   const filteredLeads = useMemo(() => {
//     return leads.filter((lead) => {
//       const q = query.toLowerCase();
  
//       const matchesQuery =
//         (lead.name || "").toLowerCase().includes(q) ||
//         lead.phone.includes(q);
  
//       if (!lead.nearestFollowUpAt) {
//         return matchesQuery && filter === "ALL";
//       }
  
//       const followUp = getFollowUpMeta(lead.nearestFollowUpAt);
  
//       const matchesFilter =
//         filter === "ALL" ||
//         (filter === "ATTENTION" &&
//           (followUp.category === "OVERDUE" ||
//            followUp.category === "TODAY")) ||
//         (filter === "UPCOMING" &&
//           followUp.category === "UPCOMING") ||
//         (filter === "NONE" && followUp.category === "NONE");
  
//       return matchesQuery && matchesFilter;
//     });
//   }, [leads, query, filter]);
  

//   /* =====================================================
//    * RENDER
//    * ===================================================== */

//   console.log("RAW leads state 👉", leads);
//   console.log("FILTERED leads 👉", filteredLeads);
//   console.log("filter =", filter, "query =", query);


//   return (
//     <PageContainer>
//       <PageHeader
//         title="Leads"
//         actions={
//           <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
//             <Plus className="h-4 w-4" />
//             Add Lead
//           </button>
//         }
//       />

//       <div className="rounded-xl border bg-card">
//         {/* Toolbar */}
//         <div className="flex items-center justify-between gap-4 border-b p-4">
//           <Input
//             placeholder="Search by name or phone…"
//             className="w-72"
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//           />

//           <Select
//             value={filter}
//             onChange={(e) =>
//               setFilter(e.target.value as any)
//             }
//           >
//             <option value="ALL">All</option>
//             <option value="ATTENTION">Needs Attention</option>
//             <option value="UPCOMING">Upcoming</option>
//             <option value="NONE">No Follow-up</option>
//           </Select>
//         </div>

//         {/* Table */}
//         <DataTable
//           columns={[
//             "Client",
//             "Phone",
//             "Requirement",
//             "Follow-up",
//             "Actions",
//           ]}
//         >
//           {filteredLeads.length === 0 ? (
//             <DataTableRow>
//               <DataTableCell colSpan={5}>
//                 <div className="py-10 text-center text-muted-foreground">
//                   No leads found
//                 </div>
//               </DataTableCell>
//             </DataTableRow>
//           ) : (
//             filteredLeads.map((lead) => {
//               const followUp = getFollowUpMeta(
//                 lead.nearestFollowUpAt
//               );

//               return (
//                 <DataTableRow
//                   key={lead.clientId}
//                   onClick={() =>
//                     router.push(`/v2/clients/${lead.clientId}`)
//                   }
//                   className={`cursor-pointer ${getRowBg(
//                     followUp.category
//                   )}`}
//                 >
//                   {/* Client */}
//                   <DataTableCell>
//                     <div className="font-medium">
//                       {lead.name || "Unnamed Client"}
//                     </div>
//                     <div className="text-xs text-muted-foreground">
//                       {lead.propertiesCount} requirement
//                       {lead.propertiesCount > 1 ? "s" : ""}
//                     </div>
//                   </DataTableCell>

//                   {/* Phone */}
//                   <DataTableCell>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         window.location.href = `tel:${lead.phone}`;
//                       }}
//                       className="rounded-md p-2 hover:bg-muted"
//                     >
//                       <Phone className="h-4 w-4" />
//                     </button>
//                   </DataTableCell>

//                   {/* Requirement */}
//                   <DataTableCell className="text-sm">
//                     {lead.requirementLabel}
//                   </DataTableCell>

//                   {/* Follow-up */}
//                   <DataTableCell>
//                     <span
//                       className={`text-sm font-medium ${followUp.color}`}
//                     >
//                       {followUp.label}
//                     </span>
//                   </DataTableCell>

//                   {/* Actions */}
//                   <DataTableCell>
//                     <div className="flex gap-2">
//                       <Link
//                         href={`/v2/clients/${lead.clientId}`}
//                         onClick={(e) => e.stopPropagation()}
//                         className="rounded-md p-2 hover:bg-muted"
//                       >
//                         <Eye className="h-4 w-4" />
//                       </Link>

//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           window.location.href = `tel:${lead.phone}`;
//                         }}
//                         className="rounded-md p-2 hover:bg-muted"
//                       >
//                         <Phone className="h-4 w-4" />
//                       </button>
//                     </div>
//                   </DataTableCell>
//                 </DataTableRow>
//               );
//             })
//           )}
//         </DataTable>
//       </div>
//     </PageContainer>
//   );
// }





















// "use client";

// import { useEffect, useMemo, useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { Eye, Phone, Plus, Search, AlertCircle, Clock, CalendarCheck, Inbox, ChevronRight } from "lucide-react";

// import { PageContainer } from "@/components/v2/layout/PageContainer";
// import { PageHeader } from "@/components/v2/layout/PageHeader";
// import { API_BASE } from "@/lib/apiBase";

// /* ------------------------------------------------------------------ */
// /* TYPES                                                               */
// /* ------------------------------------------------------------------ */

// type LeadRow = {
//   clientId: string;
//   name?: string | null;
//   phone: string;
//   requirementLabel: string;
//   propertiesCount: number;
//   nearestFollowUpAt?: string | null;
// };

// type FollowUpMeta = {
//   label: string;
//   category: "NONE" | "OVERDUE" | "TODAY" | "UPCOMING";
// };

// type FilterValue = "ALL" | "ATTENTION" | "UPCOMING" | "NONE";

// /* ------------------------------------------------------------------ */
// /* HELPERS                                                             */
// /* ------------------------------------------------------------------ */

// function getFollowUpMeta(date?: string | null): FollowUpMeta {
//   if (!date) return { label: "—", category: "NONE" };
//   const today = new Date(); today.setHours(0, 0, 0, 0);
//   const d     = new Date(date); d.setHours(0, 0, 0, 0);
//   if (d < today)                       return { label: "Overdue", category: "OVERDUE"  };
//   if (d.getTime() === today.getTime()) return { label: "Today",   category: "TODAY"    };
//   return { label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), category: "UPCOMING" };
// }

// function clientInitials(name?: string | null) {
//   if (!name) return "?";
//   return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
// }

// /* ------------------------------------------------------------------ */
// /* FILTER TABS CONFIG                                                  */
// /* ------------------------------------------------------------------ */

// const FILTER_TABS: { value: FilterValue; label: string; icon: React.ElementType }[] = [
//   { value: "ALL",       label: "All",       icon: Inbox         },
//   { value: "ATTENTION", label: "Attention", icon: AlertCircle   },
//   { value: "UPCOMING",  label: "Upcoming",  icon: Clock         },
//   { value: "NONE",      label: "None",      icon: CalendarCheck },
// ];

// /* ------------------------------------------------------------------ */
// /* FOLLOW-UP BADGE                                                     */
// /* ------------------------------------------------------------------ */

// function FollowUpBadge({ meta }: { meta: FollowUpMeta }) {
//   if (meta.category === "NONE") {
//     return <span className="text-[12px] text-slate-400">—</span>;
//   }
//   const styles = {
//     OVERDUE:  "bg-red-50 text-red-700 border-red-200",
//     TODAY:    "bg-amber-50 text-amber-700 border-amber-200",
//     UPCOMING: "bg-slate-50 text-slate-600 border-slate-200",
//   }[meta.category];
//   return (
//     <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11.5px] font-medium ${styles}`}>
//       {meta.label}
//     </span>
//   );
// }

// /* ------------------------------------------------------------------ */
// /* SKELETON — TABLE ROW (desktop)                                      */
// /* ------------------------------------------------------------------ */

// function SkeletonRow() {
//   return (
//     <tr className="border-b border-slate-50">
//       {[40, 28, 48, 20, 16].map((w, i) => (
//         <td key={i} className="px-5 py-4">
//           <div className={`h-3 w-${w} rounded bg-slate-100 animate-pulse`} />
//         </td>
//       ))}
//     </tr>
//   );
// }

// /* ------------------------------------------------------------------ */
// /* SKELETON — CARD (mobile)                                            */
// /* ------------------------------------------------------------------ */

// function SkeletonCard() {
//   return (
//     <div className="flex items-center gap-3 border-b border-slate-50 px-4 py-3.5 animate-pulse">
//       <div className="h-9 w-9 rounded-full bg-slate-100 flex-shrink-0" />
//       <div className="flex-1 space-y-1.5">
//         <div className="h-3 w-32 rounded bg-slate-100" />
//         <div className="h-2.5 w-48 rounded bg-slate-100" />
//       </div>
//       <div className="h-5 w-14 rounded-md bg-slate-100" />
//     </div>
//   );
// }

// /* ------------------------------------------------------------------ */
// /* MOBILE LEAD CARD                                                    */
// /* ------------------------------------------------------------------ */

// function MobileLeadCard({ lead }: { lead: LeadRow }) {
//   const router = useRouter();
//   const followUp = getFollowUpMeta(lead.nearestFollowUpAt);

//   const accentBar =
//     followUp.category === "OVERDUE" ? "border-l-red-400" :
//     followUp.category === "TODAY"   ? "border-l-amber-400" :
//     "border-l-transparent";

//   return (
//     <div
//       onClick={() => router.push(`/v2/clients/${lead.clientId}`)}
//       className={[
//         "flex items-center gap-3 border-b border-slate-50 px-4 py-3.5",
//         "border-l-2 cursor-pointer active:bg-slate-50 transition-colors",
//         accentBar,
//       ].join(" ")}
//     >
//       {/* Avatar */}
//       <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
//         {clientInitials(lead.name)}
//       </div>

//       {/* Info */}
//       <div className="flex-1 min-w-0">
//         <p className="text-[13.5px] font-semibold text-slate-800 truncate">
//           {lead.name || "Unnamed Client"}
//         </p>
//         <p className="text-[11.5px] text-slate-400 truncate">
//           {lead.requirementLabel}
//         </p>
//       </div>

//       {/* Right — badge + chevron */}
//       <div className="flex items-center gap-1.5 flex-shrink-0">
//         <FollowUpBadge meta={followUp} />
//         <ChevronRight className="h-4 w-4 text-slate-300" />
//       </div>
//     </div>
//   );
// }

// /* ------------------------------------------------------------------ */
// /* PAGE                                                                */
// /* ------------------------------------------------------------------ */

// export default function LeadsPage() {
//   const router = useRouter();

//   const [leads,   setLeads]   = useState<LeadRow[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [query,   setQuery]   = useState("");
//   const [filter,  setFilter]  = useState<FilterValue>("ALL");

//   /* ── fetch ── */
//   useEffect(() => {
//     setLoading(true);
//     fetch(`${API_BASE}/clients/leads`, { cache: "no-store" })
//       .then((res) => res.json())
//       .then((data) => setLeads(Array.isArray(data) ? data : []))
//       .catch(() => setLeads([]))
//       .finally(() => setLoading(false));
//   }, []);

//   /* ── filter ── */
//   const filteredLeads = useMemo(() => {
//     return leads.filter((lead) => {
//       const q = query.toLowerCase();
//       const matchesQuery =
//         (lead.name || "").toLowerCase().includes(q) ||
//         lead.phone.includes(q);

//       if (!lead.nearestFollowUpAt) return matchesQuery && filter === "ALL";

//       const followUp = getFollowUpMeta(lead.nearestFollowUpAt);
//       const matchesFilter =
//         filter === "ALL" ||
//         (filter === "ATTENTION" && (followUp.category === "OVERDUE" || followUp.category === "TODAY")) ||
//         (filter === "UPCOMING"  && followUp.category === "UPCOMING") ||
//         (filter === "NONE"      && followUp.category === "NONE");

//       return matchesQuery && matchesFilter;
//     });
//   }, [leads, query, filter]);

//   /* ── counts ── */
//   const counts = useMemo(() => {
//     const attention = leads.filter((l) => {
//       const c = getFollowUpMeta(l.nearestFollowUpAt).category;
//       return c === "OVERDUE" || c === "TODAY";
//     }).length;
//     const upcoming = leads.filter((l) => getFollowUpMeta(l.nearestFollowUpAt).category === "UPCOMING").length;
//     const none     = leads.filter((l) => !l.nearestFollowUpAt).length;
//     return { ALL: leads.length, ATTENTION: attention, UPCOMING: upcoming, NONE: none };
//   }, [leads]);

//   /* ── empty state ── */
//   const emptyState = (
//     <div className="flex flex-col items-center justify-center py-16 text-center">
//       <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">👥</div>
//       <p className="text-[14px] font-semibold text-slate-800">No leads found</p>
//       <p className="mt-1 text-[12.5px] text-slate-400">Try adjusting your search or filter.</p>
//     </div>
//   );

//   /* ------------------------------------------------------------------ */

//   return (
//     <PageContainer className="bg-[#F7F5F0]">
//       <PageHeader
//         title="Leads"
//         actions={
//           <button className="
//             inline-flex items-center gap-2 rounded-[9px]
//             bg-[#0B1F14] px-3 py-2 sm:px-4 sm:py-2.5
//             text-sm font-medium text-white
//             shadow-sm transition-all duration-150
//             hover:bg-[#1A3525] hover:shadow-md hover:-translate-y-[1px]
//           ">
//             <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500 text-white">
//               <Plus className="h-3 w-3" />
//             </span>
//             <span className="hidden sm:inline">Add Lead</span>
//             <span className="sm:hidden">Add</span>
//           </button>
//         }
//       />

//       {/* ── FILTER BAR — full-bleed breakout ── */}
//       {/* Mobile: tabs scroll horizontally, search below on its own row  */}
//       {/* Desktop: tabs + search in one row                              */}
//       <div className="-mx-4 sm:-mx-6">

//         {/* Row 1: tabs (always scrollable on mobile) */}
//         <div className="flex items-center gap-1 overflow-x-auto bg-white border-b border-slate-100 px-4 sm:px-6 py-2.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
//           {FILTER_TABS.map((tab) => {
//             const active = filter === tab.value;
//             const Icon   = tab.icon;
//             return (
//               <button
//                 key={tab.value}
//                 onClick={() => setFilter(tab.value)}
//                 className={[
//                   "flex flex-shrink-0 items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-semibold border transition-all duration-150",
//                   active
//                     ? "bg-[#0B1F14] text-white border-[#0B1F14]"
//                     : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700",
//                 ].join(" ")}
//               >
//                 <Icon className="h-3 w-3 flex-shrink-0" />
//                 {/* Full label on sm+, short label always visible */}
//                 <span className="hidden sm:inline">{tab.label}</span>
//                 <span className="sm:hidden">
//                   {tab.value === "ALL"       ? "All"       :
//                    tab.value === "ATTENTION" ? "Urgent"    :
//                    tab.value === "UPCOMING"  ? "Soon"      : "None"}
//                 </span>
//                 {counts[tab.value] > 0 && (
//                   <span className={[
//                     "ml-0.5 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
//                     active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
//                   ].join(" ")}>
//                     {counts[tab.value]}
//                   </span>
//                 )}
//               </button>
//             );
//           })}

//           {/* Search — inline on desktop only */}
//           <div className="hidden sm:block relative ml-auto flex-shrink-0">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
//             <input
//               placeholder="Search by name or phone…"
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//               className="
//                 h-8 pl-8 pr-3 w-52 rounded-lg border border-slate-200
//                 text-xs text-slate-700 placeholder:text-slate-400
//                 bg-slate-50 focus:bg-white focus:outline-none
//                 focus:border-slate-400 focus:w-64
//                 transition-all duration-200
//               "
//             />
//           </div>
//         </div>

//         {/* Row 2: search full-width on mobile only */}
//         <div className="sm:hidden bg-white border-b border-slate-100 px-4 pb-2.5">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
//             <input
//               placeholder="Search by name or phone…"
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//               className="
//                 h-9 w-full pl-8 pr-3 rounded-lg border border-slate-200
//                 text-sm text-slate-700 placeholder:text-slate-400
//                 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400
//               "
//             />
//           </div>
//         </div>
//       </div>

//       {/* ── CONTENT ── */}
//       <div className="mt-4 sm:mt-5 rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">

//         {/* ══ MOBILE — card list (hidden sm+) ══ */}
//         <div className="sm:hidden">
//           {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
//           {!loading && filteredLeads.length === 0 && emptyState}
//           {!loading && filteredLeads.map((lead) => <MobileLeadCard key={lead.clientId} lead={lead} />)}
//         </div>

//         {/* ══ DESKTOP — table (hidden on mobile) ══ */}
//         <table className="hidden sm:table w-full">
//           <thead>
//             <tr className="border-b border-slate-100">
//               {["Client", "Phone", "Requirement", "Follow-up", "Actions"].map((col) => (
//                 <th
//                   key={col}
//                   className="px-5 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-400"
//                 >
//                   {col}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}

//             {!loading && filteredLeads.length === 0 && (
//               <tr><td colSpan={5}>{emptyState}</td></tr>
//             )}

//             {!loading && filteredLeads.map((lead) => {
//               const followUp = getFollowUpMeta(lead.nearestFollowUpAt);
//               const rowAccent =
//                 followUp.category === "OVERDUE" ? "border-l-2 border-l-red-400" :
//                 followUp.category === "TODAY"   ? "border-l-2 border-l-amber-400" :
//                 "border-l-2 border-l-transparent";

//               return (
//                 <tr
//                   key={lead.clientId}
//                   onClick={() => router.push(`/v2/clients/${lead.clientId}`)}
//                   className={[
//                     "border-b border-slate-50 cursor-pointer transition-colors duration-100 hover:bg-slate-50/70",
//                     rowAccent,
//                   ].join(" ")}
//                 >
//                   <td className="px-5 py-3.5">
//                     <div className="flex items-center gap-3">
//                       <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
//                         {clientInitials(lead.name)}
//                       </div>
//                       <div>
//                         <p className="text-[13px] font-semibold text-slate-800">{lead.name || "Unnamed Client"}</p>
//                         <p className="text-[11px] text-slate-400">{lead.propertiesCount} requirement{lead.propertiesCount !== 1 ? "s" : ""}</p>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-5 py-3.5">
//                     <a
//                       href={`tel:${lead.phone}`}
//                       onClick={(e) => e.stopPropagation()}
//                       className="flex items-center gap-1.5 text-[12.5px] text-slate-500 hover:text-emerald-700 transition-colors"
//                     >
//                       <Phone className="h-3 w-3 flex-shrink-0" />
//                       {lead.phone}
//                     </a>
//                   </td>
//                   <td className="px-5 py-3.5">
//                     <span className="text-[12.5px] text-slate-600">{lead.requirementLabel}</span>
//                   </td>
//                   <td className="px-5 py-3.5">
//                     <FollowUpBadge meta={followUp} />
//                   </td>
//                   <td className="px-5 py-3.5">
//                     <div className="flex items-center gap-1">
//                       <Link
//                         href={`/v2/clients/${lead.clientId}`}
//                         onClick={(e) => e.stopPropagation()}
//                         className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-slate-400 hover:text-slate-700 transition-all"
//                       >
//                         <Eye className="h-3.5 w-3.5" />
//                       </Link>
//                       <a
//                         href={`tel:${lead.phone}`}
//                         onClick={(e) => e.stopPropagation()}
//                         className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-emerald-300 hover:text-emerald-700 transition-all"
//                       >
//                         <Phone className="h-3.5 w-3.5" />
//                       </a>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </PageContainer>
//   );
// }


















"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye, Phone, Plus, Search, AlertCircle, Clock,
  CalendarCheck, Inbox, ChevronRight, /* Users, UserCheck, */ Loader2,
} from "lucide-react";

import { PageContainer }    from "@/components/v2/layout/PageContainer";
import { PageHeader }       from "@/components/v2/layout/PageHeader";
import { apiGet, apiPost }  from "@/lib/api";
import { CreateClientModal } from "@/components/v2/clients/CreateClientModal";
import { useAuth }          from "@/context/AuthContext";

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

type LeadRow = {
  clientId:         string;
  name?:            string | null;
  phone:            string;
  requirementLabel: string;
  propertiesCount:  number;
  nearestFollowUpAt?: string | null;
  owner?:           { id: string; name: string | null } | null;
  isPool?:          boolean;
};

// V1: Lead Pool hidden — uncomment to restore
// type PoolRow = {
//   id:     string;
//   name?:  string | null;
//   phones: { phone: string; primary: boolean }[];
//   properties: { listing: { bhk: string | null; propertySubType: string | null; city: string | null } }[];
// };

type FollowUpMeta = {
  label:    string;
  category: "NONE" | "OVERDUE" | "TODAY" | "UPCOMING";
};

// Top-level tabs
// V1: Pool tab hidden — type MainTab = "MY_LEADS" | "POOL";
type MainTab    = "MY_LEADS";
type FilterValue = "ALL" | "ATTENTION" | "UPCOMING" | "NONE";

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

function getFollowUpMeta(date?: string | null): FollowUpMeta {
  if (!date) return { label: "—", category: "NONE" };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d     = new Date(date); d.setHours(0, 0, 0, 0);
  if (d < today)                       return { label: "Overdue", category: "OVERDUE"  };
  if (d.getTime() === today.getTime()) return { label: "Today",   category: "TODAY"    };
  return {
    label:    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    category: "UPCOMING",
  };
}

function clientInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// V1: Pool label hidden — uncomment with PoolTab to restore
// function poolLabel(row: PoolRow): string {
//   const p = row.properties[0]?.listing;
//   if (!p) return "—";
//   return [p.bhk, p.propertySubType, p.city].filter(Boolean).join(" ");
// }

/* ------------------------------------------------------------------ */
/* FILTER TABS                                                         */
/* ------------------------------------------------------------------ */

const FILTER_TABS: { value: FilterValue; label: string; icon: React.ElementType }[] = [
  { value: "ALL",       label: "All",       icon: Inbox       },
  { value: "ATTENTION", label: "Attention", icon: AlertCircle },
  { value: "UPCOMING",  label: "Upcoming",  icon: Clock       },
  { value: "NONE",      label: "None",      icon: CalendarCheck },
];

/* ------------------------------------------------------------------ */
/* BADGES                                                              */
/* ------------------------------------------------------------------ */

function FollowUpBadge({ meta }: { meta: FollowUpMeta }) {
  if (meta.category === "NONE") return <span className="text-[12px] text-slate-400">—</span>;
  const styles = {
    OVERDUE:  "bg-red-50 text-red-700 border-red-200",
    TODAY:    "bg-amber-50 text-amber-700 border-amber-200",
    UPCOMING: "bg-slate-50 text-slate-600 border-slate-200",
  }[meta.category];
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11.5px] font-medium ${styles}`}>
      {meta.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* SKELETONS                                                           */
/* ------------------------------------------------------------------ */

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-50">
      {[40, 28, 48, 20, 16].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className={`h-3 w-${w} rounded bg-slate-100 animate-pulse`} />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 border-b border-slate-50 px-4 py-3.5 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-slate-100 flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-32 rounded bg-slate-100" />
        <div className="h-2.5 w-48 rounded bg-slate-100" />
      </div>
      <div className="h-5 w-14 rounded-md bg-slate-100" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MOBILE LEAD CARD                                                    */
/* ------------------------------------------------------------------ */

function MobileLeadCard({ lead }: { lead: LeadRow }) {
  const router   = useRouter();
  const followUp = getFollowUpMeta(lead.nearestFollowUpAt);
  const accentBar =
    followUp.category === "OVERDUE" ? "border-l-red-400" :
    followUp.category === "TODAY"   ? "border-l-amber-400" :
    "border-l-transparent";

  return (
    <div
      onClick={() => router.push(`/v2/clients/${lead.clientId}`)}
      className={`flex items-center gap-3 border-b border-slate-50 px-4 py-3.5 border-l-2 cursor-pointer active:bg-slate-50 transition-colors ${accentBar}`}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
        {clientInitials(lead.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-slate-800 truncate">{lead.name || "Unnamed Client"}</p>
        <p className="text-[11.5px] text-slate-400 truncate">{lead.requirementLabel}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <FollowUpBadge meta={followUp} />
        <ChevronRight className="h-4 w-4 text-slate-300" />
      </div>
    </div>
  );
}

// V1: Pool components hidden — uncomment to restore
// function MobilePoolCard({
//   row, onClaim, claiming,
// }: { row: PoolRow; onClaim: (id: string) => void; claiming: boolean }) {
//   const phone = row.phones.find((p) => p.primary)?.phone ?? row.phones[0]?.phone ?? "—";
//   return (
//     <div className="flex items-center gap-3 border-b border-slate-50 px-4 py-3.5">
//       <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
//         {clientInitials(row.name)}
//       </div>
//       <div className="flex-1 min-w-0">
//         <p className="text-[13.5px] font-semibold text-slate-800 truncate">{row.name || "Unnamed"}</p>
//         <p className="text-[11.5px] text-slate-400 truncate">{phone} · {poolLabel(row)}</p>
//       </div>
//       <button
//         onClick={() => onClaim(row.id)}
//         disabled={claiming}
//         className="flex-shrink-0 h-7 px-3 rounded-lg text-[12px] font-semibold border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 transition-colors flex items-center gap-1"
//       >
//         {claiming ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3 w-3" />}
//         Claim
//       </button>
//     </div>
//   );
// }

// V1: PoolTab hidden — uncomment to restore
// function PoolTab({ onClaimed }: { onClaimed: () => void }) {
//   const [pool,     setPool]     = useState<PoolRow[]>([]);
//   const [loading,  setLoading]  = useState(true);
//   const [claiming, setClaiming] = useState<string | null>(null);
//   const [query,    setQuery]    = useState("");
//   const router = useRouter();
//
//   useEffect(() => {
//     setLoading(true);
//     apiGet<PoolRow[]>('/clients/pool')
//       .then((d) => setPool(Array.isArray(d) ? d : []))
//       .catch(() => setPool([]))
//       .finally(() => setLoading(false));
//   }, []);
//
//   async function handleClaim(clientId: string) {
//     setClaiming(clientId);
//     try {
//       await apiPost(`/clients/${clientId}/claim`, {});
//       setPool((prev) => prev.filter((r) => r.id !== clientId));
//       onClaimed();
//     } catch (e: any) {
//       alert(e.message ?? "Failed to claim lead");
//     } finally {
//       setClaiming(null);
//     }
//   }
//
//   const filtered = useMemo(() => {
//     const q = query.toLowerCase();
//     return pool.filter((r) =>
//       (r.name ?? "").toLowerCase().includes(q) ||
//       r.phones.some((p) => p.phone.includes(q))
//     );
//   }, [pool, query]);
//
//   return (
//     <div>
//       <div className="px-5 py-3 border-b border-slate-100">
//         <div className="relative max-w-xs">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
//           <input
//             placeholder="Search pool…"
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             className="h-8 w-full pl-8 pr-3 rounded-lg border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400"
//           />
//         </div>
//       </div>
//       <div className="sm:hidden">
//         {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
//         {!loading && filtered.length === 0 && (
//           <div className="flex flex-col items-center justify-center py-16 text-center">
//             <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">🏊</div>
//             <p className="text-[14px] font-semibold text-slate-800">Pool is empty</p>
//             <p className="mt-1 text-[12.5px] text-slate-400">All leads are assigned to brokers.</p>
//           </div>
//         )}
//         {!loading && filtered.map((row) => (
//           <MobilePoolCard key={row.id} row={row} onClaim={handleClaim} claiming={claiming === row.id} />
//         ))}
//       </div>
//       <table className="hidden sm:table w-full">
//         <thead>
//           <tr className="border-b border-slate-100">
//             {["Client", "Phone", "Requirement", "Properties", ""].map((col) => (
//               <th key={col} className="px-5 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{col}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
//           {!loading && filtered.length === 0 && (
//             <tr><td colSpan={5}>
//               <div className="flex flex-col items-center justify-center py-16 text-center">
//                 <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">🏊</div>
//                 <p className="text-[14px] font-semibold text-slate-800">Pool is empty</p>
//                 <p className="mt-1 text-[12.5px] text-slate-400">All leads are assigned to brokers.</p>
//               </div>
//             </td></tr>
//           )}
//           {!loading && filtered.map((row) => {
//             const phone = row.phones.find((p) => p.primary)?.phone ?? row.phones[0]?.phone ?? "—";
//             return (
//               <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
//                 <td className="px-5 py-3.5">
//                   <div className="flex items-center gap-3">
//                     <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
//                       {clientInitials(row.name)}
//                     </div>
//                     <p className="text-[13px] font-semibold text-slate-800">{row.name || "Unnamed Client"}</p>
//                   </div>
//                 </td>
//                 <td className="px-5 py-3.5">
//                   <a href={`tel:${phone}`} className="flex items-center gap-1.5 text-[12.5px] text-slate-500 hover:text-emerald-700 transition-colors">
//                     <Phone className="h-3 w-3 flex-shrink-0" />{phone}
//                   </a>
//                 </td>
//                 <td className="px-5 py-3.5 text-[12.5px] text-slate-600">{poolLabel(row)}</td>
//                 <td className="px-5 py-3.5 text-[12.5px] text-slate-500">{row.properties.length}</td>
//                 <td className="px-5 py-3.5">
//                   <div className="flex items-center gap-2">
//                     <button
//                       onClick={() => handleClaim(row.id)}
//                       disabled={claiming === row.id}
//                       className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-semibold border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
//                     >
//                       {claiming === row.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3 w-3" />}
//                       Claim
//                     </button>
//                     <Link
//                       href={`/v2/clients/${row.id}`}
//                       className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-slate-400 hover:text-slate-700 transition-all"
//                     >
//                       <Eye className="h-3.5 w-3.5" />
//                     </Link>
//                   </div>
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// }

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */

export default function LeadsPage() {
  const router      = useRouter();
  const { user, workspace } = useAuth();
  const isOwner     = workspace?.role === "OWNER";

  const [mainTab, setMainTab] = useState<MainTab>("MY_LEADS");
  const [leads,   setLeads]   = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState("");
  const [filter,  setFilter]  = useState<FilterValue>("ALL");
  // V1: Pool count hidden — uncomment with Pool tab
  // const [poolCount, setPoolCount] = useState(0);

  const [showCreateClient, setShowCreateClient] = useState(false);

  const loadLeads = useCallback(() => {
    setLoading(true);
    apiGet<LeadRow[]>('/clients/leads')
      .then((data) => setLeads(Array.isArray(data) ? data : []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, []);

  // V1: Pool count fetch hidden — uncomment with Pool tab
  // useEffect(() => {
  //   apiGet<{ id: string }[]>('/clients/pool')
  //     .then((d) => setPoolCount(Array.isArray(d) ? d.length : 0))
  //     .catch(() => setPoolCount(0));
  // }, []);

  useEffect(() => {
    if (mainTab === "MY_LEADS") loadLeads();
  }, [mainTab, loadLeads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const q = query.toLowerCase();
      const matchesQuery =
        (lead.name || "").toLowerCase().includes(q) ||
        lead.phone.includes(q);

      const followUp    = getFollowUpMeta(lead.nearestFollowUpAt);
      const matchesFilter =
        filter === "ALL" ||
        (filter === "ATTENTION" && (followUp.category === "OVERDUE" || followUp.category === "TODAY")) ||
        (filter === "UPCOMING"  && followUp.category === "UPCOMING") ||
        (filter === "NONE"      && followUp.category === "NONE");

      return matchesQuery && matchesFilter;
    });
  }, [leads, query, filter]);

  const counts = useMemo(() => {
    const attention = leads.filter((l) => {
      const c = getFollowUpMeta(l.nearestFollowUpAt).category;
      return c === "OVERDUE" || c === "TODAY";
    }).length;
    const upcoming = leads.filter((l) => getFollowUpMeta(l.nearestFollowUpAt).category === "UPCOMING").length;
    const none     = leads.filter((l) => !l.nearestFollowUpAt).length;
    return { ALL: leads.length, ATTENTION: attention, UPCOMING: upcoming, NONE: none };
  }, [leads]);

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">👥</div>
      <p className="text-[14px] font-semibold text-slate-800">No leads found</p>
      <p className="mt-1 text-[12.5px] text-slate-400">Try adjusting your search or filter.</p>
    </div>
  );

  return (
    <PageContainer className="bg-[#F7F5F0]">
      <PageHeader
        title="Leads"
        actions={
          <button
            onClick={() => setShowCreateClient(true)}
            className="inline-flex items-center gap-2 rounded-[9px] bg-[#0B1F14] px-3 py-2 sm:px-4 sm:py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-[#1A3525] hover:shadow-md hover:-translate-y-[1px]"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500 text-white">
              <Plus className="h-3 w-3" />
            </span>
            <span className="hidden sm:inline">Add client</span>
            <span className="sm:hidden">Add</span>
          </button>
        }
      />

      {showCreateClient && (
        <CreateClientModal onClose={() => setShowCreateClient(false)} />
      )}

      {/* V1: Main tabs removed — only MY_LEADS exists. Uncomment below to restore Pool tab. */}
      {/* ── MAIN TABS: My Leads / Pool ── */}
      {/* <div className="-mx-4 sm:-mx-6">
        <div className="flex items-center gap-0 bg-white border-b border-slate-100 px-4 sm:px-6">
          <button
            onClick={() => setMainTab("MY_LEADS")}
            className={[
              "flex items-center gap-2 px-4 py-3 text-[13px] font-semibold border-b-2 transition-colors",
              mainTab === "MY_LEADS"
                ? "border-[#0B1F14] text-[#0B1F14]"
                : "border-transparent text-slate-400 hover:text-slate-600",
            ].join(" ")}
          >
            <Inbox className="h-3.5 w-3.5" />
            My Leads
            {leads.length > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${mainTab === "MY_LEADS" ? "bg-[#0B1F14] text-white" : "bg-slate-100 text-slate-500"}`}>
                {leads.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setMainTab("POOL")}
            className={[
              "flex items-center gap-2 px-4 py-3 text-[13px] font-semibold border-b-2 transition-colors",
              mainTab === "POOL"
                ? "border-violet-500 text-violet-700"
                : "border-transparent text-slate-400 hover:text-slate-600",
            ].join(" ")}
          >
            <Users className="h-3.5 w-3.5" />
            Lead Pool
            {poolCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${mainTab === "POOL" ? "bg-violet-500 text-white" : "bg-violet-50 text-violet-600"}`}>
                {poolCount}
              </span>
            )}
          </button>
        </div> */}

      <div className="-mx-4 sm:-mx-6">
        {/* Filter bar */}
        {mainTab === "MY_LEADS" && (
          <>
            <div className="flex items-center gap-1 overflow-x-auto bg-white border-b border-slate-100 px-4 sm:px-6 py-2.5 [&::-webkit-scrollbar]:hidden">
              {FILTER_TABS.map((tab) => {
                const active = filter === tab.value;
                const Icon   = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value)}
                    className={[
                      "flex flex-shrink-0 items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-semibold border transition-all duration-150",
                      active
                        ? "bg-[#0B1F14] text-white border-[#0B1F14]"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700",
                    ].join(" ")}
                  >
                    <Icon className="h-3 w-3 flex-shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">
                      {tab.value === "ALL" ? "All" : tab.value === "ATTENTION" ? "Urgent" : tab.value === "UPCOMING" ? "Soon" : "None"}
                    </span>
                    {counts[tab.value] > 0 && (
                      <span className={`ml-0.5 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                        {counts[tab.value]}
                      </span>
                    )}
                  </button>
                );
              })}
              <div className="hidden sm:block relative ml-auto flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  placeholder="Search by name or phone…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-8 pl-8 pr-3 w-52 rounded-lg border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400 focus:w-64 transition-all duration-200"
                />
              </div>
            </div>
            <div className="sm:hidden bg-white border-b border-slate-100 px-4 pb-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  placeholder="Search by name or phone…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-9 w-full pl-8 pr-3 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div className="mt-4 sm:mt-5 rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">

        {/* V1: Pool tab hidden — uncomment to restore
        {mainTab === "POOL" && (
          <PoolTab onClaimed={() => {
            setPoolCount((n) => Math.max(0, n - 1));
            loadLeads();
          }} />
        )} */}

        {/* MY LEADS */}
        {mainTab === "MY_LEADS" && (
          <>
            {/* Mobile */}
            <div className="sm:hidden">
              {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              {!loading && filteredLeads.length === 0 && emptyState}
              {!loading && filteredLeads.map((lead) => (
                <MobileLeadCard key={lead.clientId} lead={lead} />
              ))}
            </div>

            {/* Desktop */}
            <table className="hidden sm:table w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {[
                    "Client",
                    "Phone",
                    "Requirement",
                    ...(isOwner ? ["Assigned to"] : []),
                    "Follow-up",
                    "Actions",
                  ].map((col) => (
                    <th key={col} className="px-5 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}

                {!loading && filteredLeads.length === 0 && (
                  <tr><td colSpan={isOwner ? 6 : 5}>{emptyState}</td></tr>
                )}

                {!loading && filteredLeads.map((lead) => {
                  const followUp  = getFollowUpMeta(lead.nearestFollowUpAt);
                  const rowAccent =
                    followUp.category === "OVERDUE" ? "border-l-2 border-l-red-400" :
                    followUp.category === "TODAY"   ? "border-l-2 border-l-amber-400" :
                    "border-l-2 border-l-transparent";

                  return (
                    <tr
                      key={lead.clientId}
                      onClick={() => router.push(`/v2/clients/${lead.clientId}`)}
                      className={`border-b border-slate-50 cursor-pointer transition-colors duration-100 hover:bg-slate-50/70 ${rowAccent}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
                            {clientInitials(lead.name)}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-slate-800">{lead.name || "Unnamed Client"}</p>
                            <p className="text-[11px] text-slate-400">{lead.propertiesCount} requirement{lead.propertiesCount !== 1 ? "s" : ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-[12.5px] text-slate-500 hover:text-emerald-700 transition-colors">
                          <Phone className="h-3 w-3 flex-shrink-0" />{lead.phone}
                        </a>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12.5px] text-slate-600">{lead.requirementLabel}</span>
                      </td>

                      {isOwner && (
                        <td className="px-5 py-3.5">
                          {lead.isPool ? (
                            <span className="text-[11px] text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md font-medium">Pool</span>
                          ) : lead.owner ? (
                            <span className="text-[12px] text-slate-600">{lead.owner.name ?? "—"}</span>
                          ) : (
                            <span className="text-[12px] text-slate-400">Unassigned</span>
                          )}
                        </td>
                      )}

                      <td className="px-5 py-3.5"><FollowUpBadge meta={followUp} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <Link href={`/v2/clients/${lead.clientId}`} onClick={(e) => e.stopPropagation()}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-slate-400 hover:text-slate-700 transition-all">
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-emerald-300 hover:text-emerald-700 transition-all">
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </PageContainer>
  );
}