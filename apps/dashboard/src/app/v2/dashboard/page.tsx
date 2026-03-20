// import Link from "next/link";
// import { PageContainer } from "@/components/v2/layout/PageContainer";
// import { PageHeader } from "@/components/v2/layout/PageHeader";
// import { StatCard } from "@/components/v2/cards/StatCard";
// import {
//   Users,
//   CheckCircle,
//   Clock,
//   IndianRupee,
//   AlertCircle,
//   Calendar,
// } from "lucide-react";

// import { API_BASE } from "@/lib/apiBase";
// // const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

// type FollowUpItem = {
//   clientId: string;
//   clientName?: string | null;
//   followUpAt: string;
//   property: {
//     bhk?: string | null;
//     propertySubType?: string | null;
//     area?: string | null;
//     city?: string | null;
//   };
// };

// function getBaseUrl() {
//   // Server-side safe base URL
//   if (process.env.NEXT_PUBLIC_APP_URL) {
//     return process.env.NEXT_PUBLIC_APP_URL;
//   }

//   // fallback for local dev
//   return "http://localhost:3001";
// }

// async function fetchFollowUps(path: string): Promise<FollowUpItem[]> {
//   const baseUrl = getBaseUrl();

//   const res = await fetch(`${baseUrl}/api${path}`, {
//     cache: "no-store",
//   });

//   if (!res.ok) return [];
//   return res.json();
// }


// export default async function DashboardPage() {
//   const [today, upcoming] = await Promise.all([
//     fetchFollowUps("/clients/follow-ups/today"),
//     fetchFollowUps("/clients/follow-ups/upcoming"),
//   ]);

//   const todayDate = new Date();
//   todayDate.setHours(0, 0, 0, 0);

//   return (
//     <PageContainer>

//       <PageHeader title="Dashboard" />

//       {/* ================= STATS ================= */}
//       <div className="grid grid-cols-4 gap-4">
//         <StatCard title="Total Leads" value="0" icon={<Users />} footer="All time" />
//         <StatCard title="Active Leads" value="0" icon={<Clock />} footer="Open" />
//         <StatCard title="Closed" value="0" icon={<CheckCircle />} footer="This month" />
//         <StatCard title="Revenue" value="₹0" icon={<IndianRupee />} footer="This month" />
//       </div>

//       <div className="mt-6 grid grid-cols-3 gap-4">
//         {/* TODAY */}
//         <div className="col-span-2 rounded-xl border bg-card p-5">
//           <div className="mb-4 flex items-center gap-2 text-sm font-medium">
//             <AlertCircle className="h-4 w-4 text-red-600" />
//             Follow-ups Due / Overdue
//           </div>

//           {today.length === 0 ? (
//             <div className="h-[200px] flex items-center justify-center text-muted-foreground">
//               No follow-ups 🎉
//             </div>
//           ) : (
//             today.map((f, i) => {
//               const isOverdue =
//                 new Date(f.followUpAt).setHours(0, 0, 0, 0) < todayDate.getTime();

//               return (
//                 <Link
//                   key={i}
//                   href={`/clients/${f.clientId}`}
//                   className="block rounded-lg border p-3 mb-2 hover:bg-muted"
//                 >
//                   <div className="flex justify-between">
//                     <div>
//                       <div className="font-medium">
//                         {f.clientName || "Unnamed Client"}
//                       </div>
//                       <div className="text-xs text-muted-foreground">
//                         {f.property.bhk ?? ""}{" "}
//                         {f.property.propertySubType ?? "Property"} ·{" "}
//                         {f.property.area ?? "—"}
//                       </div>
//                     </div>
//                     <span
//                       className={`text-xs ${
//                         isOverdue ? "text-red-600" : "text-yellow-600"
//                       }`}
//                     >
//                       {isOverdue ? "Overdue" : "Today"}
//                     </span>
//                   </div>
//                 </Link>
//               );
//             })
//           )}
//         </div>

