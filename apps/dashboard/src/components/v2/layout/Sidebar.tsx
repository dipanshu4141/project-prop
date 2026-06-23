"use client";
import { InstallAppButton } from "./InstallAppButton";
import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Handshake,
  Radio,
  Bookmark,
  X,
  LogOut,
  Settings,
  Users2,
  BarChart3,
  CreditCard,
  Download,
  ChevronRight,
} from "lucide-react";
import { SidebarItem } from "./SidebarItem";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState, useRef, useEffect } from "react";

/* ------------------------------------------------------------------ */
/* NAV CONFIG                                                          */
/* ------------------------------------------------------------------ */

const NAV_ITEMS = [
  { href: "/v2/dashboard",   label: "Today",      icon: LayoutDashboard },
  { href: "/v2/leads", label: "Clients",    icon: Users           },
  { href: "/v2/properties",  label: "Properties", icon: Building2       },
  { href: "/v2/deals",       label: "Pipeline",   icon: Handshake       },
  { href: "/v2/collections", label: "Saved",      icon: Bookmark        },
  { href: "/v2/groups",      label: "Import",     icon: Radio           },
  { href: "/v2/subscription",label: "Subscription", icon: CreditCard  },
];

const MOBILE_NAV_ITEMS = [
  { href: "/v2/dashboard",   label: "Today",      icon: LayoutDashboard },
  { href: "/v2/leads", label: "Clients",    icon: Users           },
  { href: "/v2/properties",  label: "Properties", icon: Building2       },
];

// const PROFILE_MENU_ITEMS = [
//   { href: "/v2/collections", label: "Saved",        icon: Bookmark    },
//   { href: "/v2/groups",      label: "Import",       icon: Radio       },
//   { href: "/v2/deals",       label: "Pipeline",     icon: Handshake   },
//   { href: "/v2/team",        label: "Team",         icon: Users2      },
//   { href: "/v2/analytics",   label: "Analytics",    icon: BarChart3   },
//   { href: "/v2/settings",    label: "Settings",     icon: Settings    },
//   { href: "/v2/subscription",label: "Subscription", icon: CreditCard  },
//   { href: "/v2/export",      label: "Export",       icon: Download    },
// ];

const PROFILE_MENU_ITEMS = [
  { href: "/v2/collections", label: "Saved",    icon: Bookmark  },
  { href: "/v2/groups",      label: "Import",   icon: Radio     },
  { href: "/v2/deals",       label: "Pipeline", icon: Handshake },
  { href: "/v2/subscription",label: "Subscription", icon: CreditCard  },

  // { href: "/v2/agents",      label: "Team",     icon: Users2    },
];

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

function initials(name?: string | null, email?: string | null): string {
  if (name) return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  if (email) return email[0].toUpperCase();
  return "?";
}

/* ------------------------------------------------------------------ */
/* MOBILE PROFILE MENU                                                 */
/* ------------------------------------------------------------------ */

function MobileProfileMenu() {
  const { user, workspace, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const avatar      = initials(user?.name, user?.email);
  const displayName = user?.name ?? user?.email ?? "You";
  const roleLabel   = workspace?.role
    ? workspace.role.charAt(0) + workspace.role.slice(1).toLowerCase()
    : "Member";

  return (
    <>
      {/* Avatar button */}
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-[12px] font-bold text-white ring-2 ring-white/20 hover:ring-white/40 transition-all"
      >
        {avatar}
      </button>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
                  {avatar}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900 truncate">{displayName}</p>
                  <p className="text-[11px] text-slate-400">{roleLabel}</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Menu items */}
            <div className="flex-1 overflow-y-auto py-2">
              {PROFILE_MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-5 py-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Icon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    {item.label}
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 ml-auto" />
                  </Link>
                );
              })}

              {/* Install app */}
              <div className="px-2 pt-1 pb-2">
                <InstallAppButton variant="light" />
              </div>

              {/* Logout */}
              <div className="border-t border-slate-100 p-4">
                <button
                  onClick={() => { setOpen(false); logout(); }}
                  className="flex w-full items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-600 hover:bg-red-100 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* MOBILE BOTTOM NAV (3 items)                                         */
