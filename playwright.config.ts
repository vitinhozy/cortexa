import { defineConfig } from '@playwright/test';

// Configuração pública SIMULADA: habilita apenas os formulários locais.
// O domínio .invalid não aponta para um serviço Supabase real.
export const localWebServer = {
  command: 'node node_modules/expo/bin/cli start --offline --port 8081',
  url: 'http://localhost:8081',
  reuseExistingServer: false,
  timeout: 120000,
  env: {
    CI: '1',
    EXPO_NO_DOTENV: '1',
    EXPO_PUBLIC_SUPABASE_URL: 'https://cortexa-e2e.invalid',
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_simulated_e2e_no_credentials',
    EXPO_PUBLIC_AUTH_WEB_REDIRECT_URL: '',
  },
};

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: '**/offline.spec.ts',
  timeout: 60000,
  workers: 1,
  webServer: localWebServer,
  use: {
    baseURL: 'http://localhost:8081',
    browserName: 'chromium',
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
  },
});
