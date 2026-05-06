'use client';

import { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { apiGet, apiPost, apiDel } from '@/lib/api';
import { Trash2 } from 'lucide-react';

type PhoneStatus = 'CONNECTED' | 'DISCONNECTED' | 'QR_PENDING' | 'CONNECTING';

interface Phone {
  id: string; phone: string; displayName?: string | null;
  active: boolean; sessionPath: string; qrCode?: string | null; status: PhoneStatus;
}
interface Group {
  id: string; groupJid: string; groupName: string; ingestionPhoneId: string;
  phone: { phone: string; displayName?: string | null }; _count: { subscriptions: number };
}
interface LiveGroup { jid: string; name: string; participantCount: number; }

const STATUS_META: Record<PhoneStatus, { label: string; dot: string; badge: string }> = {
  CONNECTED:    { label: 'Connected',    dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  QR_PENDING:   { label: 'Scan QR',     dot: 'bg-amber-400 animate-pulse', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  CONNECTING:   { label: 'Connecting…', dot: 'bg-blue-400 animate-pulse',  badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  DISCONNECTED: { label: 'Offline',     dot: 'bg-stone-400', badge: 'bg-stone-100 text-stone-500 border-stone-200' },
};

function StatusBadge({ status }: { status: PhoneStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${m.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  );
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">{children}</h2>;
}
function Spinner() {
  return <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />;
}

function AddPhoneModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [sessionPath, setSessionPath] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!phone.trim() || !sessionPath.trim()) { setError('Phone and session path are required.'); return; }
    setSaving(true); setError('');
    try {
      await apiPost('/admin/ingestion/phones', { phone: phone.trim(), displayName: displayName.trim(), sessionPath: sessionPath.trim() });
      onAdded(); onClose();
    } catch (e: any) { setError(e?.message ?? 'Failed to add phone'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#0B1F14]">Add Ingestion Phone</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl leading-none">×</button>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Phone number', value: phone, set: setPhone, placeholder: '919876543210' },
            { label: 'Display name (optional)', value: displayName, set: setDisplayName, placeholder: 'Ingestion #1' },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs font-semibold text-stone-500 block mb-1">{f.label}</label>
              <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-stone-500 block mb-1">Session path</label>
            <input value={sessionPath} onChange={e => setSessionPath(e.target.value)} placeholder="wa-sessions/phone1"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <p className="text-xs text-stone-400 mt-1">Folder where Baileys stores session credentials.</p>
          </div>
        </div>
        {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 border border-stone-200 rounded-lg py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex-1 bg-[#0B1F14] text-white rounded-lg py-2 text-sm font-semibold hover:bg-emerald-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Spinner /> : 'Add Phone'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PhoneCard({ phone, onRemove, onViewGroups, onSyncDone }: { phone: Phone; onRemove: (id: string) => void; onViewGroups: (id: string) => void; onSyncDone: () => void }) {

  const [qr, setQr] = useState<string | null>(phone.qrCode ?? null);
  const [status, setStatus] = useState<PhoneStatus>(phone.status);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === 'QR_PENDING' || status === 'CONNECTING') {
      pollRef.current = setInterval(async () => {
        try {
          const phones = await apiGet<Phone[]>('/admin/ingestion/phones');
          const updated = phones.find(p => p.id === phone.id);
          if (updated) {
            setStatus(updated.status); setQr(updated.qrCode ?? null);
            if (updated.status === 'CONNECTED') clearInterval(pollRef.current!);
          }
        } catch {}
      }, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [status]);

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-[#0B1F14] text-sm">{phone.displayName ?? phone.phone}</p>
          {phone.displayName && <p className="text-xs text-stone-400 mt-0.5">{phone.phone}</p>}
          <p className="text-xs text-stone-300 mt-0.5 font-mono">{phone.sessionPath}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      {status === 'QR_PENDING' && qr && (
        <div className="flex flex-col items-center gap-2 py-3 border border-amber-100 bg-amber-50 rounded-xl">
          <QRCodeSVG value={qr} size={180} />
          <p className="text-xs text-amber-600 font-medium">WhatsApp → Linked Devices → Scan</p>
        </div>
      )}
      {status === 'QR_PENDING' && !qr && (
        <div className="flex items-center gap-2 text-xs text-stone-400 py-2"><Spinner /> Waiting for QR…</div>
      )}
      {status === 'CONNECTED' && (
        <div className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Session active
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <button onClick={() => onViewGroups(phone.id)}
          className="flex-1 text-xs border border-stone-200 rounded-lg py-1.5 text-stone-600 hover:bg-stone-50 transition-colors font-medium">
          View Groups
        </button>
        <button
          onClick={async () => {
            try {
              await fetch(`/api/admin/ingestion/phones/${phone.id}/sync-groups`, {
                method: 'POST', credentials: 'include',
              });
              onSyncDone();
            } catch { alert('Sync failed — phone may not be connected'); }
          }}
          className="text-xs border border-emerald-100 text-emerald-600 hover:bg-emerald-50 rounded-lg px-3 py-1.5 transition-colors font-medium"
        >
          Sync
        </button>
        <button onClick={() => onRemove(phone.id)}
          className="text-xs border border-red-100 text-red-400 hover:bg-red-50 rounded-lg px-3 py-1.5 transition-colors font-medium">
          Remove
        </button>
      </div>
    </div>
  );
}

function GroupsDrawer({ phoneId, onClose }: { phoneId: string; onClose: () => void }) {
  const [liveGroups, setLiveGroups] = useState<LiveGroup[]>([]);
  const [dbGroups, setDbGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet<LiveGroup[]>(`/admin/ingestion/phones/${phoneId}/groups`),
      apiGet<Group[]>('/admin/ingestion/groups'),
    ]).then(([live, db]) => {
      setLiveGroups(live);
      setDbGroups(db.filter(g => g.ingestionPhoneId === phoneId));
    }).finally(() => setLoading(false));
  }, [phoneId]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-[#0B1F14]">WhatsApp Groups</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl">×</button>
        </div>
        <div className="p-6 space-y-6">
          {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (<>
            <div>
              <SectionTitle>Live groups ({liveGroups.length})</SectionTitle>
              {liveGroups.length === 0
                ? <p className="text-sm text-stone-400">Phone not connected or no groups joined.</p>
                : <div className="space-y-2">{liveGroups.map(g => (
                    <div key={g.jid} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-stone-50 border border-stone-100">
                      <div>
                        <p className="text-sm font-medium text-[#0B1F14]">{g.name}</p>
                        <p className="text-xs text-stone-400 font-mono">{g.jid}</p>
                      </div>
                      <span className="text-xs text-stone-400">{g.participantCount} members</span>
                    </div>
                  ))}</div>
              }
            </div>
            <div>
              <SectionTitle>Synced to DB ({dbGroups.length})</SectionTitle>
              {dbGroups.length === 0
                ? <p className="text-sm text-stone-400">Groups sync automatically on connect.</p>
                : <div className="space-y-2">{dbGroups.map(g => (
                    <div key={g.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <div>
                        <p className="text-sm font-medium text-[#0B1F14]">{g.groupName}</p>
                        <p className="text-xs text-stone-400 font-mono">{g.groupJid}</p>
                      </div>
                      <span className="text-xs text-emerald-600 font-semibold">{g._count.subscriptions} subs</span>
                    </div>
                  ))}</div>
              }
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}

// ── Groups table with multi-select ────────────────────────────────────────────

function GroupsTable({ groups, onReload }: { groups: Group[]; onReload: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const allSelected = groups.length > 0 && selected.size === groups.length;

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(groups.map(g => g.id)));
  };

  const bulkRemove = async () => {
    if (!confirm(`Remove ${selected.size} group(s) and all their subscriptions?`)) return;
    setDeleting(true);
    await Promise.all([...selected].map(id =>
      fetch(`/api/admin/ingestion/groups/${id}`, { method: 'DELETE', credentials: 'include' })
    ));
    setSelected(new Set());
    setDeleting(false);
    onReload();
  };

  const removeSingle = async (id: string) => {
    if (!confirm('Remove this group and all its subscriptions?')) return;
    await fetch(`/api/admin/ingestion/groups/${id}`, { method: 'DELETE', credentials: 'include' });
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    onReload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle>All synced groups ({groups.length})</SectionTitle>
        {selected.size > 0 && (
          <button
            onClick={bulkRemove}
            disabled={deleting}
            className="flex items-center gap-1.5 text-xs text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg px-3 py-1.5 font-semibold transition-colors disabled:opacity-50"
          >
            {deleting ? <Spinner /> : <Trash2 className="h-3.5 w-3.5" />}
            Remove {selected.size} selected
          </button>
        )}
      </div>
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                />
              </th>
              <th className="text-left px-4 py-3 font-medium">Group name</th>
              <th className="text-left px-4 py-3 font-medium">JID</th>
              <th className="text-left px-4 py-3 font-medium">Phone</th>
              <th className="text-left px-4 py-3 font-medium">Subscriptions</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {groups.map(g => (
              <tr key={g.id}
                className={`border-b border-stone-50 last:border-0 transition-colors ${selected.has(g.id) ? 'bg-red-50/50' : 'hover:bg-stone-50'}`}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(g.id)}
                    onChange={() => toggle(g.id)}
                    className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </td>
                <td className="px-4 py-3 font-medium text-[#0B1F14]">{g.groupName}</td>
                <td className="px-4 py-3 font-mono text-xs text-stone-400 max-w-[160px] truncate">{g.groupJid}</td>
                <td className="px-4 py-3 text-stone-500 text-xs">{g.phone.displayName ?? g.phone.phone}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${g._count.subscriptions > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-400'}`}>
                    {g._count.subscriptions}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => removeSingle(g.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IngestionAdminPage() {
  const [phones, setPhones]       = useState<Phone[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [drawerPhoneId, setDrawerPhoneId] = useState<string | null>(null);

  const load = async () => {
    try {
      const [p, g] = await Promise.all([
        apiGet<Phone[]>('/admin/ingestion/phones'),
        apiGet<Group[]>('/admin/ingestion/groups'),
      ]);
      setPhones(p);
      setAllGroups(g);
    } catch (e) {
      console.error('load failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const removePhone = async (id: string) => {
    if (!confirm('Remove this phone and disconnect the session?')) return;
    try {
      await fetch(`/api/admin/ingestion/phones/${id}`, { method: 'DELETE', credentials: 'include' });
      await load();
    } catch (e) {
      console.error('Remove failed:', e);
      alert('Failed to remove phone');
    }
  };

  const connected = phones.filter(p => p.status === 'CONNECTED').length;
  const totalSubs = allGroups.reduce((acc, g) => acc + g._count.subscriptions, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F14]">Ingestion Phones</h1>
          <p className="text-sm text-stone-400 mt-1">Shared WhatsApp sessions and group subscriptions</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="bg-[#0B1F14] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-emerald-900 transition-colors">
          + Add Phone
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total phones', value: phones.length, accent: false },
          { label: 'Connected', value: connected, accent: connected > 0 },
          { label: 'Total subscriptions', value: totalSubs, accent: false },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.accent ? 'bg-emerald-600 border-emerald-500' : 'bg-white border-stone-200'}`}>
            <p className={`text-xs font-medium uppercase tracking-wide ${s.accent ? 'text-emerald-100' : 'text-stone-400'}`}>{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.accent ? 'text-white' : 'text-[#0B1F14]'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : phones.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
          <p className="text-stone-400 text-sm">No ingestion phones added yet.</p>
          <button onClick={() => setShowAdd(true)} className="mt-4 text-sm text-emerald-600 font-semibold hover:underline">Add your first phone →</button>
        </div>
      ) : (
        <div>
          <SectionTitle>Phones ({phones.length})</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {phones.map(p => (
              <PhoneCard key={p.id} phone={p} onRemove={removePhone} onViewGroups={setDrawerPhoneId} onSyncDone={load} />
            ))}
          </div>
        </div>
      )}

      {allGroups.length > 0 && (
        <GroupsTable groups={allGroups} onReload={load} />
      )}

      {showAdd && <AddPhoneModal onClose={() => setShowAdd(false)} onAdded={load} />}
      {drawerPhoneId && <GroupsDrawer phoneId={drawerPhoneId} onClose={() => setDrawerPhoneId(null)} />}
    </div>
  );
}