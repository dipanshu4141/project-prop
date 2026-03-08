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

export default function ClientPropertiesGrid({ properties, phone }: {
  properties: ClientProperty[];
  phone: string;
}) {
  if (properties.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No properties shared yet
      </div>
    );
  }

  return (
    <div className="divide-y border rounded-lg">
      {properties.map((cp) => (
        <div key={cp.id} className="p-4 flex items-start justify-between gap-6">
          {/* Left */}
          <div>
            <div className="text-sm font-medium">
              {cp.property.bhk ?? ""} {cp.property.propertySubType ?? "Apartment"}
            </div>
            <div className="text-xs text-muted-foreground">
              {cp.property.area ?? "—"}
              {cp.property.city ? `, ${cp.property.city}` : ""}
            </div>
            <div className="mt-1 text-sm">
              {cp.property.price
                ? `₹${Number(cp.property.price).toLocaleString()}`
                : "Price on request"}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            <LeadStageBadge stage={cp.status} />
            <ClientPropertyActions
              clientPropertyId={cp.id}
              currentStatus={cp.status}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
