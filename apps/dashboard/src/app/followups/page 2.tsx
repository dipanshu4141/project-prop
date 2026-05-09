'use client';

export const dynamic = 'force-dynamic';


import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function LeadRow({ lead }: { lead: any }) {
  const p = lead.property;

  return (
    <div className="border rounded p-4 bg-white flex justify-between items-center">
      <div>
        <div className="font-semibold">
          {p.bhk || ""} BHK • {p.building || p.area || "Property"}
        </div>

        <div className="text-sm text-gray-600">
          ₹{p.price || "-"} • {p.area || "-"}
        </div>

        <div className="text-sm mt-1">
          👤 {lead.targetName || "Client"} • 📞 {lead.targetContact}
        </div>

        <div className="text-xs text-gray-500 mt-1">
          Follow-up: {new Date(lead.followUpAt).toLocaleString()}
        </div>
      </div>

      <div className="flex gap-2">
        <a href={`tel:${lead.targetContact}`}>
          <Button>📞 Call</Button>
        </a>

        <a
          target="_blank"
          href={`https://wa.me/91${lead.targetContact}`}
        >
          <Button variant="outline">💬 WhatsApp</Button>
        </a>
      </div>
    </div>
  );
}

export default function FollowupsPage() {
  const todayQuery = useQuery({
    queryKey: ["followups-today"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/properties/leads/followups-today`);
      return res.json();
    },
  });

  const overdueQuery = useQuery({
    queryKey: ["followups-overdue"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/properties/leads/followups-overdue`);
      return res.json();
    },
  });

  const today = todayQuery.data || [];
  const overdue = overdueQuery.data || [];

  return (
    <div className="p-6 space-y-8">

      <div>
        <h1 className="text-2xl font-bold mb-4">🔔 Today’s Follow-ups</h1>

        <div className="space-y-3">
          {today.length === 0 && (
            <div className="text-gray-500">No follow-ups for today 🎉</div>
          )}

          {today.map((l: any) => (
            <LeadRow key={l.id} lead={l} />
          ))}
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold mb-4 text-red-600">⚠️ Overdue Follow-ups</h1>

        <div className="space-y-3">
          {overdue.length === 0 && (
            <div className="text-gray-500">No overdue follow-ups 🎉</div>
          )}

          {overdue.map((l: any) => (
            <LeadRow key={l.id} lead={l} />
          ))}
        </div>
      </div>

    </div>
  );
}