'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, FolderPlus, Loader2, Link2, Folder, Plus, Check } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

type Props = {
  listingIds: string[];
  onClose: () => void;
};

type ShareTokenResponse = {
  url: string;
  expiresAt: string;
  clientId: string;
  isNew: boolean;
};

type ExistingShortlist = {
  id:        string;
  name?:     string | null;
  itemCount: number;
  client: {
    id:   string;
    name?: string | null;
  };
};

type Mode = 'choose' | 'new' | 'existing';

function isValidPhone(phone: string) {
  return phone.replace(/\D/g, '').length >= 10;
}

export function AddToShortlistModal({ listingIds, onClose }: Props) {
  const router = useRouter();

  const [mode,        setMode]        = useState<Mode>('choose');
  const [clientName,  setClientName]  = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientId,    setClientId]    = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [saving,      setSaving]      = useState(false);

  // Existing shortlists
  const [shortlists,    setShortlists]    = useState<ExistingShortlist[]>([]);
  const [slLoading,     setSlLoading]     = useState(false);
  const [selectedSlId,  setSelectedSlId]  = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load existing shortlists once
  useEffect(() => {
    setSlLoading(true);
    apiGet<ExistingShortlist[]>('/shortlists')
      .then((d) => setShortlists(Array.isArray(d) ? d : []))
      .catch(() => setShortlists([]))
      .finally(() => setSlLoading(false));
  }, []);

  // Resolve client by phone (debounced) — only in new mode
  const resolveClient = useCallback((phone: string, name: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!isValidPhone(phone)) { setClientId(null); return; }
    debounceRef.current = setTimeout(async () => {
      setLinkLoading(true);
      try {
        const data = await apiPost<ShareTokenResponse>(
          '/clients/share-token-by-phone',
          { phone: phone.replace(/\D/g, ''), name: name.trim() || undefined },
        );
        setClientId(data.clientId);
      } catch {
        setClientId(null);
      } finally {
        setLinkLoading(false);
      }
    }, 600);
  }, []);

  useEffect(() => {
    if (mode === 'new') resolveClient(clientPhone, clientName);
  }, [clientPhone, clientName, mode, resolveClient]);

  // Create new shortlist
  async function handleCreateNew() {
    if (!clientId || saving) return;
    setSaving(true);
    try {
      let finalClientId = clientId;
      if (!finalClientId && isValidPhone(clientPhone)) {
        const data = await apiPost<ShareTokenResponse>(
          '/clients/share-token-by-phone',
          { phone: clientPhone.replace(/\D/g, ''), name: clientName.trim() || undefined },
        );
        finalClientId = data.clientId;
      }
      const shortlist = await apiPost<{ id: string; clientId: string }>('/shortlists', {
        clientId:  finalClientId,
        listingIds,
        name: clientName.trim() ? `${clientName.trim()}'s shortlist` : undefined,
      });
      router.push(`/v2/clients/${shortlist.clientId}/shortlists/${shortlist.id}`);
      onClose();
    } catch (err) {
      console.error('Failed to create shortlist:', err);
    } finally {
      setSaving(false);
    }
  }

  // Add to existing shortlist
  async function handleAddToExisting() {
    if (!selectedSlId || saving) return;
    setSaving(true);
    try {
      const sl = shortlists.find((s) => s.id === selectedSlId)!;
      await apiPost(`/shortlists/${selectedSlId}/items`, { listingIds });
      router.push(`/v2/clients/${sl.client.id}/shortlists/${selectedSlId}`);
      onClose();
    } catch (err) {
      console.error('Failed to add to shortlist:', err);
    } finally {
      setSaving(false);
    }
  }

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <FolderPlus className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-900">Add to shortlist</p>
              <p className="text-[11.5px] text-slate-400">
                {listingIds.length} {listingIds.length === 1 ? 'property' : 'properties'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── CHOOSE MODE ── */}
        {mode === 'choose' && (
          <div className="px-6 py-5 space-y-3">
            <p className="text-[12.5px] text-slate-500">Where would you like to add these properties?</p>

            {/* Add to existing */}
            <button
              onClick={() => setMode('existing')}
              disabled={slLoading || shortlists.length === 0}
              className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 text-left hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                <Folder className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-800">Add to existing shortlist</p>
                <p className="text-[11.5px] text-slate-400 mt-0.5">
                  {slLoading ? 'Loading…' : shortlists.length === 0 ? 'No shortlists yet' : `${shortlists.length} shortlist${shortlists.length !== 1 ? 's' : ''} available`}
                </p>
              </div>
            </button>

            {/* Create new */}
            <button
              onClick={() => setMode('new')}
              className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 text-left hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-sky-50">
                <Plus className="h-4 w-4 text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-800">Create new shortlist</p>
                <p className="text-[11.5px] text-slate-400 mt-0.5">Enter client name and phone</p>
              </div>
            </button>
          </div>
        )}

        {/* ── EXISTING SHORTLIST MODE ── */}
        {mode === 'existing' && (
          <>
            <div className="px-6 py-4 space-y-2 max-h-[50vh] overflow-y-auto">
              <p className="text-[11.5px] font-medium text-slate-400 mb-3">Select a shortlist:</p>
              {shortlists.map((s) => {
                const selected = selectedSlId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSlId(s.id)}
                    className={[
                      'w-full flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all',
                      selected
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-slate-100 bg-slate-50 hover:border-slate-200',
                    ].join(' ')}
                  >
                    <Folder className={`h-4 w-4 flex-shrink-0 ${selected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-slate-800 truncate">
                        {s.name || 'Shortlist'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {s.client.name || 'Unknown client'} · {s.itemCount} propert{s.itemCount !== 1 ? 'ies' : 'y'}
                      </p>
                    </div>
                    <div className={[
                      'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all',
                      selected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white',
                    ].join(' ')}>
                      {selected && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <button
                onClick={() => setMode('choose')}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleAddToExisting}
                disabled={!selectedSlId || saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0B1F14] hover:bg-[#1A3525] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Adding…</>
                  : <><FolderPlus className="h-3.5 w-3.5" />Add to shortlist</>
                }
              </button>
            </div>
          </>
        )}

        {/* ── NEW SHORTLIST MODE ── */}
        {mode === 'new' && (
          <>
            <div className="px-6 py-5 space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11.5px] font-medium text-slate-500">Client name</label>
                <input
                  type="text"
                  placeholder="e.g. Ravi Sharma"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11.5px] font-medium text-slate-500">
                  Phone <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="+91 98200 00000"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {linkLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
                    {!linkLoading && clientId && <Link2 className="h-3.5 w-3.5 text-emerald-500" />}
                  </div>
                </div>
                <div className="h-4">
                  {linkLoading && isValidPhone(clientPhone) && (
                    <p className="text-[11px] text-slate-400">Looking up client…</p>
                  )}
                  {!linkLoading && clientId && (
                    <p className="text-[11px] text-emerald-600">Client found — shortlist will be created</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <button
                onClick={() => setMode('choose')}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreateNew}
                disabled={!isValidPhone(clientPhone) || saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0B1F14] hover:bg-[#1A3525] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Creating…</>
                  : <><FolderPlus className="h-3.5 w-3.5" />Create shortlist</>
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}