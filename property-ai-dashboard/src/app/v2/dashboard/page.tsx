import Link from "next/link";
import { PageContainer } from "@/components/v2/layout/PageContainer";
import { PageHeader } from "@/components/v2/layout/PageHeader";
import { StatCard } from "@/components/v2/cards/StatCard";
import {
  Users,
  CheckCircle,
  Clock,
  IndianRupee,
  AlertCircle,
  Calendar,
} from "lucide-react";

import { API_BASE } from "@/lib/apiBase";
// const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

type FollowUpItem = {
  clientId: string;
  clientName?: string | null;
  followUpAt: string;
  property: {
    bhk?: string | null;
    propertySubType?: string | null;
    area?: string | null;
    city?: string | null;
  };
};

function getBaseUrl() {
  // Server-side safe base URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // fallback for local dev
  return "http://localhost:3001";
}

async function fetchFollowUps(path: string): Promise<FollowUpItem[]> {
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/api${path}`, {
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}


export default async function DashboardPage() {
  const [today, upcoming] = await Promise.all([
    fetchFollowUps("/clients/follow-ups/today"),
    fetchFollowUps("/clients/follow-ups/upcoming"),
  ]);

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  return (
    <PageContainer>
      <div className="grid grid-cols-2 gap-6">
  <div className="border border-black p-4">A</div>
  <div className="border border-black p-4">B</div>
</div>


      <PageHeader title="Dashboard" />

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Leads" value="0" icon={<Users />} footer="All time" />
        <StatCard title="Active Leads" value="0" icon={<Clock />} footer="Open" />
        <StatCard title="Closed" value="0" icon={<CheckCircle />} footer="This month" />
        <StatCard title="Revenue" value="₹0" icon={<IndianRupee />} footer="This month" />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {/* TODAY */}
        <div className="col-span-2 rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="h-4 w-4 text-red-600" />
            Follow-ups Due / Overdue
          </div>

          {today.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No follow-ups 🎉
            </div>
          ) : (
            today.map((f, i) => {
              const isOverdue =
                new Date(f.followUpAt).setHours(0, 0, 0, 0) < todayDate.getTime();

              return (
                <Link
                  key={i}
                  href={`/clients/${f.clientId}`}
                  className="block rounded-lg border p-3 mb-2 hover:bg-muted"
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">
                        {f.clientName || "Unnamed Client"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {f.property.bhk ?? ""}{" "}
                        {f.property.propertySubType ?? "Property"} ·{" "}
                        {f.property.area ?? "—"}
                      </div>
                    </div>
                    <span
                      className={`text-xs ${
                        isOverdue ? "text-red-600" : "text-yellow-600"
                      }`}
                    >
                      {isOverdue ? "Overdue" : "Today"}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* UPCOMING */}
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4 text-green-600" />
            Upcoming (7 days)
          </div>

          {upcoming.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Nothing scheduled
            </div>
          ) : (
            upcoming.map((f, i) => (
              <Link
                key={i}
                href={`/clients/${f.clientId}`}
                className="block rounded-lg border p-3 mb-2 hover:bg-muted"
              >
                <div className="font-medium">
                  {f.clientName || "Unnamed Client"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(f.followUpAt).toLocaleDateString()}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </PageContainer>
  );
}
