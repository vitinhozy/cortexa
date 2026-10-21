import type { AIConversation, AIMessage } from '@/types/domain';
import type { AITutorTransport } from '@/types/aiTutor';
import type { AIService, Repository } from './contracts';
import { AIError } from './aiErrors';
import { uid } from '@/utils/date';

export function createAITutorService(repo: Repository, transport?: AITutorTransport): AIService {
  return {
    conversation: (id) =>
      repo.getSnapshot().conversations.find((conversation) => conversation.id === id),
    async send(input) {
      const data = repo.getSnapshot();
      if (data.workspace !== 'personal')
        throw new Error('Use a demonstração local para testar respostas simuladas.');
      if (!transport) throw new AIError('unavailable');
      const material = data.materials.find((item) => item.id === input.materialId);
      const topic = data.topics.find((item) => item.id === (input.topicId ?? material?.topicId));
      const existing = data.conversations.find((item) => item.id === input.conversationId);
      const priorMessages = existing?.messages ?? [];
      const last = priorMessages[priorMessages.length - 1];
      const userMessage: AIMessage =
        last?.role === 'user' && last.content === input.text.trim()
          ? last
          : {
              id: uid('msg'),
              role: 'user',
              content: input.text.trim(),
              createdAt: new Date().toISOString(),
            };
      const conversation: AIConversation = existing ?? {
        id: input.conversationId,
        mode: input.mode,
        materialId: input.materialId,
        topicId: topic?.id,
        messages: [],
      };
      const messages = userMessage === last ? priorMessages : [...priorMessages, userMessage];
      repo.update((current) => ({
        ...current,
        conversations: [
          ...current.conversations.filter((item) => item.id !== input.conversationId),
          {
            ...conversation,
            materialId: input.materialId ?? conversation.materialId,
            topicId: topic?.id ?? conversation.topicId,
            messages,
          },
        ],
      }));
      const historyMessages = userMessage === last ? priorMessages.slice(0, -1) : priorMessages;
      const response = await transport.send(data.user.id, {
        question: input.text.trim(),
        history: historyMessages
          .slice(-6)
          .map(({ role, content }) => ({ role, content: content.slice(0, 2000) })),
        topicName: topic?.name,
        materialTitle: material?.title,
        materialContent: material?.content?.slice(0, 5000),
      });
      const answer: AIMessage = {
        id: uid('msg'),
        role: 'assistant',
        content: response.answer,
        createdAt: new Date().toISOString(),
        provider: response.provider,
        model: response.model,
        promptVersion: response.promptVersion,
        simulated: false,
      };
      repo.update((current) => ({
        ...current,
        conversations: current.conversations.map((item) =>
          item.id === input.conversationId
            ? { ...item, messages: [...item.messages, answer] }
            : item,
        ),
      }));
      return answer;
    },
  };
}

export function aiTutorErrorMessage(error: unknown): string {
  if (!(error instanceof AIError)) return 'Não foi possível responder agora. Tente novamente.';
  const messages = {
    unavailable: 'O tutor ainda não está disponível neste ambiente.',
    unauthorized: 'Entre na sua conta para conversar com o tutor.',
    invalid_input: 'A pergunta ou o contexto ultrapassou o limite permitido.',
    invalid_output: 'O tutor não retornou uma resposta utilizável. Tente novamente.',
    rate_limit: 'Você atingiu o limite diário de conversas com o tutor. Tente novamente amanhã.',
    busy: 'Já existe uma solicitação em andamento. Aguarde um momento.',
    timeout: 'A resposta demorou mais que o esperado. Tente novamente.',
    cancelled: 'Solicitação cancelada.',
    provider: 'Não foi possível falar com o Gemini agora. Tente novamente.',
    storage: 'Não foi possível registrar a solicitação com segurança. Tente novamente.',
  };
  return messages[error.code];
}