//         {/* UPCOMING */}
//         <div className="rounded-xl border bg-card p-5">
//           <div className="mb-4 flex items-center gap-2 text-sm font-medium">
//             <Calendar className="h-4 w-4 text-green-600" />
//             Upcoming (7 days)
//           </div>

//           {upcoming.length === 0 ? (
//             <div className="h-[200px] flex items-center justify-center text-muted-foreground">
//               Nothing scheduled
//             </div>
//           ) : (
//             upcoming.map((f, i) => (
//               <Link
//                 key={i}
//                 href={`/clients/${f.clientId}`}
//                 className="block rounded-lg border p-3 mb-2 hover:bg-muted"
//               >
//                 <div className="font-medium">
//                   {f.clientName || "Unnamed Client"}
//                 </div>
//                 <div className="text-xs text-muted-foreground">
//                   {new Date(f.followUpAt).toLocaleDateString()}
//                 </div>
//               </Link>
//             ))
//           )}
//         </div>
//       </div>
//     </PageContainer>
//   );
// }

























// import Link from "next/link";
// import { PageContainer } from "@/components/v2/layout/PageContainer";
// import { PageHeader } from "@/components/v2/layout/PageHeader";
// import {
//   Users,
//   CheckCircle,
//   Clock,
//   IndianRupee,
//   AlertCircle,
//   Calendar,
//   ChevronRight,
// } from "lucide-react";

// /* ------------------------------------------------------------------ */
// /* TYPES                                                               */
// /* ------------------------------------------------------------------ */

// type FollowUpItem = {
//   clientId: string;
//   clientName?: string | null;
//   followUpAt: string;
//   property: {
//     bhk?: string | null;
//     propertySubType?: string | null;
//     area?: string | null;
//     city?: string | null;
//   };
// };

// /* ------------------------------------------------------------------ */
// /* DATA                                                                */
// /* ------------------------------------------------------------------ */

// function getBaseUrl() {
//   if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
//   return "http://localhost:3001";
// }

// async function fetchFollowUps(path: string): Promise<FollowUpItem[]> {
//   const res = await fetch(`${getBaseUrl()}/api${path}`, { cache: "no-store" });
//   if (!res.ok) return [];
//   return res.json();
// }

// /* ------------------------------------------------------------------ */
// /* HELPERS                                                             */
// /* ------------------------------------------------------------------ */

// function clientInitials(name?: string | null) {
//   if (!name) return "?";
//   return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
// }

// function formatFollowUpDate(iso: string) {
//   return new Date(iso).toLocaleDateString("en-IN", {
//     day: "numeric",
//     month: "short",
//   });
// }

// /* ------------------------------------------------------------------ */
// /* STAT CARD — Safari-safe static colour map                          */
// /* ------------------------------------------------------------------ */

// type AccentKey = "sky" | "amber" | "emerald" | "violet";

// const ACCENT: Record<AccentKey, { iconBg: string; iconText: string; circleBg: string }> = {
//   sky:     { iconBg: "bg-sky-100",     iconText: "text-sky-600",     circleBg: "bg-sky-400"     },
//   amber:   { iconBg: "bg-amber-100",   iconText: "text-amber-600",   circleBg: "bg-amber-400"   },
//   emerald: { iconBg: "bg-emerald-100", iconText: "text-emerald-600", circleBg: "bg-emerald-400" },
//   violet:  { iconBg: "bg-violet-100",  iconText: "text-violet-600",  circleBg: "bg-violet-400"  },
// };

// function StatCard({
//   title, value, footer, icon: Icon, accent,
// }: {
//   title: string; value: string; footer: string;
//   icon: React.ElementType; accent: AccentKey;
// }) {
//   const a = ACCENT[accent];
//   return (
//     <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 md:p-5 overflow-hidden relative">
//       <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 ${a.circleBg}`} />

//       {/* ── MOBILE layout: icon + value side-by-side ── */}
//       <div className="flex items-center justify-between md:hidden">
//         <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${a.iconBg}`}>
//           <Icon className={`h-4 w-4 ${a.iconText}`} />
//         </div>
//         <p className="text-[22px] font-bold leading-none text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
//           {value}
//         </p>
//       </div>
//       <p className="mt-2 text-[11px] font-medium text-slate-500 md:hidden">{title}</p>
//       <p className="mt-0.5 text-[11px] text-slate-400 md:hidden">{footer}</p>

