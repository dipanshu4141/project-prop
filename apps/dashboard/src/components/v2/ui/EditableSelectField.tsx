"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

export function EditableSelectField({
  label,
  value,
  options,
  propertyId,
  field,
}: {
  label: string;
  value: string | null;
  options: string[];
  propertyId: string;
  field: string;
}) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(value ?? "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function save(next: string) {
    if (next === value) {
      setEditing(false);
      return;
    }

    setLoading(true);

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/properties/${propertyId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: next }),
      }
    );

    setLoading(false);
    setEditing(false);

    // 🔥 re-fetch server data
    router.refresh();
  }

  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">
        {label}
      </div>

      {!editing ? (
        <div className="flex items-center gap-2">
          <div className="text-sm">
            {value ?? "—"}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <select
          autoFocus
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value);
            save(e.target.value);
          }}
          disabled={loading}
          onBlur={() => setEditing(false)}
          className="h-8 w-full rounded-md border px-2 text-sm"
        >
          <option value="" disabled>
            Select…
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
