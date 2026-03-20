"use client";

import { LogOut } from "lucide-react";

type Props = {
  /** When true: renders only the avatar circle (for the mobile top bar) */
  mobileCompact?: boolean;
};

export function UserProfileCard({ mobileCompact = false }: Props) {
  /* ── Mobile: avatar-only pill ── */
  if (mobileCompact) {
    return (
      <button
        aria-label="Your profile"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-[12px] font-bold text-white ring-2 ring-white/20 hover:ring-white/40 transition-all duration-150"
      >
        U
      </button>
    );
  }

  /* ── Desktop: full card ── */
  return (
    <div className="rounded-xl bg-white/6 border border-white/10 p-3">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
          U
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white truncate leading-tight">
            Your Name
          </p>
          <p className="text-[11px] text-white/40 mt-0.5">Broker</p>
        </div>

        {/* Logout icon button */}
        <button
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-white/30 hover:bg-white/10 hover:text-white/80 transition-all duration-150"
          aria-label="Logout"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}