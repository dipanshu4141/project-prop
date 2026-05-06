'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { Radio, CheckCircle2, PlusCircle, Trash2 } from 'lucide-react';

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
  group: {
    id: string;
    groupName: string;
    groupJid: string;
    phone: { phone: string; displayName?: string | null };
  };
}

function Spinner() {
  return <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />;
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">{children}</h2>;
}
function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center flex flex-col items-center gap-3">
      <div className="text-stone-300">{icon}</div>
      <p className="text-sm text-stone-400">{text}</p>
    </div>
  );
}

export default function GroupsPage() {
  const [available, setAvailable]         = useState<AvailableGroup[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading]             = useState(true);
  const [subscribing, setSubscribing]     = useState<Set<string>>(new Set());
  const [selectedSubs, setSelectedSubs]   = useState<Set<string>>(new Set());
  const [selectedAvail, setSelectedAvail] = useState<Set<string>>(new Set());
  const [bulkRemoving, setBulkRemoving]   = useState(false);
  const [bulkSubbing, setBulkSubbing]     = useState(false);

  const load = async () => {
    try {
      const [avail, subs] = await Promise.all([
        apiGet<AvailableGroup[]>('/ingestion/available-groups'),
        apiGet<Subscription[]>('/ingestion/subscriptions'),
      ]);
      setAvailable(avail);
      setSubscriptions(subs);
    } catch (e) {
      console.error('load failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const activeSubs = subscriptions.filter(s => s.active);
  const allSubsSelected = activeSubs.length > 0 && selectedSubs.size === activeSubs.length;
  const allAvailSelected = available.length > 0 && selectedAvail.size === available.length;

  const toggleSub = (id: string) => setSelectedSubs(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const toggleAvail = (id: string) => setSelectedAvail(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const subscribe = async (groupId: string) => {
    setSubscribing(prev => new Set([...prev, groupId]));
    try {
      await apiPost('/ingestion/subscriptions', { groupId });
      setSelectedAvail(prev => { const n = new Set(prev); n.delete(groupId); return n; });
      await load();
    } catch (e) { console.error('subscribe failed:', e); }
    finally { setSubscribing(prev => { const n = new Set(prev); n.delete(groupId); return n; }); }
  };

  const unsubscribeSingle = async (id: string) => {
    if (!confirm('Stop receiving listings from this group?')) return;
    await fetch(`/api/ingestion/subscriptions/${id}`, { method: 'DELETE', credentials: 'include' });
    setSelectedSubs(prev => { const n = new Set(prev); n.delete(id); return n; });
    await load();
  };

  const bulkUnsubscribe = async () => {
    if (!confirm(`Unsubscribe from ${selectedSubs.size} group(s)?`)) return;
    setBulkRemoving(true);
    await Promise.all([...selectedSubs].map(id =>
      fetch(`/api/ingestion/subscriptions/${id}`, { method: 'DELETE', credentials: 'include' })
    ));
    setSelectedSubs(new Set());
    setBulkRemoving(false);
    await load();
  };

  const bulkSubscribe = async () => {
    setBulkSubbing(true);
    const ids = [...selectedAvail];
    await Promise.all(ids.map(id => apiPost('/ingestion/subscriptions', { groupId: id }).catch(() => {})));
    setSelectedAvail(new Set());
    setBulkSubbing(false);
    await load();
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Radio className="h-5 w-5 text-emerald-600" />
            <h1 className="text-2xl font-bold text-[#0B1F14]">WhatsApp Groups</h1>
          </div>
          <p className="text-sm text-stone-400">
            Subscribe to groups to automatically receive and parse property listings.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : (
          <>
            {/* Active subscriptions */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <SectionTitle>Your subscriptions ({activeSubs.length})</SectionTitle>
                {selectedSubs.size > 0 && (
                  <button
                    onClick={bulkUnsubscribe}
                    disabled={bulkRemoving}
                    className="flex items-center gap-1.5 text-xs text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg px-3 py-1.5 font-semibold transition-colors disabled:opacity-50"
                  >
                    {bulkRemoving ? <Spinner /> : <Trash2 className="h-3.5 w-3.5" />}
                    Unsubscribe {selectedSubs.size} selected
                  </button>
                )}
              </div>

              {activeSubs.length === 0 ? (
                <EmptyState
                  icon={<Radio className="h-10 w-10" />}
                  text="You haven't subscribed to any groups yet. Subscribe below to start receiving listings."
                />
              ) : (
                <>
                  {/* Select all row */}
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <input
                      type="checkbox"
                      checked={allSubsSelected}
                      onChange={() => setSelectedSubs(allSubsSelected ? new Set() : new Set(activeSubs.map(s => s.id)))}
                      className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-stone-400">Select all</span>
                  </div>

                  <div className="space-y-2">
                    {activeSubs.map(sub => (
                      <div key={sub.id}
                        className={`border rounded-2xl px-5 py-4 flex items-center gap-3 transition-colors ${selectedSubs.has(sub.id) ? 'bg-red-50/60 border-red-200' : 'bg-white border-stone-200'}`}>
                        <input
                          type="checkbox"
                          checked={selectedSubs.has(sub.id)}
                          onChange={() => toggleSub(sub.id)}
                          className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 flex-shrink-0"
                        />
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#0B1F14] text-sm truncate">{sub.group.groupName}</p>
                          <p className="text-xs text-stone-400 mt-0.5">
                            via {sub.group.phone.displayName ?? sub.group.phone.phone}
                            <span className="mx-1.5 text-stone-200">·</span>
                            since {new Date(sub.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <button
                          onClick={() => unsubscribeSingle(sub.id)}
                          className="flex-shrink-0 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-200 hover:bg-red-50 rounded-lg px-3 py-1.5 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Unsub
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            {/* Available groups */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <SectionTitle>Available groups ({available.length})</SectionTitle>
                {selectedAvail.size > 0 && (
                  <button
                    onClick={bulkSubscribe}
                    disabled={bulkSubbing}
                    className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-1.5 font-semibold transition-colors disabled:opacity-50"
                  >
                    {bulkSubbing ? <Spinner /> : <PlusCircle className="h-3.5 w-3.5" />}
                    Subscribe {selectedAvail.size} selected
                  </button>
                )}
              </div>

              {available.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="h-10 w-10" />}
                  text="You're subscribed to all available groups."
                />
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <input
                      type="checkbox"
                      checked={allAvailSelected}
                      onChange={() => setSelectedAvail(allAvailSelected ? new Set() : new Set(available.map(g => g.id)))}
                      className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-stone-400">Select all</span>
                  </div>

                  <div className="space-y-2">
                    {available.map(group => (
                      <div key={group.id}
                        className={`border rounded-2xl px-5 py-4 flex items-center gap-3 transition-colors ${selectedAvail.has(group.id) ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-stone-200'}`}>
                        <input
                          type="checkbox"
                          checked={selectedAvail.has(group.id)}
                          onChange={() => toggleAvail(group.id)}
                          className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 flex-shrink-0"
                        />
                        <div className="w-8 h-8 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center flex-shrink-0">
                          <Radio className="h-4 w-4 text-stone-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#0B1F14] text-sm truncate">{group.groupName}</p>
                          <p className="text-xs text-stone-400 mt-0.5">
                            via {group.phone.displayName ?? group.phone.phone}
                            <span className="mx-1.5 text-stone-200">·</span>
                            {group._count.subscriptions} workspace{group._count.subscriptions !== 1 ? 's' : ''} subscribed
                          </p>
                        </div>
                        <button
                          onClick={() => subscribe(group.id)}
                          disabled={subscribing.has(group.id)}
                          className="flex-shrink-0 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-1.5 font-semibold transition-colors disabled:opacity-50"
                        >
                          {subscribing.has(group.id) ? <Spinner /> : <PlusCircle className="h-3.5 w-3.5" />}
                          Subscribe
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}