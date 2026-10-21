import type {
  AIExecutionPolicy,
  AIModel,
  AIPreference,
  AIProvider,
  AIRequest,
  AIResponse,
  AIRouter,
  AITask,
} from '../types/ai.ts';

const commonTasks: AITask[] = [
  'classification',
  'title',
  'extraction',
  'summary',
  'question-generation',
  'flashcards',
];
export function createAIRouter(models: AIModel[]): AIRouter {
  return {
    route(task: AITask, preference: AIPreference = 'automatic') {
      const capability =
        task === 'image-analysis'
          ? 'multimodal'
          : task === 'complex-reasoning' ||
              (!commonTasks.includes(task) && preference === 'advanced')
            ? 'advanced'
            : commonTasks.includes(task) || preference === 'fast'
              ? 'economical'
              : 'standard';
      const candidates = models.filter(
        (model) =>
          model.tasks.includes(task) &&
          model.capability === capability &&
          (task !== 'scientific-research' || model.verifiedRetrieval),
      );
      const chosen = [...candidates].sort(
        (a, b) => a.costTier - b.costTier || a.id.localeCompare(b.id),
      )[0];
      if (!chosen) throw new Error('Não há um modelo configurado para essa tarefa e capacidade.');
      return { capability, provider: chosen.provider, model: chosen.id };
    },
  };
}
/** Server adapter only. Not composed into the native app; authorization/budget policy is required. */
export function createAIExecutor(
  models: AIModel[],
  providers: AIProvider[],
  policy: AIExecutionPolicy,
) {
  const router = createAIRouter(models);
  const requests = new Map<string, { payload: string; response: Promise<AIResponse> }>();
  const clock = policy.now ?? Date.now;
  return {
    router,
    execute(request: AIRequest, signal?: AbortSignal): Promise<AIResponse> {
      if (
        !request.id ||
        !request.userId ||
        !request.feature ||
        !request.input.trim() ||
        request.input.length > 100000 ||
        !Number.isInteger(request.maxOutputTokens) ||
        request.maxOutputTokens < 1 ||
        request.maxOutputTokens > 8192 ||
        !['automatic', 'fast', 'study', 'advanced'].includes(request.preference)
      )
        return Promise.reject(new Error('Requisição de IA inválida.'));
      const key = `${request.userId}:${request.id}`;
      const payload = JSON.stringify(request);
      const prior = requests.get(key);
      if (prior)
        return prior.payload === payload
          ? prior.response
          : Promise.reject(new Error('O ID da requisição já foi usado com outro conteúdo.'));
      const execute = async () => {
        const route = router.route(request.task, request.preference);
        const model = models.find((m) => m.id === route.model && m.provider === route.provider)!;
        const provider = providers.find((p) => p.id === model.provider);
        if (!provider) throw new Error('Provedor de IA indisponível.');
        if (!(await policy.authorize(request, model)))
          throw new Error('A tarefa excede as permissões ou o orçamento disponível.');
        const started = clock();
        let response: AIResponse | undefined;
        let completed = false;
        try {
          response = await provider.execute(request, model, signal);
          if (
            ![response.inputTokens, response.outputTokens].every(
              (n) => Number.isInteger(n) && n >= 0,
            ) ||
            (response.reasoningTokens !== undefined &&
              (!Number.isInteger(response.reasoningTokens) || response.reasoningTokens < 0)) ||
            (response.estimatedCost !== undefined &&
              (!Number.isFinite(response.estimatedCost) || response.estimatedCost < 0))
          )
            throw new Error('O provedor retornou métricas inválidas.');
          policy.validateResponse?.(response);
          completed = true;
          return response;
        } finally {
          const count = (value: number | undefined) =>
            value !== undefined && Number.isInteger(value) && value >= 0 ? value : undefined;
          await policy.recordUsage({
            requestId: request.id,
            userId: request.userId,
            feature: request.feature,
            sessionId: request.sessionId,
            task: request.task,
            provider: model.provider,
            model: model.id,
            inputTokens: count(response?.inputTokens),
            outputTokens: count(response?.outputTokens),
            reasoningTokens: count(response?.reasoningTokens),
            estimatedCost:
              response?.estimatedCost !== undefined &&
              Number.isFinite(response.estimatedCost) &&
              response.estimatedCost >= 0
                ? response.estimatedCost
                : undefined,
            latencyMs: Math.max(0, clock() - started),
            timestamp: new Date(clock()).toISOString(),
            status: completed ? 'completed' : 'failed',
          });
        }
      };
      const response = execute();
      requests.set(key, { payload, response });
      return response;
    },
  };
}
