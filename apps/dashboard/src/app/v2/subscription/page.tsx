'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, Loader2, AlertCircle, ArrowRight,
  Zap, Shield, Clock, Star, XCircle,
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';

/* ── Types ── */
interface BillingStatus {
  status:                 string;
  trialEndsAt:            string | null;
  daysLeft:               number | null;
  isExpired?:             boolean;
  currentPeriodEnd?:      string | null;
  gatewaySubscriptionId?: string | null;
}

interface SubscribeResponse {
  subscriptionId: string;
  keyId:          string;
}

/* ── Helpers ── */
function daysLeft(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

/* ── Features ── */
const FEATURES = [
  'WhatsApp group auto-ingestion',
  'AI property deduplication',
  'Unlimited listings',
  'Client share portal',
  'Deal pipeline tracking',
  'Media uploads (photos & videos)',
  'Private group support',
  'Priority support',
];

/* ── Floating CTA ── */
function FloatingCTA({ paying, onSubscribe, isTrialing, days, onContinue }: {
  paying: boolean;
  onSubscribe: () => void;
  isTrialing: boolean;
  days: number;
  onContinue: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById('cta-sentinel');
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 px-4 pt-4 pb-4 bg-gradient-to-t from-[#F7F5F0] via-[#F7F5F0]/95 to-transparent lg:hidden">
      <div className="max-w-sm mx-auto space-y-2">
        <button onClick={onSubscribe} disabled={paying}
          className="w-full h-12 rounded-xl bg-[#0B1F14] text-[14px] font-bold text-white hover:bg-[#1A3525] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#0B1F14]/20">
          {paying
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
            : <><Zap className="h-4 w-4 text-emerald-400" /> Subscribe now · ₹999/month</>
          }
        </button>
        {isTrialing && days > 0 && (
          <button onClick={onContinue}
            className="w-full text-center text-[12px] text-slate-400 hover:text-slate-600 transition-colors py-1">
            Continue with trial →
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main ── */
export default function SubscriptionPage() {
  const router = useRouter();
  const [status,     setStatus]     = useState<BillingStatus | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [paying,     setPaying]     = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled,  setCancelled]  = useState(false);
  const [error,      setError]      = useState('');

  const loadStatus = useCallback(() => {
    setLoading(true);
    apiGet<BillingStatus>('/billing/status')
      .then(setStatus)
      .catch(() => setError('Failed to load billing status'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const handleSubscribe = useCallback(async () => {
    setPaying(true);
    setError('');
    try {
      const data = await apiPost<SubscribeResponse>('/billing/subscribe', {});
      const rzp = new (window as any).Razorpay({
        key:             data.keyId,
        subscription_id: data.subscriptionId,
        name:            'GrowCliento',
        description:     'Pro Plan · ₹999/month',
        image:           '/icons/icon-512.png',
        theme:           { color: '#0B1F14' },
        handler: async (response: any) => {
          try {
            await apiPost('/billing/verify', {
              razorpay_payment_id:      response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature:       response.razorpay_signature,
            });
            router.replace('/v2/dashboard');
          } catch {
            setError('Payment verification failed. Contact support@growcliento.com');
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.open();
    } catch (e: any) {
      setError(e.message ?? 'Failed to initiate payment');
      setPaying(false);
    }
  }, [router]);

  const handleCancel = useCallback(async () => {
    if (!confirm('Cancel subscription? You keep access until the billing period ends.')) return;
    setCancelling(true);
    setError('');
    try {
      await apiPost('/billing/cancel', {});
      setCancelled(true);
      loadStatus();
    } catch (e: any) {
      setError(e.message ?? 'Failed to cancel subscription');
    } finally { setCancelling(false); }
  }, [loadStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const isActive   = status?.status === 'ACTIVE';
  const isTrialing = status?.status === 'TRIALING';
  const isHalted   = status?.status === 'HALTED';
  const isPending  = status?.status === 'PENDING';
  const days       = daysLeft(status?.trialEndsAt ?? null);
  const isExpired  = status?.isExpired || (!isActive && !isTrialing && !isPending && !isHalted);

  return (
    <>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <div className="min-h-screen bg-[#F7F5F0]">

        {/* ── HERO ── */}
        <div className="relative overflow-hidden px-5 pt-12 pb-8"
          style={{ background: 'linear-gradient(135deg, #0B1F14 0%, #1a3525 50%, #0B1F14 100%)' }}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, #10b981, transparent)', animation: 'float1 6s ease-in-out infinite' }} />
            <div className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full opacity-15"
              style={{ background: 'radial-gradient(circle, #34d399, transparent)', animation: 'float2 8s ease-in-out infinite' }} />
            <div className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }} />
          </div>
          <div className="relative z-10 max-w-sm mx-auto">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-3 py-1 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-widest">GrowCliento Pro</span>
            </div>
            <h1 className="text-[28px] font-bold text-white leading-tight mb-1">
              {isActive ? 'Your subscription' : 'Upgrade your\nreal estate game'}
            </h1>
            <p className="text-[13px] text-white/40">
              {isActive ? 'Manage your Pro plan' : 'Everything you need to close more deals'}
            </p>
          </div>
          <style>{`
            @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(12px,-12px) scale(1.1)} }
            @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-10px,10px) scale(1.05)} }
          `}</style>
        </div>

        <div className="max-w-sm mx-auto px-4 py-6 space-y-4 pb-10 lg:pb-10">

          {/* ── ACTIVE STATE ── */}
          {isActive && (
            <>
              <div className="rounded-2xl bg-white border border-emerald-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-800">Pro Plan · Active</p>
                    <p className="text-[12px] text-slate-400">
                      {status?.currentPeriodEnd
                        ? `Renews ${new Date(status.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                        : '₹999/month'
                      }
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {FEATURES.map(f => (
                    <div key={f} className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      <p className="text-[12.5px] text-slate-600">{f}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => router.push('/v2/dashboard')}
                className="w-full h-11 rounded-xl bg-[#0B1F14] text-[13.5px] font-semibold text-white hover:bg-[#1A3525] transition-colors flex items-center justify-center gap-2">
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </button>

              {!cancelled ? (
                <button onClick={handleCancel} disabled={cancelling}
                  className="w-full h-10 rounded-xl border border-red-200 text-[13px] font-medium text-red-500 hover:bg-red-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                  {cancelling
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Cancelling…</>
                    : <><XCircle className="h-4 w-4" /> Cancel subscription</>
                  }
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <p className="text-[12.5px] text-amber-700">Cancellation requested. Access continues until billing period ends.</p>
                </div>
              )}
            </>
          )}

          {/* ── HALTED / PENDING ── */}
          {(isHalted || isPending) && (
            <div className="rounded-2xl bg-white border border-amber-200 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-[14px] font-bold text-slate-800">
                    {isHalted ? 'Payment failed' : 'Payment pending'}
                  </p>
                  <p className="text-[12px] text-slate-400 mt-0.5">
                    {isHalted
                      ? 'Your subscription was halted due to payment failure.'
                      : 'Your payment is being processed. This may take a few minutes.'}
                  </p>
                </div>
              </div>
              {isHalted && (
                <button onClick={handleSubscribe} disabled={paying}
                  className="w-full h-11 rounded-xl bg-[#0B1F14] text-[13.5px] font-semibold text-white hover:bg-[#1A3525] disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                  {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 text-emerald-400" />}
                  {paying ? 'Processing…' : 'Retry payment'}
                </button>
              )}
            </div>
          )}

          {/* ── TRIAL / EXPIRED ── */}
          {!isActive && !isHalted && !isPending && (
            <>
              {/* Status badge */}
              {isTrialing && days > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <p className="text-[13px] font-medium text-amber-700">
                    {days} day{days !== 1 ? 's' : ''} left in your trial
                  </p>
                </div>
              )}

              {isExpired && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-[13px] font-medium text-red-700">
                    Your trial has ended. Subscribe to restore access.
                  </p>
                </div>
              )}

              {/* Plan card */}
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="bg-[#0B1F14] px-5 pt-6 pb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="h-4 w-4 text-emerald-400" />
                    <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Pro Plan</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[36px] font-bold text-white">₹999</span>
                    <span className="text-[13px] text-white/40">/month</span>
                  </div>
                  <p className="text-[12px] text-white/40 mt-1">GST inclusive · Cancel anytime</p>
                </div>

                <div className="px-5 py-4 space-y-2.5">
                  {FEATURES.map(f => (
                    <div key={f} className="flex items-center gap-2.5">
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      </div>
                      <p className="text-[13px] text-slate-700">{f}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-[13px] text-red-700">{error}</p>
                </div>
              )}

              {/* ── IN-PAGE CTA (sentinel) ── */}
              <div id="cta-sentinel" className="space-y-3">
                <button onClick={handleSubscribe} disabled={paying}
                  className="w-full h-12 rounded-xl bg-[#0B1F14] text-[14px] font-bold text-white hover:bg-[#1A3525] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#0B1F14]/20">
                  {paying
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                    : <><Zap className="h-4 w-4 text-emerald-400" /> Subscribe now · ₹999/month</>
                  }
                </button>

                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Shield className="h-3 w-3" />
                    Secured by Razorpay
                  </div>
                  <div className="w-px h-3 bg-slate-200" />
                  <p className="text-[11px] text-slate-400">Cancel anytime</p>
                  <div className="w-px h-3 bg-slate-200" />
                  <p className="text-[11px] text-slate-400">GST inclusive</p>
                </div>

                {isTrialing && days > 0 && (
                  <button onClick={() => router.push('/v2/dashboard')}
                    className="w-full text-center text-[12.5px] text-slate-400 hover:text-slate-600 transition-colors py-1">
                    Continue with trial →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── FLOATING CTA — appears when sentinel scrolls out of view ── */}
      {!isActive && !isHalted && !isPending && (
        <FloatingCTA
          paying={paying}
          onSubscribe={handleSubscribe}
          isTrialing={isTrialing}
          days={days}
          onContinue={() => router.push('/v2/dashboard')}
        />
      )}
    </>
  );
}