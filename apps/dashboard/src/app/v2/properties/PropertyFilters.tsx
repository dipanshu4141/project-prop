"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
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
  datePreset?: DatePreset;
  fromDate?: string;
  toDate?: string;
};

type Props = {
  value: PropertyFiltersValue;
  onChange: (v: PropertyFiltersValue) => void;
  isOpen?: boolean;
  onToggle?: () => void;
};

/* ------------------------------------------------------------------ */
/* CONSTANTS                                                           */
/* ------------------------------------------------------------------ */

const BHK_OPTIONS = ["1RK", "1BHK", "2BHK", "3BHK", "4BHK", "Studio"] as const;

const FURNISHING_OPTIONS = [
  { value: "UNFURNISHED",     label: "Unfurnished" },
  { value: "SEMI_FURNISHED",  label: "Semi"        },
  { value: "FULLY_FURNISHED", label: "Fully"       },
] as const;

const DATE_PRESETS = [
  { value: "TODAY",        label: "Today"   },
  { value: "LAST_7_DAYS",  label: "7 days"  },
  { value: "LAST_14_DAYS", label: "14 days" },
  { value: "LAST_30_DAYS", label: "30 days" },
] as const;

const TENANT_TYPE_OPTIONS = ["BACHELORS", "FAMILY", "GIRLS", "BOYS", "ANY"];

const TENANT_RESTRICTION_OPTIONS = [
  { value: "ONLY_HINDU",            label: "Hindu only"    },
  { value: "ONLY_MUSLIM",           label: "Muslim only"   },
  { value: "ONLY_JAIN",             label: "Jain only"     },
  { value: "ONLY_VEGETARIAN",       label: "Veg only"      },
  { value: "NO_PETS",               label: "No pets"       },
  { value: "WORKING_PROFESSIONALS", label: "Working prof." },
];

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

function countActiveFilters(v: PropertyFiltersValue): number {
  let n = 0;
  if (v.listingType) n++;
  if (v.propertyCategory) n++;
  if (v.q) n++;
  if (v.minPrice || v.maxPrice) n++;
  n += v.bhk?.length ?? 0;
  n += v.furnishing?.length ?? 0;
  n += v.tenantTypes?.length ?? 0;
  n += v.tenantRestrictions?.length ?? 0;
  if (v.datePreset || v.fromDate || v.toDate) n++;
  return n;
}

/* ------------------------------------------------------------------ */
/* PILL TOGGLE  (single-select)                                        */
/* ------------------------------------------------------------------ */

function PillToggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value?: T;
  options: { label: string; value: T }[];
  onChange: (v: T | undefined) => void;
}) {
  return (
    <div className="flex gap-1 flex-shrink-0">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(active ? undefined : o.value)}
            className={[
              "h-8 rounded-lg px-3.5 text-xs font-semibold border whitespace-nowrap transition-all duration-150",
              active
                ? "bg-[#0B1F14] text-white border-[#0B1F14]"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700",
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MULTI PILL TOGGLE                                                   */
/* ------------------------------------------------------------------ */

function MultiPillToggle({
  options,
  values,
  onToggle,
  colorActive = "bg-[#0B1F14] text-white border-[#0B1F14]",
}: {
  options: { label: string; value: string }[];
  values: string[];
  onToggle: (v: string) => void;
  colorActive?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => {
        const active = values.includes(o.value);
        return (
          <button
            key={o.value}
            onClick={() => onToggle(o.value)}
            className={[
              "h-8 rounded-lg px-3 text-xs font-medium border transition-all duration-150",
              active
                ? colorActive
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700",
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DROPDOWN PANEL                                                      */
/*                                                                     */
/* Uses position:fixed for the panel so the parent's overflow-x:auto  */
/* (needed for horizontal pill scrolling) cannot clip it.             */
/* Position is calculated from the trigger button's bounding rect.    */
/* ------------------------------------------------------------------ */

function DropdownPanel({
  label,
  badge,
  children,
}: {
  label: string;
  badge?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const hasActive = (badge ?? 0) > 0;

  function handleToggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      // Clamp left so panel never overflows right edge of viewport
      const left = Math.min(r.left, window.innerWidth - 276);
      setPanelPos({ top: r.bottom + 6, left });
    }
    setOpen((v) => !v);
  }

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={[
          "flex items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-semibold border whitespace-nowrap transition-all duration-150",
          open || hasActive
            ? "bg-[#0B1F14] text-white border-[#0B1F14]"
            : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700",
        ].join(" ")}
      >
        {label}
        {hasActive ? (
          <span className="ml-0.5 bg-emerald-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">
            {badge}
          </span>
        ) : (
          <ChevronDown
            className={["w-3 h-3 transition-transform flex-shrink-0", open ? "rotate-180" : ""].join(" ")}
          />
        )}
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[101] bg-white rounded-xl border border-slate-200 shadow-xl p-4 min-w-[260px]"
            style={{ top: panelPos.top, left: panelPos.left }}
          >
            {children}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SECTION LABEL                                                       */
/* ------------------------------------------------------------------ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* DIVIDER                                                             */
/* ------------------------------------------------------------------ */

function Divider() {
  return <div className="w-px h-5 bg-slate-200 flex-shrink-0" />;
}

/* ------------------------------------------------------------------ */
/* MAIN COMPONENT                                                      */
/* ------------------------------------------------------------------ */

export default function PropertyFilters({ value, onChange }: Props) {
  const [draft, setDraft] = useState<PropertyFiltersValue>(value);

  useEffect(() => { setDraft(value); }, [value]);

  function update<K extends keyof PropertyFiltersValue>(key: K, val: PropertyFiltersValue[K]) {
    const next = { ...draft, [key]: val };
    setDraft(next);
    onChange(next);
  }

  function toggleArr<K extends keyof PropertyFiltersValue>(key: K, val: string) {
    const arr = (draft[key] as string[]) ?? [];
    const next = {
      ...draft,
      [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val],
    };
    setDraft(next);
    onChange(next);
  }

  function selectPreset(preset: DatePreset) {
    const next = { ...draft, datePreset: preset, fromDate: undefined, toDate: undefined };
    setDraft(next);
    onChange(next);
  }

  function clearAll() {
    setDraft({});
    onChange({});
  }

  const isRent        = draft.listingType !== "SALE";
  const isResidential = draft.propertyCategory !== "COMMERCIAL";
  const activeCount   = countActiveFilters(draft);

  const bhkActive    = draft.bhk?.length ?? 0;
  const furnActive   = draft.furnishing?.length ?? 0;
  const tenantActive = (draft.tenantTypes?.length ?? 0) + (draft.tenantRestrictions?.length ?? 0);
  const dateActive   = draft.datePreset || draft.fromDate || draft.toDate ? 1 : 0;
  const priceActive  = draft.minPrice || draft.maxPrice ? 1 : 0;

  return (
    <div className="w-full bg-white border-b border-slate-100 sticky top-0 rounded-t-lg">
      <div className="flex items-center gap-2 px-6 py-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

        {/* ── LISTING TYPE ── */}
        <PillToggle
          value={draft.listingType}
          options={[
            { label: "Rent", value: "RENT" },
            { label: "Sale", value: "SALE" },
          ]}
          onChange={(v) => update("listingType", v)}
        />

        <Divider />

        {/* ── PROPERTY CATEGORY ── */}
        <PillToggle
          value={draft.propertyCategory}
          options={[
            { label: "Residential", value: "RESIDENTIAL" },
            { label: "Commercial",  value: "COMMERCIAL"  },
          ]}
          onChange={(v) => update("propertyCategory", v)}
        />

        <Divider />

        {/* ── BHK ── */}
        {isResidential && (
          <>
            <DropdownPanel label="BHK" badge={bhkActive}>
              <SectionLabel>Configuration</SectionLabel>
              <MultiPillToggle
                options={BHK_OPTIONS.map((b) => ({ label: b, value: b }))}
                values={draft.bhk ?? []}
                onToggle={(v) => toggleArr("bhk", v)}
              />
            </DropdownPanel>

            <DropdownPanel label="Furnishing" badge={furnActive}>
              <SectionLabel>Furnishing type</SectionLabel>
              <MultiPillToggle
                options={FURNISHING_OPTIONS.map((f) => ({ label: f.label, value: f.value }))}
                values={draft.furnishing ?? []}
                onToggle={(v) => toggleArr("furnishing", v)}
              />
            </DropdownPanel>

            <Divider />
          </>
        )}

        {/* ── PRICE ── */}
        <DropdownPanel label="Price" badge={priceActive}>
          <SectionLabel>Price range</SectionLabel>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">₹</span>
              <input
                type="number"
                placeholder="Min"
                value={draft.minPrice ?? ""}
                onChange={(e) => update("minPrice", e.target.value || undefined)}
                className="w-full h-9 pl-7 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-slate-400"
              />
            </div>
            <span className="text-slate-300 font-light select-none">—</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">₹</span>
              <input
                type="number"
                placeholder="Max"
                value={draft.maxPrice ?? ""}
                onChange={(e) => update("maxPrice", e.target.value || undefined)}
                className="w-full h-9 pl-7 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>
        </DropdownPanel>

        {/* ── DATE ── */}
        <DropdownPanel label="Date" badge={dateActive}>
          <SectionLabel>Date added</SectionLabel>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() =>
                  draft.datePreset === p.value
                    ? update("datePreset", undefined)
                    : selectPreset(p.value)
                }
                className={[
                  "h-8 rounded-lg px-3 text-xs font-medium border transition-all",
                  draft.datePreset === p.value
                    ? "bg-[#0B1F14] text-white border-[#0B1F14]"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400",
                ].join(" ")}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-3">
            <SectionLabel>Custom range</SectionLabel>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={draft.fromDate ?? ""}
                onChange={(e) => {
                  const next = { ...draft, datePreset: undefined, fromDate: e.target.value || undefined };
                  setDraft(next);
                  onChange(next);
                }}
                className="flex-1 h-9 px-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-slate-400"
              />
              <span className="text-slate-300 text-xs select-none">to</span>
              <input
                type="date"
                value={draft.toDate ?? ""}
                onChange={(e) => {
                  const next = { ...draft, datePreset: undefined, toDate: e.target.value || undefined };
                  setDraft(next);
                  onChange(next);
                }}
                className="flex-1 h-9 px-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>
        </DropdownPanel>

        {/* ── TENANT (rent only) ── */}
        {isRent && (
          <DropdownPanel label="Tenant" badge={tenantActive}>
            <div className="space-y-3">
              <div>
                <SectionLabel>Allowed</SectionLabel>
                <MultiPillToggle
                  options={TENANT_TYPE_OPTIONS.map((t) => ({
                    label: t.charAt(0) + t.slice(1).toLowerCase(),
                    value: t,
                  }))}
                  values={draft.tenantTypes ?? []}
                  onToggle={(v) => toggleArr("tenantTypes", v)}
                  colorActive="bg-emerald-50 text-emerald-800 border-emerald-300"
                />
              </div>
              <div className="border-t border-slate-100 pt-2">
                <SectionLabel>Restrictions</SectionLabel>
                <MultiPillToggle
                  options={TENANT_RESTRICTION_OPTIONS}
                  values={draft.tenantRestrictions ?? []}
                  onToggle={(v) => toggleArr("tenantRestrictions", v)}
                  colorActive="bg-amber-50 text-amber-800 border-amber-300"
                />
              </div>
            </div>
          </DropdownPanel>
        )}

        <Divider />

        {/* ── SEARCH ── */}
        <div className="relative ml-auto flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            placeholder="Area, building, city…"
            value={draft.q ?? ""}
            onChange={(e) => update("q", e.target.value || undefined)}
            className="h-8 pl-8 pr-3 w-48 rounded-lg border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400 focus:w-56 transition-all duration-200"
          />
        </div>

        {/* ── CLEAR ALL ── */}
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors flex-shrink-0"
          >
            <X className="w-3 h-3" />
            Clear {activeCount}
          </button>
        )}
      </div>
    </div>
  );
}