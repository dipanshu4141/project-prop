"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/v2/ui/Input";
import { API_BASE } from "@/lib/apiBase";
import { AgentListTable } from "@/components/v2/agents/AgentListTable";

export function AgentList() {
  const [agents, setAgents] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [query, setQuery] = useState("");
  const [meta, setMeta] = useState<any>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");


    useEffect(() => {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        sortOrder,
    });

    if (debouncedQuery) {
        params.set("q", debouncedQuery);
    }

    fetch(`${API_BASE}/agents?${params.toString()}`)
        .then((r) => r.json())
        .then((d) => {
        setAgents(d.items);
        setMeta(d.meta);
        })
        .catch(() => {
        setAgents([]);
        setMeta(null);
        });
    }, [page, limit, sortBy, sortOrder, debouncedQuery]);


  useEffect(() => {
    const t = setTimeout(() => {
        setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(t);
    }, [query]);


  return (
    <div className="rounded-xl border bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b p-4">
        <Input
          placeholder="Search by name, phone or firm…"
          className="w-72"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />

        
      </div>

      <AgentListTable
        agents={agents}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(col) => {
          if (col === sortBy) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
          } else {
            setSortBy(col);
            setSortOrder("asc");
          }
        }}
      />

      {meta && meta.totalPages > 1 && (
        <div className="border-t px-4 py-3">
            <div className="mx-auto flex max-w-md items-center justify-center gap-6">
            {/* Prev */}
            <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="rounded-md border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
                Prev
            </button>

            {/* Page info */}
            <div className="text-sm font-medium text-muted-foreground">
                Page {meta.page} of {meta.totalPages}
            </div>

            {/* Next */}
            <button
                disabled={page === meta.totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-md border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
                Next
            </button>
            </div>
        </div>
        )}

    </div>
  );
}
