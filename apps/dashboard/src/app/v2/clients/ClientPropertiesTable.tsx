"use client";

import { useRouter } from "next/navigation";
import { LeadStageBadge } from "@/components/v2/utils/leadStage";
import { ClientPropertyActions } from "@/components/v2/clients/ClientPropertyActions";
import { ClientFollowUp } from "@/components/v2/clients/ClientFollowUp";
import { ClientWhatsappDraft } from "@/components/v2/clients/ClientWhatsappDraft";
import { ChevronDown } from "lucide-react";

function formatPrice(price?: string | number | null) {
  if (!price) return "—";
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
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            {["Property", "Area", "Price", "Pipeline", "Client", ""].map((col) => (
              <th key={col} className="px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {properties.map((cp) => {
            const prop     = cp.listing ?? cp.property ?? {};
            const title    = [prop.bhk, prop.propertySubType].filter(Boolean).join(" ") || "Property";
            const location = [prop.area, prop.city].filter(Boolean).join(", ") || "—";

            return (
              <tr
                key={cp.id}
                onClick={() => router.push(`/v2/properties/${prop.id}`)}
                className="border-b border-slate-50 cursor-pointer hover:bg-slate-50/70 transition-colors"
              >
                {/* Property */}
                <td className="px-3 py-3.5">
                  <p className="text-[13px] font-semibold text-slate-800">{title}</p>
                  <p className="text-[11px] text-slate-400">{location}</p>
                </td>

                {/* Area */}
                <td className="px-3 py-3.5 text-[12.5px] text-slate-500 whitespace-nowrap">
                  {prop.areaSqft ? `${prop.areaSqft.toLocaleString("en-IN")} sq ft` : "—"}
                </td>

                {/* Price */}
                <td className="px-3 py-3.5">
                  <span className="text-[13px] font-semibold text-slate-900 whitespace-nowrap">
                    {formatPrice(prop.price)}
                  </span>
                </td>

                {/* Pipeline */}
                <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <LeadStageBadge stage={cp.status} />
                </td>

                {/* Client status */}
                <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <ClientPropertyActions clientPropertyId={cp.id} currentStatus={cp.clientStatus ?? cp.status} />
                </td>

                {/* Actions */}
                <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <ClientFollowUp clientPropertyId={cp.id} followUpAt={cp.followUpAt} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}