'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CheckCircle2, ChevronRight } from 'lucide-react';
import { apiPost } from '@/lib/api';

type Step = 'plan' | 'done';

type OnboardingFlowProps = {
  initialStep:          Step;
  initialWorkspaceType: 'INDIVIDUAL';
  workspaceName:        string;
};

function DoneScreen({ workspaceName }: { workspaceName: string }) {
  const router = useRouter();
  return (
    <div className="text-center space-y-6 py-4">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: '#d1fae5' }}>
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#0B1F14' }}>You're all set! 🎉</h2>
        <p className="text-gray-400 text-sm max-w-xs mx-auto">
          <strong>{workspaceName}</strong> is ready. Start adding listings and managing clients.
        </p>
      </div>
      <button
        onClick={() => router.push('/v2/dashboard')}
        className="w-full h-12 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
        style={{ background: '#0B1F14' }}
      >
        Go to dashboard <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function PlanStep({ onNext }: { onNext: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleContinue() {
    setLoading(true); setError('');
    try {
      await apiPost('/onboarding/plan', { plan: 'INDIVIDUAL', interval: 'MONTHLY' });
      await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      onNext();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#0B1F14' }}>Your plan</h2>
        <p className="text-gray-400 text-sm">7-day free trial included. No charges until trial ends.</p>
      </div>

      {/* Single plan card */}
      <div className="rounded-2xl border-2 p-5" style={{ borderColor: '#0B1F14', background: '#F7F5F0' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-bold text-[15px]" style={{ color: '#0B1F14' }}>GrowCliento Pro</p>
            <p className="text-[12px] text-gray-400 mt-0.5">Individual broker</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: '#0B1F14' }}>₹999</p>
            <p className="text-[11px] text-gray-400">/month</p>
          </div>
        </div>
        <div className="border-t border-slate-200 pt-3 space-y-2">
          {[
            'WhatsApp group property parsing',
            'Unlimited property listings',
            'Client management & sharing',
            'Property media uploads',
            'Deal pipeline tracking',
            'Priority support',
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 text-[12.5px] text-gray-600">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 2.5" stroke="#10b981" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {f}
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={handleContinue}
        disabled={loading}
        className="w-full h-12 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: '#0B1F14' }}
      >
        {loading ? 'Setting up…' : <> Start 7-day free trial <ChevronRight className="h-4 w-4" /> </>}
      </button>
      <p className="text-center text-xs text-gray-400">
        ₹999/month after trial · Cancel anytime · Inclusive of GST
      </p>
    </div>
  );
}

export function OnboardingFlow({
  workspaceName: initialWorkspaceName,
}: OnboardingFlowProps) {
  const [step, setStep]               = useState<Step>('plan');
  const [workspaceName]               = useState(initialWorkspaceName);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: '#F7F5F0' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#0B1F14' }}>
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold" style={{ color: '#0B1F14' }}>GrowCliento</span>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8" style={{ background: '#fff', boxShadow: '0 4px 40px rgba(11,31,20,0.08)' }}>
          {step === 'plan' && <PlanStep onNext={() => setStep('done')} />}
          {step === 'done' && <DoneScreen workspaceName={workspaceName} />}
        </div>

        {step !== 'done' && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Need help?{' '}
            <a href="mailto:hello@growcliento.com" className="underline hover:text-gray-600">
              hello@growcliento.com
            </a>
          </p>
        )}
      </div>
    </div>
  );
}