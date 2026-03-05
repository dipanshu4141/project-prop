import { LeadStageBadge } from "@/components/v2/utils/leadStage";
import { ClientPropertyActions } from "@/components/v2/clients/ClientPropertyActions";
import { ClientFollowUp } from "@/components/v2/clients/ClientFollowUp";
import { ClientWhatsappDraft } from "@/components/v2/clients/ClientWhatsappDraft";

type ClientProperty = {
  id: string;
  status: string;
  sharedAt: string;
  followUpAt?: string | null;
  property: {
    bhk?: string | null;
    propertySubType?: string | null;
    area?: string | null;
    city?: string | null;
    price?: string | number | null;
  };
};

export default function ClientPropertiesTable({
    properties,
    phone,
  }: {
    properties: any[];
    phone: string;
  }) {
    return (
      <div className="space-y-3">
        {properties.map((cp) => (
          <div
            key={cp.id}
            className="rounded-xl border bg-card p-4 hover:shadow-sm transition"
          >
            {/* TOP ROW */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">
                  {cp.property.bhk ?? ""}{" "}
                  {cp.property.propertySubType ?? "Property"}
                </div>
  
                <div className="text-xs text-muted-foreground">
                  {cp.property.area ?? "—"}
                  {cp.property.city ? `, ${cp.property.city}` : ""}
                </div>
              </div>
  
              <ClientPropertyActions
                clientPropertyId={cp.id}
                currentStatus={cp.status}
              />
            </div>
  
            {/* PRICE */}
            <div className="mt-2 text-sm font-medium">
              {cp.property.price
                ? `₹${Number(cp.property.price).toLocaleString()}`
                : "Price on request"}
            </div>
  
            {/* META */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <LeadStageBadge stage={cp.status} />
  
              <ClientFollowUp
                clientPropertyId={cp.id}
                followUpAt={cp.followUpAt}
              />
            </div>
  
            {/* WHATSAPP */}
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                WhatsApp draft
              </summary>
  
              <div className="mt-2">
                <ClientWhatsappDraft
                  clientPropertyId={cp.id}
                  phone={phone}
                />
              </div>
            </details>
          </div>
        ))}
      </div>
    );
  }
  