"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import PropertyFilters, {
  PropertyFiltersValue,
  DatePreset,
} from "./PropertyFilters";
import { PropertyCard, Property } from "@/components/v2/cards/PropertyCard";
import { ShareMultiplePropertiesModal } from "@/components/v2/property/ShareMultiplePropertiesModal";

/* ----------------------------- CONSTANTS ----------------------------- */

const LIMIT = 8;
const SCROLL_KEY = "properties-scroll-y";





const FURNISHING_VALUES = [
  "UNFURNISHED",
  "SEMI_FURNISHED",
  "FULLY_FURNISHED",
] as const;

const DATE_PRESETS: DatePreset[] = [
  "TODAY",
  "LAST_7_DAYS",
  "LAST_14_DAYS",
  "LAST_30_DAYS",
];

const SORT_OPTIONS = [
  { label: "Newest", value: "createdAt_desc" },
  { label: "Oldest", value: "createdAt_asc" },
  { label: "Urgent", value: "urgent" },
  { label: "Most shared", value: "most_shared" },
  { label: "Price: Low → High", value: "price_asc" },
  { label: "Price: High → Low", value: "price_desc" },
];


/* ----------------------------- HELPERS ----------------------------- */

function parseArray(v: string | null) {
  if (!v) return [];
  return v.split(",").filter(Boolean);
}

function serializeArray(v?: string[]) {
  if (!v || v.length === 0) return undefined;
  return v.join(",");
}

function parseEnumArray<T extends readonly string[]>(
  raw: string | null,
  allowed: T
): T[number][] {
  if (!raw) return [];
  const set = new Set(allowed);
  return raw.split(",").filter((v): v is T[number] => set.has(v));
}

function updateParam(
  params: URLSearchParams,
  key: string,
  value: string | number
) {
  const p = new URLSearchParams(params.toString());
  p.set(key, String(value));
  return p.toString();
}


/* ----------------------------- COMPONENT ----------------------------- */

