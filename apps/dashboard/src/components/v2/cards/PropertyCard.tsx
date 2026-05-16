// "use client";

// import { Eye, Zap } from "lucide-react";

// /* ------------------------------------------------------------------ */
// /* TYPES                                                               */
// /* ------------------------------------------------------------------ */

// type Agent = {
//   id?: string;
//   name?: string;
//   phones?: string[] | string | null;
// };

// export interface Property {
//   id: string;

//   listingType: "RENT" | "SALE";
//   propertyCategory: string;
//   propertySubType: string;

//   price: string;
//   bhk: string | null;

//   area: string | null;
//   city: string | null;
//   location: string | null;
//   areaSqft: number | null;

//   furnishing: string;
//   availability: string;
//   status: string;

//   urgencyLevel?: "NORMAL" | "URGENT" | "VERY_URGENT";
//   parkingAvailable?: any;
//   tenantTypes?: string[] | null;

//   agents?: Agent[];
// }

// interface PropertyCardProps {
//   property: Property;
//   selectionMode?: boolean;
//   selected?: boolean;
//   onToggleSelect?: () => void;
//   onView?: () => void;
// }

// /* ------------------------------------------------------------------ */
// /* HELPERS                                                             */
// /* ------------------------------------------------------------------ */

// function formatPrice(price: string, listingType: "RENT" | "SALE") {
//   const n = parseInt(price);
//   if (isNaN(n)) return { main: price, sub: "" };
//   if (listingType === "RENT") return { main: `₹${n.toLocaleString("en-IN")}`, sub: "/ mo" };
//   if (n >= 10_000_000) return { main: `₹${(n / 10_000_000).toFixed(2)} Cr`, sub: "" };
//   if (n >= 100_000)    return { main: `₹${(n / 100_000).toFixed(2)} L`,     sub: "" };
//   return { main: `₹${n.toLocaleString("en-IN")}`, sub: "" };
// }

// function agentInitials(name?: string) {
//   if (!name) return "?";
//   return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
// }

// function furnishingLabel(f: string) {
//   if (f === "FULLY_FURNISHED") return "Fully furnished";
//   if (f === "SEMI_FURNISHED")  return "Semi furnished";
//   if (f === "UNFURNISHED")     return "Unfurnished";
//   return f;
// }

// function accentColor(property: Property) {
//   if (property.urgencyLevel === "VERY_URGENT") return "from-red-500 to-red-400";
//   if (property.urgencyLevel === "URGENT")      return "from-amber-500 to-amber-400";
//   if (property.status === "APPROVED")          return "from-emerald-500 to-emerald-400";
//   return "from-violet-500 to-indigo-400";
// }

// function StatusBadge({ property }: { property: Property }) {
//   if (property.urgencyLevel === "VERY_URGENT") {
//     return (
//       <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700 border border-red-200 whitespace-nowrap flex-shrink-0">
//         <Zap className="h-2.5 w-2.5" />
//         Urgent
//       </span>
//     );
//   }
//   if (property.status === "APPROVED") {
//     return (
//       <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 border border-emerald-200 whitespace-nowrap flex-shrink-0">
//         Approved
//       </span>
//     );
//   }
//   return (
//     <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 border border-amber-200 whitespace-nowrap flex-shrink-0">
//       Review
//     </span>
//   );
// }

// /* ------------------------------------------------------------------ */
// /* COMPONENT                                                           */
// /* ------------------------------------------------------------------ */

// export function PropertyCard({
//   property,
//   selectionMode = false,
//   selected = false,
//   onToggleSelect,
//   onView,
// }: PropertyCardProps) {
//   const { main: priceMain, sub: priceSub } = formatPrice(property.price, property.listingType);

//   const title = property.bhk
//     ? `${property.bhk} ${property.propertySubType}`
//     : property.propertySubType;

//   const locationText =
//     property.area && property.city
//       ? `${property.area}, ${property.city}`
//       : property.location || "Location not specified";

//   const agents       = property.agents ?? [];
//   const primaryAgent = agents[0];
//   const extraAgents  = agents.length > 1 ? agents.length - 1 : 0;

