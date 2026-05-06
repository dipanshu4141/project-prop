"use client";

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, Eye, EyeOff, Loader2, User, Users, CheckCircle2 } from 'lucide-react';
import { apiPost } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { AuthUser, AuthWorkspace } from '@/context/AuthContext';

type WorkspaceType = 'INDIVIDUAL' | 'FIRM';

const WORKSPACE_OPTIONS = [
  {
    type: 'INDIVIDUAL' as WorkspaceType, icon: User,
    label: 'Individual broker', description: 'Just you — manage your own leads, properties, and clients.', price: '₹2,000/mo',
  },
  {
    type: 'FIRM' as WorkspaceType, icon: Users,
    label: 'Firm / Team', description: 'Multiple brokers under one account. Owner sees everything.', price: '₹6,000–8,000/mo',
  },
];

function PasswordInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="Minimum 8 characters" required minLength={8}
        className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 pr-10 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors" />
      <button type="button" onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ── Invite registration — simplified, no workspace/plan ───────────────────────

function InviteRegisterForm({ inviteToken, prefillEmail }: { inviteToken: string; prefillEmail: string }) {
  const router    = useRouter();
  const { login } = useAuth();
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await apiPost<{ user: AuthUser; workspace: AuthWorkspace }>(
        '/auth/register-member',
        { name, email, password, inviteToken },
      );
      login(data.user, data.workspace);
      // Register + invite acceptance happens in one backend call.
      // Go straight to dashboard — they're already a workspace member.
      router.replace('/v2/dashboard');
    } catch (err: any) {
      setError(err.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="text-[20px] font-bold text-slate-900 mb-1">Create your account</h1>
      <p className="text-[13px] text-slate-500 mb-6">
        You're joining a workspace — no need to set one up yourself.
      </p>
      {error && (
        <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">{error}</div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Your name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahul Sharma" required
            className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors" />
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Email address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            readOnly={!!prefillEmail} placeholder="you@example.com" required
            className={`w-full h-10 rounded-lg border border-slate-200 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition-colors ${
              prefillEmail ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50 focus:bg-white'
            }`} />
          {prefillEmail && (
            <p className="text-[11.5px] text-slate-400 mt-1">This email was specified in your invite.</p>
          )}
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Password</label>
          <PasswordInput value={password} onChange={setPassword} />
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="mt-6 w-full h-10 rounded-lg bg-[#0B1F14] text-[13.5px] font-semibold text-white hover:bg-[#1A3525] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? 'Creating account…' : 'Create account & join'}
      </button>
    </form>
  );
}

// ── Standard registration — creates workspace + goes to onboarding ────────────

function StandardRegisterForm() {
  const router    = useRouter();
  const { login } = useAuth();
  const [step, setStep]                   = useState<1 | 2>(1);
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType | null>(null);
  const [name, setName]                   = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceType) return;
    setError(''); setLoading(true);
    try {
      const data = await apiPost<{ user: AuthUser; workspace: AuthWorkspace }>(
        '/auth/register',
        { name, workspaceName, workspaceType, email, password },
      );
      login(data.user, data.workspace);
      router.replace(`/onboarding?step=plan&type=${workspaceType}`);
    } catch (err: any) {
      setError(err.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        {[1, 2].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div className={['flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors',
              step >= n ? 'bg-[#0B1F14] text-white' : 'bg-slate-100 text-slate-400'].join(' ')}>
              {step > n ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
            </div>
            {n < 2 && <div className="h-px w-8 bg-slate-200" />}
          </div>
        ))}
        <p className="ml-2 text-[12px] text-slate-400">{step === 1 ? 'Account type' : 'Your details'}</p>
      </div>

      {step === 1 && (
        <div>
          <h1 className="text-[20px] font-bold text-slate-900 mb-1">How do you work?</h1>
          <p className="text-[13px] text-slate-500 mb-6">Choose the account type that fits you. You can upgrade later.</p>
          <div className="space-y-3">
            {WORKSPACE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = workspaceType === opt.type;
              return (
                <button key={opt.type} type="button" onClick={() => setWorkspaceType(opt.type)}
                  className={['w-full rounded-xl border-2 p-4 text-left transition-all duration-150',
                    selected ? 'border-[#0B1F14] bg-[#0B1F14]/[0.03]' : 'border-slate-200 hover:border-slate-300'].join(' ')}>
                  <div className="flex items-start gap-3">
                    <div className={['flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
                      selected ? 'bg-emerald-100' : 'bg-slate-100'].join(' ')}>
                      <Icon className={['h-4 w-4', selected ? 'text-emerald-700' : 'text-slate-500'].join(' ')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[14px] font-semibold text-slate-900">{opt.label}</p>
                        <span className="text-[12px] font-medium text-slate-500">{opt.price}</span>
                      </div>
                      <p className="mt-0.5 text-[12.5px] text-slate-500">{opt.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <button type="button" disabled={!workspaceType} onClick={() => setStep(2)}
            className="mt-6 w-full h-10 rounded-lg bg-[#0B1F14] text-[13.5px] font-semibold text-white hover:bg-[#1A3525] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit}>
          <h1 className="text-[20px] font-bold text-slate-900 mb-1">Create your account</h1>
          <p className="text-[13px] text-slate-500 mb-6">
            {workspaceType === 'FIRM' ? 'Set up your firm workspace.' : 'Set up your individual account.'}
          </p>
          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">{error}</div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Your name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahul Sharma" required
                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">
                {workspaceType === 'FIRM' ? 'Firm name' : 'Your workspace name'}
              </label>
              <input type="text" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder={workspaceType === 'FIRM' ? 'Sharma Properties' : 'Rahul Sharma'} required
                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Password</label>
              <PasswordInput value={password} onChange={setPassword} />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setStep(1)}
              className="h-10 px-4 rounded-lg border border-slate-200 text-[13.5px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">Back</button>
            <button type="submit" disabled={loading}
              className="flex-1 h-10 rounded-lg bg-[#0B1F14] text-[13.5px] font-semibold text-white hover:bg-[#1A3525] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

// ── Inner component (needs useSearchParams) ───────────────────────────────────

function RegisterPageInner() {
  const searchParams = useSearchParams();
  const inviteToken  = searchParams.get('inviteToken') ?? '';
  const prefillEmail = searchParams.get('email') ?? '';

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[440px]">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-slate-900">Property CRM</span>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8">
          {inviteToken
            ? <InviteRegisterForm inviteToken={inviteToken} prefillEmail={prefillEmail} />
            : <StandardRegisterForm />
          }
        </div>
        <p className="mt-5 text-center text-[13px] text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-slate-800 hover:text-slate-900 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageInner />
    </Suspense>
  );
}