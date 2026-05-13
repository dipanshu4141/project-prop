'use client';

import { useState } from 'react';
import type { ShareMedia } from './page';

// ── Carousel ──────────────────────────────────────────────────────────────────

function MediaCarousel({
  media,
  propertyType,
}: {
  media: ShareMedia[];
  propertyType: string | null;
}) {
  const [idx, setIdx] = useState(0);

  const images = media.filter((m) => m.type === 'IMAGE');
  const videos = media.filter((m) => m.type === 'VIDEO');
  const all    = [...images, ...videos];

  if (all.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center"
        style={{ aspectRatio: '16/9', background: '#E8E4DB' }}
      >
        <span className="text-5xl opacity-30">{propertyIcon(propertyType)}</span>
      </div>
    );
  }

  const current = all[idx];
  const prev = () => setIdx((i) => (i === 0 ? all.length - 1 : i - 1));
  const next = () => setIdx((i) => (i === all.length - 1 ? 0 : i + 1));

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9', background: '#0B1F14' }}>

      {/* Current media */}
      {current.type === 'IMAGE' ? (
        <img
          src={current.url}
          alt=""
          className="w-full h-full object-cover"
          style={{ transition: 'opacity 0.2s' }}
        />
      ) : (
        <video
          src={current.url}
          controls
          className="w-full h-full object-contain"
        />
      )}

      {/* Nav arrows — only if more than one */}
      {all.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-white transition-all active:scale-90"
            style={{ background: 'rgba(0,0,0,0.45)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-white transition-all active:scale-90"
            style={{ background: 'rgba(0,0,0,0.45)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {all.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                className="rounded-full transition-all"
                style={{
                  width:   i === idx ? 16 : 6,
                  height:  6,
                  background: i === idx ? '#fff' : 'rgba(255,255,255,0.45)',
                }}
              />
            ))}
          </div>

          {/* Counter */}
          <div
            className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
            style={{ background: 'rgba(0,0,0,0.45)' }}
          >
            {idx + 1} / {all.length}
          </div>
        </>
      )}
    </div>
  );
}

// ── Icon helper (copy from SharePortalClient or import) ───────────────────────

const PROPERTY_TYPE_ICONS: Record<string, string> = {
  APARTMENT: '🏢', VILLA: '🏡', OFFICE: '🏢',
  SHOP: '🏪', WAREHOUSE: '🏭', SHOWROOM: '🏪',
  PLOT: '🗺️', OTHER: '🏠',
};

function propertyIcon(type: string | null): string {
  if (!type) return '🏠';
  return PROPERTY_TYPE_ICONS[type.toUpperCase()] ?? '🏠';
}

export { MediaCarousel, propertyIcon };