//   const tags = [
//     property.furnishing ? furnishingLabel(property.furnishing) : null,
//     property.tenantTypes?.length
//       ? property.tenantTypes[0].charAt(0).toUpperCase() + property.tenantTypes[0].slice(1).toLowerCase()
//       : null,
//     property.listingType === "SALE" ? "For sale" : null,
//   ].filter(Boolean) as string[];

//   return (
//     <div
//       onClick={() => selectionMode && onToggleSelect?.()}
//       className={[
//         /* ── fixed height keeps every card in the grid the same size ── */
//         "h-[210px] flex flex-col",
//         "relative rounded-[14px] bg-white overflow-hidden",
//         "border transition-all duration-200",
//         "hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]",
//         selected
//           ? "border-emerald-400 shadow-[0_0_0_2px_rgba(52,211,153,0.25)]"
//           : "border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
//         selectionMode ? "cursor-pointer" : "",
//       ].join(" ")}
//     >
//       {/* ── ACCENT BAR ── */}
//       <div className={`h-[4px] w-full flex-shrink-0 bg-gradient-to-r ${accentColor(property)}`} />

//       {/* ── SELECTION CIRCLE ── */}
//       {selectionMode && (
//         <div
//           className={[
//             "absolute left-3 top-5 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-all",
//             selected
//               ? "border-emerald-500 bg-emerald-500 text-white"
//               : "border-slate-300 bg-white text-transparent",
//           ].join(" ")}
//         >
//           ✓
//         </div>
//       )}

//       {/* ── CARD BODY — flex-1 fills remaining height ── */}
//       <div className="flex flex-col flex-1 px-4 pt-3.5 overflow-hidden">

//         {/* Price + badge */}
//         <div className="flex items-center justify-between gap-2 mb-1.5">
//           <div className="flex items-baseline gap-1 min-w-0">
//             <span className="font-['Outfit',sans-serif] text-[18px] font-bold leading-tight tracking-tight text-slate-900 truncate">
//               {priceMain}
//             </span>
//             {priceSub && (
//               <span className="text-[11px] font-normal text-slate-400 whitespace-nowrap flex-shrink-0">
//                 {priceSub}
//               </span>
//             )}
//           </div>
//           <StatusBadge property={property} />
//         </div>

//         {/* Property type */}
//         <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.6px] text-slate-400 truncate">
//           {title}
//         </p>

//         {/* Location */}
//         <div className="mb-2.5 flex items-center gap-1.5 text-[12px] text-slate-500">
//           <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
//           <span className="truncate">{locationText}</span>
//         </div>

//         {/* Tags — fixed height row, overflow hidden so extra tags don't push footer */}
//         <div className="flex gap-1.5 overflow-hidden h-[22px] flex-shrink-0">
//           {tags.map((tag) => (
//             <span
//               key={tag}
//               className="rounded-[6px] border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10.5px] font-medium text-slate-500 whitespace-nowrap"
//             >
//               {tag}
//             </span>
//           ))}
//         </div>
//       </div>

//       {/* ── CARD FOOTER — always at bottom ── */}
//       <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 flex-shrink-0">

//         {/* Agent */}
//         <div className="flex items-center gap-2 min-w-0">
//           <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-[9px] font-bold text-sky-700">
//             {agentInitials(primaryAgent?.name)}
//           </div>
//           <span className="truncate text-[11.5px] font-medium text-slate-500">
//             {primaryAgent?.name ?? "—"}
//             {extraAgents > 0 && (
//               <span className="ml-1 text-slate-400">+{extraAgents}</span>
//             )}
//           </span>
//         </div>

//         {/* Sqft / View */}
//         <div className="flex items-center gap-2 flex-shrink-0">
//           {property.areaSqft && (
//             <span className="text-[11px] font-medium text-slate-400">
//               {property.areaSqft.toLocaleString("en-IN")} sqft
//             </span>
//           )}
//           {selectionMode && (
//             <button
//               onClick={(e) => { e.stopPropagation(); onView?.(); }}
//               className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-800 transition-colors"
//             >
//               <Eye className="h-3 w-3" />
//               View
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }







