"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Building2, Users, CreditCard,
  ScrollText, ChevronLeft, ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NAV = [
  { href: '/admin',               label: 'Overview',       icon: LayoutDashboard },
  { href: '/admin/workspaces',    label: 'Workspaces',     icon: Building2       },
  { href: '/admin/users',         label: 'Users',          icon: Users           },
  { href: '/admin/subscriptions', label: 'Subscriptions',  icon: CreditCard      },
  { href: '/admin/audit',         label: 'Audit log',      icon: ScrollText      },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  /* Guard — only SUPERADMIN and SUPPORT can enter */
  useEffect(() => {
    if (!loading && user && user.platformRole === 'USER') {
      router.replace('/v2/dashboard');
    }
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user || user.platformRole === 'USER') {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F7F5F0]">

      {/* ── SIDEBAR ── */}
      <aside className="w-56 shrink-0 flex flex-col bg-[#0B1F14] text-white h-screen sticky top-0">

        {/* Header */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/10 flex-shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500 flex-shrink-0">
            <ShieldAlert className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[13.5px] font-semibold text-white leading-tight">Admin</p>
            <p className="text-[10px] text-white/40">Platform control</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5">
          {NAV.map((item) => {
            const Icon   = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center gap-2.5 h-9 rounded-lg px-3 text-[13px] font-medium transition-colors relative',
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white/90 hover:bg-white/5',
                ].join(' ')}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-red-400" />
                )}
                <Icon className={`h-4 w-4 ${active ? 'text-red-400' : 'text-white/40'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to app */}
        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <Link
            href="/v2/dashboard"
            className="flex items-center gap-2 h-9 rounded-lg px-3 text-[12.5px] text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to app
          </Link>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}