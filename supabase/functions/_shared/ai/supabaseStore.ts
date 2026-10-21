import type { AnalysisStore, AnalysisClaim } from './handler.ts';
import { materialPromptVersion } from './prompts.ts';
import { AIError } from '../../../../services/aiErrors.ts';
import { recordValue } from '../../../../features/study/materialAnalysisSchema.ts';

export function supabaseAnalysisBackend(
  url: string | undefined,
  serviceKey: string | undefined,
  send: typeof fetch = fetch,
) {
  async function remote(path: string, body?: unknown, token?: string): Promise<unknown> {
    if (!url || !serviceKey) throw new AIError('unavailable');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await send(`${url}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        signal: controller.signal,
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${token ?? serviceKey}`,
          'Content-Type': 'application/json',
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new AIError(token ? 'unauthorized' : 'storage');
      }
      return await response.json();
    } catch (error) {
      throw error instanceof AIError ? error : new AIError('storage');
    } finally {
      clearTimeout(timeout);
    }
  }
  const store: AnalysisStore = {
    async claim(owner, key, material, hash, config) {
      const value = await remote('/rest/v1/rpc/claim_material_analysis', {
        p_owner: owner,
        p_key: key,
        p_material: material,
        p_hash: hash,
        p_model: config.model,
        p_prompt: materialPromptVersion,
        p_daily_limit: config.dailyLimit,
      });
      if (
        !recordValue(value) ||
        !['claimed', 'cached', 'busy', 'limited'].includes(String(value.state))
      )
        throw new AIError('storage');
      return value as unknown as AnalysisClaim;
    },
    async finish(owner, key, token, record, usage, errorCode) {
      const saved = await remote('/rest/v1/rpc/finish_material_analysis', {
        p_owner: owner,
        p_key: key,
        p_token: token,
        p_record: record ?? null,
        p_usage: usage ?? {},
        p_error: errorCode ?? null,
      });
      if (saved !== true) throw new AIError('storage');
    },
    async review(owner, key) {
      const value = await remote('/rest/v1/rpc/review_material_analysis', {
        p_owner: owner,
        p_key: key,
      });
      if (!recordValue(value)) throw new AIError('invalid_input');
      return value;
    },
  };
  return {
    store,
    async authenticate(token: string) {
      const user = await remote('/auth/v1/user', undefined, token);
      if (
        !recordValue(user) ||
        typeof user.id !== 'string' ||
        !/^[0-9a-f-]{36}$/i.test(user.id) ||
        user.is_anonymous === true
      )
        throw new AIError('unauthorized');
      return user.id;
    },
  };
}
