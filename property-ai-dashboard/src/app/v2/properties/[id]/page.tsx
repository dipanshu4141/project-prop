import { PageHeader } from "@/components/v2/layout/PageHeader";
import { PageContainer } from "@/components/v2/layout/PageContainer";
import { PropertyHeader } from "@/components/v2/property/PropertyHeader";
import { PropertyActivityTimeline } from "@/components/v2/property/PropertyActivityTimeline";
import { PropertyDetails } from "@/components/v2/property/PropertyDetails";
import { WhatsAppMessageCard } from "@/components/v2/property/WhatsAppMessageCard";
import { PropertyLeadsDropdown } from "@/components/v2/property/PropertyLeadsDropdown";
import { getServerApiBase } from "@/lib/serverApi";

const SERVER_API_BASE = getServerApiBase();

/* ------------------------------------------------------------------ */
/* DATA FETCHERS */
/* ------------------------------------------------------------------ */

async function getProperty(id: string) {
  const res = await fetch(`${SERVER_API_BASE}/properties/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to load property");
  return res.json();
}

async function getPropertyLeads(id: string) {
  const res = await fetch(`${SERVER_API_BASE}/properties/${id}/leads`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to load leads");
  return res.json();
}

async function getPropertyActivities(id: string) {
  const res = await fetch(`${SERVER_API_BASE}/properties/${id}/activities`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to load activities");
  return res.json();
}

/**
 * Neighbors depend ONLY on current filters.
 * No list, no history, no encoding tricks.
 */
async function getPropertyNeighbors(id: string, filtersQuery: string) {
  const res = await fetch(
    `${SERVER_API_BASE}/properties/${id}/neighbors?${filtersQuery}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return { prevId: null, nextId: null };
  }

  return res.json();
}

/* ------------------------------------------------------------------ */
/* HELPERS */
/* ------------------------------------------------------------------ */

/**
 * Build filter query for backend.
 * Explicitly ignore navigation-only params.
 */
function buildFiltersQuery(
  searchParams: Record<string, string | string[] | undefined>
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      params.set(key, value);
    } else if (Array.isArray(value)) {
      params.set(key, value.join(","));
    }
  }

  return params.toString();
}

/* ------------------------------------------------------------------ */
/* PAGE */
/* ------------------------------------------------------------------ */

export default async function PropertyDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // ✅ MUST await
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  const filtersQuery = buildFiltersQuery(resolvedSearchParams);

  let property, leads, activities, neighbors;

  try {
    [property, leads, activities, neighbors] = await Promise.all([
      getProperty(id),
      getPropertyLeads(id),
      getPropertyActivities(id),
      getPropertyNeighbors(id, filtersQuery),
    ]);
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Property" />
        <div className="text-red-500">Failed to load property details.</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* ================= HEADER ================= */}
      <PropertyHeader
        title={
          property.bhk
            ? `${property.bhk} ${property.propertySubType}`
            : property.propertySubType
        }
        propertyId={property.id}
        status={property.status}
        prevId={neighbors?.prevId ?? null}
        nextId={neighbors?.nextId ?? null}
      />

      {/* ================= MAIN GRID ================= */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        {/* LEFT */}
        <div id="property-left-column">
          <PropertyDetails property={property} />
        </div>

        {/* RIGHT */}
        <div className="col-span-2 space-y-4">
          <PropertyLeadsDropdown leads={leads} />

          {property.message?.rawText && (
            <div className="sticky top-24 z-10">
              <WhatsAppMessageCard message={property.message.rawText} />
            </div>
          )}
        </div>
      </div>

      {/* ================= ACTIVITY ================= */}
      <div className="mt-4">
        <PropertyActivityTimeline
          activities={activities}
          propertyId={property.id}
        />
      </div>
    </PageContainer>
  );
}
