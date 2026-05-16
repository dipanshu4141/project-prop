'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye, Phone, Plus, Search, AlertCircle, Clock,
  CalendarCheck, Inbox, ChevronRight, Folder,
} from 'lucide-react';

import { PageContainer }     from '@/components/v2/layout/PageContainer';
import { PageHeader }        from '@/components/v2/layout/PageHeader';
import { apiGet }            from '@/lib/api';
import { CreateClientModal } from '@/components/v2/clients/CreateClientModal';
import { useAuth }           from '@/context/AuthContext';

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

type LeadRow = {
  clientId:         string;
  name?:            string | null;
  phone:            string;
  requirementLabel: string;
  propertiesCount:  number;
  nearestFollowUpAt?: string | null;
  owner?:           { id: string; name: string | null } | null;
};

type ShortlistRow = {
  id:          string;
  name?:       string | null;
  status:      string;
  createdAt:   string;
  itemCount:   number;
  client: {
    id:    string;
    name?: string | null;
    phones: { phone: string }[];
  };
};

type FilterValue = 'ALL' | 'ATTENTION' | 'UPCOMING' | 'NONE';
type MainTab     = 'LEADS' | 'SHORTLISTS';

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

type FollowUpMeta = {
  label:    string;
  category: 'NONE' | 'OVERDUE' | 'TODAY' | 'UPCOMING';
};

function getFollowUpMeta(date?: string | null): FollowUpMeta {
  if (!date) return { label: '—', category: 'NONE' };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d     = new Date(date); d.setHours(0, 0, 0, 0);
  if (d < today)                       return { label: 'Overdue', category: 'OVERDUE'  };
  if (d.getTime() === today.getTime()) return { label: 'Today',   category: 'TODAY'    };
  return {
    label:    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    category: 'UPCOMING',
  };
}

function clientInitials(name?: string | null) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/* ------------------------------------------------------------------ */
/* FILTER TABS                                                         */
/* ------------------------------------------------------------------ */

const FILTER_TABS: { value: FilterValue; label: string; icon: React.ElementType }[] = [
  { value: 'ALL',       label: 'All',       icon: Inbox       },
  { value: 'ATTENTION', label: 'Attention', icon: AlertCircle },
  { value: 'UPCOMING',  label: 'Upcoming',  icon: Clock       },
  { value: 'NONE',      label: 'None',      icon: CalendarCheck },
];

/* ------------------------------------------------------------------ */
/* BADGES                                                              */
/* ------------------------------------------------------------------ */

