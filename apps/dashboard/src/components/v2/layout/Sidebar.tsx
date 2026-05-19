"use client";

import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  IndianRupee,
  UserCircle2,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Handshake,
  Radio,
  Bookmark,
} from "lucide-react";
import { SidebarItem } from "./SidebarItem";
import { UserProfileCard } from "./UserProfileCard";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { href: "/v2/dashboard",  label: "Dashboard",       icon: LayoutDashboard },
  { href: "/v2/leads",      label: "Leads",            icon: Users           },
  { href: "/v2/properties", label: "Properties",       icon: Building2       },
  { href: "/v2/deals",      label: "Deals",            icon: Handshake       },
  { label: 'Collections', href: '/v2/collections', icon: Bookmark },
  // { href: "/v2/visits",     label: "Visits",           icon: Calendar        },
  // { href: "/v2/payments",   label: "Payments",         icon: IndianRupee     },
  // { href: "/v2/agents",     label: "Agents & Brokers", icon: UserCircle2     },
  // { href: "/v2/team",       label: "Team",             icon: Users           },
  { href: "/v2/groups",     label: "WA Groups",        icon: Radio           },
];

const MOBILE_NAV_ITEMS = [
  { href: "/v2/dashboard",  label: "Home",       icon: LayoutDashboard },
  { href: "/v2/leads",      label: "Leads",      icon: Users           },
  { href: "/v2/properties", label: "Properties", icon: Building2       },
  { href: "/v2/deals",      label: "Deals",      icon: Handshake       },
  { href: "/v2/groups",     label: "WA Groups",        icon: Radio           },
  { label: 'Collections', href: '/v2/collections', icon: Bookmark },
  // { href: "/v2/agents",     label: "Agents",     icon: UserCircle2     },
];

/* ------------------------------------------------------------------ */
/* MOBILE BOTTOM NAV                                                   */
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
/* SIDEBAR                                                             */
/* ------------------------------------------------------------------ */

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user }   = useAuth();
  const pathname   = usePathname();

  const isAdmin    = user?.platformRole === "SUPERADMIN" || user?.platformRole === "SUPPORT";
  const adminActive = pathname.startsWith("/v2/admin");

  return (
    <>
      {/* ════════════════════════════════════════════════════════════
          DESKTOP — collapsible left sidebar
          ════════════════════════════════════════════════════════════ */}
      <aside
        className={[
          "hidden lg:flex flex-col bg-[#0B1F14] text-white h-screen sticky top-0 flex-shrink-0 transition-all duration-300",
          collapsed ? "w-[60px]" : "w-60",
        ].join(" ")}
      >
        {/* Logo + toggle button */}
        <div className="h-16 flex items-center border-b border-white/10 flex-shrink-0 px-3 gap-2">
          {/* Logo mark — always visible */}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 flex-shrink-0">
            <Building2 className="h-4 w-4 text-white" />
          </div>

          {/* App name — hidden when collapsed */}
          {!collapsed && (
            <span className="flex-1 text-[15px] font-semibold tracking-tight text-white truncate">
              Property CRM
            </span>
          )}

          {/* Toggle button */}
          <button
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={[
              "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg",
              "text-white/30 hover:bg-white/10 hover:text-white/80 transition-all duration-150",
              collapsed ? "mx-auto" : "",
            ].join(" ")}
          >
            {collapsed
              ? <PanelLeftOpen  className="h-4 w-4" />
              : <PanelLeftClose className="h-4 w-4" />
            }
          </button>
        </div>

        {/* Main nav */}
        <div className="flex-1 overflow-y-auto px-2 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {!collapsed && (
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Menu
            </p>
          )}
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <SidebarItem
                key={item.href}
                {...item}
                collapsed={collapsed}
              />
            ))}
          </nav>

          {/* Admin section */}
          {isAdmin && (
            <div className="mt-4">
              <div className="mx-1 mb-2 border-t border-white/10" />
              {!collapsed && (
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                  Platform
                </p>
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
                <ShieldCheck
                  className={[
                    "h-4 w-4 flex-shrink-0",
                    adminActive ? "text-emerald-400" : "text-white/40",
                  ].join(" ")}
                />
                {!collapsed && <span>Platform Admin</span>}
              </Link>
            </div>
          )}
        </div>

        {/* User card */}
        <div className="p-2 border-t border-white/10 flex-shrink-0">
          <UserProfileCard collapsed={collapsed} />
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════
          MOBILE — top header + bottom tab bar
          ════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-2.5 border-b border-white/10 bg-[#0B1F14] px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 flex-shrink-0">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-white">
          Property CRM
        </span>
        <div className="ml-auto">
          <UserProfileCard mobileCompact />
        </div>
      </div>

      <MobileBottomNav />
    </>
  );
}