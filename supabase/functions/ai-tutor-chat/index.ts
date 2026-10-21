import { aiConfig } from '../_shared/ai/config.ts';
import { geminiProvider } from '../_shared/ai/gemini.ts';
import { tutorHandler } from '../_shared/ai/tutor.ts';
import { supabaseTutorBackend } from '../_shared/ai/tutorStore.ts';

const config = aiConfig((key) => Deno.env.get(key));
const backend = supabaseTutorBackend(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  config,
);
Deno.serve(
  tutorHandler({
    ...backend,
    authenticate: (token) => backend.store.authenticate(token),
    provider: geminiProvider(config),
    config,
  }),
);
