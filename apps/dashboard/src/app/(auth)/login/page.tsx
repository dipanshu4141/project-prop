"use client";

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
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
  // const { login }    = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,    setError]    = useState('');
  const verified = searchParams.get('verified');
  const { login, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/v2/dashboard');
    }
  }, [user, loading, router]);



  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = await apiPost<{ user: AuthUser; workspace: AuthWorkspace }>(
        '/auth/login',
        { email, password },
      );

    login(data.user, data.workspace);
      if (!data.workspace.planSelected) {
        router.replace('/onboarding?step=plan&type=INDIVIDUAL');
        return;
      }
      const from = searchParams.get('from') ?? '/v2/dashboard';
      router.replace(from);

    } catch (err: any) {
      setError(err.message ?? 'Invalid email or password');
    } finally {
      setSubmitting(false);
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

          {verified && (
            <div className="mb-5 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-[13px] text-emerald-700">
              ✓ Email verified! You can now sign in.
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
              disabled={submitting}
              className="w-full h-10 rounded-lg bg-[#0B1F14] text-[13.5px] font-semibold text-white hover:bg-[#1A3525] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
            <div className="mt-4">
              <div className="relative flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <a href="http://localhost:3000/api/auth/google"
              // <a href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google`} 
                className="w-full h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center gap-2.5 text-[13.5px] font-medium text-slate-700">
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </a>
            </div>
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