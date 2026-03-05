"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AccordionSection } from "@/components/v2/ui/AccordionSection";
import { ControlledEditableField } from "@/components/v2/ui/ControlledEditableField";
import { ControlledEditableSelectField } from "@/components/v2/ui/ControlledEditableSelectField";
import { PropertyAgentsTable } from "@/components/v2/property/PropertyAgentsTable";

import { API_BASE } from "@/lib/apiBase";

/* ============================================================
   TYPES
============================================================ */

type PropertyDetailsProps = {
  property: any;
};

/* ============================================================
   GENERIC FIELD WRAPPER
   - Read-only when not editing
   - Editable slot when editMode === true
============================================================ */

function Field({
  label,
  value,
  editMode,
  children,
}: {
  label: string;
  value: any;
  editMode: boolean;
  children?: React.ReactNode;
}) {
  if (!editMode) {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return null;
    }

    return (
      <div className="space-y-0.5">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm">
          {Array.isArray(value) ? value.join(", ") : value}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function MultiSelect({
  value = [],
  options,
  onChange,
}: {
  value: string[];
  options: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`
              rounded-md border px-3 py-1 text-xs
              transition
              ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              }
            `}
          >
            {opt.replaceAll("_", " ")}
          </button>
        );
      })}
    </div>
  );
}


const PROPERTY_CATEGORY_OPTIONS = ["RESIDENTIAL", "COMMERCIAL"];

const PROPERTY_TYPE_OPTIONS = [
  "APARTMENT",
  "VILLA",
  "OFFICE",
  "SHOP",
  "WAREHOUSE",
  "SHOWROOM",
  "PLOT",
  "OTHER",
];

const PROPERTY_STATUS_OPTIONS = [
  "NEW",
  "REVIEW",
  "APPROVED",
  "REJECTED",
];

const BHK_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"];

const TENANT_TYPE_OPTIONS = [
  "BACHELORS",
  "FAMILY",
  "GIRLS",
  "BOYS",
  "ANY",
];

const TENANT_RESTRICTION_OPTIONS = [
  "HINDU_ONLY",
  "MUSLIM_ONLY",
  "VEG_ONLY",
  "NO_SMOKING",
  "FAMILY_ONLY",
  "BACHELORS_ALLOWED",
  "COMPANY_LEASE_ONLY",
];


/* ============================================================
   MAIN COMPONENT
============================================================ */

