'use client';

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
// import { buildWhatsAppMessage } from "@/utils/buildWhatsAppMessage";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function SharePropertyModal({
  property,
  onClose,
}: {
  property: any;
  onClose: () => void;
}) {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [team, setTeam] = useState<any[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load team members
  useEffect(() => {
    fetch(`${API_URL}/team`)
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res)) {
          setTeam(res);
        } else if (Array.isArray((res as any).items)) {
          setTeam((res as any).items);
        } else if (Array.isArray((res as any).data)) {
          setTeam((res as any).data);
        } else {
          console.error("Unexpected /team response:", res);
          setTeam([]);
        }
      });
  }, []);

  function toggleTeam(id: string) {
    setSelectedTeamIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const selectedTeam = useMemo(
    () => team.filter((t) => selectedTeamIds.includes(t.id)),
    [team, selectedTeamIds]
  );

  // 🔮 Live preview message
  const previewMessage = useMemo(() => {
    if (selectedTeam.length === 0) {
      return "Select at least one team member to see message preview...";
    }
    // return buildWhatsAppMessage(property, selectedTeam);
  }, [property, selectedTeam]);

  async function share() {
    if (!clientPhone) {
      alert("Please enter client phone number");
      return;
    }

    if (selectedTeamIds.length === 0) {
      alert("Please select at least one team member");
      return;
    }

    setLoading(true);

    // 1) Call backend to log lead + distribution
    await fetch(`${API_URL}/properties/${property.id}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "WHATSAPP",
        clientName,
        clientPhone,
        teamMemberIds: selectedTeamIds,
      }),
    });

    // 2) Open WhatsApp
    // const encoded = encodeURIComponent(previewMessage);
    const phone = clientPhone.replace(/\D/g, "");
    // const url = `https://wa.me/91${phone}?text=${encoded}`;
    // window.open(url, "_blank");

    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white w-[700px] max-h-[90vh] overflow-y-auto rounded-lg p-6 space-y-4">

        <div className="flex justify-between items-center">
          <div className="text-lg font-bold">📤 Share Property</div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>

        {/* Client info */}
        <div className="space-y-2">
          <div className="font-semibold">Client</div>

          <input
            className="border w-full px-3 py-2 rounded"
            placeholder="Client name (optional)"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />

          <input
            className="border w-full px-3 py-2 rounded"
            placeholder="Client phone number"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
          />
        </div>

        {/* Team selection */}
        <div className="space-y-2">
          <div className="font-semibold">Show these contacts in message</div>

          <div className="border rounded divide-y max-h-[200px] overflow-y-auto">
            {team.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedTeamIds.includes(m.id)}
                  onChange={() => toggleTeam(m.id)}
                />
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-sm text-gray-500">{m.phone}</div>
                </div>
              </label>
            ))}

            {team.length === 0 && (
              <div className="p-4 text-sm text-gray-500">
                No team members found. Please add some first.
              </div>
            )}
          </div>
        </div>

        {/* 🧾 MESSAGE PREVIEW */}
        <div className="space-y-2">
          <div className="font-semibold">📄 Message Preview</div>
          <div className="border rounded p-3 bg-gray-50 text-sm whitespace-pre-wrap max-h-[250px] overflow-y-auto">
            {previewMessage}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={loading} onClick={share}>
            {loading ? "Sharing..." : "📤 Share on WhatsApp"}
          </Button>
        </div>
      </div>
    </div>
  );
}