export default function PropertiesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
const [filtersOpen, setFiltersOpen] = useState(true);


  /* ---------- DATA STATE ---------- */

  const [items, setItems] = useState<Property[]>([]);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const lastQueryRef = useRef(searchParams.toString());

  useEffect(() => {
    const currentQuery = searchParams.toString();

    if (lastQueryRef.current !== currentQuery) {
      sessionStorage.removeItem(SCROLL_KEY);
      lastQueryRef.current = currentQuery;
    }

    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);


  /* ---------- SELECTION STATE ---------- */

  const [selectedMap, setSelectedMap] = useState<
    Record<string, Property | null>
  >({});
  const [selectionMode, setSelectionMode] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const page = Number(searchParams.get("page") || 1);
  const sort = searchParams.get("sort") || "createdAt_desc";

  /* ---------- SELECTED IDS FROM URL ---------- */

  const selectedIdsFromUrl = useMemo(() => {
    const raw = searchParams.get("selected");
    return raw ? raw.split(",") : [];
  }, [searchParams]);

  const selectedCount = Object.keys(selectedMap).length;

  /* ----------------------------- TOGGLE SELECT ----------------------------- */

  function toggleSelect(property: Property) {
    setSelectedMap((prev) => {
      const copy = { ...prev };

      if (copy[property.id]) {
        delete copy[property.id];
      } else {
        copy[property.id] = property;
      }

      return copy;
    });
  }

  /* ----------------------------- AUTO ENABLE SELECT MODE ----------------------------- */

  useEffect(() => {
    if (selectedCount > 0) {
      setSelectionMode(true);
    }
  }, [selectedCount]);

  /* ----------------------------- HYDRATE FROM URL ----------------------------- */

  useEffect(() => {
    if (selectedIdsFromUrl.length === 0) return;

    setSelectedMap((prev) => {
      const copy = { ...prev };

      selectedIdsFromUrl.forEach((id) => {
        if (!(id in copy)) {
          copy[id] = null;
        }
      });

      return copy;
    });
  }, [selectedIdsFromUrl]);

  /* ----------------------------- ATTACH PROPERTY DATA ----------------------------- */

  useEffect(() => {
    if (items.length === 0) return;

    setSelectedMap((prev) => {
      let changed = false;
      const copy = { ...prev };

      items.forEach((p) => {
        if (copy[p.id] === null) {
          copy[p.id] = p;
          changed = true;
        }
      });

      return changed ? copy : prev;
    });
  }, [items]);

  /* ----------------------------- SYNC URL (SELECTION) ----------------------------- */

  useEffect(() => {
    const ids = Object.keys(selectedMap);
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get("selected") || "";

    if (ids.join(",") === current) return;

    if (ids.length > 0) {
      params.set("selected", ids.join(","));
      params.set("select", "1");
    } else {
      params.delete("selected");
      params.delete("select");
    }

    router.replace(`?${params.toString()}`, { scroll: false });
  }, [selectedMap, router, searchParams]);

  /* ----------------------------- FILTERS (URL → UI) ----------------------------- */

  const filters: PropertyFiltersValue = useMemo(() => {
    const rawPreset = searchParams.get("datePreset");

    return {
      listingType:
        searchParams.get("listingType") === "RENT" ||
        searchParams.get("listingType") === "SALE"
          ? (searchParams.get("listingType") as "RENT" | "SALE")
          : undefined,

      propertyCategory:
        searchParams.get("propertyCategory") === "RESIDENTIAL" ||
        searchParams.get("propertyCategory") === "COMMERCIAL"
          ? (searchParams.get("propertyCategory") as
              | "RESIDENTIAL"
              | "COMMERCIAL")
          : undefined,

      q: searchParams.get("q") || undefined,
      minPrice: searchParams.get("minPrice") || undefined,
      maxPrice: searchParams.get("maxPrice") || undefined,

      bhk: parseArray(searchParams.get("bhk")),
      furnishing: parseEnumArray(
        searchParams.get("furnishing"),
        FURNISHING_VALUES
      ),

      tenantTypes: parseArray(searchParams.get("tenantTypes")),
      tenantRestrictions: parseArray(
        searchParams.get("tenantRestrictions")
      ),

      /* ---------- DATE ---------- */
      datePreset: DATE_PRESETS.includes(rawPreset as DatePreset)
        ? (rawPreset as DatePreset)
        : undefined,
      fromDate: searchParams.get("fromDate") || undefined,
      toDate: searchParams.get("toDate") || undefined,
    };
  }, [searchParams]);

  /* ----------------------------- APPLY FILTERS ----------------------------- */

  function applyFilters(next: PropertyFiltersValue) {
    const params = new URLSearchParams();
  
    params.set("page", "1");
    params.set("sort", sort);
  
    if (next.listingType) params.set("listingType", next.listingType);
    if (next.propertyCategory)
      params.set("propertyCategory", next.propertyCategory);
  
    if (next.q) params.set("q", next.q);
    if (next.minPrice) params.set("minPrice", next.minPrice);
    if (next.maxPrice) params.set("maxPrice", next.maxPrice);
  
    const bhk = serializeArray(next.bhk);
    if (bhk) params.set("bhk", bhk);
  
    const furnishing = serializeArray(next.furnishing);
    if (furnishing) params.set("furnishing", furnishing);
  
    const tenantTypes = serializeArray(next.tenantTypes);
    if (tenantTypes) params.set("tenantTypes", tenantTypes);
  
    const tenantRestrictions = serializeArray(next.tenantRestrictions);
    if (tenantRestrictions)
      params.set("tenantRestrictions", tenantRestrictions);
  
    if (next.datePreset) {
      params.set("datePreset", next.datePreset);
    } else {
      if (next.fromDate) params.set("fromDate", next.fromDate);
      if (next.toDate) params.set("toDate", next.toDate);
    }
  
    router.push(`?${params.toString()}`);
  
    // ✅ COLLAPSE AFTER APPLY
    setFiltersOpen(false);
  }
  

  /* ----------------------------- FETCH ----------------------------- */

  // useEffect(() => {
  //   const currentQuery = searchParams.toString();
  
  //   // 🔁 Clear scroll ONLY if list context changed
  //   if (lastQueryRef.current !== currentQuery) {
  //     sessionStorage.removeItem(SCROLL_KEY);
  //     lastQueryRef.current = currentQuery;
  //   }
  
  //   fetchProperties();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [searchParams.toString()]);
  
  
  
  

  async function fetchProperties() {
    setLoading(true);

    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", LIMIT.toString());
    

    if (sort === "urgent") {
      params.set("sort", "urgent");
    } else if (sort === "most_shared") {
      params.set("sort", "most_shared");
    } else {
      const [sortBy, sortOrder] = sort.split("_");
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
    }
    

    const res = await fetch(
      `/api/properties?${params.toString()}`
    );
    const data = await res.json();

    setItems(data.items || []);
    setPages(data.pages || 1);
    setLoading(false);
  }

  /* ----------------------------- UI ----------------------------- */

  return (
    <>
      <PropertyFilters
        value={filters}
        onChange={applyFilters}
        isOpen={filtersOpen}
        onToggle={() => setFiltersOpen((v) => !v)}
      />

      {/* SELECT / CANCEL */}
      <div className="mt-4 flex items-center gap-3">
          {/* SELECT */}
          <button
            onClick={() => {
              if (selectionMode) {
                setSelectedMap({});
                setSelectionMode(false);
              } else {
                setSelectionMode(true);
              }
            }}
            className="rounded-md border px-3 py-1 text-sm hover:bg-muted"
          >
            {selectionMode ? "Cancel" : "Select"}
          </button>

          {/* SORT */}
          <select
            value={sort}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("sort", e.target.value);
              params.set("page", "1"); // reset page on sort
              router.push(`?${params.toString()}`);
            }}
            className="rounded-md border px-3 py-1 text-sm bg-white"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </select>
        </div>


      {loading && (
        <div className="mt-6 text-sm text-muted-foreground">
          Loading properties…
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="mt-6 rounded-xl border bg-card p-10 text-center text-muted-foreground">
          No properties found
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="mt-6 grid grid-cols-4 gap-4">
            {items.map((property) => {
              const listQuery = searchParams.toString();

              return (
                <div
                  key={property.id}
                  className="cursor-pointer"
                  onClick={() => {
                    if (!selectionMode) {
                      sessionStorage.setItem(
                        SCROLL_KEY,
                        String(window.scrollY)
                      );
                      router.push(`/v2/properties/${property.id}`);

                    }
                  }}
                >
                  <PropertyCard
                    property={property}
                    selectionMode={selectionMode}
                    selected={Boolean(selectedMap[property.id])}
                    onToggleSelect={() => toggleSelect(property)}
                    onView={() => {
                      sessionStorage.setItem(
                        SCROLL_KEY,
                        String(window.scrollY)
                      );
                      router.push(`/v2/properties/${property.id}`);
                    }}
                  />
                </div>
              );
            })}
          </div>


          {/* SHARE BAR */}
          {selectedCount > 0 && (
            <div className="sticky bottom-4 z-20 mt-4 flex items-center justify-between rounded-xl border bg-card p-4 shadow">
              <div className="text-sm">
                {selectedCount} selected
              </div>

              <button
                onClick={() => setShareOpen(true)}
                disabled={selectedCount > 10}
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                Share Selected
              </button>
            </div>
          )}

          {shareOpen && (
            <ShareMultiplePropertiesModal
              propertiesMap={selectedMap}
              onClose={() => {
                setShareOpen(false);
                setSelectedMap({});
                setSelectionMode(false);
              }}
            />
          )}

          {/* PAGINATION */}
          <div className="mt-6 flex justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() =>
                router.push(
                  `?${updateParam(searchParams, "page", page - 1)}`
                )
              }
              className="rounded-md border px-3 py-1 disabled:opacity-50"
            >
              Prev
            </button>

            <span className="px-3 py-1 text-sm">
              Page {page} of {pages}
            </span>

            <button
              disabled={page >= pages}
              onClick={() =>
                router.push(
                  `?${updateParam(searchParams, "page", page + 1)}`
                )
              }
              className="rounded-md border px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </>
  );
}
