"use client";

import { LogOut } from "lucide-react";

export function UserProfileCard() {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
          U
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium leading-none">Your Name</div>
          <div className="text-xs text-muted-foreground">Broker</div>
        </div>
      </div>

      <button className="mt-3 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </div>
  );
}
