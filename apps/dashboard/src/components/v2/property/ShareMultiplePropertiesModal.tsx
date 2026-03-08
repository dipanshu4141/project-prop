"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppMessageForMultiple } from "@/utils/buildWhatsAppMessage";
import { API_BASE } from "@/lib/apiBase";

/* ------------------------------------------------------------------ */
/* TYPES */
/* ------------------------------------------------------------------ */

type Property = {
  id: string;
  [key: string]: any;
};

type TeamMember = {
  id: string;
  name: string;
  phone: string;
};

/* ------------------------------------------------------------------ */
/* COMPONENT */
/* ------------------------------------------------------------------ */

export function ShareMultiplePropertiesModal({
  propertiesMap,
  onClose,
}: {
  propertiesMap: Record<string, Property | null>;
  onClose: () => void;
}) {
  /* ---------------- CLIENT ---------------- */
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  /* ---------------- TEAM ---------------- */
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  /* ---------------- PROPERTIES ---------------- */
  const [resolvedProperties, setResolvedProperties] = useState<Property[]>([]);
  const [resolving, setResolving] = useState(true);

  /* ---------------- UI ---------------- */
  const [loading, setLoading] = useState(false);

  const propertyIds = useMemo(
    () => Object.keys(propertiesMap),
    [propertiesMap]
  );

  /* ------------------------------------------------------------------ */
  /* LOAD TEAM */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    async function loadTeam() {
      try {
        const res = await fetch(`${API_BASE}/team`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load team");

        const data = await res.json();
        const list =
          data?.items || data?.data || (Array.isArray(data) ? data : []);

        if (!cancelled) {
          setTeam(Array.isArray(list) ? list : []);
        }
      } catch {
        if (!cancelled) setTeam([]);
      }
    }

    loadTeam();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ------------------------------------------------------------------ */
  /* RESOLVE PROPERTIES */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    async function resolveAll() {
      setResolving(true);

      const known = Object.values(propertiesMap).filter(
        (p): p is Property => Boolean(p)
      );

      const missingIds = propertyIds.filter(
        (id) => !propertiesMap[id]
      );

      const fetched: Property[] = [];

      for (const id of missingIds) {
        try {
          const res = await fetch(`${API_BASE}/properties/${id}`, {
            cache: "no-store",
          });
          if (!res.ok) continue;
          fetched.push(await res.json());
        } catch {
          /* ignore */
        }
      }

      if (!cancelled) {
        setResolvedProperties([...known, ...fetched]);
        setResolving(false);
      }
    }

    resolveAll();
    return () => {
      cancelled = true;
    };
  }, [propertiesMap, propertyIds]);

  /* ------------------------------------------------------------------ */
  /* TEAM SELECTION */
  /* ------------------------------------------------------------------ */

  function toggleTeam(id: string) {
    setSelectedTeamIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  const selectedTeam = useMemo(
    () => team.filter((t) => selectedTeamIds.includes(t.id)),
    [team, selectedTeamIds]
  );

  /* ------------------------------------------------------------------ */
  /* PREVIEW */
  /* ------------------------------------------------------------------ */

  const previewMessage = useMemo(() => {
    if (resolving) return "Preparing message…";
    if (resolvedProperties.length === 0)
      return "No properties selected.";
    if (selectedTeam.length === 0)
      return "Select team to preview message…";

    return buildWhatsAppMessageForMultiple(
      resolvedProperties,
      selectedTeam,
      clientName
    );
  }, [resolvedProperties, selectedTeam, clientName, resolving]);

  /* ------------------------------------------------------------------ */
  /* SHARE */
  /* ------------------------------------------------------------------ */

  async function share() {
  /* -------------------------------------------------- */
  /* 0️⃣ BASIC GUARDS                                   */
  /* -------------------------------------------------- */
  if (
    !clientPhone ||
    selectedTeam.length === 0 ||
    resolvedProperties.length === 0
  ) {
    return;
  }

  /* -------------------------------------------------- */
  /* 1️⃣ NORMALIZE PHONE (REQUIRED FOR BOTH SIDES)      */
  /* -------------------------------------------------- */
  const phone = clientPhone.replace(/\D/g, "");
  if (!phone) return;

  /* -------------------------------------------------- */
  /* 2️⃣ BUILD MESSAGE (UNICODE SAFE)                   */
  /* -------------------------------------------------- */
  const message = buildWhatsAppMessageForMultiple(
    resolvedProperties,
    selectedTeam,
    clientName
  );

  /* -------------------------------------------------- */
  /* 3️⃣ BUILD WHATSAPP URL (BUT DO NOT OPEN YET)       */
  /* -------------------------------------------------- */
  const params = new URLSearchParams();
  params.set("phone", `91${phone}`);
  params.set("text", message);

  /* -------------------------------------------------- */
  /* 4️⃣ BACKEND ATTACH (CRITICAL: MUST RUN FIRST)      */
  /* -------------------------------------------------- */
  setLoading(true);

  try {
    console.log("API_BASE =", API_BASE);
    await Promise.all(
      resolvedProperties.map((p) =>
        fetch(`${API_BASE}/properties/${p.id}/share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientName,
            clientPhone: phone,
            teamMemberIds: selectedTeamIds,
            platform: "WHATSAPP",
          }),
        })
      )
    );
    console.log("WhatsappFethAPI_BASE =", API_BASE);

    /* -------------------------------------------------- */
    /* 5️⃣ OPEN WHATSAPP (SAFE — DB IS ALREADY UPDATED)  */
    /* -------------------------------------------------- */
    window.open(
      `https://api.whatsapp.com/send/?${params.toString()}`,
      "_blank",
      "noopener,noreferrer"
    );
  } catch (err) {
    console.error("Failed to attach leads:", err);
  } finally {
    /* -------------------------------------------------- */
    /* 6️⃣ CLEANUP UI                                   */
    /* -------------------------------------------------- */
    setLoading(false);
    onClose();
  }
}
 

  /* ------------------------------------------------------------------ */
  /* UI */
  /* ------------------------------------------------------------------ */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[700px] max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 space-y-4">
        <div className="text-lg font-bold">
          📤 Share {propertyIds.length} Properties
        </div>

        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Client name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
        />

        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Client phone number"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
        />

        <div className="max-h-[200px] divide-y overflow-y-auto rounded border">
          {team.map((m) => (
            <label
              key={m.id}
              className="flex gap-3 p-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedTeamIds.includes(m.id)}
                onChange={() => toggleTeam(m.id)}
              />
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-sm text-gray-500">
                  {m.phone}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="rounded border bg-gray-50 p-3 whitespace-pre-wrap text-sm">
          {previewMessage}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={loading || resolving} onClick={share}>
            {loading ? "Sharing…" : "Share on WhatsApp"}
          </Button>
        </div>
      </div>
    </div>
  );
}
