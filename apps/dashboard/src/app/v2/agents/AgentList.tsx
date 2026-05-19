"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { apiGet } from "@/lib/api";
import { AgentListTable } from "@/components/v2/agents/AgentListTable";
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

/* ------------------------------------------------------------------ */
/* PAGE BUTTON                                                         */
/* ------------------------------------------------------------------ */

function PageBtn({
  children,
  active,
  disabled,
  onClick,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={[
        "flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition-all duration-150",
        active
          ? "border-[#0B1F14] bg-[#0B1F14] text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900",
        disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function buildPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

/* ------------------------------------------------------------------ */
/* SKELETON ROW                                                        */
/* ------------------------------------------------------------------ */

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-50">
      {[32, 40, 28, 20, 16].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className={`h-3 w-${w} rounded bg-slate-100 animate-pulse`} />
        </td>
      ))}
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */

export function AgentList() {
  const [page,           setPage]           = useState(1);
  const [limit]                             = useState(8);
  const [sortBy,         setSortBy]         = useState("createdAt");
  const [sortOrder,      setSortOrder]      = useState<"asc" | "desc">("desc");
  const [query,          setQuery]          = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page:      String(page),
      limit:     String(limit),
      sortBy,
      sortOrder,
    });
    if (debouncedQuery) params.set('q', debouncedQuery);
    return `/agents?${params.toString()}`;
  }, [page, limit, sortBy, sortOrder, debouncedQuery]);

  const { data, isLoading } = useSWR<{ items: any[]; meta: any }>(
    apiUrl,
    fetcher,
    { dedupingInterval: 10000, revalidateOnFocus: false, keepPreviousData: true },
  );

  const agents  = data?.items ?? [];
  const meta    = data?.meta  ?? null;
  const loading = isLoading && !data;

  
  // const [agents,         setAgents]         = useState<any[]>([]);
  // const [meta,           setMeta]           = useState<any>(null);
  // const [loading,        setLoading]        = useState(true);

  /* ── fetch ── */
  // useEffect(() => {
  //   setLoading(true);
  //   const params = new URLSearchParams({
  //     page: String(page),
  //     limit: String(limit),
  //     sortBy,
  //     sortOrder,
  //   });
  //   if (debouncedQuery) params.set("q", debouncedQuery);

  //   apiGet<{ items: any[]; meta: any }>(`/agents?${params.toString()}`)
  //     .then((d) => { setAgents(d.items); setMeta(d.meta); })
  //     .catch(() => { setAgents([]); setMeta(null); })
  //     .finally(() => setLoading(false));
  // }, [page, limit, sortBy, sortOrder, debouncedQuery]);

  /* ── debounce ── */
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQuery(query.trim()); }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function handleSortChange(col: string) {
    if (col === sortBy) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortOrder("asc"); }
  }

  const totalPages = meta?.totalPages ?? 1;

  /* ------------------------------------------------------------------ */
  /* UI                                                                  */
  /* ------------------------------------------------------------------ */

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">

      {/* ── TOOLBAR ── */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-3.5">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            placeholder="Search by name, phone or firm…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            className="
              h-8 pl-8 pr-3 w-64 rounded-lg border border-slate-200
              text-xs text-slate-700 placeholder:text-slate-400
              bg-slate-50 focus:bg-white focus:outline-none
              focus:border-slate-400 focus:w-72
              transition-all duration-200
            "
          />
        </div>

        {/* Meta info */}
        {meta?.total > 0 && (
          <p className="text-[12.5px] text-slate-400">
            <span className="font-semibold text-slate-700">{meta.total}</span> agents
          </p>
        )}
      </div>

      {/* ── TABLE ── */}
      {loading ? (
        <table className="w-full">
          <tbody>
            {Array.from({ length: limit }).map((_, i) => <SkeletonRow key={i} />)}
          </tbody>
        </table>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">👤</div>
          <p className="text-[14px] font-semibold text-slate-800">No agents found</p>
          <p className="mt-1 text-[12.5px] text-slate-400">Try adjusting your search.</p>
        </div>
      ) : (
        <AgentListTable
          agents={agents}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />
      )}

      {/* ── PAGINATION ── */}
      {meta && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 px-5 py-3.5">
          <PageBtn
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            aria-label="Previous"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </PageBtn>

          {buildPageRange(page, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`e-${i}`} className="w-8 text-center text-xs text-slate-400">…</span>
            ) : (
              <PageBtn
                key={p}
                active={p === page}
                onClick={() => setPage(p as number)}
              >
                {p}
              </PageBtn>
            )
          )}

          <PageBtn
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            aria-label="Next"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </PageBtn>
        </div>
      )}
    </div>
  );
}