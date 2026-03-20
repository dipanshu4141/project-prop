"use client";

import { useRouter } from "next/navigation";
import { LeadStageBadge } from "@/components/v2/utils/leadStage";
import { ClientPropertyActions } from "@/components/v2/clients/ClientPropertyActions";
import { WhatsAppAction } from "@/components/v2/clients/WhatsAppAction";

function formatPrice(price?: string | number | null) {
  if (!price) return "Price on request";
  const n = Number(price);
  if (isNaN(n)) return String(price);
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function ClientPropertiesGrid({
  properties,
  phone,
  clientName,
}: {
  properties: any[];
  phone: string;
  clientName?: string | null;
}) {
  const router = useRouter();

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
    <div className="divide-y divide-slate-50">
      {properties.map((cp) => {
        // Backend may return "listing" (new schema) or "property" (old) — handle both
        const prop     = cp.listing ?? cp.property ?? {};
        const title    = [prop.bhk, prop.propertySubType ?? "Property"].filter(Boolean).join(" ");
        const location = [prop.area, prop.city].filter(Boolean).join(", ") || "—";

        return (
          <div key={cp.id} className="py-3.5 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              {/* Left */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px]">
                  🏠
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 truncate">{title || "Property"}</p>
                  <p className="text-[11px] text-slate-400 truncate">{location}</p>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <p className="hidden sm:block text-[13px] font-semibold text-slate-900 whitespace-nowrap">
                  {formatPrice(prop.price)}
                </p>
                <LeadStageBadge stage={cp.status} />
                <WhatsAppAction
                  clientPropertyId={cp.id}
                  clientName={clientName}
                  clientPhone={phone}
                  propertyLabel={title || "Property"}
                  onSent={() => router.refresh()}
                />
                <ClientPropertyActions clientPropertyId={cp.id} currentStatus={cp.status} />
              </div>
            </div>

            {/* Price on mobile */}
            <p className="sm:hidden mt-1.5 pl-11 text-[12.5px] font-semibold text-slate-700">
              {formatPrice(prop.price)}
            </p>
          </div>
        );
      })}
    </div>
  );
}