function FollowUpBadge({ meta }: { meta: FollowUpMeta }) {
  if (meta.category === 'NONE') return <span className="text-[12px] text-slate-400">—</span>;
  const styles = {
    OVERDUE:  'bg-red-50 text-red-700 border-red-200',
    TODAY:    'bg-amber-50 text-amber-700 border-amber-200',
    UPCOMING: 'bg-slate-50 text-slate-600 border-slate-200',
  }[meta.category];
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11.5px] font-medium ${styles}`}>
      {meta.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* SKELETONS                                                           */
/* ------------------------------------------------------------------ */

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-50">
      {[40, 28, 48, 20, 16].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className={`h-3 w-${w} rounded bg-slate-100 animate-pulse`} />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 border-b border-slate-50 px-4 py-3.5 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-slate-100 flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-32 rounded bg-slate-100" />
        <div className="h-2.5 w-48 rounded bg-slate-100" />
      </div>
      <div className="h-5 w-14 rounded-md bg-slate-100" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MOBILE LEAD CARD                                                    */
/* ------------------------------------------------------------------ */

function MobileLeadCard({ lead }: { lead: LeadRow }) {
  const router   = useRouter();
  const followUp = getFollowUpMeta(lead.nearestFollowUpAt);
  const accentBar =
    followUp.category === 'OVERDUE' ? 'border-l-red-400' :
    followUp.category === 'TODAY'   ? 'border-l-amber-400' :
    'border-l-transparent';

  return (
    <div
      onClick={() => router.push(`/v2/clients/${lead.clientId}`)}
      className={`flex items-center gap-3 border-b border-slate-50 px-4 py-3.5 border-l-2 cursor-pointer active:bg-slate-50 transition-colors ${accentBar}`}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
        {clientInitials(lead.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-slate-800 truncate">{lead.name || 'Unnamed Client'}</p>
        <p className="text-[11.5px] text-slate-400 truncate">{lead.requirementLabel}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <FollowUpBadge meta={followUp} />
        <ChevronRight className="h-4 w-4 text-slate-300" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SHORTLISTS TAB                                                      */
/* ------------------------------------------------------------------ */

function ShortlistsTab() {
  const router = useRouter();
  const [shortlists, setShortlists] = useState<ShortlistRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [query,      setQuery]      = useState('');

  useEffect(() => {
    setLoading(true);
    apiGet<ShortlistRow[]>('/shortlists')
      .then((d) => setShortlists(Array.isArray(d) ? d : []))
      .catch(() => setShortlists([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return shortlists;
    return shortlists.filter((s) =>
      (s.client?.name ?? '').toLowerCase().includes(q) ||
      (s.name ?? '').toLowerCase().includes(q) ||
      s.client?.phones?.[0]?.phone?.includes(q),
    );
  }, [shortlists, query]);

  // Group by client
  const grouped = useMemo(() => {
    const map = new Map<string, { client: ShortlistRow['client']; shortlists: ShortlistRow[] }>();
    filtered.forEach((s) => {
      if (!map.has(s.client.id)) {
        map.set(s.client.id, { client: s.client, shortlists: [] });
      }
      map.get(s.client.id)!.shortlists.push(s);
    });
    return Array.from(map.values());
  }, [filtered]);

  return (
    <div>
      {/* Search */}
      <div className="border-b border-slate-100 bg-white px-4 sm:px-6 py-2.5">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            placeholder="Search client or shortlist…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 w-full pl-8 pr-3 rounded-lg border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400"
          />
        </div>
      </div>

      {loading && (
        <div className="space-y-0">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && grouped.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Folder className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-[14px] font-semibold text-slate-800">No shortlists yet</p>
          <p className="mt-1 text-[12.5px] text-slate-400">
            Select properties and click "Add to shortlist" to get started.
          </p>
        </div>
      )}

      {!loading && grouped.map(({ client, shortlists: clientShortlists }) => (
        <div key={client.id} className="border-b border-slate-100 last:border-0">
          {/* Client header row */}
          <div
            onClick={() => router.push(`/v2/clients/${client.id}`)}
            className="flex items-center gap-3 px-4 sm:px-6 py-3 bg-slate-50/60 hover:bg-slate-100/60 cursor-pointer transition-colors"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
              {clientInitials(client.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-800 truncate">
                {client.name || 'Unnamed Client'}
              </p>
              {client.phones?.[0]?.phone && (
                <p className="text-[11px] text-slate-400">{client.phones[0].phone}</p>
              )}
            </div>
            <span className="text-[11px] text-slate-400 flex-shrink-0">
              {clientShortlists.length} shortlist{clientShortlists.length !== 1 ? 's' : ''}
            </span>
            <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
          </div>

          {/* Shortlists under this client */}
          {clientShortlists.map((s) => (
            <div
              key={s.id}
              onClick={() => router.push(`/v2/clients/${client.id}/shortlists/${s.id}`)}
              className="flex items-center gap-3 px-4 sm:px-6 py-3 pl-8 sm:pl-14 border-t border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <Folder className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-medium text-slate-700 truncate">
                  {s.name || 'Shortlist'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {s.itemCount} propert{s.itemCount !== 1 ? 'ies' : 'y'} · {timeAgo(s.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {s.status === 'ARCHIVED' && (
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    Archived
                  </span>
                )}
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */

export default function ClientsPage() {
  const router              = useRouter();
  const { user, workspace } = useAuth();
  const isOwner             = workspace?.role === 'OWNER';

  const [mainTab, setMainTab] = useState<MainTab>('LEADS');
  const [leads,   setLeads]   = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState('');
  const [filter,  setFilter]  = useState<FilterValue>('ALL');
  const [showCreateClient, setShowCreateClient] = useState(false);

  const loadLeads = useCallback(() => {
    setLoading(true);
    apiGet<LeadRow[]>('/clients/leads')
      .then((data) => setLeads(Array.isArray(data) ? data : []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (mainTab === 'LEADS') loadLeads();
  }, [mainTab, loadLeads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const q = query.toLowerCase();
      const matchesQuery =
        (lead.name || '').toLowerCase().includes(q) ||
        lead.phone.includes(q);
      const followUp = getFollowUpMeta(lead.nearestFollowUpAt);
      const matchesFilter =
        filter === 'ALL' ||
        (filter === 'ATTENTION' && (followUp.category === 'OVERDUE' || followUp.category === 'TODAY')) ||
        (filter === 'UPCOMING'  && followUp.category === 'UPCOMING') ||
        (filter === 'NONE'      && followUp.category === 'NONE');
      return matchesQuery && matchesFilter;
    });
  }, [leads, query, filter]);

  const counts = useMemo(() => {
    const attention = leads.filter((l) => {
      const c = getFollowUpMeta(l.nearestFollowUpAt).category;
      return c === 'OVERDUE' || c === 'TODAY';
    }).length;
    const upcoming = leads.filter((l) => getFollowUpMeta(l.nearestFollowUpAt).category === 'UPCOMING').length;
    const none     = leads.filter((l) => !l.nearestFollowUpAt).length;
    return { ALL: leads.length, ATTENTION: attention, UPCOMING: upcoming, NONE: none };
  }, [leads]);

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">👥</div>
      <p className="text-[14px] font-semibold text-slate-800">No leads found</p>
      <p className="mt-1 text-[12.5px] text-slate-400">Try adjusting your search or filter.</p>
    </div>
  );

  return (
    <PageContainer className="bg-[#F7F5F0]">
      <PageHeader
        title="Clients"
        actions={
          <button
            onClick={() => setShowCreateClient(true)}
            className="inline-flex items-center gap-2 rounded-[9px] bg-[#0B1F14] px-3 py-2 sm:px-4 sm:py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-[#1A3525] hover:shadow-md hover:-translate-y-[1px]"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500 text-white">
              <Plus className="h-3 w-3" />
            </span>
            <span className="hidden sm:inline">Add client</span>
            <span className="sm:hidden">Add</span>
          </button>
        }
      />

      {showCreateClient && (
        <CreateClientModal onClose={() => setShowCreateClient(false)} />
      )}

      {/* ── MAIN TABS ── */}
      <div className="-mx-4 sm:-mx-6">
        <div className="flex items-center bg-white border-b border-slate-100 px-4 sm:px-6">
          {([
            { value: 'LEADS',      label: 'Leads',            icon: Inbox  },
            { value: 'SHORTLISTS', label: 'Client Shortlists', icon: Folder },
          ] as { value: MainTab; label: string; icon: React.ElementType }[]).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setMainTab(value)}
              className={[
                'flex items-center gap-2 px-4 py-3 text-[13px] font-semibold border-b-2 transition-colors',
                mainTab === value
                  ? 'border-[#0B1F14] text-[#0B1F14]'
                  : 'border-transparent text-slate-400 hover:text-slate-600',
              ].join(' ')}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {value === 'LEADS' && leads.length > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${mainTab === 'LEADS' ? 'bg-[#0B1F14] text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {leads.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filter bar — leads only */}
        {mainTab === 'LEADS' && (
          <>
            <div className="flex items-center gap-1 overflow-x-auto bg-white border-b border-slate-100 px-4 sm:px-6 py-2.5 [&::-webkit-scrollbar]:hidden">
              {FILTER_TABS.map((tab) => {
                const active = filter === tab.value;
                const Icon   = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value)}
                    className={[
                      'flex flex-shrink-0 items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-semibold border transition-all duration-150',
                      active
                        ? 'bg-[#0B1F14] text-white border-[#0B1F14]'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700',
                    ].join(' ')}
                  >
                    <Icon className="h-3 w-3 flex-shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">
                      {tab.value === 'ALL' ? 'All' : tab.value === 'ATTENTION' ? 'Urgent' : tab.value === 'UPCOMING' ? 'Soon' : 'None'}
                    </span>
                    {counts[tab.value] > 0 && (
                      <span className={`ml-0.5 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {counts[tab.value]}
                      </span>
                    )}
                  </button>
                );
              })}
              <div className="hidden sm:block relative ml-auto flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  placeholder="Search by name or phone…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-8 pl-8 pr-3 w-52 rounded-lg border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400 focus:w-64 transition-all duration-200"
                />
              </div>
            </div>
            <div className="sm:hidden bg-white border-b border-slate-100 px-4 pb-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  placeholder="Search by name or phone…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-9 w-full pl-8 pr-3 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div className="mt-4 sm:mt-5 rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">

        {/* SHORTLISTS TAB */}
        {mainTab === 'SHORTLISTS' && <ShortlistsTab />}

        {/* LEADS TAB */}
        {mainTab === 'LEADS' && (
          <>
            {/* Mobile */}
            <div className="sm:hidden">
              {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              {!loading && filteredLeads.length === 0 && emptyState}
              {!loading && filteredLeads.map((lead) => (
                <MobileLeadCard key={lead.clientId} lead={lead} />
              ))}
            </div>

            {/* Desktop */}
            <table className="hidden sm:table w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {[
                    'Client', 'Phone', 'Requirement',
                    ...(isOwner ? ['Assigned to'] : []),
                    'Follow-up', 'Actions',
                  ].map((col) => (
                    <th key={col} className="px-5 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}

                {!loading && filteredLeads.length === 0 && (
                  <tr><td colSpan={isOwner ? 6 : 5}>{emptyState}</td></tr>
                )}

                {!loading && filteredLeads.map((lead) => {
                  const followUp  = getFollowUpMeta(lead.nearestFollowUpAt);
                  const rowAccent =
                    followUp.category === 'OVERDUE' ? 'border-l-2 border-l-red-400' :
                    followUp.category === 'TODAY'   ? 'border-l-2 border-l-amber-400' :
                    'border-l-2 border-l-transparent';

                  return (
                    <tr
                      key={lead.clientId}
                      onClick={() => router.push(`/v2/clients/${lead.clientId}`)}
                      className={`border-b border-slate-50 cursor-pointer transition-colors duration-100 hover:bg-slate-50/70 ${rowAccent}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
                            {clientInitials(lead.name)}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-slate-800">{lead.name || 'Unnamed Client'}</p>
                            <p className="text-[11px] text-slate-400">{lead.propertiesCount} requirement{lead.propertiesCount !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-[12.5px] text-slate-500 hover:text-emerald-700 transition-colors">
                          <Phone className="h-3 w-3 flex-shrink-0" />{lead.phone}
                        </a>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12.5px] text-slate-600">{lead.requirementLabel}</span>
                      </td>
                      {isOwner && (
                        <td className="px-5 py-3.5">
                          {lead.owner
                            ? <span className="text-[12px] text-slate-600">{lead.owner.name ?? '—'}</span>
                            : <span className="text-[12px] text-slate-400">Unassigned</span>
                          }
                        </td>
                      )}
                      <td className="px-5 py-3.5"><FollowUpBadge meta={followUp} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <Link href={`/v2/clients/${lead.clientId}`} onClick={(e) => e.stopPropagation()}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-slate-400 hover:text-slate-700 transition-all">
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-emerald-300 hover:text-emerald-700 transition-all">
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </PageContainer>
  );
}