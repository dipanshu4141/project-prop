import { MapPin, Eye } from "lucide-react";

/* ------------------------------------------------------------------ */
/* TYPES */
/* ------------------------------------------------------------------ */

type Agent = {
  id?: string;
  name?: string;
  phones?: string[] | string | null;
};

export interface Property {
  id: string;

  listingType: "RENT" | "SALE";
  propertyCategory: string;
  propertySubType: string;

  price: string;
  bhk: string | null;

  area: string | null;
  city: string | null;
  location: string | null;
  areaSqft: number | null;

  furnishing: string;
  availability: string;
  status: string;

  parkingAvailable?: any;
  tenantTypes?: any;

  /** ✅ NEW MODEL */
  agents?: Agent[];
}

/* ------------------------------------------------------------------ */
/* PROPS */
/* ------------------------------------------------------------------ */

interface PropertyCardProps {
  property: Property;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onView?: () => void;
}

/* ------------------------------------------------------------------ */
/* HELPERS */
/* ------------------------------------------------------------------ */

function formatPrice(
  price: string,
  listingType: "RENT" | "SALE"
) {
  const n = parseInt(price);
  if (isNaN(n)) return price;

  if (listingType === "RENT") {
    return `₹ ${n.toLocaleString("en-IN")} / month`;
  }

  if (n >= 10000000) return `₹ ${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹ ${(n / 100000).toFixed(2)} L`;

  return `₹ ${n.toLocaleString("en-IN")}`;
}

/* ------------------------------------------------------------------ */
/* COMPONENT */
/* ------------------------------------------------------------------ */

export function PropertyCard({
  property,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  onView,
}: PropertyCardProps) {
  const title = property.bhk
    ? `${property.bhk} ${property.propertySubType}`
    : property.propertySubType;

  const location =
    property.area && property.city
      ? `${property.area}, ${property.city}`
      : property.location || "Location not specified";

  const agents = property.agents ?? [];

  return (
    <div
      className={`
        relative rounded-xl border bg-white p-8
        transition-all
        hover:border-indigo-500
        hover:shadow-xl hover:shadow-indigo-300/20
        ${selectionMode ? "cursor-pointer" : ""}
        ${selected ? "ring-2 ring-indigo-500" : ""}
      `}
      onClick={() => selectionMode && onToggleSelect?.()}
    >
      {/* SELECTION CHECKBOX */}
      {selectionMode && (
        <input
          type="checkbox"
          checked={selected}
          readOnly
          className="absolute left-3 top-3 h-4 w-4 accent-indigo-600"
        />
      )}

      {/* PRICE + STATUS */}
      <div className="mb-2 flex items-center justify-between">
        <div className="text-lg font-semibold text-slate-900">
          {formatPrice(property.price, property.listingType)}
        </div>

        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            property.status === "APPROVED"
              ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
              : "bg-gradient-to-r from-amber-400 to-orange-400 text-white"
          }`}
        >
          {property.status}
        </span>
      </div>

      {/* TITLE */}
      <div className="text-sm font-medium text-slate-800 capitalize">
        {title}
      </div>

      {/* LOCATION */}
      <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
        <MapPin className="h-3 w-3" />
        {location}
      </div>

      {/* META */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <div>
          {property.areaSqft ? `${property.areaSqft} sqft` : "—"}
        </div>

        {selectionMode ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView?.();
            }}
            className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
          >
            <Eye className="h-3 w-3" />
            View
          </button>
        ) : (
          <div className="text-sm">
            <span className="text-muted-foreground">Agent:</span>{" "}
            {agents.length > 0
              ? `${agents[0]?.name ?? "—"}${
                  agents.length > 1
                    ? ` +${agents.length - 1}`
                    : ""
                }`
              : "—"}
          </div>
        )}
      </div>
    </div>
  );
}
