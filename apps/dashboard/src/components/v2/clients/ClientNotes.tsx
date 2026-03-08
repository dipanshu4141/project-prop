"use client";

import { useState, useTransition } from "react";
import { API_BASE } from "@/lib/apiBase";


// const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

type Note = {
  id: string;
  note: string;
  createdAt: string;
};

export function ClientNotes({ clientId, notes }: { clientId: string; notes: Note[] }) {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  function saveNote() {
    if (!text.trim()) return;

    startTransition(async () => {
      await fetch(`${API_BASE}/clients/${clientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: text }),
      });
      setText("");
      window.location.reload();
    });
  }

  return (
    <div className="space-y-4">
      {/* Input */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a quick note…"
        className="w-full resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1"
        rows={3}
      />

      <div className="flex justify-end">
        <button
          onClick={saveNote}
          disabled={isPending}
          className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
        >
          Save
        </button>
      </div>

      {/* Notes */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No notes yet
          </div>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="text-sm">
              <div>{n.note}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
