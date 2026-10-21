import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { supabase, authConfigured } from '@/services/supabase';

const AuthContext = createContext<{ user: User | null; ready: boolean; configured: boolean }>({
  user: null,
  ready: false,
  configured: authConfigured,
});
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!supabase);
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;
    let generation = 0;
    async function validate() {
      const request = ++generation;
      try {
        const result = await client!.auth.getUser();
        if (active && request === generation) setUser(result.error ? null : result.data.user);
      } catch {
        if (active && request === generation) setUser(null);
      } finally {
        if (active && request === generation) setReady(true);
      }
    }
    void validate();
    const { data: listener } = client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        generation++;
        setUser(null);
        setReady(true);
      } else if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'PASSWORD_RECOVERY' ||
        event === 'USER_UPDATED'
      ) {
        setTimeout(() => {
          if (active) void validate();
        }, 0);
      }
    });
    if (AppState.currentState === 'active') client.auth.startAutoRefresh();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') client.auth.startAutoRefresh();
      else client.auth.stopAutoRefresh();
    });
    return () => {
      active = false;
      generation++;
      listener.subscription.unsubscribe();
      appState.remove();
      client.auth.stopAutoRefresh();
    };
  }, []);
  return (
    <AuthContext.Provider value={{ user, ready, configured: authConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
