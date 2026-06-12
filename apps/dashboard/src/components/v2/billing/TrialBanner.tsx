'use client';

import { useEffect, useState } from 'react';
import { Clock, X, Zap } from 'lucide-react';
import Link from 'next/link';

interface BillingStatus {
  status:      string;
  daysLeft:    number | null;
  isExpired?:  boolean;
}

export function TrialBanner() {
  const [status,    setStatus]    = useState<BillingStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/billing/status', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => {});
  }, []);

  // Don't show if dismissed, active, or no status
  if (dismissed || !status) return null;
  if (status.status === 'ACTIVE') return null;
  if (status.status === 'NONE') return null;

  const isExpired  = status.isExpired || status.status === 'PAST_DUE' || status.status === 'CANCELLED';
  const daysLeft   = status.daysLeft ?? 0;

  // Only show when 3 days or less left, or expired
  if (!isExpired && daysLeft > 3) return null;

  return (
    <div className={[
      'relative flex items-center gap-3 px-4 py-2.5 text-[12px] font-medium',
      isExpired
        ? 'bg-red-600 text-white'
        : daysLeft <= 1
        ? 'bg-amber-500 text-white'
        : 'bg-[#0B1F14] text-white',
    ].join(' ')}>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isExpired
          ? <Zap className="h-3.5 w-3.5 flex-shrink-0" />
          : <Clock className="h-3.5 w-3.5 flex-shrink-0" />
        }
        <span className="truncate">
          {isExpired
            ? 'Your trial has expired — subscribe to restore access'
            : daysLeft === 0
            ? 'Trial expires today'
            : `Trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
          }
        </span>
      </div>

      <Link
        href="/v2/subscription"
        className={[
          'flex-shrink-0 rounded-lg px-3 py-1 text-[11px] font-bold transition-colors',
          isExpired
            ? 'bg-white text-red-600 hover:bg-red-50'
            : 'bg-emerald-500 text-white hover:bg-emerald-600',
        ].join(' ')}
      >
        {isExpired ? 'Subscribe now' : 'Upgrade'}
      </Link>

      {!isExpired && (
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}