//       {/* ── DESKTOP layout: original stacked ── */}
//       <div className={`hidden md:flex h-9 w-9 items-center justify-center rounded-xl mb-4 ${a.iconBg}`}>
//         <Icon className={`h-4 w-4 ${a.iconText}`} />
//       </div>
//       <p className="hidden md:block text-[12px] font-medium text-slate-500">{title}</p>
//       <p className="hidden md:block mt-1 text-[28px] font-bold leading-none text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
//         {value}
//       </p>
//       <p className="hidden md:block mt-2 text-[11px] text-slate-400">{footer}</p>
//     </div>
//   );
// }

// /* ------------------------------------------------------------------ */
// /* FOLLOW-UP ROW                                                       */
// /* ------------------------------------------------------------------ */

// function FollowUpRow({ item, isOverdue }: { item: FollowUpItem; isOverdue?: boolean }) {
//   const propertyLabel = [item.property.bhk, item.property.propertySubType ?? "Property"]
//     .filter(Boolean).join(" ");
//   const location = [item.property.area, item.property.city].filter(Boolean).join(", ") || "—";

//   return (
//     <Link
//       href={`/v2/clients/${item.clientId}`}
//       className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 lg:px-4 py-3 hover:bg-slate-100 hover:border-slate-200 transition-all duration-150"
//     >
//       <div className="flex items-center gap-3 min-w-0">
//         <div className={[
//           "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
//           isOverdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700",
//         ].join(" ")}>
//           {clientInitials(item.clientName)}
//         </div>
//         <div className="min-w-0">
//           <p className="text-[13px] font-semibold text-slate-800 truncate">
//             {item.clientName || "Unnamed Client"}
//           </p>
//           <p className="text-[11px] text-slate-400 truncate">
//             {propertyLabel} · {location}
//           </p>
//         </div>
//       </div>

//       <div className="flex items-center gap-2 flex-shrink-0">
//         <span className={[
//           "rounded-md border px-2 py-0.5 text-[11px] font-semibold",
//           isOverdue ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200",
//         ].join(" ")}>
//           {isOverdue ? "Overdue" : "Today"}
//         </span>
//         <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
//       </div>
//     </Link>
//   );
// }

// /* ------------------------------------------------------------------ */
// /* UPCOMING ROW                                                        */
// /* ------------------------------------------------------------------ */

// function UpcomingRow({ item }: { item: FollowUpItem }) {
//   return (
//     <Link
//       href={`/v2/clients/${item.clientId}`}
//       className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 lg:px-4 py-3 hover:bg-slate-100 hover:border-slate-200 transition-all duration-150"
//     >
//       <div className="flex items-center gap-3 min-w-0">
//         <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
//           {clientInitials(item.clientName)}
//         </div>
//         <div className="min-w-0">
//           <p className="text-[13px] font-semibold text-slate-800 truncate">
//             {item.clientName || "Unnamed Client"}
//           </p>
//           <p className="text-[11px] text-slate-400">
//             {[item.property.bhk, item.property.propertySubType].filter(Boolean).join(" ")}
//           </p>
//         </div>
//       </div>

//       <div className="flex items-center gap-2 flex-shrink-0">
//         <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
//           {formatFollowUpDate(item.followUpAt)}
//         </span>
//         <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
//       </div>
//     </Link>
//   );
// }

// /* ------------------------------------------------------------------ */
// /* SECTION CARD                                                        */
// /* ------------------------------------------------------------------ */

