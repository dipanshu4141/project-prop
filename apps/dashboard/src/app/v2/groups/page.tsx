'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { Search, Radio, CheckCircle2, Clock, Home, Lock, Plus, X, Copy, Check } from 'lucide-react';

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
    isPrivate: boolean;
    phone: { phone: string; displayName?: string | null };
  };
}

interface PrivateGroup {
  id: string;
  code: string;
  groupJid: string | null;
  groupName: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
}

interface PendingRequest {
  id: string;
  code: string;
  expiresAt: string;
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

/* ─── Add Private Group Modal ──────────────────────────────── */
function AddPrivateGroupModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep]             = useState<'loading' | 'show'>('loading');
  const [request, setRequest]       = useState<{ code: string; expiresAt: string; phoneNumber: string } | null>(null);
  const [copied, setCopied]         = useState<'number' | 'code' | null>(null);
  const [polling, setPolling]       = useState(false);

  useEffect(() => {
    fetch('/api/private-groups/pending', { credentials: 'include' })
      .then(r => r.text())
      .then(text => {
        const data = text ? JSON.parse(text) : null;
        if (data && data.code) {
          setRequest({ 
            code: data.code, 
            expiresAt: data.expiresAt, 
            phoneNumber: process.env.NEXT_PUBLIC_PRIVATE_PHONE ?? '+919717970520'
          });
          setStep('show');
        } else {
          return fetch('/api/private-groups/request', { method: 'POST', credentials: 'include' })
            .then(r => r.json())
            .then(d => { setRequest(d); setStep('show'); });
        }
      })
      .catch(() => setStep('show'));
  }, []);

  const initialCount = useRef(0);

  useEffect(() => {
    // Store initial count when modal opens
    fetch('/api/private-groups', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { initialCount.current = Array.isArray(data) ? data.length : 0; });
  }, []);

  // Poll for linking
  useEffect(() => {
    if (step !== 'show' || !request) return;
    const interval = setInterval(async () => {
      const res = await fetch('/api/private-groups', { credentials: 'include' }).then(r => r.json());
      if (Array.isArray(res) && res.length > initialCount.current) {
        clearInterval(interval);
        onSuccess();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [step, request]);

  function copy(text: string, type: 'number' | 'code') {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0B1F14] flex items-center justify-center">
              <Lock className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-[15px] font-bold text-[#0B1F14]">Add personal group</h2>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 'loading' && (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        )}

        {step === 'show' && request && (
          <div className="space-y-4">
            <p className="text-[13px] text-stone-500">
              Follow these 2 steps to link your personal WhatsApp group privately. Only you will see listings from this group.
            </p>

            {/* Step 1 */}
            <div className="rounded-xl bg-stone-50 border border-stone-200 p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Step 1</p>
              <p className="text-[13px] text-stone-600 mb-3">Add this number to your WhatsApp group:</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-2 text-[14px] font-mono font-bold text-[#0B1F14]">
                  {request.phoneNumber || process.env.NEXT_PUBLIC_PRIVATE_PHONE || '—'}
                </div>
                <button
                  onClick={() => copy(request.phoneNumber, 'number')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B1F14] text-white text-[12px] font-semibold"
                >
                  {copied === 'number' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === 'number' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Step 2</p>
              <p className="text-[13px] text-stone-600 mb-3">Send this code as a message in that group:</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-emerald-200 rounded-lg px-3 py-2 text-[18px] font-mono font-bold text-emerald-700 tracking-widest">
                  {request.code}
                </div>
                <button
                  onClick={() => copy(request.code, 'code')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 text-white text-[12px] font-semibold"
                >
                  {copied === 'code' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === 'code' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Waiting indicator */}
            <div className="flex items-center gap-2 text-[12px] text-stone-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Waiting for group to link… (auto-detects when code is sent)
            </div>

            <p className="text-[11px] text-stone-400">
              Code expires {new Date(request.expiresAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────── */
export default function GroupsPage() {
  const [available, setAvailable]         = useState<AvailableGroup[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [privateGroups, setPrivateGroups] = useState<PrivateGroup[]>([]);
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
  const [tab, setTab]                     = useState<'network' | 'private'>('network');
  const [showAddPrivate, setShowAddPrivate] = useState(false);

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
  const toggleSub   = (id: string) => setSelectedSubs(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

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
      <div className="max-w-2xl mx-auto px-5 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0B1F14]">WhatsApp Groups</h1>
            <p className="text-sm text-stone-400 mt-1">
              Subscribe to groups — listings appear automatically.
            </p>
          </div>
          {tab === 'private' && (
            <button
              onClick={() => setShowAddPrivate(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B1F14] text-white text-[13px] font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              Add group
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-stone-200 rounded-xl p-1">
          <button
            onClick={() => setTab('network')}
            className={`flex-1 text-[13px] font-semibold rounded-lg py-2 transition-colors ${tab === 'network' ? 'bg-[#0B1F14] text-white' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Network groups ({activeSubs.length})
          </button>
          <button
            onClick={() => setTab('private')}
            className={`flex-1 text-[13px] font-semibold rounded-lg py-2 transition-colors flex items-center justify-center gap-1.5 ${tab === 'private' ? 'bg-[#0B1F14] text-white' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <Lock className="h-3.5 w-3.5" />
            My groups ({privateGroups.length})
          </button>
        </div>

        {/* ── NETWORK TAB ── */}
        {tab === 'network' && (
          <div className="space-y-6">
            {/* Subscribed network groups */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
                  Your subscriptions ({activeSubs.length})
                </p>
                <div className="flex items-center gap-2">
                  {selectedSubs.size > 0 && (
                    <button onClick={removeSelected}
                      className="text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-3 py-1.5 transition-colors">
                      Remove {selectedSubs.size}
                    </button>
                  )}
                  {activeSubs.length > 1 && (
                    <select value={sortSubs} onChange={e => setSortSubs(e.target.value as any)}
                      className="text-xs text-stone-500 border border-stone-200 rounded-lg px-2 py-1 bg-white focus:outline-none">
                      <option value="activity">Last listing</option>
                      <option value="count">Most properties</option>
                      <option value="recent">Recently joined</option>
                    </select>
                  )}
                </div>
              </div>

              {activeSubs.length > 4 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-300" />
                  <input value={searchSubs} onChange={e => setSearchSubs(e.target.value)}
                    placeholder="Search your groups…"
                    className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 placeholder:text-stone-300" />
                </div>
              )}

              {activeSubs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200 px-5 py-8 text-center">
                  <Radio className="h-8 w-8 text-stone-200 mx-auto mb-2" />
                  <p className="text-sm font-medium text-stone-400">No subscriptions yet</p>
                  <p className="text-xs text-stone-300 mt-1">Subscribe to groups below.</p>
                </div>
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
                          <span className="flex items-center gap-1 text-xs text-stone-400">
                            <Home className="h-3 w-3" />{sub.propertyCount} listings
                          </span>
                          <span className="flex items-center gap-1 text-xs text-stone-400">
                            <Clock className="h-3 w-3" />{timeAgo(sub.lastListingAt)}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => unsubscribe(sub.id)} disabled={removing.has(sub.id)}
                        className="flex-shrink-0 text-xs text-stone-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-40 flex items-center gap-1">
                        {removing.has(sub.id) ? <Spinner small /> : 'Remove'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Available network groups */}
            {available.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
                    Available ({filteredAvail.length})
                  </p>
                  <div className="flex items-center gap-2">
                    {bulkMode && selectedAvail.size > 0 && (
                      <button onClick={subscribeSelected} disabled={subscribingAll}
                        className="text-xs font-semibold text-white bg-[#0B1F14] rounded-lg px-3 py-1.5 disabled:opacity-50 flex items-center gap-1.5">
                        {subscribingAll ? <Spinner small /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Subscribe {selectedAvail.size}
                      </button>
                    )}
                    {filteredAvail.length > 0 && !bulkMode && (
                      <button onClick={subscribeAllVisible} disabled={subscribingAll}
                        className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-1.5 disabled:opacity-50 flex items-center gap-1.5">
                        {subscribingAll ? <Spinner small /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Subscribe all
                      </button>
                    )}
                    <button onClick={() => { setBulkMode(p => !p); setSelectedAvail(new Set()); }}
                      className="text-xs text-stone-400 hover:text-stone-600 border border-stone-200 rounded-lg px-2 py-1.5 bg-white">
                      {bulkMode ? 'Cancel' : 'Select'}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-300" />
                  <input value={searchAvail} onChange={e => setSearchAvail(e.target.value)}
                    placeholder="Search groups by name…"
                    className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 placeholder:text-stone-300" />
                </div>

                <div className="space-y-2">
                  {filteredAvail.map(group => (
                    <div key={group.id}
                      onClick={bulkMode ? () => toggleAvail(group.id) : undefined}
                      className={`bg-white rounded-2xl border px-4 py-3.5 flex items-center gap-3 transition-colors ${bulkMode ? 'cursor-pointer' : ''} ${selectedAvail.has(group.id) ? 'border-emerald-300 bg-emerald-50/50' : 'border-stone-200'}`}>
                      {bulkMode ? (
                        <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${selectedAvail.has(group.id) ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300'}`}>
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
                      <button onClick={() => subscribe(group.id)} disabled={subscribing.has(group.id)}
                        className="flex-shrink-0 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-1.5 disabled:opacity-50 flex items-center gap-1.5">
                        {subscribing.has(group.id) ? <Spinner small /> : '+ Subscribe'}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── PRIVATE TAB ── */}
        {tab === 'private' && (
          <div className="space-y-4">
            {privateGroups.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 px-5 py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3">
                  <Lock className="h-6 w-6 text-stone-300" />
                </div>
                <p className="text-sm font-medium text-stone-600 mb-1">No private groups yet</p>
                <p className="text-xs text-stone-400 mb-4">
                  Add your personal WhatsApp group — only you will see its listings.
                </p>
                <button
                  onClick={() => setShowAddPrivate(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1F14] text-white text-[13px] font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add personal group
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {privateGroups.map(pg => (
                  <div key={pg.id} className="bg-white rounded-2xl border border-stone-200 px-4 py-3.5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Lock className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0B1F14] truncate">
                        {pg.groupName ?? 'Linking…'}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {pg.status === 'LINKED' ? 'Private · Only visible to you' : 'Waiting for code to be sent…'}
                      </p>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${pg.status === 'LINKED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {pg.status === 'LINKED' ? 'Linked' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modal */}
      {showAddPrivate && (
        <AddPrivateGroupModal
          onClose={() => setShowAddPrivate(false)}
          onSuccess={() => { setShowAddPrivate(false); load(); setTab('private'); }}
        />
      )}
    </div>
  );
}