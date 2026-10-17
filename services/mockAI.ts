import type { AIService, AIRouter, Repository } from './contracts';
import type { AIConversation, AIMessage } from '@/types/domain';
import { uid } from '@/utils/date';
export const aiRouter: AIRouter = {
  route: (task) => ({
    capability:
      task === 'image-analysis' ? 'multimodal' : task === 'tutoring' ? 'advanced' : 'economical',
    provider: 'mock',
  }),
};
export class MockAIService implements AIService {
  constructor(private repo: Repository) {}
  conversation(id: string) {
    return this.repo.getSnapshot().conversations.find((c) => c.id === id);
  }
  async send(input: Parameters<AIService['send']>[0]): Promise<AIMessage> {
    const data = this.repo.getSnapshot();
    const material = data.materials.find((m) => m.id === input.materialId);
    const normalized = input.text.toLowerCase();
    const topic =
      data.topics.find((t) => t.id === (input.topicId ?? material?.topicId)) ??
      data.topics.find(
        (t) =>
          normalized.includes(t.name.toLowerCase()) ||
          (normalized.includes('sraa') && t.id === 'raas') ||
          (normalized.includes('potássio') && t.id === 'potassium'),
      ) ??
      data.topics[0];
    let content = `${topic.name}\n\n${topic.summary}\n\n${topic.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n\n')}\n\nPara fixar: tente explicar o mecanismo com suas próprias palavras antes de consultar a resposta.`;
    if (normalized.includes('quest'))
      content = `Para praticar ${topic.name.toLowerCase()}, abra a sessão de questões pelo botão abaixo. O banco demonstrativo já contém alternativas comentadas e registra seus erros. A geração de questões inéditas será conectada futuramente.`;
    else if (normalized.includes('errando') || normalized.includes('errei'))
      content = `Vamos olhar para o raciocínio. No exemplo de gasometria, o erro comum é confundir o distúrbio primário com a compensação.\n\n1. Primeiro, observe o pH.\n2. Depois, identifique qual componente explica a alteração.\n3. Só então avalie se a resposta compensatória é adequada.\n\nEssa é uma hipótese didática simulada, não uma avaliação automática real do seu raciocínio.`;
    else if (normalized.includes('amanhã') || normalized.includes('plano'))
      content =
        'Comece pelo assunto com menor domínio, pratique algumas questões e termine revisando os erros.\n\nNo planejador, informe o tempo disponível: o Study Engine local distribui os minutos entre seus assuntos prioritários.';
    else if (
      ![
        'explique',
        'resum',
        'ensine',
        'sraa',
        'ácido',
        'gasometria',
        'potássio',
        'renal',
        'material',
      ].some((term) => normalized.includes(term))
    )
      content = `Estou em modo de demonstração e ainda não interpreto perguntas livres com uma IA real. Posso mostrar uma explicação pronta de ${topic.name.toLowerCase()}, questões comentadas ou uma aula guiada.\n\n${topic.summary}`;
    const userMessage: AIMessage = {
      id: uid('msg'),
      role: 'user',
      content: input.text,
      createdAt: new Date().toISOString(),
    };
    this.repo.update((current) => {
      const existing = current.conversations.find((c) => c.id === input.conversationId);
      const conversation: AIConversation = existing ?? {
        id: input.conversationId,
        mode: input.mode,
        materialId: input.materialId,
        topicId: topic.id,
        messages: [],
      };
      return {
        ...current,
        conversations: [
          ...current.conversations.filter((c) => c.id !== conversation.id),
          { ...conversation, messages: [...conversation.messages, userMessage] },
        ],
      };
    });
    await new Promise((resolve) => setTimeout(resolve, 600));
    const answer: AIMessage = {
      id: uid('msg'),
      role: 'assistant',
      content,
      createdAt: new Date().toISOString(),
      sources: [
        {
          id: material?.id ?? 'demo-reference',
          title:
            input.mode === 'class'
              ? `${material?.title ?? topic.name} · fonte simulada`
              : 'Referência médica demonstrativa · não consultada',
          page:
            input.mode === 'class' && material && !material.content
              ? Math.min(12, material.pages)
              : undefined,
          simulated: true,
        },
      ],
    };
    this.repo.update((current) => ({
      ...current,
      conversations: current.conversations.map((c) =>
        c.id === input.conversationId ? { ...c, messages: [...c.messages, answer] } : c,
      ),
    }));
    return answer;
  }
}
