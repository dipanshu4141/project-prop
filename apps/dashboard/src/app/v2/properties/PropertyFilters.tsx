"use client";

import { useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/* TYPES */
/* ------------------------------------------------------------------ */

export type DatePreset =
  | "TODAY"
  | "LAST_7_DAYS"
  | "LAST_14_DAYS"
  | "LAST_30_DAYS";

export type PropertyFiltersValue = {
  listingType?: "RENT" | "SALE";
  propertyCategory?: "RESIDENTIAL" | "COMMERCIAL";

  q?: string;

  minPrice?: string;
  maxPrice?: string;

  bhk?: string[];

  furnishing?: ("UNFURNISHED" | "SEMI_FURNISHED" | "FULLY_FURNISHED")[];

  tenantTypes?: string[];
  tenantRestrictions?: string[];

  /* ---------- DATE FILTER ---------- */
  datePreset?: DatePreset;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string;   // YYYY-MM-DD
};

type Props = {
  value: PropertyFiltersValue;
  onChange: (v: PropertyFiltersValue) => void;
  isOpen: boolean;
  onToggle: () => void;
};


/* ------------------------------------------------------------------ */
/* UTILS */
/* ------------------------------------------------------------------ */

function isDesktopPointer() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(pointer:fine)").matches;
}

/* ------------------------------------------------------------------ */
/* COMPONENT */
/* ------------------------------------------------------------------ */

