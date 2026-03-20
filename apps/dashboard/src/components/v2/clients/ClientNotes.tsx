"use client";

import { useState, useTransition } from "react";
import { Loader2, StickyNote } from "lucide-react";
import { apiPost } from "@/lib/api";

type Note = {
  id:        string;
  note:      string;
  createdAt: string;
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function ClientNotes({
  clientId,
  notes: initialNotes,
}: {
  clientId: string;
  notes:    Note[];
}) {
  const [notes,     setNotes]     = useState<Note[]>(initialNotes);
  const [text,      setText]      = useState("");
  const [isPending, startTransition] = useTransition();
  const [error,     setError]     = useState("");

  function saveNote() {
    if (!text.trim()) return;
    setError("");
    startTransition(async () => {
      try {
        await apiPost(`/clients/${clientId}/notes`, { note: text.trim() });
        // Optimistic update — prepend the new note
        setNotes((prev) => [
          {
            id:        crypto.randomUUID(),
            note:      text.trim(),
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setText("");
      } catch (err: any) {
        setError(err.message ?? "Failed to save note");
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      saveNote();
    }
  }

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:bg-white focus-within:border-slate-400 transition-colors">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a quick note… (⌘+Enter to save)"
          rows={3}
          className="w-full resize-none bg-transparent px-3 pt-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
        <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">⌘+Enter to save</p>
          <button
            onClick={saveNote}
            disabled={isPending || !text.trim()}
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-[#0B1F14] text-[12px] font-semibold text-white hover:bg-[#1A3525] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            Save
          </button>
        </div>
      </div>

      {error && (
        <p className="text-[12px] text-red-600">{error}</p>
      )}

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <StickyNote className="h-6 w-6 text-slate-300 mb-2" />
          <p className="text-[12.5px] text-slate-500">No notes yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[13px] text-slate-800 leading-relaxed whitespace-pre-wrap">
                {n.note}
              </p>
              <p className="mt-1.5 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}