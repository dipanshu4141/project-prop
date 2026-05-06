'use client';

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ;

// ================= HELPERS =================

function prettyEnum(v: any) {
  if (!v) return "—";
  return String(v)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function prettyKey(s: string) {
  return s.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

// ================= COMPONENT =================

export function ActivityLog({ propertyId }: { propertyId: string }) {
    const { data: activities = [] } = useQuery({
      queryKey: ["activities", propertyId],
      queryFn: async () => {
        const res = await fetch(`${API_URL}/properties/${propertyId}/activities`);
        return res.json();
      }
    });
  
    if (!activities.length) {
      return <div className="text-sm text-gray-500">No activity yet</div>;
    }
  
    return (
      <div className="space-y-4">
        {activities.map((a: any) => (
          <ActivityItem key={a.id} activity={a} />
        ))}
      </div>
    );
  }
  

// ================= ITEM =================

function ActivityItem({ activity }: { activity: any }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const canRevert = activity.oldData && activity.action !== "CREATED";

  async function doRevert() {
    await fetch(
      `${API_URL}/properties/${activity.propertyId}/revert/${activity.id}`,
      { method: "POST" }
    );

    queryClient.invalidateQueries({ queryKey: ["properties"] });
    queryClient.invalidateQueries({ queryKey: ["activities", activity.propertyId] });
  }

  return (
    <div className="border rounded-lg p-3 text-sm bg-white">

      {/* ===== Header ===== */}
      <div className="flex justify-between items-start gap-3">

        <div>
        <div className="font-semibold flex items-center">
            <span>
                <ActionBadge action={activity.action} />
            </span>

            {activity.userName && (
                <span className="text-xs text-gray-500 ml-2">
                <span> </span>by {activity.userName}
                </span>
            )}
        </div>



          <div className="text-xs text-gray-500 mt-1">
            {new Date(activity.createdAt).toLocaleString()}
          </div>
        </div>

        {/* ===== Buttons ===== */}
        <div className="flex gap-2">

          {activity.oldData && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setOpen(!open);
                setConfirming(false);
              }}
            >
              👁 View Changes
            </Button>
          )}

          {canRevert && (
            <>
              {!confirming ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!open) {
                      setOpen(true);
                    }
                    setConfirming(true);
                  }}
                >
                  ⏪ Revert
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={doRevert}
                >
                  ⚠ Confirm Revert
                </Button>
              )}
            </>
          )}

        </div>
      </div>

      {/* ===== Diff ===== */}
      {open && activity.oldData && activity.newData && (
        <div className="mt-3 space-y-2">
          <DiffView oldData={activity.oldData} newData={activity.newData} />

          {confirming && (
            <div className="text-xs text-orange-600 mt-2">
              ⚠ Please review changes before reverting
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ================= UI =================

function ActionBadge({ action }: { action: string }) {
    const colors: Record<string, string> = {
      CREATED: "bg-blue-100 text-blue-700",
      UPDATED: "bg-yellow-100 text-yellow-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      REVERTED: "bg-purple-100 text-purple-700",
    };
  
    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[action] || "bg-gray-200 text-gray-700"}`} >
        {action}
      </span>
    );
  }
  

function DiffView({ oldData, newData }: { oldData: any; newData: any }) {
  const ignore = ["createdAt", "updatedAt", "id"];

  const keys = new Set([
    ...Object.keys(oldData || {}),
    ...Object.keys(newData || {}),
  ]);

  const rows: any[] = [];

  keys.forEach((key) => {
    if (ignore.includes(key)) return;

    const oldVal = normalize(oldData?.[key]);
    const newVal = normalize(newData?.[key]);

    if (oldVal !== newVal) {
      rows.push(
        <div key={key} className="grid grid-cols-3 gap-2 items-center text-xs">
          <div className="font-medium text-gray-700">
            {prettyKey(key)}
          </div>
          <div className="text-red-600 line-through">
            {prettyEnum(oldVal)}
          </div>
          <div className="text-green-700 font-semibold">
            {prettyEnum(newVal)}
          </div>
        </div>
      );
    }
  });

  if (rows.length === 0) {
    return <div className="text-xs text-gray-400">No field changes</div>;
  }

  return <div className="space-y-1">{rows}</div>;
}

// ================= UTILS =================

function normalize(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
