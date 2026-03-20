"use client";

import { Suspense } from 'react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { apiPost } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { AuthUser, AuthWorkspace } from '@/context/AuthContext';

// ── Inner component (uses useSearchParams — must be inside Suspense) ──────────

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { login }    = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiPost<{ user: AuthUser; workspace: AuthWorkspace }>(
        '/auth/login',
        { email, password },
      );

      login(data.user, data.workspace);

      const from = searchParams.get('from') ?? '/v2/dashboard';
      router.replace(from);
    } catch (err: any) {
      setError(err.message ?? 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-slate-900">
            Property CRM
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8">

          <h1 className="text-[22px] font-bold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-[13.5px] text-slate-500 mb-7">Sign in to your workspace</p>

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 pr-10 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-1.5 text-right">
                <Link href="/forgot-password" className="text-[12px] text-slate-500 hover:text-slate-700 transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-[#0B1F14] text-[13.5px] font-semibold text-white hover:bg-[#1A3525] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[13px] text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-slate-800 hover:text-slate-900 transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

// ── Page export — wraps LoginForm in Suspense ─────────────────────────────────

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}