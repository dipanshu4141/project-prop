// apps/dashboard/src/app/v2/admin/properties/[id]/page.tsx

import { serverGet } from '@/lib/serverApi';
import { notFound }  from 'next/navigation';
import Link          from 'next/link';
import { VerifyButton } from './VerifyButton';

// ── Types ─────────────────────────────────────────────────────────────────────

type AgentPhone   = { phone: string };
type Agent        = { id: string; name: string | null; phones: AgentPhone[] };
type ListingAgent = { agent: Agent };
type Media        = { url: string; type: string };

type SourceMessage = {
  id:         string;
  rawText:    string;
  groupName:  string;
  receivedAt: string;
} | null;

type Workspace = {
  id: string; name: string; slug: string;
  logoUrl: string | null; type: string; plan: string;
};

type Listing = {
  id:              string;
  refCode:         string;
  workspaceId:     string;
  workspace:       Workspace;
  listingType:     string | null;
  propertySubType: string | null;
  bhk:             string | null;
  city:            string | null;
  area:            string | null;
  location:        string | null;
  building:        string | null;
  price:           string | null;
  deposit:         string | null;
  areaSqft:        number | null;
  furnishing:      string | null;
  floor:           number | null;
  totalFloors:     number | null;
  availability:    string | null;
  urgencyLevel:    string | null;
  negotiable:      boolean | null;
  notes:           string | null;
  listingRole:     string;
  brokerType:      string | null;
  confidence:      number;
  createdAt:       string;
  listingAgents:   ListingAgent[];
  media:           Media[];
  clientCount:     number;
  shareCount:      number;
  message:         SourceMessage;
};

type DuplicateLink = {
  id: string; listingAId: string; listingBId: string;
  confidence: string; matchReasons: string[];
  confirmed: boolean | null; createdAt: string;
};

type DealChainLink = {
  workspace: { id: string; name: string };
  role: string; position: number;
};

type Deal = {
  id: string; status: string;
  dealValue: string | null; commissionRate: number | null;
  totalCommission: string | null;
  initiatedAt: string; agreedAt: string | null;
  completedAt: string | null; fallenAt: string | null;
  notes: string | null;
  chain: DealChainLink[];
};

