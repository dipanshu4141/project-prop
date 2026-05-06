'use client';

import { useState } from "react";
import { LeadsSection } from "./LeadsSection";
import { Button } from "@/components/ui/button";
import { LeadActionPanel } from "./LeadActionPanel";
import { SharePropertyModal } from "./SharePropertyModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ================= UI HELPERS =================

function Section({
  title,
  summary,
  children,
}: {
  title: string;
  summary: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-lg mb-4 overflow-hidden">
      <div
        className="p-4 bg-gray-50 cursor-pointer flex justify-between items-center"
        onClick={() => setOpen(!open)}
      >
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-gray-600">{summary}</div>
        </div>
        <div className="text-sm">{open ? "▲" : "▼"}</div>
      </div>

      {open && <div className="p-4 bg-white">{children}</div>}
    </div>
  );
}

function InfoTable({ rows }: { rows: { label: string; value: any }[] }) {
  return (
    <table className="w-full text-sm border border-gray-200">
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b last:border-b-0">
            <td className="w-1/3 p-2 font-medium text-gray-600 bg-gray-50">
              {r.label}
            </td>
            <td className="p-2">{r.value || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ================= MAIN COMPONENT =================

export function PropertyViewDrawer({
  property,
  onClose,
  onEdit,
}: {
  property: any;
  onClose: () => void;
  onEdit: (prop: any) => void;
}) {
  const queryClient = useQueryClient();
  const [showShare, setShowShare] = useState(false);

  // ================= STATUS MUTATION =================

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`${API_URL}/properties/${property.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      onClose(); // close drawer after update
    },
  });

  function changeStatus(status: string) {
    statusMutation.mutate(status);
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex justify-end">
      <div className="bg-white w-[650px] h-full p-6 overflow-y-auto">

        {/* ===== BROKER ACTION PANEL ===== */}
        <LeadActionPanel property={property} />

        {/* ===== HEADER ===== */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Property Overview</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button variant="outline" onClick={() => onEdit(property)}>✏️ Edit</Button>
          </div>
        </div>

        {/* ===== PRIMARY ACTIONS ===== */}
        <div className="flex gap-2 mb-6">
          <Button onClick={() => setShowShare(true)}>📤 Share</Button>

          <Button
            variant="outline"
            disabled={statusMutation.isPending || property.status === "REVIEW"}
            onClick={() => changeStatus("REVIEW")}
          >
            🟡 Review
          </Button>

          <Button
            className="bg-green-600"
            disabled={statusMutation.isPending || property.status === "APPROVED"}
            onClick={() => changeStatus("APPROVED")}
          >
            ✅ Approve
          </Button>

          <Button
            variant="destructive"
            disabled={statusMutation.isPending || property.status === "REJECTED"}
            onClick={() => changeStatus("REJECTED")}
          >
            ❌ Reject
          </Button>
        </div>

        {/* ================= AGENT INFO ================= */}
        <Section
          title="🧑 Agent / Source Info"
          summary={`${property.agentName || "Unknown"} • ${property.agentPhone || "-"}`}
        >
          <InfoTable
            rows={[
              { label: "Agent Name", value: property.agentName },
              {
                label: "Agent Phone",
                value: property.agentPhone ? (
                  <a className="text-blue-600 underline" href={`tel:${property.agentPhone}`}>
                    📞 {property.agentPhone}
                  </a>
                ) : "-",
              },
              { label: "Sender Contact", value: property.senderContact },
              { label: "Firm Name", value: property.firmName },
            ]}
          />
        </Section>

        {/* ================= PROPERTY DETAILS ================= */}
        <Section
          title="🏠 Property Details"
          summary={`${property.bhk || "-"} BHK • ${property.areaSqft || property.area || "-"} sqft • ₹${property.price || "-"}`}
        >
          <InfoTable
            rows={[
              { label: "Area (sqft)", value: property.areaSqft || property.area },
              { label: "BHK", value: property.bhk },
              { label: "Price", value: property.price },
              { label: "Deposit", value: property.deposit },
              { label: "Furnishing", value: property.furnishing },
              { label: "Negotiable", value: property.negotiable ? "Yes" : "No" },
              { label: "Category", value: property.propertyCategory },
              { label: "Sub Category", value: property.propertySubType },
            ]}
          />
        </Section>

        {/* ================= LOCATION ================= */}
        <Section
          title="📍 Location"
          summary={`${property.building || ""} ${property.city || ""}`}
        >
          <InfoTable
            rows={[
              { label: "Building", value: property.building },
              { label: "Area", value: property.area },
              { label: "City", value: property.city },
              { label: "Country", value: property.country || "India" },
            ]}
          />
        </Section>

        {/* ================= STATUS ================= */}
        <Section
          title="⚙️ Status"
          summary={`${property.status} • ${property.urgencyLevel || "NORMAL"}`}
        >
          <InfoTable
            rows={[
              { label: "Status", value: property.status },
              { label: "Urgency", value: property.urgencyLevel },
              { label: "Available From", value: property.availableFrom },
            ]}
          />
        </Section>

        {/* ================= LEADS ================= */}
        <Section
          title="🧑‍💼 Leads"
          summary="Clients interested in this property"
        >
          <LeadsSection propertyId={property.id} />
        </Section>

        {/* ================= DISTRIBUTION ================= */}
        <Section
          title="📤 Distribution History"
          summary="Where this property was shared"
        >
          <div className="text-sm text-gray-500">
            (Will show WhatsApp, groups, portals etc here)
          </div>
        </Section>

        {/* ================= SHARE MODAL ================= */}
        {showShare && (
          <SharePropertyModal
            property={property}
            onClose={() => setShowShare(false)}
          />
        )}

      </div>
    </div>
  );
}
