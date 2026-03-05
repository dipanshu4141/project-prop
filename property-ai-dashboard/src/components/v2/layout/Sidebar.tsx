import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  IndianRupee,
} from "lucide-react";
import { SidebarItem } from "./SidebarItem";
import { UserProfileCard } from "./UserProfileCard";

export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b font-semibold text-lg">
        Property CRM
      </div>

      {/* Menu */}
      <div className="flex-1 px-3 py-4">
        <div className="mb-2 px-3 text-xs font-medium uppercase text-muted-foreground">
          Menu
        </div>

        <nav className="space-y-1">
          <SidebarItem
            href="/v2/dashboard"
            label="Dashboard"
            icon={LayoutDashboard}
          />
          <SidebarItem href="/v2/leads" label="Leads" icon={Users} />
          <SidebarItem
            href="/v2/properties"
            label="Properties"
            icon={Building2}
          />
          <SidebarItem href="/v2/visits" label="Visits" icon={Calendar} />
          <SidebarItem
            href="/v2/payments"
            label="Payments"
            icon={IndianRupee}
          />
          <SidebarItem href="/v2/agents" label="Agents & Brokers" icon={Users} />

          <SidebarItem href="/v2/team" label="Team" icon={Users} />

        </nav>
      </div>

      {/* User */}
      <div className="p-4">
        <UserProfileCard />
      </div>
    </aside>
  );
}
