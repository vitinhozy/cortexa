import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export type AuthEmailFlow = 'signup' | 'recovery' | 'oauth';

/** Builds a deep link handled by Expo Router after email confirmation or password recovery. */
export function authEmailRedirect(flow: AuthEmailFlow, nextPath?: string) {
  const configuredRedirect =
    Platform.OS === 'web' && flow !== 'oauth'
      ? process.env.EXPO_PUBLIC_AUTH_WEB_REDIRECT_URL?.trim()
      : undefined;
  if (configuredRedirect) {
    try {
      const redirect = new URL(configuredRedirect);
      redirect.searchParams.set('authFlow', flow);
      if (nextPath) redirect.searchParams.set('next', nextPath);
      return redirect.toString();
    } catch {
      // Fall back to Expo's current app URL when the optional override is malformed.
    }
  }
  // Set query parameters once: Expo Linking web encodes values a second time.
  // OAuth must return to this origin, where its PKCE verifier was created.
  const redirect = new URL(Linking.createURL('/account'));
  redirect.searchParams.set('authFlow', flow);
  if (nextPath) redirect.searchParams.set('next', nextPath);
  return redirect.toString();
}