'use client';

// apps/dashboard/src/components/v2/cards/PropertyCard.tsx

import { useState } from 'react';
import { Eye, Zap } from 'lucide-react';
import {
  PropertyStatusSelect,
  type AvailabilityStatus,
} from '@/components/v2/property/PropertyStatusSelect';
import { SaveToCollectionButton } from '@/components/v2/collections/SaveToCollectionButton';

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

type Agent = {
  id?:     string;
  name?:   string;
  phones?: string[] | string | null;
};

export type Property = {
  id:              string;
  refCode:         string;
  listingType:     'RENT' | 'SALE' | null;
  propertySubType: string | null;
  bhk:             string | null;
  area:            string | null;
  city:            string | null;
  location?:       string | null;
  areaSqft:        number | null;
  price:           string | null;
  availability:    AvailabilityStatus;
  urgencyLevel?:   'NORMAL' | 'URGENT' | 'VERY_URGENT' | null;
  agentName?:      string | null;
  agents?:         Agent[];
  shares?:         number;
  status?:         string | null;
  furnishing?:     string | null;
  tenantTypes?:    string[] | null;
  imageUrl?:       string | null;
  lastActivityAt?: string | null;
  lastSeenAt?:        string | null;
  marketFirstSeenAt?: string | null;
};

type PropertyCardProps = {
  property:        Property;
  selectionMode?:  boolean;
  selected?:       boolean;
  onToggleSelect?: () => void;
  onView?:         () => void;
};

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

