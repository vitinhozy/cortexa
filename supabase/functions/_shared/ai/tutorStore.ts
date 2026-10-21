import type { AIConfig } from './config.ts';
import type { TutorStore } from './tutor.ts';
import { AIError } from '../../../../services/aiErrors.ts';
import { recordValue } from '../../../../features/study/materialAnalysisSchema.ts';

export function supabaseTutorBackend(
  url: string | undefined,
  serviceKey: string | undefined,
  config: AIConfig,
  send: typeof fetch = fetch,
) {
  async function remote(path: string, body?: unknown, token?: string): Promise<unknown> {
    if (!url || !serviceKey) throw new AIError('unavailable');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await send(url + path, {
        method: body === undefined ? 'GET' : 'POST',
        signal: controller.signal,
        headers: {
          apikey: serviceKey,
          Authorization: 'Bearer ' + (token ?? serviceKey),
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
  const store: TutorStore = {
    async authenticate(token) {
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
    async claim(owner, requestId, provider, model, limit) {
      const value = await remote('/rest/v1/rpc/claim_ai_tutor_chat', {
        p_owner: owner,
        p_request_id: requestId,
        p_provider: provider,
        p_model: model,
        p_daily_limit: limit,
      });
      if (value !== 'claimed' && value !== 'limited') throw new AIError('storage');
      return value;
    },
    async finish(owner, requestId, usage, errorCode) {
      const value = await remote('/rest/v1/rpc/finish_ai_tutor_chat', {
        p_owner: owner,
        p_request_id: requestId,
        p_usage: usage ?? {},
        p_error: errorCode ?? null,
      });
      if (value !== true) throw new AIError('storage');
    },
  };
  return {
    store,
    config,
  };
}
