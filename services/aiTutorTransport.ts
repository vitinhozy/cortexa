import type { AITutorRequest, AITutorResponse, AITutorTransport } from '@/types/aiTutor';
import { recordValue } from '@/features/study/materialAnalysisSchema';
import { AIError, remoteAIError } from './aiErrors';
import { publicSupabaseConfig, supabase } from './supabase';

export const aiTutorTransport: AITutorTransport | undefined =
  supabase && publicSupabaseConfig
    ? { send: (owner, request, signal) => invoke(owner, request, signal) }
    : undefined;

async function invoke(
  owner: string,
  request: AITutorRequest,
  signal?: AbortSignal,
): Promise<AITutorResponse> {
  if (!supabase || !publicSupabaseConfig) throw new AIError('unavailable');
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  if (signal?.aborted) controller.abort();
  let expired = false;
  const timer = setTimeout(() => {
    expired = true;
    controller.abort();
  }, 35000);
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session || data.session.user.id !== owner) throw new AIError('unauthorized');
    const response = await fetch(publicSupabaseConfig.url + '/functions/v1/ai-tutor-chat', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        apikey: publicSupabaseConfig.key,
        Authorization: 'Bearer ' + data.session.access_token,
      },
      body: JSON.stringify(request),
    });
    let value: unknown;
    try {
      value = await response.json();
    } catch {
      throw new AIError(response.status === 404 ? 'unavailable' : 'provider');
    }
    if (!response.ok)
      throw response.status === 401
        ? new AIError('unauthorized')
        : response.status === 404
          ? new AIError('unavailable')
          : remoteAIError(value);
    if (
      !recordValue(value) ||
      typeof value.answer !== 'string' ||
      !value.answer.trim() ||
      value.provider !== 'gemini' ||
      typeof value.model !== 'string' ||
      !/^[a-zA-Z0-9._-]{1,100}$/.test(value.model) ||
      typeof value.promptVersion !== 'string'
    )
      throw new AIError('invalid_output');
    return value as unknown as AITutorResponse;
  } catch (error) {
    if (signal?.aborted) throw new AIError('cancelled');
    if (expired) throw new AIError('timeout');
    throw error instanceof AIError ? error : new AIError('provider');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}
