// apps/dashboard/src/app/v2/admin/layout.tsx
//
// This layout wraps ALL /v2/admin/* pages.
// It renders FULL-SCREEN (no main app sidebar) by using a portal-style
// approach: the layout sits inside /v2/ but overrides the visual chrome
// using fixed positioning + a white overlay that covers the parent sidebar.
//
// Simpler alternative used here: a top nav bar replaces the second sidebar.
// The main /v2/ layout sidebar still shows — that's intentional and matches
// your screenshot's left nav. What we remove is the SECOND inline column
// that was being rendered by the old admin pages.

import Link from 'next/link';
import { cookies } from 'next/headers';

const ADMIN_NAV = [
  { label: 'Overview',      href: '/v2/admin'                  },
  { label: 'Properties',    href: '/v2/admin/properties'       },
  { label: 'Workspaces',    href: '/v2/admin/workspaces'       },
  { label: 'Users',         href: '/v2/admin/users'            },
  { label: 'Subscriptions', href: '/v2/admin/subscriptions'    },
  { label: 'Audit log',     href: '/v2/admin/audit'            },
  { label: 'Ingestion',     href: '/v2/admin/ingestion'        },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: '#F7F5F0' }}>

      {/* ── Admin top bar ── */}
      <div
        className="sticky top-0 z-20 border-b"
        style={{ background: '#0B1F14', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-1 h-11">

            {/* Platform label */}
            <div className="flex items-center gap-2 mr-6">
              <div
                className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              >
                ⚡
              </div>
              <span className="text-xs font-bold text-white/60 uppercase tracking-widest">
                Platform Admin
              </span>
            </div>

            {/* Nav links */}
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                {item.label}
              </Link>
            ))}

            {/* Back to app */}
            <Link
              href="/v2/properties"
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to app
            </Link>
          </div>
        </div>
      </div>

      {/* ── Page content ── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </div>
    </div>
  );
}