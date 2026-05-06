"use client";

import { useEffect, useState } from "react";
import { X, Search, Loader2, GitMerge, AlertTriangle, CheckCircle2 } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

type Agent = {
  id:        string;
  name?:     string | null;
  firmName?: string | null;
  phones:    string[];
};

type Props = {
  sourceAgent: Agent;   // the agent we're ON (will be merged INTO target)
  onClose:     () => void;
};

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */

export function AgentMergeModal({ sourceAgent, onClose }: Props) {
  const router = useRouter();

  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [target,  setTarget]  = useState<Agent | null>(null);
  const [reason,  setReason]  = useState("");
  const [merging, setMerging] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");

  /* Search agents */
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiGet<{ items: Agent[] }>(`/agents?q=${encodeURIComponent(query)}&limit=8`);
        // Exclude the source agent from results
        setResults((data.items ?? []).filter((a) => a.id !== sourceAgent.id));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, sourceAgent.id]);

  async function handleMerge() {
    if (!target) return;
    setError("");
    setMerging(true);
    try {
      // source is merged INTO target — target survives, source is deleted
      await apiPost(`/agents/${sourceAgent.id}/merge/${target.id}`, { reason });
      setDone(true);
      setTimeout(() => {
        router.replace(`/v2/agents/${target.id}`);
      }, 1500);
    } catch (e: any) {
      setError(e.message ?? "Merge failed");
    } finally {
      setMerging(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
              <GitMerge className="h-4 w-4 text-violet-700" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-900">Merge agent</p>
              <p className="text-[11.5px] text-slate-400">Combine two duplicate agents into one</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="text-[17px] font-bold text-slate-900 mb-1">Merged!</p>
            <p className="text-[13px] text-slate-500">
              All listings and phones have been moved to{" "}
              <strong>{target?.name ?? target?.phones[0]}</strong>.
              Redirecting…
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-5">

            {/* Source agent (this one will be deleted) */}
            <div>
              <p className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                This agent (will be deleted after merge)
              </p>
              <AgentCard agent={sourceAgent} dimmed />
            </div>

            {/* Target agent search */}
            <div>
              <p className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Merge into (will survive)
              </p>

              {target ? (
                <div className="space-y-2">
                  <AgentCard agent={target} selected />
                  <button
                    onClick={() => setTarget(null)}
                    className="text-[12px] text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    Choose different agent
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search by name or phone…"
                      className="w-full h-9 pl-8 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
                    />
                    {loading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-slate-400" />
                    )}
                  </div>

                  {results.length > 0 && (
                    <div className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
                      {results.map((agent) => (
                        <button
                          key={agent.id}
                          onClick={() => { setTarget(agent); setQuery(""); }}
                          className="flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors"
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                            {(agent.name ?? agent.phones[0] ?? "?")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-800 truncate">
                              {agent.name ?? "Unnamed"}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {agent.phones.join(" · ")}
                              {agent.firmName ? ` · ${agent.firmName}` : ""}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {query.length > 1 && results.length === 0 && !loading && (
                    <p className="text-[12.5px] text-slate-400 text-center py-3">
                      No agents found for "{query}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Merge preview */}
            {target && (
              <div className="rounded-xl bg-violet-50 border border-violet-200 px-4 py-3 space-y-2">
                <p className="text-[12px] font-semibold text-violet-800">After merge:</p>
                <ul className="space-y-1 text-[12px] text-violet-700">
                  <li>✓ All {sourceAgent.name ?? "this agent"}'s listings → {target.name ?? target.phones[0]}</li>
                  <li>✓ All phones merged: {[...new Set([...sourceAgent.phones, ...target.phones])].join(", ")}</li>
                  <li>✓ {sourceAgent.name ?? "Source agent"} record deleted</li>
                </ul>
              </div>
            )}

            {/* Optional reason */}
            {target && (
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1">
                  Reason (optional)
                </label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Same person, different numbers"
                  className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[12.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <p className="text-[12.5px] text-red-700">{error}</p>
              </div>
            )}

            {/* Warning */}
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-amber-800">
                This action <strong>cannot be undone</strong>. The source agent record will be permanently deleted.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-[13.5px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMerge}
                disabled={!target || merging}
                className="flex-1 h-10 rounded-xl bg-violet-700 text-[13.5px] font-semibold text-white hover:bg-violet-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {merging
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Merging…</>
                  : <><GitMerge className="h-4 w-4" /> Merge agents</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AGENT CARD SUB-COMPONENT                                           */
/* ------------------------------------------------------------------ */

function AgentCard({ agent, selected, dimmed }: { agent: Agent; selected?: boolean; dimmed?: boolean }) {
  return (
    <div className={[
      "flex items-center gap-3 rounded-xl border px-4 py-3",
      selected ? "border-violet-300 bg-violet-50" :
      dimmed   ? "border-slate-200 bg-slate-50 opacity-70" :
                 "border-slate-200 bg-white",
    ].join(" ")}>
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
        selected ? "bg-violet-200 text-violet-800" : "bg-slate-200 text-slate-600"
      }`}>
        {(agent.name ?? agent.phones[0] ?? "?")[0].toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-slate-800 truncate">
          {agent.name ?? "Unnamed"}
        </p>
        <p className="text-[11.5px] text-slate-400 truncate">
          {agent.phones.join(" · ")}
          {agent.firmName ? ` · ${agent.firmName}` : ""}
        </p>
      </div>
    </div>
  );
}