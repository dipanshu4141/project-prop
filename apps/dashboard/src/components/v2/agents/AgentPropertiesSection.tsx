"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, ArrowUpRight } from "lucide-react";
import PropertyFilters, { PropertyFiltersValue } from "@/app/v2/properties/PropertyFilters";
import { apiGet } from "@/lib/api";

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

type AgentProperty = {
  id: string;
  city?: string | null;
  area?: string | null;
  price?: number | string | null;
  bhk?: string | null;
  propertySubType?: string | null;
};

type Props = {
  agentId: string;
  initialProperties: AgentProperty[];
};

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

function formatPrice(price?: number | string | null) {
  if (!price) return "Price on request";
  const n = Number(price);
  if (isNaN(n)) return String(price);
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

/* ------------------------------------------------------------------ */
/* SKELETON CARD                                                       */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-2 animate-pulse">
      <div className="h-3 w-24 rounded bg-slate-100" />
      <div className="h-2.5 w-36 rounded bg-slate-100" />
      <div className="h-3 w-20 rounded bg-slate-100 mt-3" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PROPERTY CARD                                                       */
/* ------------------------------------------------------------------ */

function PropertyCard({ property }: { property: AgentProperty }) {
  const title = property.bhk
    ? `${property.bhk} ${property.propertySubType ?? ""}`.trim()
    : property.propertySubType ?? "Property";
  const location = [property.area, property.city].filter(Boolean).join(", ") || "—";

  return (
    <Link
      href={`/v2/properties/${property.id}`}
      className="group relative flex flex-col rounded-xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-150 hover:border-slate-200 hover:shadow-md hover:-translate-y-[1px]"
    >
      {/* Top accent bar */}
      <div className="h-[3px] w-full bg-slate-200 group-hover:bg-emerald-400 transition-colors duration-150" />

      <div className="p-4">
        {/* Price */}
        <p className="text-[17px] font-bold leading-tight text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {formatPrice(property.price)}
        </p>

        {/* Type */}
        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.5px] text-slate-400">
          {title}
        </p>

        {/* Location */}
        <div className="mt-3 flex items-center gap-1.5 text-[12px] text-slate-500">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
          {location}
        </div>
      </div>

      {/* Arrow icon — shows on hover */}
      <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <ArrowUpRight className="h-3.5 w-3.5 text-slate-600" />
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */

export function AgentPropertiesSection({ agentId, initialProperties }: Props) {
  const [filters,    setFilters]    = useState<PropertyFiltersValue>({});
  const [open,       setOpen]       = useState(false);
  const [properties, setProperties] = useState<AgentProperty[]>(initialProperties);
  const [loading,    setLoading]    = useState(false);

  /* ── fetch on filter change ── */
  useEffect(() => {
    const hasActiveFilters = Object.values(filters).some(
      (v) => Array.isArray(v) ? v.length > 0 : !!v
    );
    if (!hasActiveFilters) return;

    const controller = new AbortController();

    async function fetchFiltered() {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) params.set(key, value.join(","));
        else if (typeof value === "string" && value !== "") params.set(key, value);
      });
      try {
        const data = await apiGet<AgentProperty[]>(
          `/agents/${agentId}/properties?${params.toString()}`
        );
        if (!controller.signal.aborted) setProperties(data);
      } catch (err) {
        if ((err as any).name !== "AbortError") console.error("Agent property filter failed", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFiltered();
    return () => controller.abort();
  }, [filters, agentId]);

  /* ---------------------------------------------------------------- */
  /* UI                                                               */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-4">

      {/* ── FILTERS ── */}
      <PropertyFilters
        value={filters}
        onChange={setFilters}
        isOpen={open}
        onToggle={() => setOpen((v) => !v)}
      />

      {/* ── COUNT ── */}
      <div className="flex items-center justify-between">
        <p className="text-[12.5px] text-slate-400">
          {loading ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-300" />
              Applying filters…
            </span>
          ) : (
            <>
              <span className="font-semibold text-slate-700">{properties.length}</span>
              {" "}propert{properties.length === 1 ? "y" : "ies"}
            </>
          )}
        </p>
      </div>

      {/* ── GRID ── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white py-12 text-center">
          <div className="mb-2 text-2xl">🏠</div>
          <p className="text-[13px] font-semibold text-slate-800">No properties found</p>
          <p className="text-[11.5px] text-slate-400 mt-0.5">Try adjusting or clearing the filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}