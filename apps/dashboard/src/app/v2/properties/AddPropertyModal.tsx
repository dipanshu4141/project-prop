"use client";

import { X, FileText, MessageSquare, ChevronRight, Check } from "lucide-react";
import { useState, ChangeEvent, useEffect } from "react";
import { apiPost } from "@/lib/api";

/* ------------------------------------------------------------------ */
/* TYPES  (unchanged)                                                  */
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
type SourceType = (typeof SOURCE_TYPES)[number];

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
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
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<PropertyFormData>({});
  const [rawText, setRawText] = useState("");
  const [source, setSource] = useState<SourceData>({
    type: "",
    contactNumber: "",
    name: "",
    firmName: "",
  });

  function resetState() {
    setStep(1);
    setMethod(null);
    setFormData({});
    setRawText("");
    setSubmitting(false);
    setSource({ type: "", contactNumber: "", name: "", firmName: "" });
  }

  useEffect(() => {
    if (!open) return;
    resetState();
  }, [open]);

  if (!open) return null;

  function updateForm<K extends keyof PropertyFormData>(k: K, v: string) {
    setFormData((d) => ({ ...d, [k]: v }));
  }

  function updateSource<K extends keyof SourceData>(k: K, v: string) {
    setSource((s) => ({ ...s, [k]: v }));
  }

  async function handleSubmit() {
    if (!source.contactNumber) {
      alert("Contact number is mandatory");
      return;
    }
    if (!source.type) {
      alert("Source type is required");
      return;
    }

    setSubmitting(true);

    const payload = {
      method,
      propertyData: method === "FORM" ? formData : undefined,
      rawText: method === "TEXT" ? rawText : undefined,
      source,
    };

    try {
      await apiPost('/properties/manual', payload);
      onClose();
    } catch {
      alert("Failed to add property");
    } finally {
      setSubmitting(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /* RENDER                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {/* Step indicator */}
            <div className="flex items-center gap-1.5">
              <StepDot n={1} active={step === 1} done={step > 1} />
              <div className="w-8 h-px bg-slate-200" />
              <StepDot n={2} active={step === 2} done={false} />
            </div>
            <span className="text-[13px] text-slate-400 font-medium">
              {step === 1 ? "Choose method" : method === "FORM" ? "Fill details" : "Paste details"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* STEP 1 — choose method */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-[18px] font-semibold text-slate-900 tracking-tight">
                  Add a property
                </h2>
                <p className="mt-1 text-[13px] text-slate-500">
                  How would you like to add this listing?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <MethodCard
                  icon={<FileText className="h-5 w-5" />}
                  title="Fill a form"
                  description="Structured fields — ideal for new listings"
                  onClick={() => { setMethod("FORM"); setStep(2); }}
                />
                <MethodCard
                  icon={<MessageSquare className="h-5 w-5" />}
                  title="Paste message"
                  description="Paste a WhatsApp message, SMS, or call notes"
                  onClick={() => { setMethod("TEXT"); setStep(2); }}
                />
              </div>
            </div>
          )}

          {/* STEP 2 — FORM */}
          {step === 2 && method === "FORM" && (
            <>
              <FormSection title="Property details">
                <FieldGrid>
                  <FieldSelect
                    label="Listing type"
                    value={formData.listingType ?? ""}
                    options={["RENT", "SALE"]}
                    onChange={(v) => updateForm("listingType", v)}
                  />
                  <FieldSelect
                    label="Category"
                    value={formData.category ?? ""}
                    options={["RESIDENTIAL", "COMMERCIAL"]}
                    onChange={(v) => updateForm("category", v)}
                  />
                  <FieldSelect
                    label="BHK"
                    value={formData.bhk ?? ""}
                    options={["Studio", "1RK", "1BHK", "2BHK", "3BHK", "4BHK", "5BHK+"]}
                    onChange={(v) => updateForm("bhk", v)}
                  />
                  <FieldSelect
                    label="Furnishing"
                    value={formData.furnishing ?? ""}
                    options={["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"]}
                    onChange={(v) => updateForm("furnishing", v)}
                  />
                  <FieldInput
                    label="Price"
                    prefix="₹"
                    type="number"
                    placeholder="e.g. 75000"
                    onChange={(v) => updateForm("price", v)}
                  />
                  <FieldInput
                    label="Deposit"
                    prefix="₹"
                    type="number"
                    placeholder="e.g. 150000"
                    onChange={(v) => updateForm("deposit", v)}
                  />
                </FieldGrid>
              </FormSection>

              <FormSection title="Location">
                <FieldGrid>
                  <FieldInput label="City" placeholder="e.g. Mumbai" onChange={(v) => updateForm("city", v)} />
                  <FieldInput label="Area" placeholder="e.g. Andheri West" onChange={(v) => updateForm("area", v)} />
                  <FieldInput label="Building" placeholder="Optional" onChange={(v) => updateForm("building", v)} />
                  <FieldInput label="Landmark / location" placeholder="Optional" onChange={(v) => updateForm("location", v)} />
                </FieldGrid>
              </FormSection>
            </>
          )}

          {/* STEP 2 — TEXT */}
          {step === 2 && method === "TEXT" && (
            <FormSection title="Paste property details">
              <textarea
                rows={7}
                value={rawText}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setRawText(e.target.value)
                }
                placeholder={`2BHK Andheri West\n850 sqft, Rent 75k\nDeposit 2L, Family Only\nBroker Rahul 9820000000`}
                className="
                  w-full resize-none rounded-xl border border-slate-200
                  bg-slate-50 px-4 py-3 text-sm text-slate-800
                  placeholder:text-slate-400 font-mono leading-relaxed
                  focus:outline-none focus:border-slate-400 focus:bg-white
                  transition-colors
                "
              />
              <p className="mt-1.5 text-[11.5px] text-slate-400">
                AI will extract all property details automatically.
              </p>
            </FormSection>
          )}

          {/* SOURCE — shown on step 2 */}
          {step === 2 && (
            <FormSection title="Source info" subtitle="Required to create the agent record">
              <FieldGrid>
                <FieldSelect
                  label="Source type"
                  value={source.type}
                  options={SOURCE_TYPES}
                  onChange={(v) => updateSource("type", v)}
                  required
                />
                <FieldInput
                  label="Contact number"
                  placeholder="+91 98200 00000"
                  type="tel"
                  onChange={(v) => updateSource("contactNumber", v)}
                  required
                />
                <FieldInput
                  label="Name"
                  placeholder="Optional"
                  onChange={(v) => updateSource("name", v)}
                />
                <FieldInput
                  label="Firm name"
                  placeholder="Optional"
                  onChange={(v) => updateSource("firmName", v)}
                />
              </FieldGrid>
            </FormSection>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/60">
          <button
            onClick={() => (step === 1 ? onClose() : setStep(1))}
            className="
              rounded-lg border border-slate-200 bg-white
              px-4 py-2 text-sm font-medium text-slate-600
              hover:border-slate-300 hover:bg-slate-50
              transition-colors
            "
          >
            {step === 1 ? "Cancel" : "← Back"}
          </button>

          {step === 2 && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="
                inline-flex items-center gap-2
                rounded-lg bg-[#0B1F14] px-5 py-2
                text-sm font-medium text-white
                hover:bg-[#1A3525] transition-all
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              {submitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Add Property
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SUB-COMPONENTS                                                      */
/* ------------------------------------------------------------------ */

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div
      className={[
        "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all",
        done
          ? "bg-emerald-500 text-white"
          : active
          ? "bg-[#0B1F14] text-white"
          : "bg-slate-100 text-slate-400",
      ].join(" ")}
    >
      {done ? <Check className="h-3 w-3" /> : n}
    </div>
  );
}

function MethodCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="
        group flex flex-col items-start gap-3 rounded-xl border-2 border-slate-100
        bg-white p-5 text-left
        hover:border-[#0B1F14] hover:bg-[#F7F5F0]
        transition-all duration-150
      "
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-[#0B1F14] group-hover:text-white transition-colors">
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-slate-800">
          {title}
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
        </div>
        <p className="mt-0.5 text-[12px] text-slate-500 leading-relaxed">{description}</p>
      </div>
    </button>
  );
}

function FormSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[13px] font-semibold text-slate-800">{title}</p>
        {subtitle && <p className="text-[11.5px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
        {children}
      </div>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function FieldInput({
  label,
  placeholder,
  type = "text",
  prefix,
  required,
  onChange,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  prefix?: string;
  required?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-[11.5px] font-medium text-slate-500">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          className={[
            "h-9 w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-800",
            "placeholder:text-slate-400",
            "focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200",
            "transition-colors",
            prefix ? "pl-7 pr-3" : "px-3",
          ].join(" ")}
        />
      </div>
    </div>
  );
}

function FieldSelect({
  label,
  value,
  options,
  required,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  required?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-[11.5px] font-medium text-slate-500">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          h-9 w-full rounded-lg border border-slate-200 bg-white
          px-3 text-sm text-slate-800
          focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200
          transition-colors appearance-none
          bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMUw2IDcgMTEgMSIgc3Ryb2tlPSIjOTRBM0I4IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] 
          bg-no-repeat bg-[right_12px_center]
        "
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