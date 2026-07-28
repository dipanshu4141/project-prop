'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import {
  Search, Radio, CheckCircle2, Clock, Home,
  Lock, Plus, X, Copy, Check, Loader2,
  ChevronRight, Wifi, WifiOff,
} from 'lucide-react';
import { createPortal } from 'react-dom';

interface AvailableGroup {
  id:            string;
  groupName:     string;
  groupJid:      string;
  phone:         { phone: string; displayName?: string | null };
  lastListingAt: string | null;
  _count:        { subscriptions: number };
}

interface Subscription {
  id:            string;
  active:        boolean;
  createdAt:     string;
  propertyCount: number;
  lastListingAt: string | null;
  group: {
    id:        string;
    groupName: string;
    groupJid:  string;
    isPrivate: boolean;
    phone:     { phone: string; displayName?: string | null };
  };
}

interface PrivateGroup {
  id:        string;
  code:      string;
  groupJid:  string | null;
  groupName: string | null;
  status:    string;
  expiresAt: string;
  createdAt: string;
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'No listings yet';
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/* ── Add Private Group Modal ── */
function AddPrivateGroupModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step,    setStep]    = useState<'loading' | 'show'>('loading');
  const [request, setRequest] = useState<{ code: string; expiresAt: string; phoneNumber: string } | null>(null);
  const [copied,  setCopied]  = useState<'number' | 'code' | null>(null);
  const initialCount = useMemo(() => { return 0; }, []);
  const [baseCount,  setBaseCount]  = useState(0);

  useEffect(() => {
    fetch('/api/private-groups', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setBaseCount(Array.isArray(d) ? d.length : 0))
      .catch(() => {});

    fetch('/api/private-groups/pending', { credentials: 'include' })
      .then(r => r.text())
      .then(text => {
        const data = text ? JSON.parse(text) : null;
        if (data?.code) {
          setRequest({ code: data.code, expiresAt: data.expiresAt, phoneNumber: process.env.NEXT_PUBLIC_PRIVATE_PHONE ?? '' });
          setStep('show');
        } else {
          return fetch('/api/private-groups/request', { method: 'POST', credentials: 'include' })
            .then(r => r.json())
            .then(d => { setRequest(d); setStep('show'); });
        }
      })
      .catch(() => setStep('show'));
  }, []);

  useEffect(() => {
    if (step !== 'show' || !request) return;
    const interval = setInterval(async () => {
      const res = await fetch('/api/private-groups', { credentials: 'include' }).then(r => r.json());
      if (Array.isArray(res) && res.length > baseCount) {
        clearInterval(interval);
        onSuccess();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [step, request, baseCount, onSuccess]);

  function copy(text: string, type: 'number' | 'code') {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto mb-20 sm:mb-0">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0B1F14]">
              <Lock className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-[15px] font-bold text-[#0B1F14]">Add personal group</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {step === 'loading' && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          )}

          {step === 'show' && request && (
            <div className="space-y-4">
              <p className="text-[13px] text-slate-500">
                Follow these 2 steps to link your personal WhatsApp group privately.
              </p>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Step 1 — Add this number</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13.5px] font-mono font-bold text-[#0B1F14] truncate">
                    {request.phoneNumber || '—'}
                  </div>
                  <button onClick={() => copy(request.phoneNumber, 'number')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B1F14] text-white text-[12px] font-semibold flex-shrink-0">
                    {copied === 'number' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied === 'number' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Step 2 — Send this code in the group</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-emerald-200 rounded-lg px-3 py-2 text-[18px] font-mono font-bold text-emerald-700 tracking-widest">
                    {request.code}
                  </div>
                  <button onClick={() => copy(request.code, 'code')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 text-white text-[12px] font-semibold flex-shrink-0">
                    {copied === 'code' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied === 'code' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[12px] text-slate-400">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Waiting to detect code…
              </div>
              <p className="text-[11px] text-slate-300">
                Expires {new Date(request.expiresAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function GroupsPage() {
  const [available,     setAvailable]     = useState<AvailableGroup[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [privateGroups, setPrivateGroups] = useState<PrivateGroup[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [subscribing,   setSubscribing]   = useState<Set<string>>(new Set());
  const [removing,      setRemoving]      = useState<Set<string>>(new Set());
  const [search,        setSearch]        = useState('');
  const [tab,           setTab]           = useState<'subscribed' | 'discover' | 'private'>('subscribed');
  const [showAddPrivate,setShowAddPrivate]= useState(false);
  const [subscribingAll,setSubscribingAll]= useState(false);
  const [selectedAvail, setSelectedAvail] = useState<Set<string>>(new Set());
  const [bulkMode,      setBulkMode]      = useState(false);

  const load = async () => {
    try {
      const [avail, subs, priv] = await Promise.all([
        apiGet<AvailableGroup[]>('/ingestion/available-groups'),
        apiGet<Subscription[]>('/ingestion/subscriptions'),
        apiGet<PrivateGroup[]>('/private-groups'),
      ]);
      setAvailable(avail);
      setSubscriptions(subs);
      setPrivateGroups(priv);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const activeSubs   = subscriptions.filter(s => s.active && !s.group.isPrivate);
  const privateSubs  = subscriptions.filter(s => s.active && s.group.isPrivate);

  const filteredSubs = useMemo(() => {
    const q = search.toLowerCase();
    return q ? activeSubs.filter(s => s.group.groupName.toLowerCase().includes(q)) : activeSubs;
  }, [activeSubs, search]);

  const filteredAvail = useMemo(() => {
    const q = search.toLowerCase();
    return q ? available.filter(g => g.groupName?.toLowerCase().includes(q)) : available;
  }, [available, search]);

  async function subscribe(groupId: string) {
    setSubscribing(p => new Set([...p, groupId]));
    try {
      await apiPost('/ingestion/subscriptions', { groupId });
      setJustJoined(groupId);
      setTimeout(() => setJustJoined(null), 2000);
      await load();
    } catch {}
    finally { setSubscribing(p => { const n = new Set(p); n.delete(groupId); return n; }); }
  }

  function GroupHeroCard({ group, rank, subscribing, onJoin, justJoined }: {
    group: AvailableGroup; rank: number;
    subscribing: boolean; onJoin: () => void; justJoined: boolean;
  }) {
    const rankColors = [
      'bg-amber-100 text-amber-800',
      'bg-slate-100 text-slate-600',
    ];
    const rankLabels = ['#1', '#2'];
    const emoji = ['🏡', '🏢', '🏘️', '🏙️', '🏠'][rank % 5];

    return (
      <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 relative overflow-hidden">
        <div className={`absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full ${rankColors[rank - 1] ?? 'bg-slate-100 text-slate-500'}`}>
          {rankLabels[rank - 1]}
        </div>
        <div className="text-2xl mb-2">{emoji}</div>
        <p className="text-[13px] font-bold text-slate-800 leading-tight mb-1 pr-6 line-clamp-2">{group.groupName}</p>
        <p className="text-[11px] text-slate-400 mb-3">{group._count.subscriptions} realtors</p>
        <div className="bg-slate-50 rounded-xl px-3 py-2 mb-3">
          <p className="text-[9px] text-slate-400 mb-0.5">Last active</p>
          <p className="text-[11px] font-semibold text-slate-700">{timeAgo(group.lastListingAt)}</p>
        </div>
        <button onClick={onJoin} disabled={subscribing}
          className={`w-full h-8 rounded-xl text-[12px] font-bold transition-all ${justJoined ? 'bg-emerald-500 text-white scale-95' : 'bg-[#0B1F14] text-white hover:bg-[#1A3525]'} disabled:opacity-50`}>
          {justJoined ? '✓ Joined!' : subscribing ? '…' : 'Join'}
        </button>
      </div>
    );
  }

  function GroupListCard({ group, isHot, isNew, subscribing, onJoin, justJoined }: {
    group: AvailableGroup; isHot: boolean; isNew: boolean;
    subscribing: boolean; onJoin: () => void; justJoined: boolean;
  }) {
    const isActive = group.lastListingAt &&
      Date.now() - new Date(group.lastListingAt).getTime() < 3 * 60 * 60 * 1000;

    return (
      <div className={`rounded-2xl border shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-4 py-3.5 flex items-center gap-3 transition-all ${isNew ? 'bg-[#0B1F14] border-[#0B1F14]' : 'bg-white border-slate-100'}`}>
        <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-lg ${isNew ? 'bg-white/10' : 'bg-slate-50'}`}>
          {isHot ? '🔥' : isNew ? '✨' : '📡'}
        </div>
        <div className="flex-1 min-w-0">
          {isNew && <p className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-0.5">New this week</p>}
          <p className={`text-[13px] font-semibold truncate ${isNew ? 'text-white' : 'text-slate-800'}`}>{group.groupName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[11px] ${isNew ? 'text-white/50' : 'text-slate-400'}`}>
              {group._count.subscriptions} realtors
            </span>
            {group.lastListingAt && (
              <>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                <span className={`text-[11px] ${isActive ? 'text-emerald-600' : isNew ? 'text-white/40' : 'text-slate-300'}`}>
                  {timeAgo(group.lastListingAt)}
                </span>
              </>
            )}
          </div>
        </div>
        <button onClick={onJoin} disabled={subscribing}
          className={`flex-shrink-0 h-8 px-4 rounded-xl text-[12px] font-bold transition-all ${justJoined ? 'bg-emerald-500 text-white scale-95' : isNew ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'} disabled:opacity-50`}>
          {justJoined ? '✓' : subscribing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Join'}
        </button>
      </div>
    );
  }

  async function unsubscribe(subId: string) {
    if (!confirm('Stop receiving listings from this group?')) return;
    setRemoving(p => new Set([...p, subId]));
    try { await fetch(`/api/ingestion/subscriptions/${subId}`, { method: 'DELETE', credentials: 'include' }); await load(); }
    catch {} finally { setRemoving(p => { const n = new Set(p); n.delete(subId); return n; }); }
  }

  const [discoverFilter, setDiscoverFilter] = useState<'trending' | 'active' | 'new'>('trending');
  const [justJoined,     setJustJoined]     = useState<string | null>(null);

  const sortedAvail = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = q ? filteredAvail : filteredAvail;
    if (discoverFilter === 'active') {
      return [...filtered].sort((a, b) =>
        new Date(b.lastListingAt ?? 0).getTime() - new Date(a.lastListingAt ?? 0).getTime()
      );
    }
    if (discoverFilter === 'new') {
      return [...filtered].sort((a, b) => a._count.subscriptions - b._count.subscriptions);
    }
    // trending = by subscriber count desc (already default)
    return filtered;
  }, [filteredAvail, discoverFilter, search]);

  async function subscribeSelected() {
    const ids = [...selectedAvail];
    if (!ids.length) return;
    setSubscribingAll(true);
    await Promise.all(ids.map(id => apiPost('/ingestion/subscriptions', { groupId: id }).catch(() => {})));
    setSelectedAvail(new Set());
    setBulkMode(false);
    setSubscribingAll(false);
    await load();
  }

  function toggleAvail(id: string) {
    setSelectedAvail(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-28 lg:pb-8 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-[22px] font-bold text-[#0B1F14]">Groups</h1>
            <p className="text-[13px] text-slate-400 mt-0.5">
              {activeSubs.length} subscribed · {available.length} available
            </p>
          </div>
          {tab === 'private' && (
            <button onClick={() => setShowAddPrivate(true)}
              className="flex items-center gap-1.5 h-9 rounded-xl bg-[#0B1F14] px-3 text-[13px] font-semibold text-white hover:bg-[#1A3525] transition-colors">
              <Plus className="h-3.5 w-3.5" />
              Add group
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {[
            { key: 'subscribed', label: 'Subscribed', count: activeSubs.length },
            { key: 'discover',   label: 'Discover',   count: available.length  },
            { key: 'private',    label: 'My groups',  count: privateGroups.length + privateSubs.length },
          ].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key as any); setSearch(''); setBulkMode(false); setSelectedAvail(new Set()); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12.5px] font-semibold transition-colors ${tab === t.key ? 'bg-[#0B1F14] text-white' : 'text-slate-400 hover:text-slate-600'}`}>
              {t.key === 'private' && <Lock className="h-3 w-3" />}
              {t.label}
              {t.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        {(tab === 'subscribed' || tab === 'discover') && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={tab === 'subscribed' ? 'Search your groups…' : 'Search available groups…'}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* ── SUBSCRIBED TAB ── */}
        {tab === 'subscribed' && (
          <div className="space-y-2">
            {filteredSubs.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-5 py-10 text-center">
                <Radio className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-[13.5px] font-medium text-slate-600 mb-1">
                  {search ? 'No groups match your search' : 'No subscriptions yet'}
                </p>
                <p className="text-[12px] text-slate-400 mb-4">
                  {search ? 'Try a different search term' : 'Subscribe to groups to receive listings automatically'}
                </p>
                {!search && (
                  <button onClick={() => setTab('discover')}
                    className="inline-flex items-center gap-1.5 h-9 rounded-xl bg-[#0B1F14] px-4 text-[12.5px] font-semibold text-white">
                    Browse groups
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ) : (
              filteredSubs.map(sub => {
                const isRecent = sub.lastListingAt && Date.now() - new Date(sub.lastListingAt).getTime() < 86400000 * 3;
                return (
                  <div key={sub.id} className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-4 py-3.5 flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isRecent ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-slate-800 truncate">{sub.group.groupName}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-[11.5px] text-slate-400">
                          <Home className="h-3 w-3" />{sub.propertyCount} listings
                        </span>
                        <span className="flex items-center gap-1 text-[11.5px] text-slate-400">
                          <Clock className="h-3 w-3" />{timeAgo(sub.lastListingAt)}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => unsubscribe(sub.id)} disabled={removing.has(sub.id)}
                      className="flex-shrink-0 text-[12px] font-medium text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-lg px-2.5 py-1.5 transition-all disabled:opacity-40 flex items-center gap-1">
                      {removing.has(sub.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : <WifiOff className="h-3 w-3" />}
                      Leave
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── DISCOVER TAB ── */}
        {tab === 'discover' && (
          <div className="space-y-4">

            {/* Filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
              {[
                { key: 'trending', label: '🔥 Trending' },
                { key: 'active',   label: '⚡ Most active' },
                { key: 'new',      label: '✨ Newest' },
              ].map(f => (
                <button key={f.key}
                  onClick={() => setDiscoverFilter(f.key as any)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${discoverFilter === f.key ? 'bg-[#0B1F14] text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400'}`}>
                  {f.label}
                </button>
              ))}
            </div>

            {sortedAvail.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-5 py-10 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-[13.5px] font-medium text-slate-600">
                  {search ? 'No groups found' : "You've joined all available groups!"}
                </p>
              </div>
            ) : (
              <>
                {/* TOP 2 — hero cards */}
                {!search && discoverFilter === 'trending' && sortedAvail.length >= 2 && (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">🏆 Top groups</p>
                    <div className="grid grid-cols-2 gap-3">
                      {sortedAvail.slice(0, 2).map((group, idx) => (
                        <GroupHeroCard
                          key={group.id}
                          group={group}
                          rank={idx + 1}
                          subscribing={subscribing.has(group.id)}
                          onJoin={() => subscribe(group.id)}
                          justJoined={justJoined === group.id}
                        />
                      ))}
                    </div>
                    {sortedAvail.length > 2 && (
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">📡 All groups</p>
                    )}
                  </>
                )}

                {/* Rest of groups — list */}
                <div className="space-y-2">
                  {(search || discoverFilter !== 'trending' ? sortedAvail : sortedAvail.slice(2)).map((group, idx) => {
                    const isNew = idx === 0 && discoverFilter === 'new';
                    const isHot = group._count.subscriptions > 200;
                    return (
                      <GroupListCard
                        key={group.id}
                        group={group}
                        isHot={isHot}
                        isNew={isNew && !search}
                        subscribing={subscribing.has(group.id)}
                        onJoin={() => subscribe(group.id)}
                        justJoined={justJoined === group.id}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── PRIVATE TAB ── */}
        {tab === 'private' && (
          <div className="space-y-2">
            {/* Linked private groups from subscriptions */}
            {privateSubs.map(sub => (
              <div key={sub.id} className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-4 py-3.5 flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <Lock className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-slate-800 truncate">{sub.group.groupName}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-slate-400">{sub.propertyCount} listings</span>
                    <span className="text-[11px] text-slate-400">{timeAgo(sub.lastListingAt)}</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700">Linked</span>
              </div>
            ))}

            {/* Pending private group requests */}
            {privateGroups.filter(pg => pg.status === 'PENDING').map(pg => (
              <div key={pg.id} className="rounded-2xl bg-white border border-amber-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-4 py-3.5 flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50">
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-slate-800">Waiting for code…</p>
                  <p className="text-[11.5px] text-amber-600 mt-0.5 font-mono tracking-widest">{pg.code}</p>
                </div>
                <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-amber-100 text-amber-700">Pending</span>
              </div>
            ))}

            {privateSubs.length === 0 && privateGroups.filter(p => p.status === 'PENDING').length === 0 && (
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-5 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 mx-auto mb-3">
                  <Lock className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-[13.5px] font-medium text-slate-600 mb-1">No private groups yet</p>
                <p className="text-[12px] text-slate-400 mb-4">Add your personal WhatsApp group — only you will see its listings.</p>
                <button onClick={() => setShowAddPrivate(true)}
                  className="inline-flex items-center gap-1.5 h-9 rounded-xl bg-[#0B1F14] px-4 text-[12.5px] font-semibold text-white">
                  <Plus className="h-3.5 w-3.5" />
                  Add personal group
                </button>
              </div>
            )}

            {(privateSubs.length > 0 || privateGroups.filter(p => p.status === 'PENDING').length > 0) && (
              <button onClick={() => setShowAddPrivate(true)}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed border-slate-200 text-[13px] font-medium text-slate-400 hover:border-emerald-300 hover:text-emerald-600 transition-colors">
                <Plus className="h-4 w-4" />
                Add another group
              </button>
            )}
          </div>
        )}

      </div>

      {showAddPrivate && (
        <AddPrivateGroupModal
          onClose={() => setShowAddPrivate(false)}
          onSuccess={() => { setShowAddPrivate(false); load(); setTab('private'); }}
        />
      )}
    </div>
  );
}