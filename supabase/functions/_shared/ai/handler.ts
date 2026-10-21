import type { AIProvider, AIUsage } from '../../../../types/ai.ts';
import type {
  AnalysisMaterial,
  MaterialAnalysisRecord,
} from '../../../../types/materialAnalysis.ts';
import { createAIExecutor } from '../../../../services/aiRouter.ts';
import { AIError, safeAIError } from '../../../../services/aiErrors.ts';
import {
  materialAnalysisSchema,
  parseAnalysisMaterial,
  parseAnalysisRecord,
  parseMaterialAnalysis,
  recordValue,
} from '../../../../features/study/materialAnalysisSchema.ts';
import type { AIConfig } from './config.ts';
import { materialPrompt, materialPromptVersion, materialSystemPrompt } from './prompts.ts';

export interface AnalysisClaim {
  state: 'claimed' | 'cached' | 'busy' | 'limited';
  token?: string;
  record?: unknown;
}
export interface AnalysisStore {
  claim(
    owner: string,
    key: string,
    material: AnalysisMaterial,
    hash: string,
    config: AIConfig,
  ): Promise<AnalysisClaim>;
  finish(
    owner: string,
    key: string,
    token: string,
    record: MaterialAnalysisRecord | undefined,
    usage: AIUsage | undefined,
    errorCode?: string,
  ): Promise<void>;
  review(owner: string, key: string): Promise<unknown>;
}
export interface AnalysisDependencies {
  authenticate(token: string): Promise<string>;
  store: AnalysisStore;
  provider: AIProvider;
  config: AIConfig;
}
export async function hashText(text: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
async function bodyOf(request: Request): Promise<unknown> {
  if (!request.body) throw new AIError('invalid_input');
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let body = '';
  let size = 0;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > 48000) {
        await reader.cancel();
        throw new AIError('invalid_input');
      }
      body += decoder.decode(next.value, { stream: true });
    }
    body += decoder.decode();
    return JSON.parse(body);
  } catch {
    throw new AIError('invalid_input');
  } finally {
    reader.releaseLock();
  }
}
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
export function analysisHandler(deps: AnalysisDependencies) {
  return async (request: Request): Promise<Response> => {
    const reply = (value: unknown, status = 200) =>
      Response.json(value, { status, headers: { ...cors, 'Cache-Control': 'no-store' } });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply({ code: 'invalid_input' }, 405);
    try {
      const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1];
      if (!token) throw new AIError('unauthorized');
      const owner = await deps.authenticate(token);
      const body = await bodyOf(request);
      if (!recordValue(body)) throw new AIError('invalid_input');
      if (body.operation === 'review') {
        if (
          Object.keys(body).some((k) => !['operation', 'id'].includes(k)) ||
          typeof body.id !== 'string' ||
          !/^[a-f0-9]{64}$/.test(body.id)
        )
          throw new AIError('invalid_input');
        return reply({ record: await deps.store.review(owner, body.id) });
      }
      if (
        body.operation !== 'analyze' ||
        Object.keys(body).some((k) => !['operation', 'material'].includes(k))
      )
        throw new AIError('invalid_input');
      let material: AnalysisMaterial;
      try {
        material = parseAnalysisMaterial(body.material);
      } catch {
        throw new AIError('invalid_input');
      }
      const contentHash = await hashText(
        JSON.stringify([
          material.id,
          material.title,
          material.content,
          material.subjectName,
          material.topicName,
        ]),
      );
      const key = await hashText(
        JSON.stringify([
          contentHash,
          materialPromptVersion,
          1,
          deps.provider.id,
          deps.config.model,
        ]),
      );
      const claim = await deps.store.claim(owner, key, material, contentHash, deps.config);
      if (claim.state === 'cached')
        return reply({ record: parseAnalysisRecord(claim.record, owner, material), cached: true });
      if (claim.state === 'busy') throw new AIError('busy');
      if (claim.state === 'limited') throw new AIError('rate_limit');
      if (!claim.token) throw new AIError('storage');
      let usage: AIUsage | undefined;
      const executor = createAIExecutor(
        [
          {
            id: deps.config.model,
            provider: deps.provider.id,
            capability: 'economical',
            costTier: 0,
            tasks: ['extraction'],
          },
        ],
        [deps.provider],
        {
          authorize: async (r) => r.userId === owner && r.id === claim.token,
          recordUsage: async (record) => {
            usage = record;
          },
          validateResponse: (response) => {
            try {
              parseMaterialAnalysis(response.output, material.content);
            } catch {
              throw new AIError('invalid_output');
            }
          },
        },
      );
      try {
        const response = await executor.execute(
          {
            id: claim.token,
            userId: owner,
            feature: 'material-analysis',
            task: 'extraction',
            preference: 'automatic',
            input: materialPrompt(material),
            systemInstruction: materialSystemPrompt,
            responseSchema: { ...materialAnalysisSchema },
            maxOutputTokens: deps.config.maxOutputTokens,
          },
          request.signal,
        );
        const record: MaterialAnalysisRecord = {
          id: key,
          userId: owner,
          materialId: material.id,
          contentHash,
          model: deps.config.model,
          provider: deps.provider.id,
          promptVersion: materialPromptVersion,
          generatedAt: new Date().toISOString(),
          analysis: parseMaterialAnalysis(response.output, material.content),
        };
        await deps.store.finish(owner, key, claim.token, record, usage);
        return reply({ record, cached: false });
      } catch (error) {
        const failure = safeAIError(error);
        await deps.store.finish(owner, key, claim.token, undefined, usage, failure.code);
        throw failure;
      }
    } catch (error) {
      const failure = safeAIError(error);
      const status = {
        unauthorized: 401,
        invalid_input: 400,
        rate_limit: 429,
        busy: 409,
        unavailable: 503,
        invalid_output: 502,
        provider: 502,
        storage: 503,
        timeout: 504,
        cancelled: 499,
      }[failure.code];
      return reply({ code: failure.code, message: failure.message }, status);
    }
  };
}
