'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Building2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    fetch(`/api/auth/verify-email?token=${token}`, { credentials: 'include' })
      .then(res => {
        if (res.ok || res.redirected) setStatus('success');
        else setStatus('error');
      })
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-slate-900">PropertyAI</span>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Verifying your email…</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-slate-900 mb-2">Email verified!</h1>
              <p className="text-slate-500 text-sm mb-6">Your account is now active.</p>
              <button onClick={() => router.push('/login')}
                className="w-full h-10 rounded-lg bg-[#0B1F14] text-sm font-semibold text-white hover:bg-[#1A3525] transition-colors">
                Continue to login
              </button>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-slate-900 mb-2">Link expired</h1>
              <p className="text-slate-500 text-sm mb-6">This verification link is invalid or has expired.</p>
              <button onClick={() => router.push('/login')}
                className="w-full h-10 rounded-lg bg-[#0B1F14] text-sm font-semibold text-white hover:bg-[#1A3525] transition-colors">
                Back to login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={null}><VerifyEmailInner /></Suspense>;
}