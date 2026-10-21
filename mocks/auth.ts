/** Synthetic Auth fixtures for controlled tests; never valid against Supabase. */
export const simulatedAuthUser = {
  id: '00000000-0000-4000-8000-000000000099',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'auth-simulado@example.invalid',
  email_confirmed_at: '2026-10-21T00:00:00Z',
  created_at: '2026-10-21T00:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  identities: [],
};

export function createSimulatedAuthSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const encode = (value: unknown) =>
    btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return {
    access_token:
      encode({ alg: 'HS256', typ: 'JWT' }) +
      '.' +
      encode({ sub: simulatedAuthUser.id, aud: 'authenticated', exp: expiresAt }) +
      '.c2ltdWxhdGVk',
    refresh_token: 'simulated-test-only-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    user: simulatedAuthUser,
  };
}
