'use client';

// apps/dashboard/src/components/clients/ShareTokenModal.tsx

import { useState, useCallback, useRef } from 'react';
import { apiPost } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type ShareTokenModalProps = {
  clientId:    string;
  clientName:  string;
  clientPhone: string | null;
  isOpen:      boolean;
  onClose:     () => void;
};

type ShareTokenResponse = {
  url:       string;
  expiresAt: string;
};

// ── Static class maps ─────────────────────────────────────────────────────────

const COPY_IDLE    = 'px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200';
const COPY_COPIED  = 'px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-emerald-100 text-emerald-700';

// ── Component ─────────────────────────────────────────────────────────────────

export function ShareTokenModal({
  clientId,
  clientName,
  clientPhone,
  isOpen,
  onClose,
}: ShareTokenModalProps) {
  const [shareUrl,   setShareUrl]   = useState<string | null>(null);
  const [expiresAt,  setExpiresAt]  = useState<string | null>(null);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [copied,     setCopied]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate (or refresh) the share token when modal opens
  const generate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiPost<ShareTokenResponse>(
        `/clients/${clientId}/share-token`,
        {},
      );
      setShareUrl(data.url);
      setExpiresAt(data.expiresAt);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to generate link';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  // Generate on first open
  const handleOpen = useCallback(() => {
    if (!shareUrl) generate();
  }, [shareUrl, generate]);

  // Trigger generation when isOpen switches to true
  if (isOpen && !shareUrl && !isLoading && !error) {
    handleOpen();
  }

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the input
      inputRef.current?.select();
    }
  };

  const whatsappMessage = shareUrl
    ? encodeURIComponent(
        `Hi ${clientName}, here are the properties I've selected for you:\n${shareUrl}`,
      )
    : '';

  const whatsappHref = clientPhone
    ? `https://wa.me/${clientPhone.replace(/\D/g, '')}?text=${whatsappMessage}`
    : `https://wa.me/?text=${whatsappMessage}`;

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-IN', {
        day:   'numeric',
        month: 'short',
        year:  'numeric',
      })
    : null;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 rounded-2xl p-6 max-w-md mx-auto"
        style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2
              className="text-lg font-bold"
              style={{ color: '#0B1F14' }}
            >
              Share with Client
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Send {clientName} their property selection link
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center py-8 gap-3">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#0B1F14', borderTopColor: 'transparent' }}
            />
            <p className="text-sm text-gray-500">Generating link…</p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-center">
            <p className="text-red-600 text-sm mb-3">{error}</p>
            <button
              onClick={generate}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* URL section */}
        {shareUrl && !isLoading && (
          <div className="space-y-4">
            {/* URL input + copy */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                Share Link
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  readOnly
                  value={shareUrl}
                  className="flex-1 min-w-0 rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-gray-50 text-gray-700 font-mono"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  onClick={handleCopy}
                  className={copied ? COPY_COPIED : COPY_IDLE}
                  aria-label="Copy link"
                >
                  {copied ? (
                    <span className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Copied!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M3 10V2.5A1.5 1.5 0 014.5 1H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                      Copy
                    </span>
                  )}
                </button>
              </div>
              {expiryLabel && (
                <p className="text-xs text-gray-400 mt-1.5">
                  🔒 Expires {expiryLabel}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">or send via</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* WhatsApp button */}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#25D366', color: '#fff' }}
            >
              {/* WhatsApp icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Send via WhatsApp
            </a>

            {/* Refresh link */}
            <button
              onClick={generate}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
            >
              🔄 Regenerate link
            </button>
          </div>
        )}
      </div>
    </>
  );
}