// function SectionCard({
//   icon, title, badge, badgeRed, children, emptyEmoji, emptyTitle, emptySubtitle, isEmpty,
// }: {
//   icon: React.ReactNode; title: string; badge?: number; badgeRed?: boolean;
//   children: React.ReactNode; emptyEmoji: string; emptyTitle: string;
//   emptySubtitle: string; isEmpty: boolean;
// }) {
//   return (
//     <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
//       <div className="flex items-center gap-2 border-b border-slate-100 px-4 lg:px-5 py-3.5">
//         {icon}
//         <p className="text-[13px] font-semibold text-slate-800">{title}</p>
//         {badge !== undefined && badge > 0 && (
//           <span className={[
//             "ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold border",
//             badgeRed ? "bg-red-50 border-red-200 text-red-600" : "bg-slate-100 border-transparent text-slate-500",
//           ].join(" ")}>
//             {badge}
//           </span>
//         )}
//       </div>
//       <div className="px-4 lg:px-5 py-4">
//         {isEmpty ? (
//           <div className="flex flex-col items-center justify-center py-10 lg:py-12 text-center">
//             <div className="mb-2 text-2xl">{emptyEmoji}</div>
//             <p className="text-[13px] font-semibold text-slate-800">{emptyTitle}</p>
//             <p className="text-[11.5px] text-slate-400 mt-0.5">{emptySubtitle}</p>
//           </div>
//         ) : (
//           <div className="space-y-2">{children}</div>
//         )}
//       </div>
//     </div>
//   );
// }

// /* ------------------------------------------------------------------ */
// /* PAGE                                                                */
// /* ------------------------------------------------------------------ */

// export default async function DashboardPage() {
//   const [today, upcoming] = await Promise.all([
//     fetchFollowUps("/clients/follow-ups/today"),
//     fetchFollowUps("/clients/follow-ups/upcoming"),
//   ]);

//   const todayDate = new Date();
//   todayDate.setHours(0, 0, 0, 0);

//   return (
//     <PageContainer className="bg-[#F7F5F0]">
//       <PageHeader title="Dashboard" />

//       {/* ── STATS: 2-col mobile → 4-col desktop ── */}
//       <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
//         <StatCard title="Total Leads"  value="0"  footer="All time"       icon={Users}       accent="sky"     />
//         <StatCard title="Active Leads" value="0"  footer="Open right now" icon={Clock}       accent="amber"   />
//         <StatCard title="Closed"       value="0"  footer="This month"     icon={CheckCircle} accent="emerald" />
//         <StatCard title="Revenue"      value="₹0" footer="This month"     icon={IndianRupee} accent="violet"  />
//       </div>

//       {/* ── FOLLOW-UPS: stacked mobile → 3-col desktop ── */}
//       <div className="mt-4 lg:mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">

//         <div className="lg:col-span-2">
//           <SectionCard
//             icon={<AlertCircle className="h-3.5 w-3.5 text-red-500" />}
//             title="Due & Overdue"
//             badge={today.length}
//             badgeRed
//             isEmpty={today.length === 0}
//             emptyEmoji="🎉"
//             emptyTitle="All clear!"
//             emptySubtitle="No follow-ups due today."
//           >
//             {today.map((f, i) => {
//               const isOverdue = new Date(f.followUpAt).setHours(0, 0, 0, 0) < todayDate.getTime();
//               return <FollowUpRow key={i} item={f} isOverdue={isOverdue} />;
//             })}
//           </SectionCard>
//         </div>

//         <div className="lg:col-span-1">
//           <SectionCard
//             icon={<Calendar className="h-3.5 w-3.5 text-emerald-500" />}
//             title="Upcoming · 7 days"
//             badge={upcoming.length}
//             isEmpty={upcoming.length === 0}
//             emptyEmoji="📅"
//             emptyTitle="Nothing scheduled"
//             emptySubtitle="No follow-ups in the next 7 days."
//           >
//             {upcoming.map((f, i) => <UpcomingRow key={i} item={f} />)}
//           </SectionCard>
//         </div>

//       </div>
//     </PageContainer>
//   );
// }






