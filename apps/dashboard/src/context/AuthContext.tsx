"use client";

/**
 * apps/dashboard/src/context/AuthContext.tsx
 *
 * Provides:
 *   - user         — current user from JWT (null = not logged in)
 *   - workspace    — current workspace
 *   - loading      — true while restoring session on mount
 *   - login()      — call after successful /auth/login
 *   - logout()     — clears session + redirects
 *   - isAdmin()    — true if SUPERADMIN
 *   - isSupport()  — true if SUPPORT
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

export type AuthUser = {
  id:           string;
  email:        string;
  name:         string | null;
  platformRole: 'SUPERADMIN' | 'SUPPORT' | 'USER';
};

export type AuthWorkspace = {
  id:           string;
  name:         string;
  slug:         string;
  type:         'INDIVIDUAL' | 'FIRM';
  role:         'OWNER' | 'BROKER' | 'VIEWER';
  planSelected: boolean;
};

type AuthState = {
  user:      AuthUser | null;
  workspace: AuthWorkspace | null;
  loading:   boolean;
};

type AuthContextValue = AuthState & {
  login:      (user: AuthUser, workspace: AuthWorkspace) => void;
  logout:     () => Promise<void>;
  isAdmin:    () => boolean;
  isSupport:  () => boolean;
};

/* ------------------------------------------------------------------ */
/* CONTEXT                                                             */
/* ------------------------------------------------------------------ */

const AuthContext = createContext<AuthContextValue | null>(null);

/* ------------------------------------------------------------------ */
/* PROVIDER                                                            */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [state, setState] = useState<AuthState>({
    user:      null,
    workspace: null,
    loading:   true,
  });

  /* ── Restore session on mount ── */
  useEffect(() => {
    const restore = async () => {
      try {
        // Try /auth/me first
        const res = await fetch('/api/auth/me', { credentials: 'include' });

        if (res.ok) {
          const payload = await res.json();
          setState({
            user: {
              id:           payload.sub,
              email:        payload.email,
              name:         payload.name ?? null,
              platformRole: payload.platformRole,
            },
            workspace: {
              id:           payload.workspaceId,
              name:         '',
              slug:         '',
              type:         'INDIVIDUAL',
              role:         payload.role,
              planSelected: payload.planSelected ?? false,
            },
            loading: false,
          });
          return;
        }

        // 401 — try refresh before giving up
        if (res.status === 401) {
          const refreshRes = await fetch('/api/auth/refresh', {
            method:      'POST',
            credentials: 'include',
          });

          if (refreshRes.ok) {
            // Retry /auth/me with new access token
            const retryRes = await fetch('/api/auth/me', { credentials: 'include' });
            if (retryRes.ok) {
              const payload = await retryRes.json();
              setState({
                user: {
                  id:           payload.sub,
                  email:        payload.email,
                  name:         payload.name ?? null,
                  platformRole: payload.platformRole,
                },
                workspace: {
                  id:           payload.workspaceId,
                  name:         '',
                  slug:         '',
                  type:         'INDIVIDUAL',
                  role:         payload.role,
                  planSelected: payload.planSelected ?? false,
                },
                loading: false,
              });
              return;
            }
          }
        }

        // Both failed — not logged in
        setState({ user: null, workspace: null, loading: false });

      } catch {
        setState({ user: null, workspace: null, loading: false });
      }
    };

    restore();
  }, []);


  /* ── Called after successful login/register ── */
  const login = useCallback((user: AuthUser, workspace: AuthWorkspace) => {
    setState({ user, workspace, loading: false });
  }, []);

  /* ── Logout — revokes server session + clears cookies ── */
  const logout = useCallback(async () => {
    try {
      await apiPost('/auth/logout', {});
    } catch {
      /* best effort */
    }
    setState({ user: null, workspace: null, loading: false });
    router.push('/login');
  }, [router]);

  const isAdmin   = useCallback(() => state.user?.platformRole === 'SUPERADMIN', [state.user]);
  const isSupport = useCallback(() => state.user?.platformRole === 'SUPPORT',    [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isAdmin, isSupport }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* HOOK                                                                */
/* ------------------------------------------------------------------ */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}