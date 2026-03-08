"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

export function EditableField({
  label,
  value,
  propertyId,
  field,
  type = "text",
}: {
  label: string;
  value: any;
  propertyId: string;
  field: string;
  type?: "text" | "number";
}) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(value ?? "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function save() {
    setLoading(true);

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/properties/${propertyId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: current }),
      }
    );

    setLoading(false);
    setEditing(false);

    // 🔥 re-fetch property + activity
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
        <input
          autoFocus
          type={type}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          disabled={loading}
          className="h-8 w-full rounded-md border px-2 text-sm"
        />
      )}
    </div>
  );
}
