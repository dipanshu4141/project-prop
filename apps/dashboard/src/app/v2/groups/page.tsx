'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { Search, Radio, CheckCircle2, Clock, Home } from 'lucide-react';

interface AvailableGroup {
  id: string;
  groupName: string;
  groupJid: string;
  phone: { phone: string; displayName?: string | null };
  _count: { subscriptions: number };
}

interface Subscription {
  id: string;
  active: boolean;
  createdAt: string;
  propertyCount: number;
  lastListingAt: string | null;
  group: {
    id: string;
    groupName: string;
    groupJid: string;
    phone: { phone: string; displayName?: string | null };
  };
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'No listings yet';
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function Spinner({ small }: { small?: boolean }) {
  return (
    <div className={`border-2 border-current border-t-transparent rounded-full animate-spin opacity-50 ${small ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
  );
}

export default function GroupsPage() {
  const [available, setAvailable]         = useState<AvailableGroup[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading]             = useState(true);
  const [subscribing, setSubscribing]     = useState<Set<string>>(new Set());
  const [removing, setRemoving]           = useState<Set<string>>(new Set());
  const [searchAvail, setSearchAvail]     = useState('');
  const [searchSubs, setSearchSubs]       = useState('');
  const [subscribingAll, setSubscribingAll] = useState(false);
  const [sortSubs, setSortSubs]           = useState<'recent' | 'count' | 'activity'>('activity');
  const [selectedAvail, setSelectedAvail] = useState<Set<string>>(new Set());
  const [selectedSubs, setSelectedSubs]   = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode]           = useState(false);

  const load = async () => {
    try {
      const [avail, subs] = await Promise.all([
        apiGet<AvailableGroup[]>('/ingestion/available-groups'),
        apiGet<Subscription[]>('/ingestion/subscriptions'),
      ]);
      setAvailable(avail);
      setSubscriptions(subs);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const activeSubs = subscriptions.filter(s => s.active);

  // Filter + sort subscriptions
  const filteredSubs = useMemo(() => {
    const q = searchSubs.toLowerCase();
    const filtered = q
      ? activeSubs.filter(s => s.group.groupName.toLowerCase().includes(q))
      : activeSubs;

    return [...filtered].sort((a, b) => {
      if (sortSubs === 'count')    return b.propertyCount - a.propertyCount;
      if (sortSubs === 'activity') {
        if (!a.lastListingAt && !b.lastListingAt) return 0;
        if (!a.lastListingAt) return 1;
        if (!b.lastListingAt) return -1;
        return new Date(b.lastListingAt).getTime() - new Date(a.lastListingAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [activeSubs, searchSubs, sortSubs]);

  // Filter available groups
  const filteredAvail = useMemo(() => {
    const q = searchAvail.toLowerCase();
    return q ? available.filter(g => g.groupName?.toLowerCase().includes(q)) : available;
  }, [available, searchAvail]);

  const subscribe = async (groupId: string) => {
    setSubscribing(p => new Set([...p, groupId]));
    try {
      await apiPost('/ingestion/subscriptions', { groupId });
      await load();
    } catch {}
    finally { setSubscribing(p => { const n = new Set(p); n.delete(groupId); return n; }); }
  };

const subscribeSelected = async () => {
    const ids = [...selectedAvail];
    if (!ids.length) return;
    setSubscribingAll(true);
    await Promise.all(ids.map(id => apiPost('/ingestion/subscriptions', { groupId: id }).catch(() => {})));
    setSelectedAvail(new Set());
    setBulkMode(false);
    setSubscribingAll(false);
    await load();
  };

  const subscribeAllVisible = async () => {
    if (!confirm(`Subscribe to all ${filteredAvail.length} visible groups?`)) return;
    setSubscribingAll(true);
    await Promise.all(filteredAvail.map(g => apiPost('/ingestion/subscriptions', { groupId: g.id }).catch(() => {})));
    setSubscribingAll(false);
    setSearchAvail('');
    await load();
  };

  const removeSelected = async () => {
    if (!confirm(`Remove ${selectedSubs.size} subscription(s)?`)) return;
    await Promise.all([...selectedSubs].map(id =>
      fetch(`/api/ingestion/subscriptions/${id}`, { method: 'DELETE', credentials: 'include' })
    ));
    setSelectedSubs(new Set());
    await load();
  };

  const toggleAvail = (id: string) => setSelectedAvail(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSub = (id: string) => setSelectedSubs(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });


  const unsubscribe = async (subId: string) => {
    if (!confirm('Stop receiving listings from this group?')) return;
    setRemoving(p => new Set([...p, subId]));
    try {
      await fetch(`/api/ingestion/subscriptions/${subId}`, { method: 'DELETE', credentials: 'include' });
      await load();
    } catch {}
    finally { setRemoving(p => { const n = new Set(p); n.delete(subId); return n; }); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-stone-400">Loading groups…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <div className="max-w-2xl mx-auto px-5 py-10 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-[#0B1F14]">WhatsApp Groups</h1>
          <p className="text-sm text-stone-400 mt-1">
            Subscribe to groups — listings appear in your properties page automatically.
          </p>
        </div>

        {/* ── YOUR SUBSCRIPTIONS ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
              Your groups ({activeSubs.length})
            </p>
            <div className="flex items-center gap-2">
            {selectedSubs.size > 0 && (
              <button onClick={removeSelected}
                className="text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-3 py-1.5 transition-colors">
                Remove {selectedSubs.size} selected
              </button>
            )}
            {activeSubs.length > 1 && (
              <select value={sortSubs} onChange={e => setSortSubs(e.target.value as any)}
                className="text-xs text-stone-500 border border-stone-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-stone-400">
                <option value="activity">Sort: Last listing</option>
                <option value="count">Sort: Most properties</option>
                <option value="recent">Sort: Recently joined</option>
              </select>
            )}
          </div>
          </div>

          {/* Search subscribed */}
          {activeSubs.length > 4 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-300" />
              <input
                value={searchSubs}
                onChange={e => setSearchSubs(e.target.value)}
                placeholder="Search your groups…"
                className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 placeholder:text-stone-300"
              />
            </div>
          )}

          {activeSubs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 px-5 py-8 text-center">
              <Radio className="h-8 w-8 text-stone-200 mx-auto mb-2" />
              <p className="text-sm font-medium text-stone-400">No groups yet</p>
              <p className="text-xs text-stone-300 mt-1">Subscribe to groups below to start receiving listings.</p>
            </div>
          ) : filteredSubs.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-4">No groups match "{searchSubs}"</p>
          ) : (
            <div className="space-y-2">
              {filteredSubs.map(sub => (
                <div key={sub.id}
                  className={`bg-white rounded-2xl border px-4 py-3.5 flex items-center gap-3 transition-colors ${selectedSubs.has(sub.id) ? 'border-red-200 bg-red-50/40' : 'border-stone-200'}`}>
                  <input type="checkbox" checked={selectedSubs.has(sub.id)} onChange={() => toggleSub(sub.id)}
                    className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 flex-shrink-0" />
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sub.lastListingAt && Date.now() - new Date(sub.lastListingAt).getTime() < 86400000 * 3 ? 'bg-emerald-500' : 'bg-stone-300'}`} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0B1F14] truncate">{sub.group.groupName}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {/* Property count */}
                      <span className="flex items-center gap-1 text-xs text-stone-400">
                        <Home className="h-3 w-3" />
                        {sub.propertyCount} {sub.propertyCount === 1 ? 'listing' : 'listings'}
                      </span>
                      {/* Last activity */}
                      <span className="flex items-center gap-1 text-xs text-stone-400">
                        <Clock className="h-3 w-3" />
                        {timeAgo(sub.lastListingAt)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => unsubscribe(sub.id)}
                    disabled={removing.has(sub.id)}
                    className="flex-shrink-0 text-xs text-stone-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-40 flex items-center gap-1"
                  >
                    {removing.has(sub.id) ? <Spinner small /> : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── AVAILABLE GROUPS ── */}
        {available.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
                Available ({filteredAvail.length}{searchAvail ? ` of ${available.length}` : ''})
              </p>
              <div className="flex items-center gap-2">
                {bulkMode && selectedAvail.size > 0 && (
                  <button onClick={subscribeSelected} disabled={subscribingAll}
                    className="text-xs font-semibold text-white bg-[#0B1F14] rounded-lg px-3 py-1.5 hover:bg-emerald-900 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                    {subscribingAll ? <Spinner small /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Subscribe {selectedAvail.size}
                  </button>
                )}
                {filteredAvail.length > 0 && !bulkMode && (
                  <button onClick={subscribeAllVisible} disabled={subscribingAll}
                    className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                    {subscribingAll ? <Spinner small /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Subscribe all{searchAvail ? ' visible' : ''}
                  </button>
                )}
                <button onClick={() => { setBulkMode(p => !p); setSelectedAvail(new Set()); }}
                  className="text-xs text-stone-400 hover:text-stone-600 border border-stone-200 rounded-lg px-2 py-1.5 bg-white transition-colors">
                  {bulkMode ? 'Cancel' : 'Select'}
                </button>
              </div>
            </div>

            {/* Search available */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-300" />
              <input
                value={searchAvail}
                onChange={e => setSearchAvail(e.target.value)}
                placeholder="Search groups by name…"
                className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 placeholder:text-stone-300"
              />
              {searchAvail && (
                <button
                  onClick={() => setSearchAvail('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 text-xs"
                >✕</button>
              )}
            </div>

            {filteredAvail.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-4">No groups match "{searchAvail}"</p>
            ) : (
              <div className="space-y-2">
                {filteredAvail.map(group => (
                  <div key={group.id}
                    onClick={bulkMode ? () => toggleAvail(group.id) : undefined}
                    className={`bg-white rounded-2xl border px-4 py-3.5 flex items-center gap-3 transition-colors ${bulkMode ? 'cursor-pointer' : 'hover:border-stone-300'} ${selectedAvail.has(group.id) ? 'border-emerald-300 bg-emerald-50/50' : 'border-stone-200'}`}>
                  {bulkMode ? (
                    <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${selectedAvail.has(group.id) ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300'}`}>
                      {selectedAvail.has(group.id) && (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-stone-200 flex-shrink-0" />
                  )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0B1F14] truncate">{group.groupName}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {group._count.subscriptions > 0
                          ? `${group._count.subscriptions} broker${group._count.subscriptions !== 1 ? 's' : ''} subscribed`
                          : 'Be the first to subscribe'}
                      </p>
                    </div>
                    <button
                      onClick={() => subscribe(group.id)}
                      disabled={subscribing.has(group.id)}
                      className="flex-shrink-0 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      {subscribing.has(group.id) ? <Spinner small /> : '+ Subscribe'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {available.length === 0 && activeSubs.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 px-5 py-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-stone-600">You're in all available groups</p>
            <p className="text-xs text-stone-400 mt-1">New groups will appear here when added.</p>
          </div>
        )}

      </div>
    </div>
  );
}