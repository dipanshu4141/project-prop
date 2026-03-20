"use client";

import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  IndianRupee,
  UserCircle2,
} from "lucide-react";
import { SidebarItem } from "./SidebarItem";
import { UserProfileCard } from "./UserProfileCard";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/v2/dashboard",  label: "Dashboard",       icon: LayoutDashboard },
  { href: "/v2/leads",      label: "Leads",            icon: Users           },
  { href: "/v2/properties", label: "Properties",       icon: Building2       },
  { href: "/v2/visits",     label: "Visits",           icon: Calendar        },
  { href: "/v2/payments",   label: "Payments",         icon: IndianRupee     },
  { href: "/v2/agents",     label: "Agents & Brokers", icon: UserCircle2     },
  { href: "/v2/team",       label: "Team",             icon: Users           },
];

/* ------------------------------------------------------------------ */
/* MOBILE BOTTOM NAV                                                   */
/* 5 pinned items — avoids crowding the bar                           */
/* ------------------------------------------------------------------ */

const MOBILE_NAV_ITEMS = [
  { href: "/v2/dashboard",  label: "Home",       icon: LayoutDashboard },
  { href: "/v2/leads",      label: "Leads",      icon: Users           },
  { href: "/v2/properties", label: "Properties", icon: Building2       },
  { href: "/v2/visits",     label: "Visits",     icon: Calendar        },
  { href: "/v2/agents",     label: "Agents",     icon: UserCircle2     },
];

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

export function Sidebar() {
  return (
    <>
      {/* ════════════════════════════════════════════════════════════
          DESKTOP — full left sidebar, hidden on mobile
          ════════════════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-[#0B1F14] text-white h-screen sticky top-0">

        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/10 flex-shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 flex-shrink-0">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            Property CRM
          </span>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Menu
          </p>
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <SidebarItem key={item.href} {...item} />
            ))}
          </nav>
        </div>

        {/* User card */}
        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <UserProfileCard />
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════
          MOBILE — top header bar + bottom tab bar
          ════════════════════════════════════════════════════════════ */}

      {/* Top bar: logo + user avatar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-2.5 border-b border-white/10 bg-[#0B1F14] px-4">
        {/* Logo */}
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 flex-shrink-0">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-white">
          Property CRM
        </span>

        {/* User avatar — right-aligned */}
        <div className="ml-auto">
          <UserProfileCard mobileCompact />
        </div>
      </div>

      {/* Bottom tab nav */}
      <MobileBottomNav />
    </>
  );
}