import Link from "next/link";
import { PageContainer } from "@/components/v2/layout/PageContainer";
import { PageHeader } from "@/components/v2/layout/PageHeader";
import {
  Users,
  CheckCircle,
  Clock,
  IndianRupee,
  AlertCircle,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { serverGet } from "@/lib/serverApi";

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

type FollowUpItem = {
  clientId: string;
  clientName?: string | null;
  followUpAt: string;
  property: {
    bhk?: string | null;
    propertySubType?: string | null;
    area?: string | null;
    city?: string | null;
  };
};

/* ------------------------------------------------------------------ */
/* DATA                                                                */
/* ------------------------------------------------------------------ */

async function fetchFollowUps(path: string): Promise<FollowUpItem[]> {
  try {
    return await serverGet<FollowUpItem[]>(path);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

function clientInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function formatFollowUpDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

/* ------------------------------------------------------------------ */
/* STAT CARD — Safari-safe static colour map                          */
/* ------------------------------------------------------------------ */

type AccentKey = "sky" | "amber" | "emerald" | "violet";

const ACCENT: Record<AccentKey, { iconBg: string; iconText: string; circleBg: string }> = {
  sky:     { iconBg: "bg-sky-100",     iconText: "text-sky-600",     circleBg: "bg-sky-400"     },
  amber:   { iconBg: "bg-amber-100",   iconText: "text-amber-600",   circleBg: "bg-amber-400"   },
  emerald: { iconBg: "bg-emerald-100", iconText: "text-emerald-600", circleBg: "bg-emerald-400" },
  violet:  { iconBg: "bg-violet-100",  iconText: "text-violet-600",  circleBg: "bg-violet-400"  },
};

function StatCard({
  title, value, footer, icon: Icon, accent,
}: {
  title: string; value: string; footer: string;
  icon: React.ElementType; accent: AccentKey;
}) {
  const a = ACCENT[accent];
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 md:p-5 overflow-hidden relative">
      <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 ${a.circleBg}`} />

      {/* ── MOBILE layout: icon + value side-by-side ── */}
      <div className="flex items-center justify-between md:hidden">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${a.iconBg}`}>
          <Icon className={`h-4 w-4 ${a.iconText}`} />
        </div>
        <p className="text-[22px] font-bold leading-none text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {value}
        </p>
      </div>
      <p className="mt-2 text-[11px] font-medium text-slate-500 md:hidden">{title}</p>
      <p className="mt-0.5 text-[11px] text-slate-400 md:hidden">{footer}</p>

      {/* ── DESKTOP layout: original stacked ── */}
      <div className={`hidden md:flex h-9 w-9 items-center justify-center rounded-xl mb-4 ${a.iconBg}`}>
        <Icon className={`h-4 w-4 ${a.iconText}`} />
      </div>
      <p className="hidden md:block text-[12px] font-medium text-slate-500">{title}</p>
      <p className="hidden md:block mt-1 text-[28px] font-bold leading-none text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
        {value}
      </p>
      <p className="hidden md:block mt-2 text-[11px] text-slate-400">{footer}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FOLLOW-UP ROW                                                       */
/* ------------------------------------------------------------------ */

function FollowUpRow({ item, isOverdue }: { item: FollowUpItem; isOverdue?: boolean }) {
  const propertyLabel = [item.property.bhk, item.property.propertySubType ?? "Property"]
    .filter(Boolean).join(" ");
  const location = [item.property.area, item.property.city].filter(Boolean).join(", ") || "—";

  return (
    <Link
      href={`/v2/clients/${item.clientId}`}
      className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 lg:px-4 py-3 hover:bg-slate-100 hover:border-slate-200 transition-all duration-150"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={[
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
          isOverdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700",
        ].join(" ")}>
          {clientInitials(item.clientName)}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-800 truncate">
            {item.clientName || "Unnamed Client"}
          </p>
          <p className="text-[11px] text-slate-400 truncate">
            {propertyLabel} · {location}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={[
          "rounded-md border px-2 py-0.5 text-[11px] font-semibold",
          isOverdue ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200",
        ].join(" ")}>
          {isOverdue ? "Overdue" : "Today"}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* UPCOMING ROW                                                        */
/* ------------------------------------------------------------------ */

function UpcomingRow({ item }: { item: FollowUpItem }) {
  return (
    <Link
      href={`/v2/clients/${item.clientId}`}
      className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 lg:px-4 py-3 hover:bg-slate-100 hover:border-slate-200 transition-all duration-150"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
          {clientInitials(item.clientName)}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-800 truncate">
            {item.clientName || "Unnamed Client"}
          </p>
          <p className="text-[11px] text-slate-400">
            {[item.property.bhk, item.property.propertySubType].filter(Boolean).join(" ")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
          {formatFollowUpDate(item.followUpAt)}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* SECTION CARD                                                        */
/* ------------------------------------------------------------------ */

function SectionCard({
  icon, title, badge, badgeRed, children, emptyEmoji, emptyTitle, emptySubtitle, isEmpty,
}: {
  icon: React.ReactNode; title: string; badge?: number; badgeRed?: boolean;
  children: React.ReactNode; emptyEmoji: string; emptyTitle: string;
  emptySubtitle: string; isEmpty: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 lg:px-5 py-3.5">
        {icon}
        <p className="text-[13px] font-semibold text-slate-800">{title}</p>
        {badge !== undefined && badge > 0 && (
          <span className={[
            "ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold border",
            badgeRed ? "bg-red-50 border-red-200 text-red-600" : "bg-slate-100 border-transparent text-slate-500",
          ].join(" ")}>
            {badge}
          </span>
        )}
      </div>
      <div className="px-4 lg:px-5 py-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-10 lg:py-12 text-center">
            <div className="mb-2 text-2xl">{emptyEmoji}</div>
            <p className="text-[13px] font-semibold text-slate-800">{emptyTitle}</p>
            <p className="text-[11.5px] text-slate-400 mt-0.5">{emptySubtitle}</p>
          </div>
        ) : (
          <div className="space-y-2">{children}</div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */

export default async function DashboardPage() {
  const [today, upcoming] = await Promise.all([
    fetchFollowUps("/clients/follow-ups/today"),
    fetchFollowUps("/clients/follow-ups/upcoming"),
  ]);

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  return (
    <PageContainer className="bg-[#F7F5F0]">
      <PageHeader title="Dashboard" />

      {/* ── STATS: 2-col mobile → 4-col desktop ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard title="Total Leads"  value="0"  footer="All time"       icon={Users}       accent="sky"     />
        <StatCard title="Active Leads" value="0"  footer="Open right now" icon={Clock}       accent="amber"   />
        <StatCard title="Closed"       value="0"  footer="This month"     icon={CheckCircle} accent="emerald" />
        <StatCard title="Revenue"      value="₹0" footer="This month"     icon={IndianRupee} accent="violet"  />
      </div>

      {/* ── FOLLOW-UPS: stacked mobile → 3-col desktop ── */}
      <div className="mt-4 lg:mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">

        <div className="lg:col-span-2">
          <SectionCard
            icon={<AlertCircle className="h-3.5 w-3.5 text-red-500" />}
            title="Due & Overdue"
            badge={today.length}
            badgeRed
            isEmpty={today.length === 0}
            emptyEmoji="🎉"
            emptyTitle="All clear!"
            emptySubtitle="No follow-ups due today."
          >
            {today.map((f, i) => {
              const isOverdue = new Date(f.followUpAt).setHours(0, 0, 0, 0) < todayDate.getTime();
              return <FollowUpRow key={i} item={f} isOverdue={isOverdue} />;
            })}
          </SectionCard>
        </div>

        <div className="lg:col-span-1">
          <SectionCard
            icon={<Calendar className="h-3.5 w-3.5 text-emerald-500" />}
            title="Upcoming · 7 days"
            badge={upcoming.length}
            isEmpty={upcoming.length === 0}
            emptyEmoji="📅"
            emptyTitle="Nothing scheduled"
            emptySubtitle="No follow-ups in the next 7 days."
          >
            {upcoming.map((f, i) => <UpcomingRow key={i} item={f} />)}
          </SectionCard>
        </div>

      </div>
    </PageContainer>
  );
}