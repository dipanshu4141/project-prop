'use client';
// apps/dashboard/src/app/onboarding/OnboardingFlow.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Users, CheckCircle2, ChevronRight, Plus, X } from 'lucide-react';
import { apiPost } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkspaceType = 'INDIVIDUAL' | 'FIRM';
type PlanId = 'FREE' | 'INDIVIDUAL' | 'FIRM_5' | 'FIRM_20' | 'ENTERPRISE';
type Step = 'workspace' | 'plan' | 'invite' | 'done';

type OnboardingFlowProps = {
  initialStep:          Step;
  initialWorkspaceType: WorkspaceType;
  workspaceName:        string;
};

// ── Plans ─────────────────────────────────────────────────────────────────────

const PLANS: {
  id: PlanId; name: string; price: string; period: string;
  seats: string; features: string[]; highlight?: boolean;
}[] = [
  {
    id: 'FREE', name: 'Free', price: '₹0', period: 'forever', seats: '1 broker',
    features: ['Up to 50 listings', 'Basic CRM', 'WhatsApp ingestion'],
  },
  {
    id: 'INDIVIDUAL', name: 'Individual', price: '₹999', period: '/ month', seats: '1 broker',
    features: ['Unlimited listings', 'Full CRM', 'Client share portal', 'Analytics'],
  },
  {
    id: 'FIRM_5', name: 'Firm 5', price: '₹3,999', period: '/ month', seats: 'Up to 5 brokers',
    features: ['Everything in Individual', 'Team management', 'Deal chain tracking'],
    highlight: true,
  },
  {
    id: 'FIRM_20', name: 'Firm 20', price: '₹9,999', period: '/ month', seats: 'Up to 20 brokers',
    features: ['Everything in Firm 5', 'Advanced analytics', 'Priority support'],
  },
];

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ current, steps }: { current: Step; steps: { key: Step; label: string }[] }) {
  const currentIndex = steps.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-2 mb-10">
      {steps.map((step, i) => {
        const done   = i < currentIndex || current === 'done';
        const active = i === currentIndex && current !== 'done';
        return (
          <div key={step.key} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                style={
                  done   ? { background: '#10b981', color: '#fff' } :
                  active ? { background: '#0B1F14', color: '#fff' } :
                           { background: '#e5e7eb', color: '#9ca3af' }
                }
              >
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3.5 3.5 5.5-7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : i + 1}
              </div>
              <span className="text-sm font-medium"
                style={{ color: active ? '#0B1F14' : done ? '#10b981' : '#9ca3af' }}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 h-0.5 rounded-full mx-1 transition-all duration-300"
                style={{ background: i < currentIndex ? '#10b981' : '#e5e7eb' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Workspace (only shown for direct /onboarding visits) ──────────────

function WorkspaceStep({ onNext }: { onNext: (name: string, type: WorkspaceType, city: string) => void }) {
  const [name, setName]   = useState('');
  const [type, setType]   = useState<WorkspaceType>('INDIVIDUAL');
  const [city, setCity]   = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) { setError('Workspace name is required'); return; }
    setLoading(true); setError('');
    try {
      await apiPost('/onboarding/workspace', { name: name.trim(), type, city: city.trim() || undefined });
      onNext(name.trim(), type, city.trim());
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#0B1F14' }}>Set up your workspace</h2>
        <p className="text-gray-400 text-sm">Your workspace is where your team and listings live.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {([
          { type: 'INDIVIDUAL' as WorkspaceType, icon: '👤', title: 'Solo Broker',       desc: 'Just you managing listings and clients' },
          { type: 'FIRM'       as WorkspaceType, icon: '🏢', title: 'Brokerage Firm',    desc: 'Multiple brokers under one account'    },
        ] as const).map((opt) => (
          <button key={opt.type} onClick={() => setType(opt.type)}
            className="relative p-4 rounded-2xl border-2 text-left transition-all"
            style={{ borderColor: type === opt.type ? '#0B1F14' : '#e5e7eb', background: type === opt.type ? '#F7F5F0' : '#fff' }}>
            {type === opt.type && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#0B1F14' }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 2.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            )}
            <span className="text-2xl mb-2 block">{opt.icon}</span>
            <p className="font-semibold text-sm" style={{ color: '#0B1F14' }}>{opt.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
          </button>
        ))}
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0B1F14' }}>Workspace name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={type === 'FIRM' ? 'e.g. Sharma Properties' : 'e.g. Rahul Malhotra'}
          className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:border-gray-400" style={{ background: '#FAFAF9' }} />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0B1F14' }}>City <span className="font-normal text-gray-400">(optional)</span></label>
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mumbai, Delhi"
          className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:border-gray-400" style={{ background: '#FAFAF9' }} />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button onClick={handleSubmit} disabled={loading || !name.trim()}
        className="w-full h-12 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: '#0B1F14' }}>
        {loading ? 'Setting up…' : <> Continue <ChevronRight className="h-4 w-4" /> </>}
      </button>
    </div>
  );
}

// ── Step 2: Plan ──────────────────────────────────────────────────────────────

function PlanStep({ workspaceType, onNext }: { workspaceType: WorkspaceType; onNext: (plan: PlanId) => void }) {
  const [selected, setSelected] = useState<PlanId>('FREE');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const visiblePlans = workspaceType === 'INDIVIDUAL'
    ? PLANS.filter((p) => ['FREE', 'INDIVIDUAL'].includes(p.id))
    : PLANS;

  async function handleContinue() {
    setLoading(true); setError('');
    try {
      await apiPost('/onboarding/plan', { plan: selected, interval: 'MONTHLY' });
      onNext(selected);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#0B1F14' }}>Choose your plan</h2>
        <p className="text-gray-400 text-sm">Start free — upgrade anytime. Paid plans include a 14-day trial.</p>
      </div>
      <div className={`grid gap-3 ${visiblePlans.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {visiblePlans.map((plan) => (
          <button key={plan.id} onClick={() => setSelected(plan.id)}
            className="relative p-4 rounded-2xl border-2 text-left transition-all"
            style={{
              borderColor: selected === plan.id ? '#0B1F14' : plan.highlight ? '#d1fae5' : '#e5e7eb',
              background:  selected === plan.id ? '#F7F5F0'  : plan.highlight ? '#f0fdf4' : '#fff',
            }}>
            {plan.highlight && (
              <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#0B1F14', color: '#fff' }}>POPULAR</div>
            )}
            {selected === plan.id && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#0B1F14' }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 2.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            )}
            <div className="flex items-baseline gap-1 mb-0.5">
              <span className="text-xl font-bold" style={{ color: '#0B1F14' }}>{plan.price}</span>
              <span className="text-xs text-gray-400">{plan.period}</span>
            </div>
            <p className="font-semibold text-sm mb-0.5" style={{ color: '#0B1F14' }}>{plan.name}</p>
            <p className="text-[11px] text-gray-400 mb-2">{plan.seats}</p>
            <ul className="space-y-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 2.5" stroke="#10b981" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button onClick={handleContinue} disabled={loading}
        className="w-full h-12 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: '#0B1F14' }}>
        {loading ? 'Saving…' : <> Continue <ChevronRight className="h-4 w-4" /> </>}
      </button>
      {selected !== 'FREE' && (
        <p className="text-center text-xs text-gray-400">14-day free trial · No credit card required · Cancel anytime</p>
      )}
    </div>
  );
}

// ── Step 3: Invite ────────────────────────────────────────────────────────────

function InviteStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [emails, setEmails]   = useState<string[]>([]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  function addEmail() {
    const e = input.trim().toLowerCase();
    if (!e) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setError('Invalid email address'); return; }
    if (emails.includes(e)) { setInput(''); return; }
    if (emails.length >= 19) { setError('Maximum 19 invites at a time'); return; }
    setEmails([...emails, e]); setInput(''); setError('');
  }

  async function handleInvite() {
    if (emails.length === 0) { onSkip(); return; }
    setLoading(true); setError('');
    try {
      await apiPost('/onboarding/invite', { emails });
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
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#0B1F14' }}>Invite your team</h2>
        <p className="text-gray-400 text-sm">Add your brokers — they'll get an email invite. Skip and do it later from Team settings.</p>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0B1F14' }}>Email addresses</label>
        <div className="flex gap-2">
          <input value={input} onChange={(e) => { setInput(e.target.value); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addEmail(); } }}
            placeholder="broker@firm.com"
            className="flex-1 h-11 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:border-gray-400" style={{ background: '#FAFAF9' }} />
          <button onClick={addEmail} className="h-11 px-4 rounded-xl font-semibold text-sm flex items-center gap-1.5" style={{ background: '#0B1F14', color: '#fff' }}>
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add multiple</p>
      </div>
      {emails.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {emails.map((e) => (
            <div key={e} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium" style={{ background: '#F7F5F0', color: '#0B1F14' }}>
              {e}
              <button onClick={() => setEmails(emails.filter((x) => x !== e))} className="text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button onClick={onSkip} className="flex-1 h-12 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50">
          Skip for now
        </button>
        <button onClick={handleInvite} disabled={loading}
          className="flex-1 h-12 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: '#0B1F14' }}>
          {loading ? 'Sending…' : emails.length > 0 ? `Invite ${emails.length}` : 'Continue'}
        </button>
      </div>
    </div>
  );
}

// ── Done ──────────────────────────────────────────────────────────────────────

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
      <button onClick={() => router.push('/v2/dashboard')}
        className="w-full h-12 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
        style={{ background: '#0B1F14' }}>
        Go to dashboard <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function OnboardingFlow({
  initialStep,
  initialWorkspaceType,
  workspaceName: initialWorkspaceName,
}: OnboardingFlowProps) {
  const [step,          setStep]          = useState<Step>(initialStep);
  const [workspaceName, setWorkspaceName] = useState(initialWorkspaceName);
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType>(initialWorkspaceType);

  // Build the steps list dynamically based on workspace type and starting point
  const STEP_LIST: { key: Step; label: string }[] = [
    ...(initialStep === 'workspace' ? [{ key: 'workspace' as Step, label: 'Workspace' }] : []),
    { key: 'plan',  label: 'Plan'   },
    ...(workspaceType === 'FIRM' ? [{ key: 'invite' as Step, label: 'Invite' }] : []),
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: '#F7F5F0' }}>
      <div className="w-full max-w-xl">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#0B1F14' }}>
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold" style={{ color: '#0B1F14' }}>PropertyAI</span>
        </div>

        {/* Progress */}
        {step !== 'done' && <ProgressBar current={step} steps={STEP_LIST} />}

        {/* Card */}
        <div className="rounded-3xl p-8" style={{ background: '#fff', boxShadow: '0 4px 40px rgba(11,31,20,0.08)' }}>
          {step === 'workspace' && (
            <WorkspaceStep onNext={(name, type) => {
              setWorkspaceName(name);
              setWorkspaceType(type);
              setStep('plan');
            }} />
          )}
          {step === 'plan' && (
            <PlanStep
              workspaceType={workspaceType}
              onNext={() => setStep(workspaceType === 'FIRM' ? 'invite' : 'done')}
            />
          )}
          {step === 'invite' && (
            <InviteStep onNext={() => setStep('done')} onSkip={() => setStep('done')} />
          )}
          {step === 'done' && (
            <DoneScreen workspaceName={workspaceName} />
          )}
        </div>

        {step !== 'done' && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Need help?{' '}
            <a href="mailto:support@propertyai.in" className="underline hover:text-gray-600">support@propertyai.in</a>
          </p>
        )}
      </div>
    </div>
  );
}