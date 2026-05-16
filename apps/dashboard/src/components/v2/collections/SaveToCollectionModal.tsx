'use client';

import { useEffect, useState } from 'react';
import { X, Bookmark, Plus, Check, Loader2 } from 'lucide-react';
import { apiGet, apiPost, apiDel } from '@/lib/api';
import { createPortal } from 'react-dom';

type Collection = {
  id:        string;
  name:      string;
  emoji?:    string | null;
  itemCount: number;
};

type Props = {
  listingId: string;
  onClose:   () => void;
};

export function SaveToCollectionModal({ listingId, onClose }: Props) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [savedIn,     setSavedIn]     = useState<Set<string>>(new Set());
  const [loading,     setLoading]     = useState(true);
  const [toggling,    setToggling]    = useState<string | null>(null);
  const [showNew,     setShowNew]     = useState(false);
  const [newName,     setNewName]     = useState('');
  const [newEmoji,    setNewEmoji]    = useState('📁');
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [cols, status] = await Promise.all([
          apiGet<Collection[]>('/collections'),
          apiGet<{ savedInCollections: string[] }>(`/collections/saved-status/${listingId}`),
        ]);
        setCollections(cols);
        setSavedIn(new Set(status.savedInCollections));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [listingId]);

  async function toggle(collectionId: string) {
    if (toggling) return;
    setToggling(collectionId);
    try {
      if (savedIn.has(collectionId)) {
        await apiDel(`/collections/${collectionId}/items/${listingId}`);
        setSavedIn((prev) => { const n = new Set(prev); n.delete(collectionId); return n; });
        setCollections((prev) => prev.map((c) =>
          c.id === collectionId ? { ...c, itemCount: Math.max(0, c.itemCount - 1) } : c
        ));
      } else {
        await apiPost(`/collections/${collectionId}/items`, { listingId });
        setSavedIn((prev) => new Set([...prev, collectionId]));
        setCollections((prev) => prev.map((c) =>
          c.id === collectionId ? { ...c, itemCount: c.itemCount + 1 } : c
        ));
      }
    } finally {
      setToggling(null);
    }
  }

  async function createAndSave() {
    if (!newName.trim() || saving) return;
    setSaving(true);
    try {
      const col = await apiPost<Collection>('/collections', {
        name:  newName.trim(),
        emoji: newEmoji,
      });
      await apiPost(`/collections/${col.id}/items`, { listingId });
      setCollections((prev) => [{ ...col, itemCount: 1 }, ...prev]);
      setSavedIn((prev) => new Set([...prev, col.id]));
      setShowNew(false);
      setNewName('');
      setNewEmoji('📁');
    } finally {
      setSaving(false);
    }
  }

  const EMOJI_OPTIONS = ['📁', '⭐', '🏠', '💼', '🎯', '❤️', '🔥', '✅'];

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
              <Bookmark className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <p className="text-[14px] font-semibold text-slate-900">Save to collection</p>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {collections.length === 0 && !showNew && (
                <p className="text-center text-[12.5px] text-slate-400 py-4">
                  No collections yet. Create one below.
                </p>
              )}

              {collections.map((col) => {
                const saved = savedIn.has(col.id);
                const busy  = toggling === col.id;
                return (
                  <button
                    key={col.id}
                    onClick={() => toggle(col.id)}
                    disabled={!!toggling}
                    className={[
                      'w-full flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all text-left',
                      saved
                        ? 'bg-amber-50 border border-amber-200'
                        : 'bg-slate-50 border border-slate-100 hover:border-slate-200',
                    ].join(' ')}
                  >
                    <span className="text-[18px] flex-shrink-0">{col.emoji ?? '📁'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-slate-800 truncate">{col.name}</p>
                      <p className="text-[11px] text-slate-400">{col.itemCount} saved</p>
                    </div>
                    <div className={[
                      'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all',
                      saved ? 'border-amber-500 bg-amber-500' : 'border-slate-300 bg-white',
                    ].join(' ')}>
                      {busy
                        ? <Loader2 className="h-2.5 w-2.5 animate-spin text-white" />
                        : saved && <Check className="h-2.5 w-2.5 text-white" />
                      }
                    </div>
                  </button>
                );
              })}

              {showNew ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {EMOJI_OPTIONS.map((e) => (
                      <button
                        key={e}
                        onClick={() => setNewEmoji(e)}
                        className={[
                          'text-[18px] rounded-lg w-9 h-9 flex items-center justify-center transition-all',
                          newEmoji === e ? 'bg-amber-100 ring-2 ring-amber-400' : 'hover:bg-slate-200',
                        ].join(' ')}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Collection name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createAndSave()}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowNew(false); setNewName(''); }}
                      className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-[12.5px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createAndSave}
                      disabled={!newName.trim() || saving}
                      className="flex-1 rounded-lg bg-[#0B1F14] py-2 text-[12.5px] font-semibold text-white disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Saving…' : 'Create & save'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNew(true)}
                  className="w-full flex items-center gap-2.5 rounded-xl border border-dashed border-slate-200 px-3.5 py-3 text-[13px] font-medium text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  New collection
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-3.5">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-slate-100 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}