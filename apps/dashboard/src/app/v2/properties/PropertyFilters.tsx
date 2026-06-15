// PropertyFilters.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";

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
  source?: 'all' | 'network' | 'private';
};

type Props = {
  value: PropertyFiltersValue;
  onChange: (v: PropertyFiltersValue) => void;
  isOpen?: boolean;
  onToggle?: () => void;
};

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
  if (v.source && v.source !== 'all') n++;
  return n;
}

function PillToggle<T extends string>({
  value, options, onChange,
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
          <button key={o.value} onClick={() => onChange(active ? undefined : o.value)}
            className={["h-8 rounded-lg px-3.5 text-xs font-semibold border whitespace-nowrap transition-all duration-150",
              active ? "bg-[#0B1F14] text-white border-[#0B1F14]" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700",
            ].join(" ")}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function MultiPillToggle({
  options, values, onToggle, colorActive = "bg-[#0B1F14] text-white border-[#0B1F14]",
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
          <button key={o.value} onClick={() => onToggle(o.value)}
            className={["h-8 rounded-lg px-3 text-xs font-medium border transition-all duration-150",
              active ? colorActive : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700",
            ].join(" ")}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function DropdownPanel({ label, badge, children }: { label: string; badge?: number; children: React.ReactNode }) {
  const [open, setOpen]       = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const btnRef   = useRef<HTMLButtonElement>(null);
  const hasActive = (badge ?? 0) > 0;

  function handleToggle() {
    if (!open && btnRef.current) {
      const r    = btnRef.current.getBoundingClientRect();
      const left = Math.min(r.left, window.innerWidth - 276);
      setPanelPos({ top: r.bottom + 6, left });
    }
    setOpen((v) => !v);
  }

  return (
    <div className="relative flex-shrink-0">
      <button ref={btnRef} onClick={handleToggle}
        className={["flex items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-semibold border whitespace-nowrap transition-all duration-150",
          open || hasActive ? "bg-[#0B1F14] text-white border-[#0B1F14]" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700",
        ].join(" ")}>
        {label}
        {hasActive ? (
          <span className="ml-0.5 bg-emerald-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">
            {badge}
          </span>
        ) : (
          <ChevronDown className={["w-3 h-3 transition-transform flex-shrink-0", open ? "rotate-180" : ""].join(" ")} />
        )}
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div className="fixed z-[101] bg-white rounded-xl border border-slate-200 shadow-xl p-4 min-w-[260px]"
            style={{ top: panelPos.top, left: panelPos.left }}>
            {children}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{children}</p>;
}

function Divider() {
  return <div className="w-px h-5 bg-slate-200 flex-shrink-0" />;
}

export default function PropertyFilters({ value, onChange }: Props) {
  const [draft, setDraft] = useState<PropertyFiltersValue>(value);

  useEffect(() => { setDraft(value); }, [value]);

  function update<K extends keyof PropertyFiltersValue>(key: K, val: PropertyFiltersValue[K]) {
    setDraft(prev => ({ ...prev, [key]: val }));
  }

  function toggleArr<K extends keyof PropertyFiltersValue>(key: K, val: string) {
    setDraft(prev => {
      const arr = (prev[key] as string[]) ?? [];
      return { ...prev, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] };
    });
  }

  function selectPreset(preset: DatePreset) {
    setDraft(prev => ({ ...prev, datePreset: preset, fromDate: undefined, toDate: undefined }));
  }

  function clearAll() { setDraft({}); onChange({}); }
  function applyFilters() { onChange(draft); }

  const isRent        = draft.listingType !== "SALE";
  const isResidential = draft.propertyCategory !== "COMMERCIAL";
  const activeCount   = countActiveFilters(draft);
  const bhkActive     = draft.bhk?.length ?? 0;
  const furnActive    = draft.furnishing?.length ?? 0;
  const tenantActive  = (draft.tenantTypes?.length ?? 0) + (draft.tenantRestrictions?.length ?? 0);
  const dateActive    = draft.datePreset || draft.fromDate || draft.toDate ? 1 : 0;
  const priceActive   = draft.minPrice || draft.maxPrice ? 1 : 0;

  return (
    <div className="w-full bg-white border-b border-slate-100 sticky top-0 rounded-t-lg">

      {/* ── ROW 1: SOURCE ── */}
      <div className="flex items-center gap-2 px-4 pt-2.5 pb-2">
        {[
          { label: 'All listings', value: 'all', icon: null },
          { label: 'Network', value: 'network', icon: '📡' },
          { label: 'My groups', value: 'private', icon: '🔒' },
        ].map((o) => {
          const active = (draft.source ?? 'all') === o.value;
          return (
            <button key={o.value}
              onClick={() => {
                const next = { ...draft, source: o.value as any };
                setDraft(next);
                onChange(next);
              }}
              className={[
                "flex items-center gap-1.5 h-7 rounded-full px-3.5 text-[12px] font-semibold transition-all duration-150 border",
                active
                  ? "bg-[#0B1F14] text-white border-[#0B1F14] shadow-sm"
                  : "bg-transparent text-slate-400 border-transparent hover:border-slate-200 hover:text-slate-600",
              ].join(" ")}>
              {o.icon && <span className="text-[11px]">{o.icon}</span>}
              {o.label}
            </button>
          );
        })}
      </div>

      {/* ── DIVIDER ── */}
      <div className="h-px bg-slate-100 mx-4" />

      {/* ── ROW 2: FILTERS ── */}
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

        <PillToggle value={draft.listingType}
          options={[{ label: "Rent", value: "RENT" }, { label: "Sale", value: "SALE" }]}
          onChange={(v) => update("listingType", v)} />

        <Divider />

        <PillToggle value={draft.propertyCategory}
          options={[{ label: "Residential", value: "RESIDENTIAL" }, { label: "Commercial", value: "COMMERCIAL" }]}
          onChange={(v) => update("propertyCategory", v)} />

        <Divider />

        {isResidential && (
          <>
            <DropdownPanel label="BHK" badge={bhkActive}>
              <SectionLabel>Configuration</SectionLabel>
              <MultiPillToggle options={BHK_OPTIONS.map((b) => ({ label: b, value: b }))}
                values={draft.bhk ?? []} onToggle={(v) => toggleArr("bhk", v)} />
            </DropdownPanel>

            <DropdownPanel label="Furnishing" badge={furnActive}>
              <SectionLabel>Furnishing type</SectionLabel>
              <MultiPillToggle options={FURNISHING_OPTIONS.map((f) => ({ label: f.label, value: f.value }))}
                values={draft.furnishing ?? []} onToggle={(v) => toggleArr("furnishing", v)} />
            </DropdownPanel>

            <Divider />
          </>
        )}

        <DropdownPanel label="Price" badge={priceActive}>
          <SectionLabel>Price range</SectionLabel>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">₹</span>
              <input type="number" placeholder="Min" value={draft.minPrice ?? ""}
                onChange={(e) => update("minPrice", e.target.value || undefined)}
                className="w-full h-9 pl-7 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-slate-400" />
            </div>
            <span className="text-slate-300 font-light select-none">—</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">₹</span>
              <input type="number" placeholder="Max" value={draft.maxPrice ?? ""}
                onChange={(e) => update("maxPrice", e.target.value || undefined)}
                className="w-full h-9 pl-7 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-slate-400" />
            </div>
          </div>
        </DropdownPanel>

        <DropdownPanel label="Date" badge={dateActive}>
          <SectionLabel>Date added</SectionLabel>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {DATE_PRESETS.map((p) => (
              <button key={p.value}
                onClick={() => draft.datePreset === p.value ? update("datePreset", undefined) : selectPreset(p.value)}
                className={["h-8 rounded-lg px-3 text-xs font-medium border transition-all",
                  draft.datePreset === p.value ? "bg-[#0B1F14] text-white border-[#0B1F14]" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400",
                ].join(" ")}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-3">
            <SectionLabel>Custom range</SectionLabel>
            <div className="flex items-center gap-2">
              <input type="date" value={draft.fromDate ?? ""}
                onChange={(e) => { const next = { ...draft, datePreset: undefined, fromDate: e.target.value || undefined }; setDraft(next); onChange(next); }}
                className="flex-1 h-9 px-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-slate-400" />
              <span className="text-slate-300 text-xs select-none">to</span>
              <input type="date" value={draft.toDate ?? ""}
                onChange={(e) => { const next = { ...draft, datePreset: undefined, toDate: e.target.value || undefined }; setDraft(next); onChange(next); }}
                className="flex-1 h-9 px-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-slate-400" />
            </div>
          </div>
        </DropdownPanel>

        {isRent && (
          <DropdownPanel label="Tenant" badge={tenantActive}>
            <div className="space-y-3">
              <div>
                <SectionLabel>Allowed</SectionLabel>
                <MultiPillToggle
                  options={TENANT_TYPE_OPTIONS.map((t) => ({ label: t.charAt(0) + t.slice(1).toLowerCase(), value: t }))}
                  values={draft.tenantTypes ?? []} onToggle={(v) => toggleArr("tenantTypes", v)}
                  colorActive="bg-emerald-50 text-emerald-800 border-emerald-300" />
              </div>
              <div className="border-t border-slate-100 pt-2">
                <SectionLabel>Restrictions</SectionLabel>
                <MultiPillToggle options={TENANT_RESTRICTION_OPTIONS}
                  values={draft.tenantRestrictions ?? []} onToggle={(v) => toggleArr("tenantRestrictions", v)}
                  colorActive="bg-amber-50 text-amber-800 border-amber-300" />
              </div>
            </div>
          </DropdownPanel>
        )}

        <Divider />

        {/* ── SEARCH ── */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input placeholder="Area, building…" value={draft.q ?? ""}
            onChange={(e) => update("q", e.target.value || undefined)}
            className="h-8 pl-8 pr-3 w-36 rounded-lg border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400 transition-all duration-200" />
        </div>

        {/* ── APPLY + CLEAR desktop ── */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0 ml-auto">
          <button onClick={applyFilters}
            className="h-8 px-4 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
            Apply
          </button>
          {activeCount > 0 && (
            <button onClick={clearAll}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors">
              <X className="w-3 h-3" />
              Clear {activeCount}
            </button>
          )}
        </div>
      </div>

      {/* ── APPLY + CLEAR mobile ── */}
      <div className="sm:hidden flex items-center gap-2 px-4 pb-2.5">
        <button onClick={applyFilters}
          className="flex-1 h-9 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
          Apply filters
        </button>
        {activeCount > 0 && (
          <button onClick={clearAll}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-medium text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors">
            <X className="w-3 h-3" />
            Clear {activeCount}
          </button>
        )}
      </div>
    </div>
  );
}