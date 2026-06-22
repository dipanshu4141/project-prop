'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { apiPost } from '@/lib/api';

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      await apiPost('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-slate-900">GrowCliento</span>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8">
          {done ? (
            <div className="text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-slate-900 mb-2">Password reset!</h1>
              <p className="text-slate-500 text-sm mb-6">You can now login with your new password.</p>
              <button onClick={() => router.push('/login')}
                className="w-full h-10 rounded-lg bg-[#0B1F14] text-sm font-semibold text-white hover:bg-[#1A3525] transition-colors">
                Go to login
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-[22px] font-bold text-slate-900 mb-1">Set new password</h1>
              <p className="text-[13.5px] text-slate-500 mb-7">Choose a strong password for your account.</p>
              {error && <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">New password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters" required minLength={8}
                      className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 pr-10 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors" />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full h-10 rounded-lg bg-[#0B1F14] text-[13.5px] font-semibold text-white hover:bg-[#1A3525] disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Saving…' : 'Set new password'}
                </button>
              </form>
            </>
          )}
        </div>
        {!done && (
          <p className="mt-5 text-center text-[13px] text-slate-500">
            <Link href="/login" className="font-semibold text-slate-800 hover:text-slate-900">← Back to login</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={null}><ResetPasswordInner /></Suspense>;
}