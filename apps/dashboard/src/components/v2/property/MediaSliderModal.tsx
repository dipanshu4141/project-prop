'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ZoomIn, Loader2 } from 'lucide-react';

interface MediaItem {
  id:       string;
  url:      string;
  type:     'IMAGE' | 'VIDEO' | 'DOCUMENT';
  mimeType: string;
}

interface Props {
  listingId:   string;
  initialIndex?: number;
  onClose:     () => void;
}

export function MediaSliderModal({ listingId, initialIndex = 0, onClose }: Props) {
  const [media,   setMedia]   = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [index,   setIndex]   = useState(initialIndex);

  // Fetch media on mount
  useEffect(() => {
    fetch(`/api/media/listing/${listingId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setMedia(Array.isArray(d) ? d : []))
      .catch(() => setMedia([]))
      .finally(() => setLoading(false));
  }, [listingId]);

  const prev = useCallback(() => setIndex((i) => (i > 0 ? i - 1 : media.length - 1)), [media.length]);
  const next = useCallback(() => setIndex((i) => (i < media.length - 1 ? i + 1 : 0)), [media.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape')     onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next, onClose]);

  // Touch swipe
  let touchStartX = 0;
  const onTouchStart = (e: React.TouchEvent) => { touchStartX = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 50)  next();
    if (diff < -50) prev();
  };

  const current = media[index];

  const modal = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Counter */}
      {media.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-[12px] font-medium text-white">
          {index + 1} / {media.length}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      )}

      {/* Empty */}
      {!loading && media.length === 0 && (
        <div className="text-center text-white/60">
          <p className="text-[15px] font-medium">No media yet</p>
          <p className="text-[13px] mt-1">Upload photos from the property page</p>
        </div>
      )}

      {/* Media */}
      {current && (
        <div
          className="relative max-h-[85vh] max-w-[90vw]"
          onClick={(e) => e.stopPropagation()}
        >
          {current.type === 'IMAGE' ? (
            <img
              key={current.id}
              src={current.url}
              className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
              alt=""
            />
          ) : (
            <video
              key={current.id}
              src={current.url}
              controls
              className="max-h-[85vh] max-w-[90vw] rounded-xl"
            />
          )}
        </div>
      )}

      {/* Prev / Next */}
      {media.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      {media.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3">
          {media.map((m, i) => (
            <button
              key={m.id}
              onClick={(e) => { e.stopPropagation(); setIndex(i); }}
              className={[
                'h-1.5 rounded-full transition-all duration-200',
                i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40',
              ].join(' ')}
            />
          ))}
        </div>
      )}
    </div>
  );

  return createPortal(modal, document.body);
}