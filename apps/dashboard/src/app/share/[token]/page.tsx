// apps/dashboard/src/app/share/[token]/page.tsx
// NO auth required — public route

import type { Metadata } from 'next';
import { SharePortalClient } from './SharePortalClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ShareMedia = {
  id:   string;
  url:  string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
};

export type ShareListing = {
  id:           string;
  bhk:          string | null;
  propertyType: string | null;
  area:         number | null;
  areaUnit:     string | null;
  city:         string | null;
  locality:     string | null;
  price:        string | null;
  media:        ShareMedia[];
};

export type ShareProperty = {
  id:           string;
  clientStatus: 'PENDING' | 'INTERESTED' | 'NOT_INTERESTED'; // ← clientStatus
  listing:      ShareListing;
};

export type ShareData = {
  clientName:    string;
  workspaceName: string;
  properties:    ShareProperty[];
};

// ── Data fetching ─────────────────────────────────────────────────────────────

const BACKEND =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3000';

async function fetchShareData(token: string): Promise<ShareData | null> {
  try {
    const res = await fetch(`${BACKEND}/api/public/share/${token}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json() as Promise<ShareData>;
  } catch {
    return null;
  }
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;  // ← Promise
}): Promise<Metadata> {
  const { token } = await params;      // ← await it
  const data = await fetchShareData(token);
  if (!data) return { title: 'Properties | GrowCliento' };
  return {
    title: `Properties for ${data.clientName} | ${data.workspaceName}`,
    description: `${data.properties.length} properties selected for you by ${data.workspaceName}`,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;  // ← Promise
}) {
  const { token } = await params;      // ← await it
  const data = await fetchShareData(token);
  if (!data) return <ExpiredScreen />;
  return <SharePortalClient token={token} initialData={data} />;
}

// ── Expired / not-found screen ────────────────────────────────────────────────

function ExpiredScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#F7F5F0' }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: '#0B1F14' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
            fill="#fff"
            opacity=".9"
          />
          <rect x="9" y="13" width="6" height="8" fill="#0B1F14" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: '#0B1F14' }}>
        Link Expired
      </h1>
      <p className="text-gray-500 text-center max-w-xs leading-relaxed">
        This property sharing link has expired or is no longer valid.
        Ask your realtor to send you a new link.
      </p>
    </div>
  );
}