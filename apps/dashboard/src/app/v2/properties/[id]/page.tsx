import { PageContainer } from "@/components/v2/layout/PageContainer";
import { PropertyHeader } from "@/components/v2/property/PropertyHeader";
import { PropertyActivityTimeline } from "@/components/v2/property/PropertyActivityTimeline";
import { PropertyDetails } from "@/components/v2/property/PropertyDetails";
import { WhatsAppMessageCard } from "@/components/v2/property/WhatsAppMessageCard";
import { PropertyLeadsDropdown } from "@/components/v2/property/PropertyLeadsDropdown";
import { DeletePropertyButton } from "@/components/v2/property/DeletePropertyButton";
import { PropertyStatusSelect } from "@/components/v2/property/PropertyStatusSelect";
import { StartDealButton } from "@/components/v2/deals/StartDealButton";
import { serverGet } from "@/lib/serverApi";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/v2/navigation/BackButton";
import { MediaGallery } from "@/components/v2/property/MediaGallery";
/* ------------------------------------------------------------------ */
/* DATA FETCHERS                                                        */
/* ------------------------------------------------------------------ */

async function getProperty(id: string) {
  return serverGet<any>(`/properties/${id}`);
}

async function getPropertyLeads(id: string) {
  try { return await serverGet<any[]>(`/properties/${id}/leads`); }
  catch { return []; }
}

async function getPropertyActivities(id: string) {
  try { return await serverGet<any[]>(`/properties/${id}/activities`); }
  catch { return []; }
}

async function getPropertyNeighbors(id: string, filtersQuery: string) {
  try { return await serverGet<any>(`/properties/${id}/neighbors?${filtersQuery}`); }
  catch { return { prevId: null, nextId: null }; }
}

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

function buildFiltersQuery(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value)) params.set(key, value.join(","));
  }
  return params.toString();
}

/* ------------------------------------------------------------------ */
/* ERROR STATE                                                         */
/* ------------------------------------------------------------------ */

function ErrorState() {
  return (
    <PageContainer className="bg-[#F7F5F0]">
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">⚠️</div>
        <p className="text-[16px] font-semibold text-slate-800">Failed to load property</p>
        <p className="mt-1 text-[13px] text-slate-400">This property may have been deleted or is unavailable.</p>
        <Link
          href="/v2/properties"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#0B1F14] px-4 py-2 text-sm font-medium text-white hover:bg-[#1A3525] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to properties
        </Link>
      </div>
    </PageContainer>
  );
}

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */

export default async function PropertyDetailsPage({
  params,
  searchParams,
}: {
  params:       Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id }               = await params;
  const resolvedSearchParams = await searchParams;
  const filtersQuery         = buildFiltersQuery(resolvedSearchParams);

  let property: any, leads: any[], activities: any[], neighbors: any;

  try {
    [property, leads, activities, neighbors] = await Promise.all([
      getProperty(id),
      getPropertyLeads(id),
      getPropertyActivities(id),
      getPropertyNeighbors(id, filtersQuery),
    ]);
  } catch (err) {
    console.error('PropertyDetailsPage fetch failed:', err); // ← add this
    return <ErrorState />;
  }

  const title = property.bhk
    ? `${property.bhk} ${property.propertySubType}`
    : property.propertySubType ?? "Property";


  return (
    <PageContainer className="bg-[#F7F5F0] min-h-screen">

      {/* ── STICKY TOP NAV ── */}
      <div className="sticky top-14 lg:top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white px-4 sm:px-6 py-2.5 sm:py-3">
        <BackButton className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors" />

        <p className="absolute left-1/2 -translate-x-1/2 text-[13px] font-semibold text-slate-700 truncate max-w-[180px] sm:max-w-xs">
          {title}
        </p>

        <div className="flex items-center gap-2">
          <PropertyHeader
            title={title}
            propertyId={property.id}
            status={property.status}
            prevId={neighbors?.prevId ?? null}
            nextId={neighbors?.nextId ?? null}
            compact
          />
          <PropertyStatusSelect
            listingId={property.id}
            current={property.availability}
          />
          <DeletePropertyButton
            propertyId={property.id}
            propertyLabel={title}
            compact
          />
          <StartDealButton listingId={property.id} />
        </div>
      </div>

      {/* ── PAGE BODY ── */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-4 sm:py-6 space-y-5">
        <div className="grid grid-cols-12 gap-5">

          {/* ── LEFT — property details ── */}
          <div className="col-span-12 lg:col-span-4">
            <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className={[
                "h-1 w-full",
                property.status === "APPROVED"         ? "bg-emerald-400" :
                property.urgencyLevel === "VERY_URGENT" ? "bg-red-400"     :
                                                          "bg-amber-400",
              ].join(" ")} />
              <div className="px-5 py-5">
                <PropertyDetails property={property} />
              </div>
            </div>
          </div>

          {/* ── RIGHT — leads + source message ── */}
          <div className="col-span-12 lg:col-span-8 space-y-4">

            {property.message?.rawText && (
              <WhatsAppMessageCard message={property.message.rawText} />
            )}

            <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <p className="text-[13px] font-semibold text-slate-800">Leads</p>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                  {Array.isArray(leads) ? leads.length : 0}
                </span>
              </div>
              <div className="px-5 py-4">
                <PropertyLeadsDropdown leads={leads} />
              </div>
            </div>

            <MediaGallery
              listingId={property.id}
              canonicalPropertyId={property.canonicalPropertyId}
            />

          </div>
        </div>

        {/* ── ACTIVITY TIMELINE ── */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3.5">
            <p className="text-[13px] font-semibold text-slate-800">Activity</p>
          </div>
          <div className="px-5 py-4">
            <PropertyActivityTimeline activities={activities} propertyId={property.id} />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}