type CanonicalDetail = {
  id: string; globalRefCode: string;
  verified: boolean; verifiedAt: string | null;
  listingCount: number; totalDealsCompleted: number;
  fingerprint: string | null; createdAt: string;
  listings: Listing[];
  duplicateLinks: DuplicateLink[];
  deals: Deal[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(price: string | null): string {
  if (!price) return '—';
  const n = Number(price);
  if (isNaN(n) || n <= 0) return '—';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const ROLE_COLORS: Record<string, string> = {
  ORIGINATOR: 'bg-emerald-100 text-emerald-700',
  CO_LISTER:  'bg-blue-100 text-blue-700',
  REFERRER:   'bg-violet-100 text-violet-700',
  CLOSER:     'bg-amber-100 text-amber-700',
  PLATFORM:   'bg-gray-100 text-gray-600',
};

const STATUS_COLORS: Record<string, string> = {
  INITIATED:      'bg-blue-100 text-blue-700',
  NEGOTIATING:    'bg-amber-100 text-amber-700',
  AGREED:         'bg-violet-100 text-violet-700',
  COMPLETED:      'bg-emerald-100 text-emerald-700',
  FALLEN_THROUGH: 'bg-red-100 text-red-600',
  DISPUTED:       'bg-orange-100 text-orange-700',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  LOW:       'bg-gray-100 text-gray-600',
  MEDIUM:    'bg-amber-100 text-amber-700',
  HIGH:      'bg-orange-100 text-orange-700',
  CONFIRMED: 'bg-red-100 text-red-700',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest mb-3"
      style={{ color: '#0B1F14', opacity: 0.45 }}>
      {children}
    </h2>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="text-xs">
      <p className="text-gray-400 mb-0.5">{label}</p>
      <p className="font-medium text-gray-700">{value ?? '—'}</p>
    </div>
  );
}

function FirmCard({ listing, index }: { listing: Listing; index: number }) {
  const agents    = listing.listingAgents.map((la) => la.agent);
  const roleClass = ROLE_COLORS[listing.listingRole] ?? 'bg-gray-100 text-gray-600';
  const bhkClean  = listing.bhk?.replace(/BHK/gi, '').trim();
  const bhkLabel  = bhkClean ? `${bhkClean} BHK` : null;
  const titleLine = [bhkLabel, listing.propertySubType].filter(Boolean).join(' ') || 'Property';

  return (
    <div className="rounded-2xl p-5 space-y-4"
      style={{ background: index === 0 ? '#F7F5F0' : '#fff', border: '1px solid rgba(11,31,20,0.08)' }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${roleClass}`}>
              {listing.listingRole.replace('_', ' ')}
            </span>
            {index === 0 && <span className="text-[10px] font-bold text-gray-400">Master listing</span>}
            {listing.urgencyLevel && listing.urgencyLevel !== 'NORMAL' && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-red-100 text-red-600">
                {listing.urgencyLevel.replace('_', ' ')}
              </span>
            )}
          </div>
          <p className="font-bold text-base" style={{ color: '#0B1F14' }}>{listing.workspace.name}</p>
          <p className="text-xs text-gray-400 font-mono">{listing.refCode}</p>
          <p className="text-[10px] text-gray-300 mt-0.5">
            Plan: {listing.workspace.plan} · {listing.workspace.type}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-lg" style={{ color: '#059669' }}>{fmt(listing.price)}</p>
          {listing.deposit && listing.deposit !== '0' && (
            <p className="text-xs text-gray-400">Deposit: {fmt(listing.deposit)}</p>
          )}
          {listing.listingType && <p className="text-xs text-gray-400">{listing.listingType}</p>}
          {listing.negotiable && <p className="text-[10px] text-emerald-600 font-medium">Negotiable</p>}
        </div>
      </div>

      {/* ── Source WhatsApp message ── */}
      {listing.message ? (
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
            <span>💬</span>
            Source WhatsApp message
            <span className="font-normal text-gray-300">
              · {fmtDateTime(listing.message.receivedAt)}
              {listing.message.groupName ? ` · ${listing.message.groupName}` : ''}
            </span>
          </p>
          <pre className="text-[11px] leading-relaxed text-gray-700 bg-white rounded-lg px-3 py-2.5 whitespace-pre-wrap font-sans border border-gray-200 max-h-52 overflow-y-auto">
            {listing.message.rawText}
          </pre>
        </div>
      ) : (
        <p className="text-xs text-gray-300 italic flex items-center gap-1.5">
          <span>📝</span> Manually entered — no source WhatsApp message
        </p>
      )}

      {/* ── Property details grid ── */}
      <div className="grid grid-cols-2 gap-2.5">
        <DetailRow label="Type"       value={titleLine} />
        <DetailRow label="City"       value={listing.city} />
        <DetailRow label="Area"       value={listing.area} />
        <DetailRow label="Building"   value={listing.building} />
        <DetailRow label="Location"   value={listing.location} />
        <DetailRow label="Sqft"       value={listing.areaSqft ? `${listing.areaSqft.toLocaleString('en-IN')} sq ft` : null} />
        <DetailRow label="Furnishing" value={listing.furnishing?.replace('_', ' ')} />
        <DetailRow label="Floor"      value={listing.floor != null ? `${listing.floor}/${listing.totalFloors ?? '?'}` : null} />
        <DetailRow label="Status"     value={listing.availability?.replace('_', ' ')} />
        <DetailRow label="Broker type" value={listing.brokerType} />
        <DetailRow label="Confidence" value={listing.confidence != null ? `${Math.round(listing.confidence * 100)}%` : null} />
        <DetailRow label="Added"      value={fmtDate(listing.createdAt)} />
      </div>

      {/* ── Notes ── */}
      {listing.notes && (
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-1">Notes</p>
          <p className="text-xs text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-100">
            {listing.notes}
          </p>
        </div>
      )}

      {/* ── Agents ── */}
      {agents.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-1.5">
            Agents ({agents.length})
          </p>
          <div className="flex flex-col gap-2">
            {agents.map((a) => (
              <div key={a.id} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                  style={{ background: '#0B1F14', color: '#fff' }}>
                  {(a.name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">{a.name ?? '—'}</p>
                  <p className="text-[10px] text-gray-400">{a.phones.map((p) => p.phone).join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Engagement stats + link ── */}
      <div className="flex items-center gap-4 pt-3"
        style={{ borderTop: '1px solid rgba(11,31,20,0.07)' }}>
        <div className="text-center">
          <p className="text-base font-bold" style={{ color: '#0B1F14' }}>{listing.clientCount}</p>
          <p className="text-[10px] text-gray-400">Clients</p>
        </div>
        <div className="text-center">
          <p className="text-base font-bold" style={{ color: '#0B1F14' }}>{listing.shareCount}</p>
          <p className="text-[10px] text-gray-400">Shares</p>
        </div>
        <Link href={`/v2/properties/${listing.id}`}
          className="ml-auto text-xs font-medium text-emerald-600 hover:text-emerald-800 transition-colors">
          View listing →
        </Link>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data: CanonicalDetail;
  try {
    data = await serverGet<CanonicalDetail>(`/admin/properties/${id}`);
  } catch {
    notFound();
  }

  const firstListing = data.listings[0];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">

      {/* ── Back + header ── */}
      <div>
        <Link href="/v2/admin/properties"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors mb-4 inline-flex items-center gap-1">
          ← All properties
        </Link>

        <div className="flex items-start justify-between gap-4 mt-2">
          <div>
            <p className="text-xs font-mono text-gray-400 mb-1">{data.globalRefCode}</p>
            <h1 className="text-2xl font-bold" style={{ color: '#0B1F14' }}>
              {[
                firstListing?.bhk ? `${firstListing.bhk.replace(/BHK/gi,'').trim()} BHK` : null,
                firstListing?.propertySubType,
              ].filter(Boolean).join(' ') || 'Property'}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {[firstListing?.area, firstListing?.city].filter(Boolean).join(', ')}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {data.verified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Verified {data.verifiedAt ? `· ${fmtDate(data.verifiedAt)}` : ''}
              </span>
            ) : (
              <VerifyButton propertyId={data.id} />
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex flex-wrap items-center gap-6 mt-5 p-4 rounded-xl"
          style={{ background: '#F7F5F0', border: '1px solid rgba(11,31,20,0.07)' }}>
          {[
            { label: 'Listed by',       value: `${data.listingCount} firm${data.listingCount !== 1 ? 's' : ''}` },
            { label: 'Deals completed', value: String(data.totalDealsCompleted) },
            { label: 'Duplicate flags', value: String(data.duplicateLinks.length) },
            { label: 'Total clients',   value: String(data.listings.reduce((s, l) => s + l.clientCount, 0)) },
            { label: 'Total shares',    value: String(data.listings.reduce((s, l) => s + l.shareCount, 0)) },
            { label: 'First listed',    value: fmtDate(data.createdAt) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-sm font-semibold" style={{ color: '#0B1F14' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fingerprint ── */}
      {data.fingerprint && (
        <div className="rounded-xl px-4 py-3"
          style={{ background: '#F7F5F0', border: '1px solid rgba(11,31,20,0.07)' }}>
          <p className="text-xs font-semibold text-gray-400 mb-1">Deduplication fingerprint</p>
          <p className="text-xs font-mono text-gray-600 break-all">{data.fingerprint}</p>
        </div>
      )}

      {/* ── Firms section ── */}
      <div>
        <SectionHeading>
          {data.listingCount} firm{data.listingCount !== 1 ? 's' : ''} with this property
        </SectionHeading>
        <div className={`grid gap-4 ${data.listings.length > 1 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-xl'}`}>
          {data.listings.map((listing, i) => (
            <FirmCard key={listing.id} listing={listing} index={i} />
          ))}
        </div>
      </div>

      {/* ── Duplicate flags ── */}
      {data.duplicateLinks.length > 0 && (
        <div>
          <SectionHeading>Duplicate flags ({data.duplicateLinks.length})</SectionHeading>
          <div className="flex flex-col gap-2">
            {data.duplicateLinks.map((link) => (
              <div key={link.id}
                className="flex items-center justify-between gap-4 rounded-xl px-4 py-3"
                style={{ background: '#fff', border: '1px solid rgba(11,31,20,0.08)' }}>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${CONFIDENCE_COLORS[link.confidence] ?? 'bg-gray-100 text-gray-600'}`}>
                      {link.confidence} confidence
                    </span>
                    {link.confirmed === null  && <span className="text-[10px] text-amber-600 font-semibold">⏳ Unresolved</span>}
                    {link.confirmed === true  && <span className="text-[10px] text-emerald-600 font-semibold">✓ Confirmed duplicate</span>}
                    {link.confirmed === false && <span className="text-[10px] text-gray-400 font-semibold">✗ Rejected</span>}
                  </div>
                  <p className="text-xs text-gray-500">
                    Signals: {link.matchReasons.join(', ')}
                  </p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">{fmtDate(link.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Deal history ── */}
      {data.deals.length > 0 && (
        <div>
          <SectionHeading>Deal history ({data.deals.length})</SectionHeading>
          <div className="flex flex-col gap-3">
            {data.deals.map((deal) => (
              <div key={deal.id} className="rounded-xl px-4 py-4 space-y-3"
                style={{ background: '#fff', border: '1px solid rgba(11,31,20,0.08)' }}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${STATUS_COLORS[deal.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {deal.status.replace('_', ' ')}
                    </span>
                    {deal.dealValue && (
                      <span className="text-sm font-semibold" style={{ color: '#059669' }}>
                        {fmt(deal.dealValue)}
                      </span>
                    )}
                    {deal.commissionRate && (
                      <span className="text-xs text-gray-400">
                        {deal.commissionRate}% commission
                        {deal.totalCommission ? ` = ${fmt(deal.totalCommission)}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">Started {fmtDate(deal.initiatedAt)}</p>
                    {deal.completedAt && <p className="text-xs text-emerald-600">Completed {fmtDate(deal.completedAt)}</p>}
                    {deal.fallenAt    && <p className="text-xs text-red-400">Fallen {fmtDate(deal.fallenAt)}</p>}
                  </div>
                </div>

                {deal.notes && (
                  <p className="text-xs text-gray-500 italic">{deal.notes}</p>
                )}

                {deal.chain.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {deal.chain.map((link, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        {i > 0 && <span className="text-gray-300 text-xs">→</span>}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${ROLE_COLORS[link.role] ?? 'bg-gray-100 text-gray-600'}`}>
                          {link.workspace.name}
                          <span className="font-normal opacity-70 ml-1">({link.role})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}