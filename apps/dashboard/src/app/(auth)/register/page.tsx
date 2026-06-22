// "use client";

// import { Suspense, useState } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import Link from 'next/link';
// import { Building2, Eye, EyeOff, Loader2, User, Users, CheckCircle2 } from 'lucide-react';
// import { apiPost } from '@/lib/api';
// import { useAuth } from '@/context/AuthContext';
// import type { AuthUser, AuthWorkspace } from '@/context/AuthContext';

// type WorkspaceType = 'INDIVIDUAL' | 'FIRM';

// const WORKSPACE_OPTIONS = [
//   {
//     type: 'INDIVIDUAL' as WorkspaceType, icon: User,
//     label: 'Individual broker', description: 'Just you — manage your own leads, properties, and clients.', price: '₹2,000/mo',
//   },
//   {
//     type: 'FIRM' as WorkspaceType, icon: Users,
//     label: 'Firm / Team', description: 'Multiple brokers under one account. Owner sees everything.', price: '₹6,000–8,000/mo',
//   },
// ];

// function PasswordInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
//   const [show, setShow] = useState(false);
//   return (
//     <div className="relative">
//       <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)}
//         placeholder="Minimum 8 characters" required minLength={8}
//         className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 pr-10 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors" />
//       <button type="button" onClick={() => setShow((v) => !v)}
//         className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
//         {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//       </button>
//     </div>
//   );
// }

// // ── Invite registration — simplified, no workspace/plan ───────────────────────

// function InviteRegisterForm({ inviteToken, prefillEmail }: { inviteToken: string; prefillEmail: string }) {
//   const router    = useRouter();
//   const { login } = useAuth();
//   const [name, setName]       = useState('');
//   const [email, setEmail]     = useState(prefillEmail);
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError]     = useState('');

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setError(''); setLoading(true);
//     try {
//       const data = await apiPost<{ user: AuthUser; workspace: AuthWorkspace }>(
//         '/auth/register-member',
//         { name, email, password, inviteToken },
//       );
//       login(data.user, data.workspace);
//       // Register + invite acceptance happens in one backend call.
//       // Go straight to dashboard — they're already a workspace member.
//       router.replace('/v2/dashboard');
//     } catch (err: any) {
//       setError(err.message ?? 'Registration failed');
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <form onSubmit={handleSubmit}>
//       <h1 className="text-[20px] font-bold text-slate-900 mb-1">Create your account</h1>
//       <p className="text-[13px] text-slate-500 mb-6">
//         You're joining a workspace — no need to set one up yourself.
//       </p>
//       {error && (
//         <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">{error}</div>
//       )}
//       <div className="space-y-4">
//         <div>
//           <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Your name</label>
//           <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahul Sharma" required
//             className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors" />
//         </div>
//         <div>
//           <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Email address</label>
//           <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
//             readOnly={!!prefillEmail} placeholder="you@example.com" required
//             className={`w-full h-10 rounded-lg border border-slate-200 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition-colors ${
//               prefillEmail ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50 focus:bg-white'
//             }`} />
//           {prefillEmail && (
//             <p className="text-[11.5px] text-slate-400 mt-1">This email was specified in your invite.</p>
//           )}
//         </div>
//         <div>
//           <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Password</label>
//           <PasswordInput value={password} onChange={setPassword} />
//         </div>
//       </div>
//       <button type="submit" disabled={loading}
//         className="mt-6 w-full h-10 rounded-lg bg-[#0B1F14] text-[13.5px] font-semibold text-white hover:bg-[#1A3525] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
//         {loading && <Loader2 className="h-4 w-4 animate-spin" />}
//         {loading ? 'Creating account…' : 'Create account & join'}
//       </button>
//     </form>
//   );
// }

// // ── Standard registration — creates workspace + goes to onboarding ────────────