export function PropertyDetails({ property }: PropertyDetailsProps) {
  const router = useRouter();

  /* ============================================================
     LOCAL STATE
     - draft = property-only editable copy
     - agents are NEVER edited here
  ============================================================ */

  const [editMode, setEditMode] = useState(false);

  const [draft, setDraft] = useState<Record<string, any>>({
    ...property,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /* ============================================================
     GENERIC PROPERTY FIELD UPDATE
  ============================================================ */

  function update(field: string, value: any) {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  /* ============================================================
     SAVE PROPERTY (ONLY PROPERTY DATA)
  ============================================================ */

  async function saveAll() {
    if (saving) return;

    setSaving(true);
    setSaved(false);

    try {
      /* --------------------------------------------------------
         BUILD PROPERTY PAYLOAD (STRICT + EXPLICIT)
      -------------------------------------------------------- */

      const payload = {
        /* ---------- CORE ---------- */
        listingType: draft.listingType ?? undefined,
        propertyCategory: draft.propertyCategory ?? undefined,
        propertySubType: draft.propertySubType ?? undefined,

        /* ---------- LOCATION ---------- */
        country: draft.country ?? undefined,
        city: draft.city ?? undefined,
        area: draft.area ?? undefined,
        location: draft.location ?? undefined,
        building: draft.building ?? undefined,

        /* ---------- CONFIG ---------- */
        bhk: draft.bhk ?? undefined,
        areaSqft: draft.areaSqft ?? undefined,
        furnishing: draft.furnishing ?? undefined,
        floor: draft.floor ?? undefined,
        totalFloors: draft.totalFloors ?? undefined,
        status: draft.status ?? undefined,

        /* ---------- PRICING ---------- */
        price: draft.price ?? undefined,
        deposit: draft.deposit ?? undefined,
        negotiable: draft.negotiable ?? undefined,
        availableFrom: draft.availableFrom ?? undefined,

        /* ---------- TENANT ---------- */
        urgencyLevel: draft.urgencyLevel ?? undefined,
        tenantTypes: draft.tenantTypes ?? undefined,
        tenantRestrictions: draft.tenantRestrictions ?? undefined,

        /* ---------- NOTES ---------- */
        notes: draft.notes ?? undefined,

        /* ---------- CRM ---------- */
        leadStage: draft.leadStage ?? undefined,
        followUpAt: draft.followUpAt ?? undefined,
        lastContactedAt: draft.lastContactedAt ?? undefined,
      };

      /* --------------------------------------------------------
         PATCH PROPERTY
      -------------------------------------------------------- */

      const res = await fetch(`${API_BASE}/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("Property save failed:", err);
        throw new Error("PROPERTY_SAVE_FAILED");
      }

      setSaved(true);
      setEditMode(false);
      router.refresh();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save property. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  /* ============================================================
     CANCEL EDIT
  ============================================================ */

  function cancelEdit() {
    setDraft({ ...property });
    setEditMode(false);
  }

  /* ============================================================
     ATTACH AGENT BY PHONE (RELATIONSHIP ONLY)
  ============================================================ */

  async function attachAgentByPhone() {
    const phone = prompt("Enter agent phone number");
    
    if (!phone) return;
    
    try {
      console.log('FRONTEND API_BASE:', API_BASE);
      console.log('ATTACH URL:', `${API_BASE}/properties/${property.id}/attach-agent`);
      const res = await fetch(
        `${API_BASE}/properties/${property.id}/attach-agent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        }
      );

      if (res.status === 404) {
        alert("Agent not found. Please create the agent first.");
        router.push("/agents/new");
        return;
      }

      if (!res.ok) {
        throw new Error("ATTACH_FAILED");
      }

      router.refresh();
    } catch (err) {
      console.error("Attach agent failed:", err);
      alert("Failed to attach agent.");
    }
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="space-y-4">

      {/* ========================================================
         ACTION BAR
      ======================================================== */}

      <div className="flex justify-end gap-2">
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="rounded-md border px-4 py-2 text-sm"
          >
            Edit
          </button>
        ) : (
          <>
            <button
              onClick={cancelEdit}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Cancel
            </button>

            <button
              onClick={saveAll}
              disabled={saving}
              className={`
                relative flex items-center gap-2
                rounded-md px-4 py-2 text-sm
                transition
                ${
                  saved
                    ? "bg-green-600 text-white"
                    : "bg-primary text-primary-foreground"
                }
                disabled:opacity-70
              `}
            >
              {saving && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {saved ? "Saved ✓" : saving ? "Saving…" : "Save"}
            </button>
          </>
        )}
      </div>

        {/* ================= OVERVIEW ================= */}
        <AccordionSection title="Overview" defaultOpen>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Listing Type" value={property.listingType} editMode={editMode}>
            <ControlledEditableSelectField
              label="Listing Type"
              value={draft.listingType}
              options={["RENT", "SALE"]}
              onChange={(v) => update("listingType", v)}
            />
          </Field>

          <Field label="Category" value={property.propertyCategory} editMode={editMode}>
            <ControlledEditableSelectField
              label="Category"
              value={draft.propertyCategory}
              options={PROPERTY_CATEGORY_OPTIONS}
              onChange={(v) => update("propertyCategory", v)}
            />
          </Field>


          <Field label="Property Type" value={property.propertySubType} editMode={editMode}>
            <ControlledEditableSelectField
              label="Property Type"
              value={draft.propertySubType}
              options={PROPERTY_TYPE_OPTIONS}
              onChange={(v) => update("propertySubType", v)}
            />
          </Field>


          <Field label="BHK" value={property.bhk} editMode={editMode}>
            <ControlledEditableSelectField
              label="BHK"
              value={draft.bhk?.toString()}
              options={BHK_OPTIONS}
              onChange={(v) =>
                update("bhk", v === "10+" ? 10 : Number(v))
              }
            />
          </Field>


          <Field label="Area (sqft)" value={property.areaSqft} editMode={editMode}>
            <ControlledEditableField
              label="Area (sqft)"
              type="number"
              value={draft.areaSqft}
              onChange={(v) => update("areaSqft", Number(v))}
            />
          </Field>

          <Field label="Furnishing" value={property.furnishing} editMode={editMode}>
            <ControlledEditableSelectField
              label="Furnishing"
              value={draft.furnishing}
              options={["FULLY_FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"]}
              onChange={(v) => update("furnishing", v)}
            />
          </Field>

          <Field label="Floor" value={property.floor} editMode={editMode}>
            <ControlledEditableField
              label="Floor"
              type="number"
              value={draft.floor}
              onChange={(v) => update("floor", Number(v))}
            />
          </Field>

          <Field label="Total Floors" value={property.totalFloors} editMode={editMode}>
            <ControlledEditableField
              label="Total Floors"
              type="number"
              value={draft.totalFloors}
              onChange={(v) => update("totalFloors", Number(v))}
            />
          </Field>

          <Field label="Status" value={property.status} editMode={editMode}>
            <ControlledEditableSelectField
              label="Status"
              value={draft.status}
              options={PROPERTY_STATUS_OPTIONS}
              onChange={(v) => update("status", v)}
            />
          </Field>

        </div>
        </AccordionSection>

        {/* ================= PRICING ================= */}
        <AccordionSection title="Pricing & Availability">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price" value={property.price} editMode={editMode}>
            <ControlledEditableField
              label="Price"
              type="number"
              value={draft.price}
              onChange={(v) => update("price", Number(v))}
            />
          </Field>

          <Field label="Deposit" value={property.deposit} editMode={editMode}>
            <ControlledEditableField
              label="Deposit"
              type="number"
              value={draft.deposit}
              onChange={(v) => update("deposit", Number(v))}
            />
          </Field>

          <Field label="Negotiable" value={property.negotiable} editMode={editMode}>
            <ControlledEditableSelectField
              label="Negotiable"
              value={draft.negotiable}
              options={["YES", "NO"]}
              onChange={(v) => update("negotiable", v)}
            />
          </Field>

          <Field label="Urgency" value={property.urgencyLevel} editMode={editMode}>
            <ControlledEditableSelectField
              label="Urgency"
              value={draft.urgencyLevel}
              options={["LOW", "NORMAL", "HIGH"]}
              onChange={(v) => update("urgencyLevel", v)}
            />
          </Field>

          <Field
            label="Available From"
            value={
              property.availableFrom &&
              new Date(property.availableFrom).toLocaleDateString()
            }
            editMode={editMode}
          >
            <ControlledEditableField
              label="Available From"
              type="date"
              value={draft.availableFrom?.slice(0, 10)}
              onChange={(v) => update("availableFrom", v)}
            />
          </Field>
        </div>
        </AccordionSection>

        {/* ================= LOCATION ================= */}
        <AccordionSection title="Location & Building">
        <div className="grid grid-cols-2 gap-4">
          {["country", "city", "area", "location", "building"].map((f) => (
            <Field key={f} label={f} value={property[f]} editMode={editMode}>
              <ControlledEditableField
                label={f}
                value={draft[f]}
                onChange={(v) => update(f, v)}
              />
            </Field>
          ))}
        </div>
        </AccordionSection>

        {/* ================= TENANT ================= */}
        <AccordionSection title="Tenant Preferences">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tenant Types" value={property.tenantTypes} editMode={editMode}>
            <MultiSelect
              value={draft.tenantTypes || []}
              options={TENANT_TYPE_OPTIONS}
              onChange={(v) => update("tenantTypes", v)}
            />
          </Field>


          <Field label="Restrictions" value={property.tenantRestrictions} editMode={editMode}>
            <MultiSelect
              value={draft.tenantRestrictions || []}
              options={TENANT_RESTRICTION_OPTIONS}
              onChange={(v) => update("tenantRestrictions", v)}
            />
          </Field>

        </div>
        </AccordionSection>

      {/* ========================================================
         BROKER & SOURCE
      ======================================================== */}

      <AccordionSection title="Broker & Source">
        <div className="space-y-4">

          {/* Firm name (read-only here) */}
          <div>
            <div className="text-xs text-muted-foreground">Firm</div>
            <div className="text-sm font-medium">
              {property.firmName || "—"}
            </div>
          </div>

          {editMode && (
            <button
              onClick={attachAgentByPhone}
              className="rounded-md border px-3 py-1 text-sm hover:bg-muted"
            >
              + Attach Agent by Phone
            </button>
          )}

          <PropertyAgentsTable
            propertyId={property.id}
            firmName={property.firmName}
            agents={property.agents || []}
            confidence={property.confidence}
            editable={editMode}
          />

          <button
            onClick={() => router.push("/v2/agents")}
            className="text-xs text-muted-foreground underline"
          >
            Manage agents
          </button>

        </div>
      </AccordionSection>

    </div>
  );
}