'use client';

import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { SaveToCollectionModal } from './SaveToCollectionModal';

type Props = {
  listingId: string;
  saved?:    boolean;
};

export function SaveToCollectionButton({ listingId, saved = false }: Props) {
  const [open,    setOpen]    = useState(false);
  const [isSaved, setIsSaved] = useState(saved);

  // Sync when parent prop changes (e.g. after page refresh loads fresh data)
  useEffect(() => {
    setIsSaved(saved);
  }, [saved]);

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(true); }}
        className={[
          'flex h-7 w-7 items-center justify-center rounded-lg border transition-all',
          isSaved
            ? 'border-amber-300 bg-amber-50 text-amber-600'
            : 'border-slate-200 bg-white text-slate-400 hover:border-amber-300 hover:text-amber-500',
        ].join(' ')}
        title="Save to collection"
      >
        <Bookmark className={['h-3.5 w-3.5', isSaved ? 'fill-amber-500' : ''].join(' ')} />
      </button>

      {open && (
        <SaveToCollectionModal
          listingId={listingId}
          onClose={() => { setOpen(false); setIsSaved(true); }}
        />
      )}
    </>
  );
}