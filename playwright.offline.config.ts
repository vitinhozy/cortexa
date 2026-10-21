import { defineConfig } from '@playwright/test';
import base, { localWebServer } from './playwright.config';

export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: '**/offline.spec.ts',
  webServer: {
    ...localWebServer,
    env: {
      ...localWebServer.env,
      EXPO_PUBLIC_SUPABASE_URL: '',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
    },
  },
});
