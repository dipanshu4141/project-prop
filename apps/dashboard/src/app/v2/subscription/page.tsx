'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, Zap, Shield, Clock, AlertTriangle, Loader2, X } from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────── */

interface BillingStatus {
  status:          'NONE' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
  trialEndsAt:     string | null;
  daysLeft:        number | null;
  isExpired?:      boolean;
  currentPeriodEnd?: string | null;
}

/* ─── Razorpay types ─────────────────────────────────────── */

declare global {
  interface Window {
    Razorpay: any;
  }
}

/* ─── Load Razorpay script ───────────────────────────────── */

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/* ─── Features list ──────────────────────────────────────── */

const FEATURES = [
  'WhatsApp group property parsing',
  'Unlimited property listings',
  'Client management & sharing',
  'Property media uploads',
  'Deal pipeline tracking',
  'Priority support',
];

/* ─── Main page ──────────────────────────────────────────── */

export default function SubscriptionPage() {
  const { user, workspace } = useAuth();
  const [status,    setStatus]    = useState<BillingStatus | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [paying,    setPaying]    = useState(false);
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  /* Fetch billing status */
  useEffect(() => {
    fetch('/api/billing/status', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  /* Handle subscribe */
  const handleSubscribe = async () => {
    if (paying) return;
    setPaying(true);

    try {
      // Load Razorpay script
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Failed to load payment gateway');

      // Create subscription on backend
      const res = await fetch('/api/billing/subscribe', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? 'Failed to create subscription');
      }
      const data = await res.json();

      // Open Razorpay checkout
      const rzp = new window.Razorpay({
        key:             data.keyId,
        subscription_id: data.subscriptionId,
        name:            'GrowCliento',
        description:     data.description,
        image:           '/logo.png',
        prefill:         data.prefill,
        theme:           { color: '#0B1F14' },
        handler: async (response: any) => {
          // Verify payment
          try {
            const verifyRes = await fetch('/api/billing/verify', {
              method:      'POST',
              credentials: 'include',
              headers:     { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id:      response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature:       response.razorpay_signature,
              }),
            });
            if (!verifyRes.ok) throw new Error('Payment verification failed');

            showToast('🎉 Subscription activated! Welcome to GrowCliento Pro.');
            // Refresh status
            const statusRes = await fetch('/api/billing/status', { credentials: 'include' });
            setStatus(await statusRes.json());
          } catch {
            showToast('Payment received but verification failed. Contact support.', false);
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      });

      rzp.open();
    } catch (err: any) {
      showToast(err.message ?? 'Something went wrong', false);
      setPaying(false);
    }
  };

  /* Handle cancel */
  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You\'ll lose access at the end of your billing period.')) return;
    try {
      const res = await fetch('/api/billing/cancel', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to cancel');
      showToast('Subscription cancelled. Access continues until period end.');
      const statusRes = await fetch('/api/billing/status', { credentials: 'include' });
      setStatus(await statusRes.json());
    } catch (err: any) {
      showToast(err.message ?? 'Failed to cancel', false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F7F5F0]">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const isActive   = status?.status === 'ACTIVE';
  const isTrialing = status?.status === 'TRIALING';
  const isExpired  = status?.isExpired || status?.status === 'PAST_DUE' || status?.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-[#F7F5F0] px-4 py-8 pb-24 lg:pb-8">
      <div className="mx-auto max-w-lg">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#0B1F14]">Subscription</h1>
          <p className="mt-1 text-[13px] text-slate-500">Manage your GrowCliento plan</p>
        </div>

        {/* Status card */}
        {isTrialing && !status?.isExpired && (
          <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-amber-800">
                {status.daysLeft === 0
                  ? 'Trial expires today'
                  : `${status.daysLeft} day${status.daysLeft !== 1 ? 's' : ''} left in trial`
                }
              </p>
              <p className="text-[11px] text-amber-600 mt-0.5">
                Subscribe before trial ends to keep access
              </p>
            </div>
          </div>
        )}

        {isExpired && (
          <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 px-5 py-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-red-700">Access expired</p>
              <p className="text-[11px] text-red-500 mt-0.5">Subscribe to restore full access</p>
            </div>
          </div>
        )}

        {isActive && (
          <div className="mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-emerald-800">Active subscription</p>
              {status?.currentPeriodEnd && (
                <p className="text-[11px] text-emerald-600 mt-0.5">
                  Renews {new Date(status.currentPeriodEnd).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Pricing card */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">

          {/* Top accent */}
          <div className="h-1 w-full bg-emerald-500" />

          <div className="px-6 py-6">
            {/* Plan name + badge */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-600" />
                <p className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">
                  GrowCliento Pro
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                Most Popular
              </span>
            </div>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-[13px] font-medium text-slate-400">₹</span>
              <span className="text-5xl font-bold text-[#0B1F14] tracking-tight">999</span>
              <span className="text-[13px] text-slate-400">/month</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Inclusive of 18% GST · Cancel anytime</p>

            {/* Divider */}
            <div className="my-5 border-t border-slate-100" />

            {/* Features */}
            <ul className="space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-[13px] text-slate-700">{f}</span>
                </li>
              ))}
            </ul>

            {/* Trial note */}
            {!isActive && !isTrialing && !isExpired && (
              <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <p className="text-[12px] text-slate-500">
                  7-day free trial included · No charges until trial ends
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="mt-5 space-y-2">
              {!isActive ? (
                <button
                  onClick={handleSubscribe}
                  disabled={paying}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0B1F14] py-3.5 text-[14px] font-semibold text-white hover:bg-[#1a3525] disabled:opacity-60 transition-colors"
                >
                  {paying
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Processing…</>
                    : isExpired ? 'Reactivate — ₹999/month' : 'Subscribe — ₹999/month'
                  }
                </button>
              ) : (
                <button
                  onClick={handleCancel}
                  className="w-full flex items-center justify-center rounded-xl border border-red-200 bg-red-50 py-3 text-[13px] font-medium text-red-600 hover:bg-red-100 transition-colors"
                >
                  Cancel subscription
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Payment methods */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <Shield className="h-3.5 w-3.5 text-slate-400" />
          <p className="text-[11px] text-slate-400">
            Secured by Razorpay · UPI, Cards, Netbanking accepted
          </p>
        </div>

        {/* Invoice note */}
        {isActive && (
          <p className="mt-6 text-center text-[11px] text-slate-400">
            GST invoices are sent to your registered email after each payment.
          </p>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={[
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-medium text-white shadow-lg',
          toast.ok ? 'bg-emerald-600' : 'bg-red-500',
        ].join(' ')}>
          {toast.ok
            ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            : <X className="h-4 w-4 flex-shrink-0" />
          }
          {toast.msg}
        </div>
      )}
    </div>
  );
}