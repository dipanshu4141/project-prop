'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const STAGES = ["NEW", "CONTACTED", "VISIT", "NEGOTIATION", "CLOSED", "LOST"];

export function LeadDrawer({ lead, onClose }: { lead: any; onClose: () => void }) {
  const [stage, setStage] = useState(lead.leadStage);
  const [followUpAt, setFollowUpAt] = useState(
    lead.followUpAt ? lead.followUpAt.slice(0, 10) : ""
  );
  const [notes, setNotes] = useState(lead.notes || "");

  async function save() {
    await fetch(`${API_URL}/properties/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadStage: stage,
        followUpAt: followUpAt || null,
        notes,
      }),
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex justify-end">
      <div className="bg-white w-[420px] h-full p-6 overflow-y-auto">

        <div className="flex justify-between items-center mb-4">
          <div className="font-bold text-lg">
            {lead.targetName || "Client"} • {lead.targetContact || ""}
          </div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>

        <div className="space-y-4">

          <div className="flex gap-2">
            {lead.targetContact && (
              <a href={`tel:${lead.targetContact}`}>
                <Button>📞 Call</Button>
              </a>
            )}
            {lead.targetContact && (
              <a target="_blank" href={`https://wa.me/${lead.targetContact}`}>
                <Button variant="outline">💬 WhatsApp</Button>
              </a>
            )}
          </div>

          <div>
            <label className="text-sm text-gray-600">Stage</label>
            <select
              className="border w-full px-3 py-2 rounded"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
            >
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
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

          <div>
            <label className="text-sm text-gray-600">Notes</label>
            <textarea
              className="border w-full px-3 py-2 rounded"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button className="w-full" onClick={save}>
            💾 Save Lead
          </Button>

        </div>
      </div>
    </div>
  );
}
