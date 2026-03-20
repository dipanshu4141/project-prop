"use client";

import { LeadStageBadge } from "@/components/v2/utils/leadStage";
import { ClientPropertyActions } from "@/components/v2/clients/ClientPropertyActions";
import { ClientFollowUp } from "@/components/v2/clients/ClientFollowUp";
import { ClientWhatsappDraft } from "@/components/v2/clients/ClientWhatsappDraft";
import { ChevronDown } from "lucide-react";

function formatPrice(price?: string | number | null) {
  if (!price) return "Price on request";
  const n = Number(price);
  if (isNaN(n)) return String(price);
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function ClientPropertiesTable({
  properties,
  phone,
}: {
  properties: any[];
  phone: string;
}) {
  if (!properties || properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg">🏠</div>
        <p className="text-[13px] font-medium text-slate-700">No properties shared yet</p>
        <p className="text-[11.5px] text-slate-400 mt-0.5">Properties shared with this client will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {properties.map((cp) => {
        // Backend may return "listing" (new schema) or "property" (old) — handle both
        const prop     = cp.listing ?? cp.property ?? {};
        const title    = [prop.bhk, prop.propertySubType ?? "Property"].filter(Boolean).join(" ");
        const location = [prop.area, prop.city].filter(Boolean).join(", ") || "—";

        return (
          <div
            key={cp.id}
            className="rounded-xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
          >
            <div className={[
              "h-[3px] w-full",
              cp.status === "INTERESTED"     ? "bg-emerald-400" :
              cp.status === "NOT_INTERESTED" ? "bg-red-400"     :
              cp.status === "VISITED"        ? "bg-sky-400"     :
              "bg-slate-200",
            ].join(" ")} />

            <div className="px-3 sm:px-4 pt-3 sm:pt-3.5 pb-2.5 sm:pb-3">
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0">
                  <p className="text-[16px] sm:text-[17px] font-bold leading-tight text-slate-900"
                     style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {formatPrice(prop.price)}
                  </p>
                  <p className="mt-0.5 text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-[0.5px] text-slate-400">
                    {title || "Property"}
                  </p>
                </div>
                <ClientPropertyActions clientPropertyId={cp.id} currentStatus={cp.status} />
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-[12px] text-slate-500">
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                {location}
              </div>

              <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <LeadStageBadge stage={cp.status} />
                <span className="text-[10.5px] text-slate-400">
                  Shared {cp.sharedAt ? formatDate(cp.sharedAt) : "—"}
                </span>
                <ClientFollowUp clientPropertyId={cp.id} followUpAt={cp.followUpAt} />
              </div>

              <details className="mt-2.5 sm:mt-3 group">
                <summary className="flex cursor-pointer list-none items-center gap-1 text-[11.5px] font-medium text-slate-400 hover:text-slate-600 transition-colors w-fit select-none">
                  <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                  WhatsApp draft
                </summary>
                <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <ClientWhatsappDraft clientPropertyId={cp.id} phone={phone} />
                </div>
              </details>
            </div>
          </div>
        );
      })}
    </div>
  );
}