// function StandardRegisterForm() {
//   const router    = useRouter();
//   const { login } = useAuth();
//   const [step, setStep]                   = useState<1 | 2>(1);
//   const [workspaceType, setWorkspaceType] = useState<WorkspaceType | null>(null);
//   const [name, setName]                   = useState('');
//   const [workspaceName, setWorkspaceName] = useState('');
//   const [email, setEmail]                 = useState('');
//   const [password, setPassword]           = useState('');
//   const [loading, setLoading]             = useState(false);
//   const [error, setError]                 = useState('');

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     if (!workspaceType) return;
//     setError(''); setLoading(true);
//     try {
//       const data = await apiPost<{ user: AuthUser; workspace: AuthWorkspace }>(
//         '/auth/register',
//         { name, workspaceName, workspaceType, email, password },
//       );
//       login(data.user, data.workspace);
//       router.replace(`/onboarding?step=plan&type=${workspaceType}`);
//     } catch (err: any) {
//       setError(err.message ?? 'Registration failed');
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <>
//       <div className="flex items-center gap-2 mb-6">
//         {[1, 2].map((n) => (
//           <div key={n} className="flex items-center gap-2">
//             <div className={['flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors',
//               step >= n ? 'bg-[#0B1F14] text-white' : 'bg-slate-100 text-slate-400'].join(' ')}>
//               {step > n ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
//             </div>
//             {n < 2 && <div className="h-px w-8 bg-slate-200" />}
//           </div>
//         ))}
//         <p className="ml-2 text-[12px] text-slate-400">{step === 1 ? 'Account type' : 'Your details'}</p>
//       </div>

//       {step === 1 && (
//         <div>
//           <h1 className="text-[20px] font-bold text-slate-900 mb-1">How do you work?</h1>
//           <p className="text-[13px] text-slate-500 mb-6">Choose the account type that fits you. You can upgrade later.</p>
//           <div className="space-y-3">
//             {WORKSPACE_OPTIONS.map((opt) => {
//               const Icon = opt.icon;
//               const selected = workspaceType === opt.type;
//               return (
//                 <button key={opt.type} type="button" onClick={() => setWorkspaceType(opt.type)}
//                   className={['w-full rounded-xl border-2 p-4 text-left transition-all duration-150',
//                     selected ? 'border-[#0B1F14] bg-[#0B1F14]/[0.03]' : 'border-slate-200 hover:border-slate-300'].join(' ')}>
//                   <div className="flex items-start gap-3">
//                     <div className={['flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
//                       selected ? 'bg-emerald-100' : 'bg-slate-100'].join(' ')}>
//                       <Icon className={['h-4 w-4', selected ? 'text-emerald-700' : 'text-slate-500'].join(' ')} />
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center justify-between">
//                         <p className="text-[14px] font-semibold text-slate-900">{opt.label}</p>
//                         <span className="text-[12px] font-medium text-slate-500">{opt.price}</span>
//                       </div>
//                       <p className="mt-0.5 text-[12.5px] text-slate-500">{opt.description}</p>
//                     </div>
//                   </div>
//                 </button>
//               );
//             })}
//           </div>
//           <button type="button" disabled={!workspaceType} onClick={() => setStep(2)}
//             className="mt-6 w-full h-10 rounded-lg bg-[#0B1F14] text-[13.5px] font-semibold text-white hover:bg-[#1A3525] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
//             Continue
//           </button>
//         </div>
//       )}

//       {step === 2 && (
//         <form onSubmit={handleSubmit}>
//           <h1 className="text-[20px] font-bold text-slate-900 mb-1">Create your account</h1>
//           <p className="text-[13px] text-slate-500 mb-6">
//             {workspaceType === 'FIRM' ? 'Set up your firm workspace.' : 'Set up your individual account.'}
//           </p>
//           {error && (
//             <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">{error}</div>
//           )}
//           <div className="space-y-4">
//             <div>
//               <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Your name</label>
//               <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahul Sharma" required
//                 className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors" />
//             </div>
//             <div>
//               <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">
//                 {workspaceType === 'FIRM' ? 'Firm name' : 'Your workspace name'}
//               </label>
//               <input type="text" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)}
//                 placeholder={workspaceType === 'FIRM' ? 'Sharma Properties' : 'Rahul Sharma'} required
//                 className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors" />
//             </div>
//             <div>
//               <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Email address</label>
//               <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
//                 className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors" />
//             </div>
//             <div>
//               <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Password</label>
//               <PasswordInput value={password} onChange={setPassword} />
//             </div>
//           </div>
//           <div className="mt-6 flex gap-3">
//             <button type="button" onClick={() => setStep(1)}
//               className="h-10 px-4 rounded-lg border border-slate-200 text-[13.5px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">Back</button>
//             <button type="submit" disabled={loading}
//               className="flex-1 h-10 rounded-lg bg-[#0B1F14] text-[13.5px] font-semibold text-white hover:bg-[#1A3525] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
//               {loading && <Loader2 className="h-4 w-4 animate-spin" />}
//               {loading ? 'Creating account…' : 'Create account'}
//             </button>
//           </div>
//         </form>
//       )}
//     </>
//   );
// }

