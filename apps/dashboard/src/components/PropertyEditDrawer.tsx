'use client';

import { useState } from "react";
import { ActivityLog } from "./ActivityLog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ================= ENUM OPTIONS =================

const FURNISHING_OPTIONS = ["", "UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"];
const LISTING_TYPE_OPTIONS = ["", "RENT", "SALE"];
const CATEGORY_OPTIONS = ["", "RESIDENTIAL", "COMMERCIAL"];
const SUBTYPE_OPTIONS = ["", "APARTMENT", "SHOP", "OFFICE", "VILLA", "OTHER"];
const URGENCY_OPTIONS = ["", "NORMAL", "URGENT", "VERY_URGENT"];
const STATUS_OPTIONS = ["NEW", "REVIEW", "APPROVED", "REJECTED"];

// ================= TYPES =================

interface Property {
  id: string;
  price: string | null;
  deposit: string | null;
  area: string | null;
  building: string | null;
  bhk: string | null;
  furnishing: string | null;
  location: string | null;
  listingType: string | null;
  propertyCategory: string | null;
  propertySubType: string | null;
  urgencyLevel: string | null;
  status: string;
}

// ================= COMPONENT =================

export function PropertyEditDrawer({
  property,
  onClose,
}: {
  property: Property;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    price: property.price ?? "",
    deposit: property.deposit ?? "",
    area: property.area ?? "",
    building: property.building ?? "",
    bhk: property.bhk ?? "",
    furnishing: property.furnishing ?? "",
    location: property.location ?? "",
    listingType: property.listingType ?? "",
    propertyCategory: property.propertyCategory ?? "",
    propertySubType: property.propertySubType ?? "",
    urgencyLevel: property.urgencyLevel ?? "",
    status: property.status ?? "REVIEW",
  });

  function setField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // ================= SAVE MUTATION =================

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const res = await fetch(`${API_URL}/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });

  // ================= UI =================

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex justify-end">
      <div className="bg-white w-[420px] h-full p-6 overflow-y-auto">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Edit Property</h2>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>

        {/* ================= FORM ================= */}

        <div className="space-y-3">
          <Input label="Area" value={form.area} onChange={(v: string) => setField("area", v)} />
          <Input label="Building" value={form.building} onChange={(v: string) => setField("building", v)} />
          <Input label="Location" value={form.location} onChange={(v: string) => setField("location", v)} />
          <Input label="BHK" value={form.bhk} onChange={(v: string) => setField("bhk", v)} />
          <Input label="Price" value={form.price} onChange={(v: string) => setField("price", v)} />
          <Input label="Deposit" value={form.deposit} onChange={(v: string) => setField("deposit", v)} />

          <Select label="Listing Type" value={form.listingType} options={LISTING_TYPE_OPTIONS} onChange={(v: string) => setField("listingType", v)} />
          <Select label="Category" value={form.propertyCategory} options={CATEGORY_OPTIONS} onChange={(v: string) => setField("propertyCategory", v)} />
          <Select label="Sub Type" value={form.propertySubType} options={SUBTYPE_OPTIONS} onChange={(v: string) => setField("propertySubType", v)} />
          <Select label="Furnishing" value={form.furnishing} options={FURNISHING_OPTIONS} onChange={(v: string) => setField("furnishing", v)} />
          <Select label="Urgency" value={form.urgencyLevel} options={URGENCY_OPTIONS} onChange={(v: string) => setField("urgencyLevel", v)} />
          <Select label="Status" value={form.status} options={STATUS_OPTIONS} onChange={(v: string) => setField("status", v)} />
        </div>

        {/* ================= ACTIVITY LOG ================= */}

        <div className="mt-8 border-t pt-4">
          <h3 className="font-bold mb-3">🕒 Activity Log</h3>
          <ActivityLog propertyId={property.id} />
        </div>

        {/* ================= ACTION BUTTONS ================= */}

        <div className="mt-6 flex flex-col gap-3">
          <Button
            disabled={saveMutation.isPending}
            className="w-full"
            onClick={async () => {
              await saveMutation.mutateAsync(form);
              onClose();
            }}
          >
            💾 Save
          </Button>
        </div>

      </div>
    </div>
  );
}

// ================= UI HELPERS =================

function Input({ label, value, onChange }: any) {
  return (
    <div>
      <label className="text-sm text-gray-600">{label}</label>
      <input className="border w-full px-3 py-2 rounded" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Select({ label, value, options, onChange }: any) {
  return (
    <div>
      <label className="text-sm text-gray-600">{label}</label>
      <select className="border w-full px-3 py-2 rounded bg-white" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">-- Select --</option>
        {options.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

// function Input({
//   label,
//   value,
//   onChange,
// }: {
//   label: string;
//   value: string;
//   onChange: (v: string) => void;
// }) {
//   return (
//     <div>
//       <label className="text-sm text-gray-600">{label}</label>
//       <input
//         className="border w-full px-3 py-2 rounded"
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//       />
//     </div>
//   );
// }

// function Select({
//   label,
//   value,
//   options,
//   onChange,
// }: {
//   label: string;
//   value: string;
//   options: string[];
//   onChange: (v: string) => void;
// }) {
//   return (
//     <div>
//       <label className="text-sm text-gray-600">{label}</label>
//       <select
//         className="border w-full px-3 py-2 rounded bg-white"
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//       >
//         <option value="">-- Select --</option>
//         {options.map((opt) => (
//           <option key={opt} value={opt}>
//             {opt}
//           </option>
//         ))}
//       </select>
//     </div>
//   );
// }
