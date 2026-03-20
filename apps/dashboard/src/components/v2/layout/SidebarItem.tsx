"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";

interface SidebarItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function SidebarItem({ href, label, icon: Icon }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={[
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
        isActive
          ? "bg-white/10 text-white"
          : "text-white/50 hover:bg-white/6 hover:text-white/90",
      ].join(" ")}
    >
      {/* Left accent bar — visible on active */}
      <span
        className={[
          "absolute left-0 h-5 w-[3px] rounded-r-full bg-emerald-400 transition-all duration-150",
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-30",
        ].join(" ")}
      />

      <Icon
        className={[
          "h-4 w-4 flex-shrink-0 transition-colors duration-150",
          isActive ? "text-emerald-400" : "text-white/40 group-hover:text-white/70",
        ].join(" ")}
      />
      <span>{label}</span>
    </Link>
  );
}