export default function PropertyFilters({ value, onChange, isOpen, onToggle, }: Props) {
  const [draft, setDraft] = useState<PropertyFiltersValue>(value);
  const [showFilters, setShowFilters] = useState(isOpen);
  const [showDate, setShowDate] = useState(false);

  const isDesktop = useMemo(isDesktopPointer, []);

  /* ------------------------- sync ------------------------- */

  useEffect(() => {
  setShowFilters(isOpen);
}, [isOpen]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  /* ------------------------- helpers ------------------------- */

  function update<K extends keyof PropertyFiltersValue>(
    key: K,
    val: PropertyFiltersValue[K]
  ) {
    setDraft((d) => ({ ...d, [key]: val }));
  }

  function toggleArray<K extends keyof PropertyFiltersValue>(
    key: K,
    val: string
  ) {
    setDraft((d) => {
      const arr = (d[key] as string[]) || [];
      return {
        ...d,
        [key]: arr.includes(val)
          ? arr.filter((x) => x !== val)
          : [...arr, val],
      };
    });
  }

  /* ------------------------- DATE LOGIC ------------------------- */

  function selectPreset(preset: DatePreset) {
    setDraft((d) => ({
      ...d,
      datePreset: preset,
      fromDate: undefined,
      toDate: undefined,
    }));
  }

  function setFromDate(v: string) {
    setDraft((d) => ({
      ...d,
      datePreset: undefined,
      fromDate: v || undefined,
    }));
  }

  function setToDate(v: string) {
    setDraft((d) => ({
      ...d,
      datePreset: undefined,
      toDate: v || undefined,
    }));
  }

  const isRent = draft.listingType === "RENT";
  const isResidential = draft.propertyCategory !== "COMMERCIAL";

  /* ------------------------------------------------------------------ */
  /* UI */
  /* ------------------------------------------------------------------ */

  return (
    <div className="mt-4">
      {/* ================= SHOW FILTERS ================= */}
      {!showFilters && (
        <button
          onClick={() => setShowFilters(true)}
          className="
            w-full rounded-xl border bg-white px-4 py-3
            text-sm font-medium hover:bg-slate-50
          "
        >
          Show Filters
        </button>
      )}
  
      {/* ================= FILTER PANEL ================= */}
      {showFilters && (
        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
          {/* ---------- HEADER ---------- */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Filters</span>
            <button
              onClick={() => setShowFilters(false)}
              className="text-xs text-slate-500 hover:underline"
            >
              Hide
            </button>
          </div>
  
          {/* ---------- ROW 1 ---------- */}
          <div className="flex flex-wrap items-center gap-3">
            <PillGroup
              value={draft.listingType}
              options={[
                { label: "Rent", value: "RENT" },
                { label: "Sale", value: "SALE" },
              ]}
              onChange={(v) => update("listingType", v)}
            />
  
            <PillGroup
              value={draft.propertyCategory}
              options={[
                { label: "Residential", value: "RESIDENTIAL" },
                { label: "Commercial", value: "COMMERCIAL" },
              ]}
              onChange={(v) => update("propertyCategory", v)}
            />
  
            <input
              placeholder="Search city, area, building..."
              value={draft.q || ""}
              onChange={(e) => update("q", e.target.value)}
              className="h-9 w-64 rounded-md border px-3 text-sm"
            />
          </div>
  
          {/* ---------- ROW 2 ---------- */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min ₹"
                value={draft.minPrice || ""}
                onChange={(e) => update("minPrice", e.target.value)}
                className="h-9 w-28 rounded-md border px-3 text-sm"
              />
              <input
                type="number"
                placeholder="Max ₹"
                value={draft.maxPrice || ""}
                onChange={(e) => update("maxPrice", e.target.value)}
                className="h-9 w-28 rounded-md border px-3 text-sm"
              />
            </div>
  
            {isResidential && (
              <MultiPill
                label="BHK"
                values={draft.bhk || []}
                options={["1BHK", "2BHK", "3BHK", "4BHK", "Studio", "1RK"]}
                onToggle={(v) => toggleArray("bhk", v)}
              />
            )}
  
            {isResidential && (
              <MultiPill
                label="Furnishing"
                values={draft.furnishing || []}
                options={[
                  "UNFURNISHED",
                  "SEMI_FURNISHED",
                  "FULLY_FURNISHED",
                ]}
                onToggle={(v) => toggleArray("furnishing", v)}
              />
            )}
          </div>
  
          {/* ---------- DATE FILTER ---------- */}
          <div className="border-t pt-3 space-y-3">
            <button
              onClick={() => setShowDate((v) => !v)}
              className="
                h-9 rounded-full border bg-white px-4 text-sm
                text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50
              "
            >
              {showDate ? "Hide date filter" : "Filter by date"}
            </button>
  
            {showDate && (
              <>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Today", value: "TODAY" },
                    { label: "Last 7 days", value: "LAST_7_DAYS" },
                    { label: "Last 14 days", value: "LAST_14_DAYS" },
                    { label: "Last 30 days", value: "LAST_30_DAYS" },
                  ].map((p) => (
                    <button
                      key={p.value}
                      onClick={() => selectPreset(p.value as DatePreset)}
                      className={`h-8 rounded-full px-3 text-xs border ${
                        draft.datePreset === p.value
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white hover:border-indigo-400"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
  
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="date"
                    value={draft.fromDate || ""}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-9 rounded-md border px-3 text-sm"
                  />
                  <span className="text-sm text-slate-500">to</span>
                  <input
                    type="date"
                    value={draft.toDate || ""}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-9 rounded-md border px-3 text-sm"
                  />
                </div>
              </>
            )}
          </div>
  
          {/* ---------- TENANT PREFS ---------- */}
          {isRent && (
            <div className="border-t pt-3 space-y-2">
              <div className="text-xs font-medium text-slate-500">
                Tenant Preferences
              </div>
  
              <div className="flex flex-wrap gap-3">
                <MultiPill
                  label="Allowed"
                  values={draft.tenantTypes || []}
                  options={["BACHELORS", "FAMILY", "ANY"]}
                  onToggle={(v) => toggleArray("tenantTypes", v)}
                />
  
                <MultiPill
                  label="Restrictions"
                  values={draft.tenantRestrictions || []}
                  options={[
                    "HINDU_ONLY",
                    "MUSLIM_ONLY",
                    "VEG_ONLY",
                    "NO_SMOKING",
                  ]}
                  onToggle={(v) =>
                    toggleArray("tenantRestrictions", v)
                  }
                />
              </div>
            </div>
          )}
  
          {/* ---------- ACTIONS ---------- */}
          <div className="flex gap-2 pt-3">
            <button
              onClick={() => onChange(draft)}
              className="
                flex-1 rounded-md py-2 text-sm font-medium text-white
                bg-indigo-600 hover:bg-indigo-700
              "
            >
              Apply
            </button>
  
            <button
              onClick={() => {
                setDraft({});
                onChange({});
              }}
              className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
  

}  

/* ------------------------------------------------------------------ */
/* SUB COMPONENTS */
/* ------------------------------------------------------------------ */

type PillOption<T extends string> = {
  label: string;
  value: T;
};

type PillGroupProps<T extends string> = {
  value?: T;
  options: PillOption<T>[];
  onChange: (value: T) => void;
};

function PillGroup<T extends string>({
  value,
  options,
  onChange,
}: PillGroupProps<T>) {
  return (
    <div className="flex gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`h-9 rounded-full px-4 text-sm border ${
            value === o.value
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white hover:border-indigo-400"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

type MultiPillProps<T extends string> = {
  label: string;
  values: T[];
  options: T[];
  onToggle: (value: T) => void;
};

function MultiPill<T extends string>({
  label,
  values,
  options,
  onToggle,
}: MultiPillProps<T>) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500">{label}:</span>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onToggle(o)}
          className={`h-8 rounded-full px-3 text-xs border ${
            values.includes(o)
              ? "bg-indigo-100 text-indigo-700 border-indigo-300"
              : "bg-white hover:border-indigo-300"
          }`}
        >
          {o.replaceAll("_", " ")}
        </button>
      ))}
    </div>
  );
}
