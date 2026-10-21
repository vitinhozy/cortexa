import type { MaterialAnalysisTransport } from '@/types/materialAnalysis';
import { supabase, publicSupabaseConfig } from './supabase';
import { AIError, remoteAIError } from './aiErrors';
import { recordValue } from '@/features/study/materialAnalysisSchema';

export const materialAnalysisTransport: MaterialAnalysisTransport | undefined =
  supabase && publicSupabaseConfig
    ? {
        analyze: (owner, material, signal) =>
          invoke(owner, { operation: 'analyze', material }, signal),
        review: (owner, id, signal) => invoke(owner, { operation: 'review', id }, signal),
      }
    : undefined;

async function invoke(owner: string, body: unknown, signal?: AbortSignal): Promise<unknown> {
  if (!supabase || !publicSupabaseConfig) throw new AIError('unavailable');
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  if (signal?.aborted) controller.abort();
  let expired = false;
  const timer = setTimeout(() => {
    expired = true;
    controller.abort();
  }, 60000);
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session || data.session.user.id !== owner) throw new AIError('unauthorized');
    const response = await fetch(`${publicSupabaseConfig.url}/functions/v1/ai-material-analysis`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        apikey: publicSupabaseConfig.key,
        Authorization: `Bearer ${data.session.access_token}`,
      },
      body: JSON.stringify(body),
    });
    let result: unknown;
    try {
      result = await response.json();
    } catch {
      throw new AIError(response.status === 404 ? 'unavailable' : 'provider');
    }
    if (!response.ok)
      throw response.status === 401
        ? new AIError('unauthorized')
        : response.status === 404
          ? new AIError('unavailable')
          : remoteAIError(result);
    if (!recordValue(result) || !recordValue(result.record)) throw new AIError('invalid_output');
    return result.record;
  } catch (error) {
    if (signal?.aborted) throw new AIError('cancelled');
    if (expired) throw new AIError('timeout');
    throw error instanceof AIError ? error : new AIError('provider');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}
