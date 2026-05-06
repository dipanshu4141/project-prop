"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Check, Loader2, ChevronDown } from "lucide-react";
import { PropertyAgentsTable } from "@/components/v2/property/PropertyAgentsTable";
import { apiPatch, apiPost } from "@/lib/api";

/* ------------------------------------------------------------------ */
/* CONSTANTS                                                           */
/* ------------------------------------------------------------------ */

const PROPERTY_CATEGORY_OPTIONS  = ["RESIDENTIAL", "COMMERCIAL"];
const PROPERTY_TYPE_OPTIONS      = ["APARTMENT","VILLA","OFFICE","SHOP","WAREHOUSE","SHOWROOM","PLOT","OTHER"];
const PROPERTY_STATUS_OPTIONS    = ["NEW","REVIEW","APPROVED","REJECTED"];
const FURNISHING_OPTIONS         = ["FULLY_FURNISHED","SEMI_FURNISHED","UNFURNISHED"];
const URGENCY_OPTIONS            = ["NORMAL","URGENT","VERY_URGENT"];
const TENANT_TYPE_OPTIONS        = ["BACHELORS","FAMILY","GIRLS","BOYS","ANY"];
const TENANT_RESTRICTION_OPTIONS = ["HINDU_ONLY","MUSLIM_ONLY","VEG_ONLY","NO_SMOKING","FAMILY_ONLY","BACHELORS_ALLOWED","COMPANY_LEASE_ONLY"];

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