/* ------------------------------------------------------------------ */

function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t border-white/10 bg-[#0B1F14] lg:hidden">
      {MOBILE_NAV_ITEMS.map((item) => {
        const Icon   = item.icon;
        const active = pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors",
              active ? "text-emerald-400" : "text-white/40 hover:text-white/70",
            ].join(" ")}
          >
            <div className="relative flex items-center justify-center">
              {active && (
                <span className="absolute -top-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-400" />
              )}
              <Icon className="h-5 w-5" />
            </div>
            <span className="leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* DESKTOP SIDEBAR                                                     */
/* ------------------------------------------------------------------ */

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout }  = useAuth();
  const pathname          = usePathname();
  const isAdmin           = user?.platformRole === "SUPERADMIN" || user?.platformRole === "SUPPORT";
  const adminActive       = pathname.startsWith("/v2/admin");

  const avatar      = initials(user?.name, user?.email);
  const displayName = user?.name ?? user?.email ?? "You";

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className={[
        "hidden lg:flex flex-col bg-[#0B1F14] text-white h-screen sticky top-0 flex-shrink-0 transition-all duration-300",
        collapsed ? "w-[60px]" : "w-60",
      ].join(" ")}>

        {/* Logo + toggle */}
        <div className="h-16 flex items-center border-b border-white/10 flex-shrink-0 px-3 gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden flex-shrink-0">
            <img src="/icons/icon-512.png" alt="GrowCliento" className="h-full w-full object-cover" />
          </div>
          {!collapsed && (
            <span className="flex-1 text-[15px] font-semibold tracking-tight text-white truncate">
              GrowCliento
            </span>
          )}
          <button
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={[
              "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg",
              "text-white/30 hover:bg-white/10 hover:text-white/80 transition-all duration-150",
              collapsed ? "mx-auto" : "",
            ].join(" ")}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-2 py-4 [&::-webkit-scrollbar]:hidden">
          {!collapsed && (
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">Menu</p>
          )}
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <SidebarItem key={item.href} {...item} collapsed={collapsed} />
            ))}
          </nav>

          {isAdmin && (
            <div className="mt-4">
              <div className="mx-1 mb-2 border-t border-white/10" />
              {!collapsed && (
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">Platform</p>
              )}
              <Link
                href="/v2/admin"
                title="Platform Admin"
                className={[
                  "flex items-center rounded-xl text-[13px] font-semibold transition-colors",
                  collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                  adminActive
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-white/50 hover:text-white hover:bg-white/10",
                ].join(" ")}
              >
                <ShieldCheck className={["h-4 w-4 flex-shrink-0", adminActive ? "text-emerald-400" : "text-white/40"].join(" ")} />
                {!collapsed && <span>Platform Admin</span>}
              </Link>
            </div>
          )}
        </div>

        {/* Install app button */}
        <div className="px-2 pb-2">
          <InstallAppButton collapsed={collapsed} />
        </div>

        {/* User card */}
        <div className="p-2 border-t border-white/10 flex-shrink-0">
          {collapsed ? (
            <button
              onClick={logout}
              title="Logout"
              className="flex w-full items-center justify-center py-2 rounded-lg text-white/30 hover:bg-white/10 hover:text-white/80 transition-all"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <div className="rounded-xl bg-white/6 border border-white/10 p-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
                  {avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white truncate leading-tight">{displayName}</p>
                </div>
                <button
                  onClick={logout}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-white/30 hover:bg-white/10 hover:text-white/80 transition-all"
                  aria-label="Logout"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── MOBILE TOP BAR ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-2.5 border-b border-white/10 bg-[#0B1F14] px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden flex-shrink-0">
          <img src="/icons/icon-512.png" alt="GrowCliento" className="h-full w-full object-cover" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-white">
          GrowCliento
        </span>
        <div className="ml-auto">
          <MobileProfileMenu />
        </div>
      </div>

      <MobileBottomNav />
    </>
  );
}