"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PropertyFilters, {
  PropertyFiltersValue,
} from "@/app/v2/properties/PropertyFilters";

/* ===================== TYPES ===================== */

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

/* ===================== COMPONENT ===================== */

export function AgentPropertiesSection({
  agentId,
  initialProperties,
}: Props) {
  const [filters, setFilters] = useState<PropertyFiltersValue>({});
  const [open, setOpen] = useState(false);

  const [properties, setProperties] =
    useState<AgentProperty[]>(initialProperties);

  const [loading, setLoading] = useState(false);

  /* ------------------ FETCH FILTERED DATA ------------------ */

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
        if (Array.isArray(value) && value.length > 0) {
          params.set(key, value.join(","));
        } else if (typeof value === "string" && value !== "") {
          params.set(key, value);
        }
      });

      try {
        const res = await fetch(
          `/api/agents/${agentId}/properties?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!res.ok) throw new Error("Failed to fetch properties");

        const data = await res.json();
        setProperties(data);
      } catch (err) {
        if ((err as any).name !== "AbortError") {
          console.error("Agent property filter failed", err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchFiltered();

    return () => controller.abort();
  }, [filters, agentId]);

  /* ------------------ UI ------------------ */

  return (
    <div className="space-y-4">
      {/* FILTERS */}
      <PropertyFilters
        value={filters}
        onChange={setFilters}
        isOpen={open}
        onToggle={() => setOpen((v) => !v)}
      />

      {/* COUNT */}
      <div className="text-sm text-muted-foreground">
        {loading
          ? "Loading properties…"
          : `Showing ${properties.length} properties`}
      </div>

      {/* GRID */}
      {loading ? (
        <div className="text-sm text-muted-foreground">
          Applying filters…
        </div>
      ) : properties.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No properties match the selected filters
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/v2/properties/${property.id}`}
              className="block rounded-lg border p-4 hover:bg-muted transition"
            >
              <div className="text-sm font-medium">
                {property.bhk
                  ? `${property.bhk} ${property.propertySubType ?? ""}`
                  : property.propertySubType ?? "Property"}
              </div>

              <div className="mt-1 text-sm text-muted-foreground">
                {property.city ?? "—"} · {property.area ?? "—"}
              </div>

              <div className="mt-2 text-sm font-semibold">
                {property.price
                  ? `₹${property.price}`
                  : "Price on request"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
