"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';

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
  login:     (user: AuthUser, workspace: AuthWorkspace) => void;
  logout:    () => Promise<void>;
  isAdmin:   () => boolean;
  isSupport: () => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user:     null,
    workspace: null,
    loading:  true,
  });

  useEffect(() => {
    const restore = async () => {
      // 1. Check sessionStorage cache first
      try {
        const cached = sessionStorage.getItem('auth_user');
        if (cached) {
          const { user, workspace, ts } = JSON.parse(cached);
          if (Date.now() - ts < 10 * 60 * 1000) {
            setState({ user, workspace, loading: false });
            return;
          }
        }
      } catch {}

      // 2. Try /auth/me
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });

        if (res.ok) {
          const payload = await res.json();
          const user: AuthUser = {
            id:           payload.sub,
            email:        payload.email,
            name:         payload.name ?? null,
            platformRole: payload.platformRole,
          };
          const workspace: AuthWorkspace = {
            id:           payload.workspaceId,
            name:         '',
            slug:         '',
            type:         'INDIVIDUAL',
            role:         payload.role,
            planSelected: payload.planSelected ?? false,
          };
          setState({ user, workspace, loading: false });
          sessionStorage.setItem('auth_user', JSON.stringify({ user, workspace, ts: Date.now() }));
          return;
        }

        // 3. 401 — try refresh
        if (res.status === 401) {
          const refreshRes = await fetch('/api/auth/refresh', {
            method:      'POST',
            credentials: 'include',
          });

          if (refreshRes.ok) {
            const retryRes = await fetch('/api/auth/me', { credentials: 'include' });
            if (retryRes.ok) {
              const payload = await retryRes.json();
              const user: AuthUser = {
                id:           payload.sub,
                email:        payload.email,
                name:         payload.name ?? null,
                platformRole: payload.platformRole,
              };
              const workspace: AuthWorkspace = {
                id:           payload.workspaceId,
                name:         '',
                slug:         '',
                type:         'INDIVIDUAL',
                role:         payload.role,
                planSelected: payload.planSelected ?? false,
              };
              setState({ user, workspace, loading: false });
              sessionStorage.setItem('auth_user', JSON.stringify({ user, workspace, ts: Date.now() }));
              return;
            }
          }
        }

        // 4. Both failed
        setState({ user: null, workspace: null, loading: false });
      } catch {
        setState({ user: null, workspace: null, loading: false });
      }
    };

    restore();
  }, []);

  const login = useCallback((user: AuthUser, workspace: AuthWorkspace) => {
    setState({ user, workspace, loading: false });
    sessionStorage.setItem('auth_user', JSON.stringify({ user, workspace, ts: Date.now() }));
  }, []);

  const logout = useCallback(async () => {
    setState({ user: null, workspace: null, loading: false });
    sessionStorage.removeItem('auth_user');
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    window.location.href = '/login';
  }, []);

  const isAdmin   = useCallback(() => state.user?.platformRole === 'SUPERADMIN', [state.user]);
  const isSupport = useCallback(() => state.user?.platformRole === 'SUPPORT',    [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isAdmin, isSupport }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}