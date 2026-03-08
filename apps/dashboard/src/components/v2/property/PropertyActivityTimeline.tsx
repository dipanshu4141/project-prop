"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { WhatsAppMessageCard } from "./WhatsAppMessageCard";
import { API_BASE } from "@/lib/apiBase";

type Activity = {
  id: string;
  action: string;
  createdAt: string;
  oldData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
  property?: {
    message?: {
      rawText?: string;
      groupName?: string;
      createdAt?: string;
    };
  };
};

export function PropertyActivityTimeline({
  activities,
  propertyId,
}: {
  activities: Activity[];
  propertyId: string;
}) {
  const router = useRouter();

  const [openId, setOpenId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function revert(activityId: string) {
    const ok = confirm(
      "Revert property to this version? This will undo all changes made after this."
    );
    if (!ok) return;

    try {
      setLoadingId(activityId);

      const res = await fetch(
        `${API_BASE}/properties/${propertyId}/revert/${activityId}`,
        {
          method: "POST",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to revert property");
      }

      router.refresh();
    } catch (error) {
      console.error("Revert failed", error);
      alert("Failed to revert property. Please try again.");
    } finally {
      setLoadingId(null);
    }
  }

  function getChanges(activity: Activity) {
    if (!activity.oldData || !activity.newData) return [];

    return Object.keys(activity.newData).filter(
      (key) =>
        JSON.stringify(activity.oldData?.[key]) !==
        JSON.stringify(activity.newData?.[key])
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-4 font-medium">Activity</div>

      {activities.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No activity yet
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const isOpen = openId === activity.id;
            const changes = getChanges(activity);

            const rawMessage =
              activity.action === "CREATED"
                ? activity.property?.message?.rawText
                : null;

            return (
              <div
                key={activity.id}
                className="rounded-md border p-3"
              >
                {/* HEADER */}
                <button
                  type="button"
                  onClick={() =>
                    setOpenId(isOpen ? null : activity.id)
                  }
                  className="flex w-full items-start justify-between text-left"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {activity.action || "Property updated"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {isOpen ? "Hide" : "View"}
                  </div>
                </button>

                {/* BODY */}
                {isOpen && (
                  <div className="mt-3 space-y-3 text-sm">
                    {/* FIELD CHANGES */}
                    {changes.length === 0 ? (
                      <div className="text-muted-foreground">
                        No field-level changes recorded.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {changes.map((field) => (
                          <div
                            key={field}
                            className="grid grid-cols-3 gap-2"
                          >
                            <div className="font-medium">
                              {field}
                            </div>
                            <div className="truncate text-red-500">
                              {String(
                                activity.oldData?.[field] ?? "—"
                              )}
                            </div>
                            <div className="truncate text-green-600">
                              {String(
                                activity.newData?.[field] ?? "—"
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* WHATSAPP MESSAGE */}
                    {rawMessage && (
                      <WhatsAppMessageCard message={rawMessage} />
                    )}

                    {/* REVERT */}
                    {activity.oldData && (
                      <button
                        onClick={() => revert(activity.id)}
                        disabled={loadingId === activity.id}
                        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {loadingId === activity.id
                          ? "Reverting…"
                          : "Revert"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
