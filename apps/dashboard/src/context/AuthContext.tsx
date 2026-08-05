'use client';

import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, ReactNode,
} from 'react';
import { apiGet } from '@/lib/api';

/* ── Types ── */
export interface AuthUser {
  id:            string;
  email:         string;
  name:          string | null;
  platformRole:  string;
  emailVerified?: boolean;
}

export interface AuthWorkspace {
  id:           string;
  name:         string;
  slug:         string;
  type:         string;
  role:         string;
  planSelected: boolean;
}

interface AuthContextValue {
  user:      AuthUser | null;
  workspace: AuthWorkspace | null;
  ready:     boolean;
  loading:   boolean;
  login:     (user: AuthUser, workspace: AuthWorkspace) => void;
  logout:    () => void;
}

/* ── Storage ── */
const USER_KEY      = 'auth_user';
const WORKSPACE_KEY = 'auth_workspace';

function saveToStorage(user: AuthUser, workspace: AuthWorkspace) {
  try {
    localStorage.setItem(USER_KEY,      JSON.stringify(user));
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
  } catch {}
}

function loadFromStorage(): { user: AuthUser; workspace: AuthWorkspace } | null {
  try {
    const u = localStorage.getItem(USER_KEY);
    const w = localStorage.getItem(WORKSPACE_KEY);
    if (u && w) return { user: JSON.parse(u), workspace: JSON.parse(w) };
  } catch {}
  return null;
}

function clearStorage() {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(WORKSPACE_KEY);
  } catch {}
}

/* ── Context ── */
const AuthContext = createContext<AuthContextValue>({
  user:      null,
  workspace: null,
  ready:     false,
  loading:   false,
  login:     () => {},
  logout:    () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null);
  const [workspace, setWorkspace] = useState<AuthWorkspace | null>(null);
  const [ready,     setReady]     = useState(false);
  const [loading,   setLoading]   = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Proactive silent refresh every 50 minutes ── */
  useEffect(() => {
    if (!user) {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      return;
    }
    refreshTimer.current = setInterval(async () => {
      try {
        await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      } catch {}
    }, 50 * 60 * 1000);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [user]);

  /* ── Init on mount ── */
  useEffect(() => {
    async function initUser() {
      setLoading(true);

      // Instant render from cache
      const stored = loadFromStorage();
      if (stored) {
        setUser(stored.user);
        setWorkspace(stored.workspace);
      }

      try {
        const me = await apiGet<{
          id:            string;
          email:         string;
          name:          string | null;
          platformRole:  string;
          emailVerified: boolean;
        }>('/auth/me');

        const freshUser: AuthUser = {
          id:            me.id,
          email:         me.email,
          name:          me.name,
          platformRole:  me.platformRole,
          emailVerified: me.emailVerified,
        };

        setUser(freshUser);

        if (stored?.workspace) {
          setWorkspace(stored.workspace);
          saveToStorage(freshUser, stored.workspace);
        }
      } catch {
        if (!stored) {
          clearStorage();
          setUser(null);
          setWorkspace(null);
        }
      } finally {
        setReady(true);
        setLoading(false);
      }
    }

    initUser();
  }, []);

  const login = useCallback((newUser: AuthUser, newWorkspace: AuthWorkspace) => {
    setUser(newUser);
    setWorkspace(newWorkspace);
    saveToStorage(newUser, newWorkspace);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setWorkspace(null);
    clearStorage();
  }, []);

  return (
    <AuthContext.Provider value={{ user, workspace, ready, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}