function timeAgo(iso?: string | null): string | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatPrice(price: string | null, listingType: 'RENT' | 'SALE' | null): string {
  if (!price) return 'On req.';
  const n = parseInt(price, 10);
  if (isNaN(n) || n <= 0) return 'On req.';
  if (listingType === 'RENT') {
    if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L/mo`;
    return `₹${n.toLocaleString('en-IN')}/mo`;
  }
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function agentInitials(name?: string | null) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function accentClass(p: Property): string {
  if (p.urgencyLevel === 'VERY_URGENT') return 'bg-red-500';
  if (p.urgencyLevel === 'URGENT')      return 'bg-orange-400';
  if (p.listingType === 'SALE')         return 'bg-violet-500';
  return 'bg-emerald-500';
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */

export function PropertyCard({
  property,
  selectionMode  = false,
  selected       = false,
  onToggleSelect,
  onView,
}: PropertyCardProps) {
  const VALID_STATUSES = new Set(['AVAILABLE', 'UNDER_NEGOTIATION', 'CLOSED', 'ON_HOLD']);
  const [availability, setAvailability] = useState<AvailabilityStatus>(
    VALID_STATUSES.has(property.availability) ? property.availability : 'AVAILABLE',
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const price = formatPrice(property.price, property.listingType);

  const titleLine = [
    property.bhk ? `${property.bhk.toString().replace(/BHK/i, '').trim()} BHK` : null,
    property.propertySubType,
  ].filter(Boolean).join(' ') || 'Property';

  const locationLine =
    property.area   ? property.area
    : property.city ? property.city
    : property.location ?? '—';

  const agents       = property.agents ?? [];
  const primaryAgent = agents[0] ?? (property.agentName ? { name: property.agentName } : null);
  const extraAgents  = agents.length > 1 ? agents.length - 1 : 0;
  
  return (
    <div
    onClick={() => selectionMode && onToggleSelect?.()}
    className={[
      'relative flex flex-col rounded-2xl bg-white overflow-visible',
      'border transition-all duration-150',
      selected
      ? 'border-emerald-400 shadow-[0_0_0_2px_rgba(52,211,153,0.25)]'
      : 'border-slate-200 shadow-sm',
      selectionMode ? 'cursor-pointer' : '',
      dropdownOpen ? 'z-10' : '',
    ].join(' ')}
    >
      {/* ── ACCENT LINE ─────────────────────────────────────────────── */}
      <div className="rounded-t-2xl overflow-hidden flex-shrink-0">
      </div>

      {/* ── TOP ROW: refCode + type badge ───────────────────────────── */}
      <div className="flex items-center justify-between gap-1 px-2.5 pt-2">
        <span className="text-[9px] font-mono text-slate-300 truncate flex-1 min-w-0">
          {property.refCode}
        </span>
        <div className={`h-[3px] w-full ${accentClass(property)}`} />
        <div className="flex items-center gap-1 flex-shrink-0">

          {/* ADD THIS
          {!selectionMode && (
            <SaveToCollectionButton listingId={property.id} />
          )} */}

          {(property.urgencyLevel === 'VERY_URGENT' || property.urgencyLevel === 'URGENT') && (
            <Zap className="h-3 w-3 text-orange-500 flex-shrink-0" />
          )}
          {property.listingType && (
            <span className={[
              'rounded px-1.5 py-px text-[9px] font-bold tracking-wide flex-shrink-0',
              property.listingType === 'RENT'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-violet-50 text-violet-700',
            ].join(' ')}>
              {property.listingType}
            </span>
          )}
        </div>
      </div>

      {/* ── BODY ────────────────────────────────────────────────────── */}
      <div className="flex flex-col px-2.5 pt-1.5 pb-2 flex-1">

        {/* Price — always single line */}
        <p className="text-[15px] font-bold leading-tight text-slate-900 truncate mb-0.5">
          {price}
        </p>

        {/* Property type */}
        <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400 truncate mb-1">
          {titleLine}
        </p>

        {/* Location */}
        <div className="flex items-center gap-1 mb-1.5">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
          <span className="text-[10.5px] text-slate-500 truncate">{locationLine}</span>
        </div>

        {/* Sqft */}
        {property.areaSqft ? (
          <p className="text-[9.5px] text-slate-400">
            {property.areaSqft.toLocaleString('en-IN')} sqft
          </p>
        ) : null}
      </div>

      {/* ── SELECTION CIRCLE ────────────────────────────────────────── */}
      {selectionMode && (
        <div className={[
          'absolute left-2 top-4 z-10 flex h-4 w-4 items-center justify-center',
          'rounded-full border-2 text-[9px] font-bold transition-all',
          selected
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-slate-300 bg-white text-transparent',
        ].join(' ')}>
          ✓
        </div>
      )}

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      {/* <div className="flex items-center justify-end border-t border-slate-100 px-2.5 py-1.5 gap-1 flex-shrink-0"> */}

        {/* Uncomment the below section to enable the availabilty option*/}
      <div className="flex items-center justify-between border-t border-slate-100 px-2.5 py-1.5 gap-1 flex-shrink-0">
        {/* <div className="flex-1 min-w-0">
          <PropertyStatusSelect
            listingId={property.id}
            current={availability}
            onChange={setAvailability}
            onOpenChange={setDropdownOpen}
            variant="compact"
            disabled={selectionMode}
          />
        </div> */}
      {/* ADD THIS */}
          {!selectionMode && (
            <SaveToCollectionButton listingId={property.id} />
          )}

        <div className="flex items-center gap-1 flex-shrink-0">
           {!selectionMode && (
            <div className="flex flex-col items-end gap-0.5">
              {property.lastSeenAt && (
                <span className="text-[9px] text-slate-400 font-mono" title="Last seen in WhatsApp groups">
                  👁 {timeAgo(property.lastSeenAt)}
                </span>
              )}
              {property.marketFirstSeenAt && (
                <span className="text-[8px] text-slate-300 font-mono" title="First listed in market">
                  {timeAgo(property.marketFirstSeenAt)}
                </span>
              )}
            </div>
          )}
          {primaryAgent?.name && !selectionMode && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-[8px] font-bold text-sky-700 flex-shrink-0">
              {agentInitials(primaryAgent.name)}
            </div>
          )}
          {extraAgents > 0 && !selectionMode && (
            <span className="text-[9px] text-slate-400">+{extraAgents}</span>
          )}
          {selectionMode && (
            <button
              onClick={(e) => { e.stopPropagation(); onView?.(); }}
              className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-600"
            >
              <Eye className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}