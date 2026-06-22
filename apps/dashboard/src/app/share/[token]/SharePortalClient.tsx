'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ShareData, ShareProperty, ShareMedia } from './page';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(price: string | number | null | undefined): string {
  if (price == null || price === '') return 'Price on request';
  const n = Number(price);
  if (isNaN(n) || n <= 0) return 'Price on request';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

type ClientStatus = 'PENDING' | 'INTERESTED' | 'NOT_INTERESTED';

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({
  media,
  startIndex,
  onClose,
}: {
  media: ShareMedia[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIdx((i) => (i === 0 ? media.length - 1 : i - 1));
      if (e.key === 'ArrowRight') setIdx((i) => (i === media.length - 1 ? 0 : i + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [media.length, onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const current = media[idx];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: 'rgba(8,8,8,0.97)' }}
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className="text-xs font-semibold tracking-[0.2em] uppercase"
          style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans', sans-serif" }}
        >
          {idx + 1} / {media.length}
        </span>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Media */}
      <div
        className="flex-1 flex items-center justify-center px-4 relative min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {current.type === 'IMAGE' ? (
          <img
            src={current.url}
            alt=""
            className="max-h-full max-w-full rounded-lg object-contain"
            style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
          />
        ) : (
          <video
            src={current.url}
            controls
            autoPlay
            className="max-h-full max-w-full rounded-lg"
            style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
          />
        )}

        {media.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => (i === 0 ? media.length - 1 : i - 1))}
              className="absolute left-2 sm:left-6 flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => setIdx((i) => (i === media.length - 1 ? 0 : i + 1))}
              className="absolute right-2 sm:right-6 flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {media.length > 1 && (
        <div
          className="flex gap-2 px-6 py-4 overflow-x-auto flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
          style={{ scrollbarWidth: 'none' }}
        >
          {media.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setIdx(i)}
              className="flex-shrink-0 rounded-md overflow-hidden transition-all"
              style={{
                width: 52, height: 40,
                outline: i === idx ? '2px solid rgba(255,255,255,0.8)' : '2px solid transparent',
                outlineOffset: 2,
                opacity: i === idx ? 1 : 0.45,
              }}
            >
              {m.type === 'IMAGE' ? (
                <img src={m.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: '#1a1a1a' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white" opacity={0.7}><path d="M8 5v14l11-7z"/></svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Property Card ─────────────────────────────────────────────────────────────

function PropertyCard({
  property,
  index,
  onRespond,
}: {
  property: ShareProperty & { clientStatus: ClientStatus };
  index: number;
  onRespond: (id: string, status: 'INTERESTED' | 'NOT_INTERESTED') => void;
}) {
  const { listing, clientStatus } = property;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const touchStart = useRef<number | null>(null);

  const allMedia = listing.media ?? [];
  const hasMedia = allMedia.length > 0;

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCarouselIdx((i) => (i === 0 ? allMedia.length - 1 : i - 1));
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCarouselIdx((i) => (i === allMedia.length - 1 ? 0 : i + 1));
  };

  const details = [
    listing.bhk ? `${listing.bhk} BHK` : null,
    listing.propertyType?.replace(/_/g, ' '),
    listing.area ? `${listing.area.toLocaleString('en-IN')} sq ft` : null,
  ].filter(Boolean);

  const location = [listing.locality, listing.city].filter(Boolean).join(', ');

  return (
    <>
      {lightboxIndex !== null && (
        <Lightbox
          media={allMedia}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      <article
        className="rounded-2xl overflow-hidden"
        style={{
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(11,31,20,0.06)',
          animationDelay: `${index * 80}ms`,
        }}
      >
        {/* ── Media area ── */}
        <div
          className="relative overflow-hidden cursor-pointer"
          style={{ aspectRatio: '4/3', background: '#F0EDE8' }}
          onClick={() => hasMedia && setLightboxIndex(carouselIdx)}
          onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStart.current === null) return;
            const diff = touchStart.current - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) {
              if (diff > 0) setCarouselIdx((i) => (i === allMedia.length - 1 ? 0 : i + 1));
              else setCarouselIdx((i) => (i === 0 ? allMedia.length - 1 : i - 1));
            }
            touchStart.current = null;
          }}
        >
          {hasMedia ? (
            <>
              {allMedia[carouselIdx].type === 'IMAGE' ? (
                <img
                  src={allMedia[carouselIdx].url}
                  alt=""
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: '#111' }}>
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full"
                    style={{ background: 'rgba(255,255,255,0.15)' }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
              )}

              {/* Expand hint */}
              <div
                className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white"
                style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                View full
              </div>

              {/* Nav arrows */}
              {allMedia.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-90"
                    style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-90"
                    style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  </button>

                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                    {allMedia.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); setCarouselIdx(i); }}
                        className="rounded-full transition-all"
                        style={{
                          width: i === carouselIdx ? 14 : 5,
                          height: 5,
                          background: i === carouselIdx ? '#fff' : 'rgba(255,255,255,0.5)',
                        }}
                      />
                    ))}
                  </div>

                  {/* Counter */}
                  <div
                    className="absolute top-3 left-3 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {carouselIdx + 1}/{allMedia.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C8C4BC" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              <span className="text-xs" style={{ color: '#C0BBB2', fontFamily: "'DM Sans', sans-serif" }}>No photos added</span>
            </div>
          )}

          {/* Status badge */}
          {clientStatus !== 'PENDING' && (
            <div
              className="absolute top-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
              style={
                clientStatus === 'INTERESTED'
                  ? { background: '#059669', color: '#fff' }
                  : { background: '#DC2626', color: '#fff' }
              }
            >
              {clientStatus === 'INTERESTED' ? (
                <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg> Interested</>
              ) : (
                <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg> Not interested</>
              )}
            </div>
          )}
        </div>

        {/* ── Details ── */}
        <div className="px-4 pt-3.5 pb-4">

          {/* Price + type */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <p
                className="font-bold text-lg leading-tight"
                style={{ color: '#0B1F14', fontFamily: "'DM Serif Display', Georgia, serif", letterSpacing: '-0.02em' }}
              >
                {formatPrice(listing.price)}
              </p>
              <p
                className="text-xs font-medium mt-0.5"
                style={{ color: '#8A8880', fontFamily: "'DM Sans', sans-serif" }}
              >
                {details.join('  ·  ')}
              </p>
            </div>

            {/* Photo grid thumbnail strip — click opens lightbox */}
            {allMedia.length > 1 && (
              <div className="flex gap-1 flex-shrink-0">
                {allMedia.slice(0, 3).map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => setLightboxIndex(i)}
                    className="rounded-md overflow-hidden flex-shrink-0 transition-opacity hover:opacity-80"
                    style={{ width: 28, height: 28 }}
                  >
                    {m.type === 'IMAGE' ? (
                      <img src={m.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: '#111' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    )}
                  </button>
                ))}
                {allMedia.length > 3 && (
                  <button
                    onClick={() => setLightboxIndex(3)}
                    className="rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold transition-opacity hover:opacity-80"
                    style={{ width: 28, height: 28, background: '#F0EDE8', color: '#8A8880', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    +{allMedia.length - 3}
                  </button>
                )}
              </div>
            )}
          </div>

          {location && (
            <p
              className="text-xs mb-3 flex items-center gap-1"
              style={{ color: '#A09C96', fontFamily: "'DM Sans', sans-serif" }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 21s-8-6.686-8-12a8 8 0 0116 0c0 5.314-8 12-8 12z"/><circle cx="12" cy="9" r="2.5"/></svg>
              {location}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => clientStatus !== 'INTERESTED' && onRespond(property.id, 'INTERESTED')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
              style={
                clientStatus === 'INTERESTED'
                  ? { background: '#059669', color: '#fff', border: '1.5px solid #059669' }
                  : clientStatus === 'NOT_INTERESTED'
                  ? { background: '#F9F8F6', color: '#C0BBB2', border: '1.5px solid #EDEAE5', cursor: 'default' }
                  : { background: '#fff', color: '#059669', border: '1.5px solid #6EE7B7' }
              }
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
              Interested
            </button>

            <button
              onClick={() => clientStatus !== 'NOT_INTERESTED' && onRespond(property.id, 'NOT_INTERESTED')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
              style={
                clientStatus === 'NOT_INTERESTED'
                  ? { background: '#DC2626', color: '#fff', border: '1.5px solid #DC2626' }
                  : clientStatus === 'INTERESTED'
                  ? { background: '#F9F8F6', color: '#C0BBB2', border: '1.5px solid #EDEAE5', cursor: 'default' }
                  : { background: '#fff', color: '#DC2626', border: '1.5px solid #FCA5A5' }
              }
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              Not interested
            </button>
          </div>
        </div>
      </article>
    </>
  );
}

// ── Progress ──────────────────────────────────────────────────────────────────

function ProgressRing({ total, responded }: { total: number; responded: number }) {
  const pct = total === 0 ? 0 : responded / total;
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
        <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(11,31,20,0.08)" strokeWidth="3" />
          <circle
            cx="22" cy="22" r={r}
            fill="none"
            stroke="#059669"
            strokeWidth="3"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-xs font-bold"
          style={{ color: '#0B1F14', fontFamily: "'DM Sans', sans-serif" }}
        >
          {Math.round(pct * 100)}%
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: '#0B1F14', fontFamily: "'DM Sans', sans-serif" }}>
          {responded} of {total} reviewed
        </p>
        <p className="text-xs" style={{ color: '#A09C96', fontFamily: "'DM Sans', sans-serif" }}>
          {total - responded} remaining
        </p>
      </div>
    </div>
  );
}

