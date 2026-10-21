import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import type { AuthError } from '@supabase/supabase-js';
import { supabase, publicSupabaseConfig } from './supabase';
import { authEmailRedirect } from './authRedirect';

type GoogleFailure = 'unavailable' | 'disabled' | 'expo-go' | 'callback' | 'network';
class GoogleAuthError extends Error {
  constructor(readonly code: GoogleFailure) {
    super(code);
  }
}

let lastExchange: { code: string; result: Promise<{ error: AuthError | null }> } | undefined;

/** Auth remounts the workspace; one callback code must only be exchanged once. */
export function exchangeAccountCode(code: string): Promise<{ error: AuthError | null }> {
  if (!supabase) return Promise.reject(new GoogleAuthError('unavailable'));
  if (lastExchange?.code === code) return lastExchange.result;
  const result = supabase.auth.exchangeCodeForSession(code).then((response) => {
    if (response.error && lastExchange?.code === code) lastExchange = undefined;
    return { error: response.error };
  });
  lastExchange = { code, result };
  return result;
}

export async function signInWithGoogle(
  nextPath: string,
  signal?: AbortSignal,
): Promise<'redirecting' | 'completed' | 'cancelled'> {
  if (!supabase || !publicSupabaseConfig) throw new GoogleAuthError('unavailable');
  if (
    Platform.OS !== 'web' &&
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ) {
    throw new GoogleAuthError('expo-go');
  }
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    // Avoid redirecting out of the app to an unconfigured OAuth provider.
    const response = await fetch(publicSupabaseConfig.url + '/auth/v1/settings', {
      headers: { apikey: publicSupabaseConfig.key },
      signal: controller.signal,
    });
    if (!response.ok) throw new GoogleAuthError('network');
    const settings: unknown = await response.json();
    if (!settings || typeof settings !== 'object' || !('external' in settings)) {
      throw new GoogleAuthError('network');
    }
    const external = settings.external;
    if (
      !external ||
      typeof external !== 'object' ||
      !('google' in external) ||
      external.google !== true
    ) {
      throw new GoogleAuthError('disabled');
    }
  } catch (error) {
    throw error instanceof GoogleAuthError ? error : new GoogleAuthError('network');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }

  if (signal?.aborted) return 'cancelled';
  const redirectTo = authEmailRedirect('oauth', nextPath);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error || !data.url) throw new GoogleAuthError('network');
  if (signal?.aborted) return 'cancelled';
  if (Platform.OS === 'web') {
    window.location.assign(data.url);
    return 'redirecting';
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return 'cancelled';
  const callback = new URL(result.url);
  const expected = new URL(redirectTo);
  if (
    callback.protocol !== expected.protocol ||
    callback.host !== expected.host ||
    callback.pathname !== expected.pathname
  ) {
    throw new GoogleAuthError('callback');
  }
  const code = callback.searchParams.get('code');
  if (callback.searchParams.has('error') || !code) throw new GoogleAuthError('callback');
  const exchange = await exchangeAccountCode(code);
  if (exchange.error) throw new GoogleAuthError('callback');
  return 'completed';
}

export function googleAuthErrorMessage(error: unknown) {
  if (error instanceof GoogleAuthError) {
    if (error.code === 'disabled')
      return 'O login com Google ainda não está disponível. Entre ou crie sua conta com e-mail.';
    if (error.code === 'expo-go')
      return 'Para usar o Google, abra a Cortexa no navegador. Aqui, você pode entrar com seu e-mail.';
    if (error.code === 'callback')
      return 'Não foi possível validar o retorno do Google. Tente novamente ou use seu e-mail.';
    if (error.code === 'unavailable')
      return 'O acesso por conta não está configurado neste ambiente. Você pode continuar sem conta.';
  }
  return 'Não foi possível conectar ao Google. Confira sua conexão e tente novamente.';
}
