"use client";

import { X } from "lucide-react";
import { useState, ChangeEvent, useEffect } from "react";


/* ------------------------------------------------------------------ */
/* TYPES */
/* ------------------------------------------------------------------ */

type AddMethod = "FORM" | "TEXT" | null;

type PropertyFormData = {
  listingType?: string;
  category?: string;
  bhk?: string;
  furnishing?: string;
  price?: string;
  deposit?: string;
  city?: string;
  area?: string;
  building?: string;
  location?: string;
};

type SourceData = {
  type: SourceType | "";
  contactNumber: string;
  name?: string;
  firmName?: string;
};


const SOURCE_TYPES = [
  "OWNER",
  "BROKER",
  "BUILDER",
  "EXISTING_CLIENT",
  "ONLINE_PORTAL",
  "OTHER",
] as const;
type SourceType = typeof SOURCE_TYPES[number];

/* ------------------------------------------------------------------ */
/* COMPONENT */
/* ------------------------------------------------------------------ */

export default function AddPropertyModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [method, setMethod] = useState<AddMethod>(null);

  const [formData, setFormData] = useState<PropertyFormData>({});
  const [rawText, setRawText] = useState<string>("");

  const [source, setSource] = useState<SourceData>({
    type: "",
    contactNumber: "",
    name: "",
    firmName: "",
  });

  useEffect(() => {
    if (open) {
      resetState();
    }
  }, [open]);
  

  if (!open) return null;

  /* ------------------------- helpers ------------------------- */

  function resetState() {
    setStep(1);
    setMethod(null);
    setFormData({});
    setRawText("");
    setSource({
      type: "",
      contactNumber: "",
      name: "",
      firmName: "",
    });
  }
  

  function updateForm<K extends keyof PropertyFormData>(
    key: K,
    value: string
  ) {
    setFormData((d) => ({ ...d, [key]: value }));
  }

  function updateSource<K extends keyof SourceData>(
    key: K,
    value: string
  ) {
    setSource((s) => ({ ...s, [key]: value }));
  }

  /* ------------------------- submit ------------------------- */

  async function handleSubmit() {
    if (!source.contactNumber) {
      alert("Contact number is mandatory");
      return;
    }

    if (!source.type) {
      alert("Source type is required");
      return;
    }
    

    const payload = {
      method,
      propertyData: method === "FORM" ? formData : undefined,
      rawText: method === "TEXT" ? rawText : undefined,
      source,
    };

    const res = await fetch("http://localhost:3000/properties/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert("Failed to add property");
      return;
    }

    onClose();
  }

  /* ------------------------------------------------------------------ */
  /* UI */
  /* ------------------------------------------------------------------ */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
        {/* HEADER */}
        <div className="flex justify-between px-5 py-4 border-b">
          <button
            onClick={() => (step === 1 ? onClose() : setStep(1))}
            className="rounded-md border px-4 py-2 text-sm hover:border-indigo-500 hover:bg-indigo-500 hover:text-white"
          >
            Back
          </button>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-slate-500 " />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-thin">
          <h2 className="text-lg font-semibold">Add Property</h2>
          {/* STEP 1 */}
          {step === 1 && (
            <>
              <div className="text-sm text-slate-600">
                How do you want to add this property?
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setMethod("FORM");
                    setStep(2);
                  }}
                  className="rounded-lg border p-4 text-left hover:border-indigo-500 hover:bg-indigo-50"
                >
                  📝 Fill Property Form
                </button>

                <button
                  onClick={() => {
                    setMethod("TEXT");
                    setStep(2);
                  }}
                  className="rounded-lg border p-4 text-left hover:border-indigo-500 hover:bg-indigo-50"
                >
                  💬 Paste / Type Property Details
                </button>
              </div>
            </>
          )}

          {/* STEP 2 — FORM */}
          {step === 2 && method === "FORM" && (
            <>
              <Section title="Property Details">
                <Grid>
                  {/* LISTING TYPE */}
                  <Select
                    label="Listing Type"
                    value={formData.listingType || ""}
                    options={["RENT", "SALE"]}
                    onChange={(v) => updateForm("listingType", v)}
                  />

                  {/* CATEGORY */}
                  <Select
                    label="Category"
                    value={formData.category || ""}
                    options={["RESIDENTIAL", "COMMERCIAL"]}
                    onChange={(v) => updateForm("category", v)}
                  />

                  {/* BHK */}
                  <Select
                    label="BHK"
                    value={formData.bhk || ""}
                    options={["Studio", "1RK", "1BHK", "2BHK", "3BHK", "4BHK", "5BHK+"]}
                    onChange={(v) => updateForm("bhk", v)}
                  />

                  {/* FURNISHING */}
                  <Select
                    label="Furnishing"
                    value={formData.furnishing || ""}
                    options={["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"]}
                    onChange={(v) => updateForm("furnishing", v)}
                  />

                  {/* PRICE */}
                  <Input
                    label="Price"
                    // placeholder="₹"
                    onChange={(v) => updateForm("price", v)}
                  />

                  {/* DEPOSIT */}
                  <Input
                    label="Deposit"
                    // placeholder="₹"
                    onChange={(v) => updateForm("deposit", v)}
                  />
                </Grid>
              </Section>

              <Section title="Location">
                <Grid>
                  <Input label="City" onChange={(v) => updateForm("city", v)} />
                  <Input label="Area" onChange={(v) => updateForm("area", v)} />
                  <Input label="Building (optional)" onChange={(v) => updateForm("building", v)} />
                  <Input label="Landmark / Location" onChange={(v) => updateForm("location", v)} />
                </Grid>
              </Section>
            </>
          )}

          {/* STEP 2 — TEXT */}
          {step === 2 && method === "TEXT" && (
            <Section title="Paste Property Details">
              <textarea
                rows={6}
                value={rawText}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setRawText(e.target.value)
                }
                placeholder="Paste WhatsApp message, SMS, or call notes here..."
                className="w-full rounded-md border p-3 text-sm"
              />
            </Section>
          )}

          {/* SOURCE (MANDATORY) */}
          {step === 2 && (
            <Section title="Property Source (Required)">
              <Grid>
              <Select
  label="Source Type"
  value={source.type}
  options={SOURCE_TYPES}
  onChange={(v) => updateSource("type", v)}
/>

                <Input
                  label="Contact Number"
                  onChange={(v) => updateSource("contactNumber", v)}
                />
                <Input label="Name (optional)" onChange={(v) => updateSource("name", v)} />
                <Input
                  label="Firm Name (optional)"
                  onChange={(v) => updateSource("firmName", v)}
                />
              </Grid>
            </Section>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-between border-t px-5 py-4">
          <button
            onClick={() => (step === 1 ? onClose() : setStep(1))}
            className="rounded-md border px-4 py-2 text-sm hover:border-indigo-500 hover:bg-indigo-500 hover:text-white"
          >
            Back
          </button>

          {step === 2 && (
            <button
              onClick={handleSubmit}
              className="rounded-md bg-indigo-600 px-6 py-2 text-sm text-white"
            >
              Add Property
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* UI HELPERS (TYPED) */
/* ------------------------------------------------------------------ */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-slate-700">{title}</div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>;
}

function Input({
  label,
  onChange,
}: {
  label: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-500">{label}</label>
      <input
        className="h-9 w-full rounded-md border px-3 text-sm"
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
      />
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border px-3 text-sm"
      >
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}

