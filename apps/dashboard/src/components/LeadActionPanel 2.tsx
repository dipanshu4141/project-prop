'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const STAGES = ["NEW", "CONTACTED", "CLOSED", "LOST"];

export function LeadActionPanel({ property }: { property: any }) {
  const queryClient = useQueryClient();

  const [stage, setStage] = useState(property.leadStage || "NEW");
  const [followUpAt, setFollowUpAt] = useState(
    property.followUpAt ? property.followUpAt.slice(0, 10) : ""
  );
  const [notes, setNotes] = useState(property.notes || "");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/properties/${property.id}/lead`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadStage: stage,
          followUpAt: followUpAt || null,
          notes,
        }),
      });

      if (!res.ok) throw new Error("Failed to save lead info");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["activities", property.id] });
    },
  });

  return (
    <div className="border rounded-lg p-4 mb-4 bg-blue-50">

      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-lg font-bold">
            {property.building || "Unknown Building"} — {property.area || ""}
          </div>
          <div className="text-sm text-gray-600">
            ₹{property.price || "-"} • {property.bhk || "-"} BHK
          </div>
        </div>

        <div className="flex gap-2">
          {property.agentPhone && (
            <a href={`tel:${property.agentPhone}`}>
              <Button>📞 Call</Button>
            </a>
          )}
          {property.agentPhone && (
            <a
              href={`https://wa.me/${property.agentPhone}`}
              target="_blank"
            >
              <Button variant="outline">💬 WhatsApp</Button>
            </a>
          )}
        </div>
      </div>

      {/* ===== WORKFLOW ===== */}
      <div className="grid grid-cols-4 gap-3 items-end">

        <div>
          <label className="text-sm text-gray-600">Lead Stage</label>
          <select
            className="border w-full px-3 py-2 rounded bg-white"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">Follow-up date</label>
          <input
            type="date"
            className="border w-full px-3 py-2 rounded"
            value={followUpAt}
            onChange={(e) => setFollowUpAt(e.target.value)}
          />
        </div>

        <div className="col-span-2">
          <label className="text-sm text-gray-600">Notes</label>
          <input
            className="border w-full px-3 py-2 rounded"
            placeholder="Called, client wants visit..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

      </div>

      <div className="mt-3 flex justify-end">
        <Button
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          💾 Save Progress
        </Button>
      </div>
    </div>
  );
}
