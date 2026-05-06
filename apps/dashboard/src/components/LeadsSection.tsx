'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LeadDrawer } from "./LeadDrawer";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function LeadsSection({ propertyId }: { propertyId: string }) {
  const [openLead, setOpenLead] = useState<any | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data: leads = [], refetch } = useQuery({
    queryKey: ["leads", propertyId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/properties/${propertyId}/leads`);
      return res.json();
    },
  });

  return (
    <div className="space-y-3">

      <div className="flex justify-between items-center">
        <div className="font-semibold">Leads</div>
        <Button size="sm" onClick={() => setShowAdd(true)}>➕ Add Lead</Button>
      </div>

      <div className="border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Client</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Stage</th>
              <th className="p-2 text-left">Follow-up</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l: any) => (
              <tr key={l.id} className="border-t">
                <td className="p-2">{l.targetName || "—"}</td>
                <td className="p-2">{l.targetContact || "—"}</td>
                <td className="p-2">{l.leadStage}</td>
                <td className="p-2">
                  {l.followUpAt ? new Date(l.followUpAt).toLocaleDateString() : "—"}
                </td>
                <td className="p-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => setOpenLead(l)}>
                    Open
                  </Button>
                </td>
              </tr>
            ))}

            {leads.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No leads yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {openLead && (
        <LeadDrawer
          lead={openLead}
          onClose={() => {
            setOpenLead(null);
            refetch();
          }}
        />
      )}

      {showAdd && (
        <AddLeadModal
          propertyId={propertyId}
          onClose={() => {
            setShowAdd(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

// ================= ADD MODAL =================

function AddLeadModal({ propertyId, onClose }: { propertyId: string; onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  async function save() {
    await fetch(`${API_URL}/properties/${propertyId}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded w-[400px] space-y-4">
        <div className="font-bold text-lg">Add Lead</div>

        <input
          className="border w-full px-3 py-2 rounded"
          placeholder="Client name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="border w-full px-3 py-2 rounded"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Create</Button>
        </div>
      </div>
    </div>
  );
}
