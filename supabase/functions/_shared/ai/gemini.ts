import type { AIProvider } from '../../../../types/ai.ts';
import { AIError } from '../../../../services/aiErrors.ts';
import { recordValue } from '../../../../features/study/materialAnalysisSchema.ts';
import type { AIConfig } from './config.ts';

/** Server-only. The frontend imports contracts/validators, never this module. */
export function geminiProvider(config: AIConfig, send: typeof fetch = fetch): AIProvider {
  return {
    id: 'gemini',
    async execute(request, model, signal) {
      if (!config.apiKey) throw new AIError('unavailable');
      const controller = new AbortController();
      const cancel = () => controller.abort();
      signal?.addEventListener('abort', cancel, { once: true });
      if (signal?.aborted) controller.abort();
      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, config.timeoutMs);
      try {
        for (let attempt = 0; attempt < 2; attempt++) {
          if (controller.signal.aborted)
            throw new AIError(signal?.aborted ? 'cancelled' : 'timeout');
          const response = await send(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model.id)}:generateContent`,
            {
              method: 'POST',
              signal: controller.signal,
              headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: request.systemInstruction }] },
                contents: [{ role: 'user', parts: [{ text: request.input }] }],
                generationConfig: request.responseSchema
                  ? {
                      maxOutputTokens: request.maxOutputTokens,
                      responseMimeType: 'application/json',
                      responseJsonSchema: request.responseSchema,
                    }
                  : { maxOutputTokens: request.maxOutputTokens },
              }),
            },
          );
          if (!response.ok) {
            await response.body?.cancel();
            if (attempt === 0 && [429, 503].includes(response.status)) {
              await new Promise<void>((resolve) => setTimeout(resolve, 300));
              continue;
            }
            throw new AIError(
              response.status === 429
                ? 'rate_limit'
                : response.status === 404 || response.status === 403
                  ? 'unavailable'
                  : 'provider',
            );
          }
          const raw: unknown = await response.json();
          if (
            !recordValue(raw) ||
            !recordValue(raw.usageMetadata) ||
            !Number.isInteger(raw.usageMetadata.promptTokenCount) ||
            !Number.isInteger(raw.usageMetadata.candidatesTokenCount)
          )
            throw new AIError('invalid_output');
          const candidate: unknown = Array.isArray(raw.candidates) ? raw.candidates[0] : undefined;
          const content =
            recordValue(candidate) && recordValue(candidate.content)
              ? candidate.content
              : undefined;
          const parts: unknown[] = content && Array.isArray(content.parts) ? content.parts : [];
          const outputText = parts
            .filter((p) => recordValue(p) && !p.thought && typeof p.text === 'string')
            .map((p) => (p as { text: string }).text)
            .join('');
          let output: unknown = null;
          if (
            recordValue(candidate) &&
            candidate.finishReason === 'STOP' &&
            outputText.length <= 60000
          ) {
            if (!request.responseSchema && outputText.trim()) output = outputText.trim();
            else if (!request.responseSchema) throw new AIError('invalid_output');
            else {
              try {
                output = JSON.parse(outputText);
              } catch {
                /* Validator rejects; usage still recorded. */
              }
            }
          }
          return {
            output,
            inputTokens: raw.usageMetadata.promptTokenCount as number,
            outputTokens: raw.usageMetadata.candidatesTokenCount as number,
            reasoningTokens: raw.usageMetadata.thoughtsTokenCount as number | undefined,
          };
        }
        throw new AIError('provider');
      } catch (error) {
        if (signal?.aborted) throw new AIError('cancelled');
        if (timedOut) throw new AIError('timeout');
        throw error instanceof AIError ? error : new AIError('provider');
      } finally {
        clearTimeout(timeout);
        signal?.removeEventListener('abort', cancel);
      }
    },
  };
}
