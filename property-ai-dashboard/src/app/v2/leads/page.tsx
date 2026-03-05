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
// }
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Phone, Plus } from "lucide-react";

import { PageContainer } from "@/components/v2/layout/PageContainer";
import { PageHeader } from "@/components/v2/layout/PageHeader";
import { Input } from "@/components/v2/ui/Input";
import { Select } from "@/components/v2/ui/Select";
import {
  DataTable,
  DataTableRow,
  DataTableCell,
} from "@/components/v2/tables/DataTable";
import { API_BASE } from "@/lib/apiBase";


// const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

/* =====================================================
 * TYPES (MATCH BACKEND EXACTLY)
 * ===================================================== */

type LeadRow = {
  clientId: string;
  name?: string | null;
  phone: string;
  requirementLabel: string;
  propertiesCount: number;
  nearestFollowUpAt?: string | null;
};

type FollowUpMeta = {
  label: string;
  color: string;
  category: "NONE" | "OVERDUE" | "TODAY" | "UPCOMING";
};

/* =====================================================
 * HELPERS
 * ===================================================== */

function getFollowUpMeta(date?: string | null): FollowUpMeta {
  if (!date) {
    return {
      label: "—",
      color: "text-muted-foreground",
      category: "NONE",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  if (d < today) {
    return {
      label: "Overdue",
      color: "text-red-600",
      category: "OVERDUE",
    };
  }

  if (d.getTime() === today.getTime()) {
    return {
      label: "Today",
      color: "text-yellow-600",
      category: "TODAY",
    };
  }

  return {
    label: d.toLocaleDateString(),
    color: "text-muted-foreground",
    category: "UPCOMING",
  };
}

function getRowBg(category: FollowUpMeta["category"]) {
  if (category === "OVERDUE") return "bg-red-50 hover:bg-red-100";
  if (category === "TODAY") return "bg-yellow-50 hover:bg-yellow-100";
  return "";
}

/* =====================================================
 * PAGE
 * ===================================================== */

export default function LeadsPage() {
  const router = useRouter();

  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<
    "ALL" | "ATTENTION" | "UPCOMING" | "NONE"
  >("ALL");

  /* ---------------- FETCH ---------------- */

  useEffect(() => {
    fetch(`${API_BASE}/clients/leads`, { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        console.log("LEADS API RESPONSE 👉", json);
        return json;
      })
      .then((data) => {
        setLeads(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("LEADS API ERROR ❌", err);
        setLeads([]);
      });
  }, []);
  

  /* ---------------- FILTER ---------------- */

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const q = query.toLowerCase();
  
      const matchesQuery =
        (lead.name || "").toLowerCase().includes(q) ||
        lead.phone.includes(q);
  
      if (!lead.nearestFollowUpAt) {
        return matchesQuery && filter === "ALL";
      }
  
      const followUp = getFollowUpMeta(lead.nearestFollowUpAt);
  
      const matchesFilter =
        filter === "ALL" ||
        (filter === "ATTENTION" &&
          (followUp.category === "OVERDUE" ||
           followUp.category === "TODAY")) ||
        (filter === "UPCOMING" &&
          followUp.category === "UPCOMING") ||
        (filter === "NONE" && followUp.category === "NONE");
  
      return matchesQuery && matchesFilter;
    });
  }, [leads, query, filter]);
  

  /* =====================================================
   * RENDER
   * ===================================================== */

  console.log("RAW leads state 👉", leads);
  console.log("FILTERED leads 👉", filteredLeads);
  console.log("filter =", filter, "query =", query);


  return (
    <PageContainer>
      <PageHeader
        title="Leads"
        actions={
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            <Plus className="h-4 w-4" />
            Add Lead
          </button>
        }
      />

      <div className="rounded-xl border bg-card">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 border-b p-4">
          <Input
            placeholder="Search by name or phone…"
            className="w-72"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <Select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as any)
            }
          >
            <option value="ALL">All</option>
            <option value="ATTENTION">Needs Attention</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="NONE">No Follow-up</option>
          </Select>
        </div>

        {/* Table */}
        <DataTable
          columns={[
            "Client",
            "Phone",
            "Requirement",
            "Follow-up",
            "Actions",
          ]}
        >
          {filteredLeads.length === 0 ? (
            <DataTableRow>
              <DataTableCell colSpan={5}>
                <div className="py-10 text-center text-muted-foreground">
                  No leads found
                </div>
              </DataTableCell>
            </DataTableRow>
          ) : (
            filteredLeads.map((lead) => {
              const followUp = getFollowUpMeta(
                lead.nearestFollowUpAt
              );

              return (
                <DataTableRow
                  key={lead.clientId}
                  onClick={() =>
                    router.push(`/v2/clients/${lead.clientId}`)
                  }
                  className={`cursor-pointer ${getRowBg(
                    followUp.category
                  )}`}
                >
                  {/* Client */}
                  <DataTableCell>
                    <div className="font-medium">
                      {lead.name || "Unnamed Client"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {lead.propertiesCount} requirement
                      {lead.propertiesCount > 1 ? "s" : ""}
                    </div>
                  </DataTableCell>

                  {/* Phone */}
                  <DataTableCell>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `tel:${lead.phone}`;
                      }}
                      className="rounded-md p-2 hover:bg-muted"
                    >
                      <Phone className="h-4 w-4" />
                    </button>
                  </DataTableCell>

                  {/* Requirement */}
                  <DataTableCell className="text-sm">
                    {lead.requirementLabel}
                  </DataTableCell>

                  {/* Follow-up */}
                  <DataTableCell>
                    <span
                      className={`text-sm font-medium ${followUp.color}`}
                    >
                      {followUp.label}
                    </span>
                  </DataTableCell>

                  {/* Actions */}
                  <DataTableCell>
                    <div className="flex gap-2">
                      <Link
                        href={`/v2/clients/${lead.clientId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-md p-2 hover:bg-muted"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `tel:${lead.phone}`;
                        }}
                        className="rounded-md p-2 hover:bg-muted"
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              );
            })
          )}
        </DataTable>
      </div>
    </PageContainer>
  );
}