// // ── Inner component (needs useSearchParams) ───────────────────────────────────

// function RegisterPageInner() {
//   const searchParams = useSearchParams();
//   const inviteToken  = searchParams.get('inviteToken') ?? '';
//   const prefillEmail = searchParams.get('email') ?? '';

//   return (
//     <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center px-4 py-10">
//       <div className="w-full max-w-[440px]">
//         <div className="flex items-center gap-2.5 mb-8">
//           <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
//             <Building2 className="h-4 w-4 text-white" />
//           </div>
//           <span className="text-[17px] font-semibold tracking-tight text-slate-900">Property CRM</span>
//         </div>
//         <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8">
//           {inviteToken
//             ? <InviteRegisterForm inviteToken={inviteToken} prefillEmail={prefillEmail} />
//             : <StandardRegisterForm />
//           }
//         </div>
//         <p className="mt-5 text-center text-[13px] text-slate-500">
//           Already have an account?{' '}
//           <Link href="/login" className="font-semibold text-slate-800 hover:text-slate-900 transition-colors">Sign in</Link>
//         </p>
//       </div>
//     </div>
//   );
// }

// export default function RegisterPage() {
//   return (
//     <Suspense fallback={null}>
//       <RegisterPageInner />
//     </Suspense>
//   );
// }

"use client";

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, Eye, EyeOff, Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import { apiPost } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { AuthUser, AuthWorkspace } from '@/context/AuthContext';

/* ─── Invite codes ─────────────────────────────────────────── */
const INVITE_CODES = new Set([
  'PROP2026',
  'MUMBAI01', 'MUMBAI02', 'MUMBAI03', 'MUMBAI04', 'MUMBAI05',
  'ANDHERI1', 'ANDHERI2', 'ANDHERI3', 'ANDHERI4', 'ANDHERI5',
  'BROKER01', 'BROKER02', 'BROKER03', 'BROKER04', 'BROKER05',
  'EARLY001', 'EARLY002', 'EARLY003', 'EARLY004',
]);