function formatPrice(v: any) {
  const n = Number(v);
  if (!v || isNaN(n)) return "—";
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

/* ------------------------------------------------------------------ */
/* SUB-COMPONENTS                                                      */
/* ------------------------------------------------------------------ */

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-3 text-left"
      >
        <p className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function Row({ label, value, editMode, children }: {
  label:    string;
  value:    any;
  editMode: boolean;
  children?: React.ReactNode;
}) {
  const display = Array.isArray(value)
    ? value.join(", ")
    : value !== null && value !== undefined && value !== "" ? String(value) : null;

  if (!editMode) {
    if (!display) return null;
    return (
      <div className="flex items-start justify-between gap-2">
        <span className="text-[12px] text-slate-400 flex-shrink-0 w-28">{label}</span>
        <span className="text-[12.5px] font-medium text-slate-800 text-right">{display}</span>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange }: { value: any; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[12.5px] text-slate-800 focus:outline-none focus:border-slate-400"
    />
  );
}

function NumberInput({ value, onChange }: { value: any; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[12.5px] text-slate-800 focus:outline-none focus:border-slate-400"
    />
  );
}

function SelectInput({ value, options, onChange }: { value: any; options: string[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[12.5px] text-slate-700 focus:outline-none focus:border-slate-400"
    >
      <option value="">— select —</option>
      {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
    </select>
  );
}

function MultiToggle({ value = [], options, onChange }: { value: string[]; options: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(active ? value.filter((v) => v !== opt) : [...value, opt])}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              active ? "border-[#0B1F14] bg-[#0B1F14] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
            }`}
          >
            {opt.replace(/_/g, " ")}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MAIN COMPONENT                                                      */
/* ------------------------------------------------------------------ */

export function PropertyDetails({ property }: { property: any }) {
  const router = useRouter();

  const [editMode, setEditMode] = useState(false);
  const [draft,    setDraft]    = useState<Record<string, any>>({ ...property });
  const [saving,   setSaving]   = useState(false);

  function update(field: string, value: any) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      await apiPatch(`/properties/${property.id}`, {
        listingType: draft.listingType,
        propertyCategory: draft.propertyCategory,
        propertySubType: draft.propertySubType,
        bhk: draft.bhk,
        areaSqft: draft.areaSqft,
        furnishing: draft.furnishing,
        floor: draft.floor,
        totalFloors: draft.totalFloors,
        status: draft.status,
        price: draft.price,
        deposit: draft.deposit,
        negotiable: draft.negotiable,
        urgencyLevel: draft.urgencyLevel,
        availableFrom: draft.availableFrom,
        country: draft.country,
        city: draft.city,
        area: draft.area,
        location: draft.location,
        building: draft.building,
        tenantTypes: draft.tenantTypes,
        tenantRestrictions: draft.tenantRestrictions,
        notes: draft.notes,
      });
      setEditMode(false);
      router.refresh();
    } catch {
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft({ ...property });
    setEditMode(false);
  }

  async function attachAgentByPhone() {
    const phone = prompt("Enter agent phone number");
    if (!phone) return;
    try {
      await apiPost(`/properties/${property.id}/attach-agent`, { phone });
      router.refresh();
    } catch (e: any) {
      alert(e.message ?? "Failed to attach agent");
    }
  }

  return (
    <div className="space-y-0">

      {/* ── ACTION BAR ── */}
      <div className="flex justify-end gap-2 mb-4">
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-[12.5px] font-medium text-slate-600 hover:border-slate-400 hover:text-slate-800 transition-all"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        ) : (
          <>
            <button
              onClick={cancel}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-[12.5px] text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#0B1F14] text-[12.5px] font-semibold text-white hover:bg-[#1A3525] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {saving
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Check   className="h-3.5 w-3.5" />}
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        )}
      </div>

      {/* ── OVERVIEW ── */}
      <Section title="Overview">
        <Row label="Listing type"    value={property.listingType}      editMode={editMode}><SelectInput value={draft.listingType}      options={["RENT","SALE"]}        onChange={(v) => update("listingType", v)} /></Row>
        <Row label="Category"        value={property.propertyCategory} editMode={editMode}><SelectInput value={draft.propertyCategory} options={PROPERTY_CATEGORY_OPTIONS} onChange={(v) => update("propertyCategory", v)} /></Row>
        <Row label="Type"            value={property.propertySubType}  editMode={editMode}><SelectInput value={draft.propertySubType}  options={PROPERTY_TYPE_OPTIONS}  onChange={(v) => update("propertySubType", v)} /></Row>
        <Row label="BHK"             value={property.bhk}              editMode={editMode}><TextInput   value={draft.bhk}                                               onChange={(v) => update("bhk", v)} /></Row>
        <Row label="Area (sqft)"     value={property.areaSqft}         editMode={editMode}><NumberInput value={draft.areaSqft}                                          onChange={(v) => update("areaSqft", v)} /></Row>
        <Row label="Furnishing"      value={property.furnishing}       editMode={editMode}><SelectInput value={draft.furnishing}       options={FURNISHING_OPTIONS}     onChange={(v) => update("furnishing", v)} /></Row>
        <Row label="Floor"           value={property.floor}            editMode={editMode}><NumberInput value={draft.floor}                                             onChange={(v) => update("floor", v)} /></Row>
        <Row label="Total floors"    value={property.totalFloors}      editMode={editMode}><NumberInput value={draft.totalFloors}                                       onChange={(v) => update("totalFloors", v)} /></Row>
        <Row label="Status"          value={property.status}           editMode={editMode}><SelectInput value={draft.status}           options={PROPERTY_STATUS_OPTIONS} onChange={(v) => update("status", v)} /></Row>
      </Section>

      {/* ── PRICING ── */}
      <Section title="Pricing">
        <Row label="Price"    value={editMode ? property.price    : formatPrice(property.price)}   editMode={editMode}><NumberInput value={draft.price}    onChange={(v) => update("price", v)} /></Row>
        <Row label="Deposit"  value={editMode ? property.deposit  : formatPrice(property.deposit)} editMode={editMode}><NumberInput value={draft.deposit}  onChange={(v) => update("deposit", v)} /></Row>
        <Row label="Urgency"  value={property.urgencyLevel}  editMode={editMode}><SelectInput value={draft.urgencyLevel}  options={URGENCY_OPTIONS}  onChange={(v) => update("urgencyLevel", v)} /></Row>
        <Row label="Negotiable" value={property.negotiable !== null ? (property.negotiable ? "Yes" : "No") : null} editMode={editMode}>
          <SelectInput value={draft.negotiable === true ? "YES" : draft.negotiable === false ? "NO" : ""} options={["YES","NO"]} onChange={(v) => update("negotiable", v === "YES")} />
        </Row>
        <Row label="Available from" value={property.availableFrom ? new Date(property.availableFrom).toLocaleDateString("en-IN") : null} editMode={editMode}>
          <input type="date" value={draft.availableFrom?.slice(0,10) ?? ""} onChange={(e) => update("availableFrom", e.target.value)}
            className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[12.5px] focus:outline-none focus:border-slate-400" />
        </Row>
      </Section>

      {/* ── LOCATION ── */}
      <Section title="Location" defaultOpen={false}>
        {["country","city","area","location","building"].map((f) => (
          <Row key={f} label={f.charAt(0).toUpperCase()+f.slice(1)} value={property[f]} editMode={editMode}>
            <TextInput value={draft[f]} onChange={(v) => update(f, v)} />
          </Row>
        ))}
      </Section>

      {/* ── TENANT ── */}
      <Section title="Tenant preferences" defaultOpen={false}>
        <Row label="Tenant types"    value={property.tenantTypes}        editMode={editMode}><MultiToggle value={draft.tenantTypes        || []} options={TENANT_TYPE_OPTIONS}        onChange={(v) => update("tenantTypes", v)} /></Row>
        <Row label="Restrictions"    value={property.tenantRestrictions} editMode={editMode}><MultiToggle value={draft.tenantRestrictions  || []} options={TENANT_RESTRICTION_OPTIONS} onChange={(v) => update("tenantRestrictions", v)} /></Row>
      </Section>

      {/* ── BROKER ── */}
      <Section title="Broker & source" defaultOpen={false}>
        <Row label="Firm" value={property.firmName} editMode={false}>{null}</Row>

        {editMode && (
          <button
            onClick={attachAgentByPhone}
            className="text-[12px] text-emerald-700 font-medium hover:underline"
          >
            + Attach agent by phone
          </button>
        )}

        <PropertyAgentsTable
          propertyId={property.id}
          firmName={property.firmName}
          agents={property.agents || []}
          confidence={property.confidence}
          editable={editMode}
        />
      </Section>

      {/* ── NOTES ── */}
      <Section title="Notes" defaultOpen={false}>
        {editMode ? (
          <textarea
            value={draft.notes ?? ""}
            onChange={(e) => update("notes", e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12.5px] text-slate-800 focus:outline-none focus:border-slate-400 resize-none"
          />
        ) : (
          <p className="text-[12.5px] text-slate-600 whitespace-pre-wrap">
            {property.notes || <span className="text-slate-400">No notes</span>}
          </p>
        )}
      </Section>
    </div>
  );
}