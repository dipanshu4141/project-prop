'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Building2, Loader2, CheckCircle2 } from 'lucide-react';
import { apiPost } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await apiPost('/auth/forgot-password', { email });
      setSent(true);
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
          <span className="text-[17px] font-semibold tracking-tight text-slate-900">PropertyAI</span>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8">
          {sent ? (
            <div className="text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-slate-900 mb-2">Check your email</h1>
              <p className="text-slate-500 text-sm">We sent a reset link to <strong>{email}</strong>. Check your inbox and spam folder.</p>
            </div>
          ) : (
            <>
              <h1 className="text-[22px] font-bold text-slate-900 mb-1">Forgot password?</h1>
              <p className="text-[13.5px] text-slate-500 mb-7">Enter your email and we'll send a reset link.</p>
              {error && <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                    className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full h-10 rounded-lg bg-[#0B1F14] text-[13.5px] font-semibold text-white hover:bg-[#1A3525] disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="mt-5 text-center text-[13px] text-slate-500">
          <Link href="/login" className="font-semibold text-slate-800 hover:text-slate-900">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}