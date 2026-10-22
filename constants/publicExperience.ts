import type { IconName } from '@/components/ui';

export const learningStory: {
  label: string;
  title: string;
  description: string;
  detail: string;
  icon: IconName;
}[] = [
  {
    label: '01 · O SEU PONTO DE PARTIDA',
    title: 'Você estuda.',
    description:
      'Uma anotação, uma questão, uma dúvida. Tudo começa com o que você está aprendendo agora.',
    detail:
      'Organize suas anotações por disciplina e assunto. Seu material dá contexto à sua jornada.',
    icon: 'book-open',
  },
  {
    label: '02 · CONHECIMENTO QUE SE CONECTA',
    title: 'Cada conceito encontra seu lugar.',
    description: 'Da disciplina ao conceito, seu estudo ganha uma estrutura que faz sentido.',
    detail:
      'As práticas registram evidências na sua memória de aprendizagem. Ler e conversar, por si só, não significam dominar.',
    icon: 'share-2',
  },
  {
    label: '03 · MAIS CLAREZA, MENOS ACHISMO',
    title: 'Suas lacunas ficam visíveis.',
    description: 'Acertos, erros e confiança ajudam a entender o que merece mais atenção.',
    detail:
      'Pratique a recuperação ativa. O feedback das questões e dos cartões ajuda a orientar o próximo passo.',
    icon: 'target',
  },
  {
    label: '04 · REENCONTRAR PARA LEMBRAR',
    title: 'Revisar tem seu momento.',
    description:
      'Volte ao que importa, com revisões espaçadas e prioridades ligadas ao seu percurso.',
    detail:
      'Organize revisões e provas dentro do tempo que você tem. Intervalos simples ajudam a manter a continuidade.',
    icon: 'repeat',
  },
  {
    label: '05 · UM PERCURSO QUE É SEU',
    title: 'A evolução ganha contexto.',
    description:
      'Enxergue sua atividade, seus assuntos e as evidências que você constrói a cada prática.',
    detail:
      'Seu histórico acompanha a etapa da sua formação. As estimativas de domínio orientam o estudo, sem certificar proficiência.',
    icon: 'trending-up',
  },
];

/** Set only after publishing the real, optimized cortexa-demo.mp4. No video is downloaded by default. */
export const cortexaDemoVideoUrl: string | undefined = undefined;
