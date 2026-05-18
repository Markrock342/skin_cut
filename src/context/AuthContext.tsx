import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as authApi from '../lib/auth-api';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import type { RegisterOutcome } from '../lib/auth-types';
import type { AuthUser } from '../types/auth';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  authConfigured: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
    acceptTerms: boolean,
  ) => Promise<RegisterOutcome>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const loginInFlight = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const profile = await authApi.resolveSessionUser();
      setUser(profile);
    } catch {
      await authApi.logout().catch(() => undefined);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      // ห้าม await supabase ใน callback โดยตรง — จะ deadlock กับ getSession/login
      setTimeout(() => {
        void (async () => {
          try {
            if (event === 'SIGNED_OUT') {
              if (!cancelled) setUser(null);
              return;
            }

            if (!session?.user?.email) {
              if (!cancelled) setUser(null);
              return;
            }

            if (event === 'SIGNED_IN' && loginInFlight.current) return;

            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
              const profile = await authApi.loadSessionUser(
                session.user.id,
                session.user.email,
                session.user,
              );
              if (!cancelled) setUser(profile);
            }
          } catch {
            if (!cancelled) setUser(null);
          } finally {
            if (event === 'INITIAL_SESSION' && !cancelled) setLoading(false);
          }
        })();
      }, 0);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    loginInFlight.current = true;
    try {
      const profile = await authApi.login({ email, password });
      setUser(profile);
    } finally {
      loginInFlight.current = false;
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName: string, acceptTerms: boolean) => {
      const outcome = await authApi.register({ email, password, displayName, acceptTerms });
      if (outcome.kind === 'active') setUser(outcome.user);
      return outcome;
    },
    [],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      authConfigured: isSupabaseConfigured,
      login,
      register,
      logout,
      refresh,
    }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