/* ─── Google button ────────────────────────────────────────── */
function GoogleButton({ label }: { label: string }) {
  return (
    <>
      <div className="relative flex items-center gap-3 my-2">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400">or</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>
      <a
        href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google`}
        className="w-full h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center gap-2.5 text-[13.5px] font-medium text-slate-700"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        {label}
      </a>
    </>
  );
}

/* ─── Password input ───────────────────────────────────────── */
function PasswordInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Minimum 8 characters"
        required
        minLength={8}
        className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 pr-10 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/* ─── Phone input ──────────────────────────────────────────── */
function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex">
      <span className="flex items-center px-3 h-10 rounded-l-lg border border-r-0 border-slate-200 bg-slate-100 text-[13px] text-slate-500 select-none">
        +91
      </span>
      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
        placeholder="9876543210"
        required
        maxLength={10}
        pattern="[6-9][0-9]{9}"
        title="Enter a valid 10-digit Indian mobile number"
        className="flex-1 h-10 rounded-r-lg border border-slate-200 bg-slate-50 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors"
      />
    </div>
  );
}

/* ─── Invite code gate ─────────────────────────────────────── */
function InviteCodeGate({ onValid }: { onValid: () => void }) {
  const [code, setCode]   = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (INVITE_CODES.has(code.trim().toUpperCase())) {
      onValid();
    } else {
      setError('Invalid invite code. Contact us to get early access.');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-center mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B1F14]">
          <KeyRound className="h-5 w-5 text-white" />
        </div>
      </div>
      <h1 className="text-[20px] font-bold text-slate-900 mb-1 text-center">Early access only</h1>
      <p className="text-[13px] text-slate-500 mb-6 text-center">
        GrowCliento is invite-only right now. Enter your code to continue.
      </p>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}
      <div>
        <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Invite code</label>
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(''); }}
          placeholder="e.g. MUMBAI01"
          required
          autoFocus
          className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors tracking-widest uppercase"
        />
      </div>
      <button
        type="submit"
        className="mt-5 w-full h-10 rounded-lg bg-[#0B1F14] text-[13.5px] font-semibold text-white hover:bg-[#1A3525] transition-colors"
      >
        Verify code
      </button>
      <p className="mt-4 text-center text-[12px] text-slate-400">
        Don't have a code?{' '}
        <a
          href="https://wa.me/917XXXXXXXXX"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-slate-600 hover:text-slate-800 transition-colors"
        >
          Contact us on WhatsApp
        </a>
      </p>
    </form>
  );
}

/* ─── Invite member form (via email invite token) ──────────── */
function InviteRegisterForm({ inviteToken, prefillEmail }: { inviteToken: string; prefillEmail: string }) {
  const router    = useRouter();
  const { login } = useAuth();
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState(prefillEmail);
  const [phone, setPhone]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await apiPost<{ user: AuthUser; workspace: AuthWorkspace }>(
        '/auth/register-member',
        { name, email, password, phone, inviteToken },
      );
      login(data.user, data.workspace);
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
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Rahul Sharma" required
            className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors" />
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Email address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            readOnly={!!prefillEmail} placeholder="you@example.com" required
            className={`w-full h-10 rounded-lg border border-slate-200 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition-colors ${
              prefillEmail ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50 focus:bg-white'
            }`} />
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Mobile number</label>
          <PhoneInput value={phone} onChange={setPhone} />
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

/* ─── Standard registration form ───────────────────────────── */
function StandardRegisterForm() {
  const router    = useRouter();
  const { login } = useAuth();
  const [codeVerified, setCodeVerified] = useState(false);
  const [name, setName]                 = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [email, setEmail]               = useState('');
  const [phone, setPhone]               = useState('');
  const [password, setPassword]         = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phone.length !== 10) {
      setError('Enter a valid 10-digit Indian mobile number');
      return;
    }
    setError(''); setLoading(true);
    try {
      const data = await apiPost<{ user: AuthUser; workspace: AuthWorkspace }>(
        '/auth/register',
        { name, workspaceName, workspaceType: 'INDIVIDUAL', email, password, phone },
      );
      login(data.user, data.workspace);
      router.replace('/onboarding?step=plan&type=INDIVIDUAL');
    } catch (err: any) {
      setError(err.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (!codeVerified) {
    return <InviteCodeGate onValid={() => setCodeVerified(true)} />;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-2 mb-5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
        </div>
        <p className="text-[12.5px] text-emerald-700 font-semibold">Invite code verified</p>
      </div>

      <h1 className="text-[20px] font-bold text-slate-900 mb-1">Create your account</h1>
      <p className="text-[13px] text-slate-500 mb-6">Set up your individual broker workspace.</p>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">{error}</div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Your name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Rahul Sharma" required
            className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors" />
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Workspace name</label>
          <input type="text" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="Rahul Properties" required
            className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors" />
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Email address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" required
            className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors" />
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Mobile number</label>
          <PhoneInput value={phone} onChange={setPhone} />
        </div>
        <div>
          <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Password</label>
          <PasswordInput value={password} onChange={setPassword} />
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="mt-6 w-full h-10 rounded-lg bg-[#0B1F14] text-[13.5px] font-semibold text-white hover:bg-[#1A3525] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? 'Creating account…' : 'Create account'}
      </button>

      <GoogleButton label="Continue with Google" />
    </form>
  );
}

/* ─── Inner page ───────────────────────────────────────────── */
function RegisterPageInner() {
  const searchParams = useSearchParams();
  const inviteToken  = searchParams.get('inviteToken') ?? '';
  const prefillEmail = searchParams.get('email') ?? '';

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[440px]">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden flex-shrink-0">
            <img src="/icons/icon-512.png" alt="GrowCliento" className="h-full w-full object-cover" />
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-slate-900">GrowCliento</span>
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