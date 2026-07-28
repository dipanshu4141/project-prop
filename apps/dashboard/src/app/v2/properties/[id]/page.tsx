import { serverGet } from "@/lib/serverApi";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Trash2 } from "lucide-react";

import { PropertyDetails } from "@/components/v2/property/PropertyDetails";
import { MediaGallery }    from "@/components/v2/property/MediaGallery";
import { PropertySectionTabs } from "@/components/v2/property/PropertySectionTabs";
import { DeletePropertyButton } from "@/components/v2/property/DeletePropertyButton";
import { MessageModal } from "@/components/v2/property/MessageModal";

/* ── Types ── */
type Property = {
  id:                  string;
  refCode:             string | null;
  listingType:         string;
  propertyCategory:    string | null;
  propertySubType:     string | null;
  bhk:                 string | null;
  areaSqft:            number | null;
  furnishing:          string | null;
  floor:               number | null;
  totalFloors:         number | null;
  status:              string;
  price:               number | null;
  deposit:             number | null;
  negotiable:          boolean | null;
  urgencyLevel:        string | null;
  availableFrom:       string | null;
  country:             string | null;
  city:                string | null;
  area:                string | null;
  location:            string | null;
  building:            string | null;
  tenantTypes:         string[];
  tenantRestrictions:  string[];
  notes:               string | null;
  firmName:            string | null;
  confidence:          number;
  canonicalPropertyId: string | null;
  workspaceId:         string;
  agents:              any[];
  message:             { rawText: string; groupName: string | null; receivedAt: string } | null;
  media:               any[];
  createdAt:           string;
  updatedAt:           string;
};

/* ── Data ── */
async function getProperty(id: string): Promise<Property | null> {
  try { return await serverGet<Property>(`/properties/${id}`); }
  catch { return null; }
}

/* ── Helpers ── */
function formatPrice(rupees: number | null, listingType?: string): string {
  if (!rupees) return '—';
  if (rupees >= 10_000_000) return `₹${(rupees / 10_000_000).toFixed(2)}Cr`;
  if (rupees >= 100_000)    return `₹${(rupees / 100_000).toFixed(2)}L`;
  if (listingType === 'RENT') return `₹${rupees.toLocaleString('en-IN')}/mo`;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

function buildTitle(p: Property): string {
  return [p.bhk, p.propertySubType].filter(Boolean).join(' ') || 'Property';
}

/* ── Page ── */
export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  const title    = buildTitle(property);
  const subtitle = [property.area, property.city].filter(Boolean).join(', ');
  const price = formatPrice(property.price, property.listingType);

  return (
    <div className="min-h-screen bg-[#F7F5F0] pt-0 lg:pt-0">

      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-14 lg:top-0 left-0 right-0 z-20 flex items-center gap-2 border-b border-slate-100 bg-white px-4 sm:px-6 py-2.5 lg:static lg:border-0 lg:bg-transparent lg:px-6 lg:pt-6 lg:pb-4">
        <Link href="/v2/properties"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors flex-shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </Link>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-slate-800 truncate lg:text-[16px] lg:font-bold lg:text-[#0B1F14]">
            {title}
          </p>
          {subtitle && (
            <p className="text-[11px] text-slate-400 truncate hidden lg:block">{subtitle}</p>
          )}
        </div>

        <DeletePropertyButton 
          propertyId={property.id} 
          propertyLabel={buildTitle(property)}
        />
      </div>

      {/* ── CONTENT ── */}
      <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-16 lg:pt-0 pb-24 lg:pb-8 space-y-3">

        {/* ── SUMMARY CARD ── */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-4 py-4">

          {/* Listing type bar */}
          <div className={`h-1 w-full rounded-full mb-4 ${property.listingType === 'SALE' ? 'bg-violet-500' : 'bg-emerald-500'}`} />

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${property.listingType === 'SALE' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {property.listingType}
                </span>
                {property.status === 'NEW' && (
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">New</span>
                )}
                {property.refCode && (
                  <span className="text-[10px] text-slate-400 font-mono">{property.refCode}</span>
                )}
              </div>
              <p className="text-[20px] font-bold text-slate-900 leading-tight">{price}</p>
              <p className="text-[13.5px] font-semibold text-slate-700 mt-0.5">{title}</p>
              {subtitle && <p className="text-[12px] text-slate-400 mt-0.5">{subtitle}</p>}
              {property.building && <p className="text-[12px] text-slate-400">{property.building}</p>}
            </div>

            {property.areaSqft && (
              <div className="flex-shrink-0 text-right">
                <p className="text-[16px] font-bold text-slate-700">{property.areaSqft.toLocaleString()}</p>
                <p className="text-[11px] text-slate-400">sqft</p>
              </div>
            )}
          </div>

          {/* Key details row */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
            {property.furnishing && (
              <span className="text-[11.5px] text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1">
                {property.furnishing.replace(/_/g, ' ')}
              </span>
            )}
            {property.floor != null && (
              <span className="text-[11.5px] text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1">
                Floor {property.floor}{property.totalFloors ? `/${property.totalFloors}` : ''}
              </span>
            )}
            {property.deposit && (
              <span className="text-[11.5px] text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1">
                Deposit {formatPrice(property.deposit)}
              </span>
            )}
            {property.negotiable && (
              <span className="text-[11.5px] text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1">
                Negotiable
              </span>
            )}
          </div>

          {/* Source message */}
          {property.message && (
            <MessageModal
              message={property.message.rawText}
              groupName={property.message.groupName}
            />
          )}
        </div>

        {/* ── TABBED SECTIONS ── */}
        <PropertySectionTabs
          detailsContent={
            <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-4 py-4">
              <PropertyDetails property={property} />
            </div>
          }
          mediaContent={
            <MediaGallery
              listingId={property.id}
              canonicalPropertyId={property.canonicalPropertyId ?? undefined}
            />
          }
          mediaCount={property.media?.length ?? 0}
        />

      </div>
    </div>
  );
}