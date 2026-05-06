"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { WhatsAppMessageCard } from "./WhatsAppMessageCard";
import { apiPost } from "@/lib/api";

type Activity = {
  id:        string;
  action:    string;
  createdAt: string;
  oldData?:  Record<string, any> | null;
  newData?:  Record<string, any> | null;
  property?: {
    message?: { rawText?: string; groupName?: string };
  };
};

const ACTION_LABELS: Record<string, string> = {
  CREATED:          "Property created",
  UPDATED:          "Property updated",
  APPROVED:         "Marked as approved",
  REJECTED:         "Marked as rejected",
  REVERTED:         "Reverted to previous version",
  PROPERTY_SHARED:  "Property shared",
  LEAD_UPDATED:     "Lead updated",
  STATUS_CHANGED:   "Status changed",
};

const ACTION_DOT: Record<string, string> = {
  CREATED:  "bg-emerald-400",
  UPDATED:  "bg-sky-400",
  APPROVED: "bg-emerald-400",
  REJECTED: "bg-red-400",
  REVERTED: "bg-amber-400",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getChanges(activity: Activity) {
  if (!activity.oldData || !activity.newData) return [];
  const SKIP = ["updatedAt", "createdAt", "id"];
  return Object.keys(activity.newData).filter(
    (key) =>
      !SKIP.includes(key) &&
      JSON.stringify(activity.oldData?.[key]) !==
      JSON.stringify(activity.newData?.[key])
  );
}

export function PropertyActivityTimeline({
  activities,
  propertyId,
}: {
  activities: Activity[];
  propertyId: string;
}) {
  const router    = useRouter();
  const [openId,     setOpenId]     = useState<string | null>(null);
  const [loadingId,  setLoadingId]  = useState<string | null>(null);

  async function revert(activityId: string) {
    if (!confirm("Revert to this version? All changes after this point will be undone.")) return;
    setLoadingId(activityId);
    try {
      await apiPost(`/properties/${propertyId}/revert/${activityId}`, {});
      router.refresh();
    } catch {
      alert("Failed to revert. Please try again.");
    } finally {
      setLoadingId(null);
    }
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="mb-2 text-xl">📋</div>
        <p className="text-[13px] font-medium text-slate-600">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-100" />

      {activities.map((activity) => {
        const isOpen  = openId === activity.id;
        const changes = getChanges(activity);
        const dot     = ACTION_DOT[activity.action] ?? "bg-slate-300";
        const label   = ACTION_LABELS[activity.action] ?? activity.action;
        const rawMsg  = activity.action === "CREATED"
          ? activity.property?.message?.rawText
          : null;

        return (
          <div key={activity.id} className="relative flex items-start gap-3 pb-4 last:pb-0">

            {/* Dot */}
            <div className="relative z-10 mt-1 flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-white border-2 border-slate-100">
              <div className={`h-2 w-2 rounded-full ${dot}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-medium text-slate-800">{label}</p>
                <span className="text-[11px] text-slate-400 flex-shrink-0">{timeAgo(activity.createdAt)}</span>
              </div>

              {/* Toggle detail */}
              {(changes.length > 0 || rawMsg) && (
                <button
                  onClick={() => setOpenId(isOpen ? null : activity.id)}
                  className="mt-1 flex items-center gap-1 text-[11.5px] text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {isOpen ? "Hide details" : "View details"}
                </button>
              )}

              {/* Detail panel */}
              {isOpen && (
                <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">

                  {/* Field changes */}
                  {changes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">Changes</p>
                      {changes.map((field) => (
                        <div key={field} className="grid grid-cols-3 gap-2 text-[12px]">
                          <span className="font-medium text-slate-600">{field}</span>
                          <span className="truncate text-red-500 line-through">
                            {String(activity.oldData?.[field] ?? "—")}
                          </span>
                          <span className="truncate text-emerald-600 font-medium">
                            {String(activity.newData?.[field] ?? "—")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* WhatsApp source message */}
                  {rawMsg && <WhatsAppMessageCard message={rawMsg} />}

                  {/* Revert button */}
                  {activity.oldData && (
                    <button
                      onClick={() => revert(activity.id)}
                      disabled={loadingId === activity.id}
                      className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-200 bg-white text-[12px] text-slate-600 hover:border-amber-300 hover:text-amber-700 disabled:opacity-50 transition-all"
                    >
                      {loadingId === activity.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <RotateCcw className="h-3 w-3" />}
                      {loadingId === activity.id ? "Reverting…" : "Revert to this version"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}