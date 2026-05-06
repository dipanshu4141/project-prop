"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";

type Props = {
  mobileCompact?: boolean;
  collapsed?: boolean;
};

function initials(name?: string | null, email?: string | null): string {
  if (name) {
    return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

export function UserProfileCard({ mobileCompact = false, collapsed = false }: Props) {
  const { user, workspace, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await apiPost("/api/auth/logout", {});
    } catch {
      // ignore — clear client state regardless
    }
    logout();               // clears AuthContext
    router.push("/login");
  };

  const avatar = initials(user?.name, user?.email);
  const displayName = user?.name ?? user?.email ?? "You";
  const roleLabel = workspace?.role
    ? workspace.role.charAt(0) + workspace.role.slice(1).toLowerCase()
    : "Member";

  /* ── Mobile: avatar-only pill ── */
  if (mobileCompact) {
    return (
      <button
        onClick={handleLogout}
        aria-label="Logout"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-[12px] font-bold text-white ring-2 ring-white/20 hover:ring-white/40 transition-all duration-150"
      >
        {avatar}
      </button>
    );
  }

  /* ── Desktop collapsed: just logout icon ── */
  if (collapsed) {
    return (
      <button
        onClick={handleLogout}
        title="Logout"
        aria-label="Logout"
        className="flex w-full items-center justify-center py-2 rounded-lg text-white/30 hover:bg-white/10 hover:text-white/80 transition-all duration-150"
      >
        <LogOut className="h-4 w-4" />
      </button>
    );
  }

  /* ── Desktop: full card ── */
  return (
    <div className="rounded-xl bg-white/6 border border-white/10 p-3">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
          {avatar}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white truncate leading-tight">
            {displayName}
          </p>
          <p className="text-[11px] text-white/40 mt-0.5">{roleLabel}</p>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-white/30 hover:bg-white/10 hover:text-white/80 transition-all duration-150"
          aria-label="Logout"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}