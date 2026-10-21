import { aiConfig } from '../_shared/ai/config.ts';
import { geminiProvider } from '../_shared/ai/gemini.ts';
import { analysisHandler } from '../_shared/ai/handler.ts';
import { supabaseAnalysisBackend } from '../_shared/ai/supabaseStore.ts';

const config = aiConfig((key) => Deno.env.get(key));
const backend = supabaseAnalysisBackend(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
);
Deno.serve(analysisHandler({ ...backend, config, provider: geminiProvider(config) }));
