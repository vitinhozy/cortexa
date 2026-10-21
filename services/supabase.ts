import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { publicAuthConfig } from './authConfig';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
// Apenas a chave PUBLICÁVEL. Service role e chaves de IA pertencem ao servidor.
const config = publicAuthConfig(url, key);
export { config as publicSupabaseConfig };
export const authConfigured = config !== null;
export const supabase = config
  ? createClient(config.url, config.key, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        flowType: 'pkce',
        detectSessionInUrl: false,
        lock: processLock,
      },
    })
  : null;