// ── Completion ────────────────────────────────────────────────────────────────

function CompletionBanner({ brokerName }: { brokerName: string }) {
  return (
    <div
      className="rounded-2xl px-5 py-5 mb-5 flex items-center gap-4"
      style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)', border: '1px solid #A7F3D0' }}
    >
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
        style={{ background: '#059669' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
      </div>
      <div>
        <p className="font-semibold text-sm" style={{ color: '#065F46', fontFamily: "'DM Sans', sans-serif" }}>
          All properties reviewed
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#047857', fontFamily: "'DM Sans', sans-serif" }}>
          {brokerName} has been notified and will follow up shortly.
        </p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function SharePortalClient({
  token,
  initialData,
}: {
  token: string;
  initialData: ShareData;
}) {
  const [statuses, setStatuses] = useState<Record<string, ClientStatus>>(() => {
    const m: Record<string, ClientStatus> = {};
    for (const p of initialData.properties) m[p.id] = p.clientStatus as ClientStatus;
    return m;
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const total = initialData.properties.length;
  const responded = Object.values(statuses).filter(
    (s) => s === 'INTERESTED' || s === 'NOT_INTERESTED',
  ).length;
  const allDone = responded === total && total > 0;

  const handleRespond = useCallback(
    async (clientPropertyId: string, status: 'INTERESTED' | 'NOT_INTERESTED') => {
      const prev = statuses[clientPropertyId];
      setStatuses((s) => ({ ...s, [clientPropertyId]: status }));
      setErrors((e) => ({ ...e, [clientPropertyId]: false }));
      try {
        const res = await fetch(`/api/public/share/${token}/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientPropertyId, status }),
        });
        if (!res.ok) throw new Error();
      } catch {
        setStatuses((s) => ({ ...s, [clientPropertyId]: prev }));
        setErrors((e) => ({ ...e, [clientPropertyId]: true }));
      }
    },
    [token, statuses],
  );

  const properties = initialData.properties.map((p) => ({
    ...p,
    clientStatus: (statuses[p.id] ?? p.clientStatus) as ClientStatus,
  }));

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        * { -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="min-h-screen flex flex-col" style={{ background: '#F7F5F1' }}>

        {/* ── Header ── */}
        <header style={{ background: '#fff', borderBottom: '1px solid #EDEAE5' }}>
          <div className="max-w-lg mx-auto px-5 py-4">
            {/* Firm name — editorial treatment */}
            <div className="flex items-start justify-between">
              <div>
                <p
                  className="text-xs font-semibold tracking-[0.18em] uppercase mb-1"
                  style={{ color: '#A09C96', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Property Selection
                </p>
                <h1
                  className="text-2xl leading-tight"
                  style={{
                    color: '#0B1F14',
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    letterSpacing: '-0.02em',
                  }}
                >
                  {initialData.workspaceName}
                </h1>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: '#8A8880', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Curated for{' '}
                  <span style={{ color: '#0B1F14', fontWeight: 600 }}>
                    {initialData.clientName}
                  </span>
                </p>
              </div>

              {/* Monogram badge */}
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold"
                style={{
                  background: '#0B1F14',
                  color: '#fff',
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  letterSpacing: '-0.02em',
                }}
              >
                {initialData.workspaceName
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()}
              </div>
            </div>

            {/* Progress row */}
            {total > 0 && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #EDEAE5' }}>
                <ProgressRing total={total} responded={responded} />
              </div>
            )}
          </div>
        </header>

        {/* ── Body ── */}
        <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-5 pb-12">

          {allDone && <CompletionBanner brokerName={initialData.workspaceName} />}

          {/* Section label */}
          <p
            className="text-xs font-semibold uppercase tracking-[0.16em] mb-3 px-0.5"
            style={{ color: '#C0BBB2', fontFamily: "'DM Sans', sans-serif" }}
          >
            {total} {total === 1 ? 'Property' : 'Properties'}
          </p>

          <div className="flex flex-col gap-4">
            {properties.map((p, i) => (
              <div key={p.id}>
                <PropertyCard property={p} index={i} onRespond={handleRespond} />
                {errors[p.id] && (
                  <p className="text-red-500 text-xs mt-1.5 px-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    ⚠️ Couldn't save — tap again to retry.
                  </p>
                )}
              </div>
            ))}
          </div>
        </main>

        {/* ── Footer ── */}
        <footer className="py-6 text-center" style={{ borderTop: '1px solid #EDEAE5' }}>
          <p className="text-xs" style={{ color: '#C0BBB2', fontFamily: "'DM Sans', sans-serif" }}>
            Powered by{' '}
            <span style={{ color: '#0B1F14', fontWeight: 600 }}>GrowCliento</span>
          </p>
        </footer>
      </div>
    </>
  );
}