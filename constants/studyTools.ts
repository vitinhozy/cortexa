import type { IconName } from '@/components/ui';
export const studyTools: {
  title: string;
  detail: string;
  icon: IconName;
  route: '/questions' | '/flashcards' | '/session' | '/mistakes' | '/planner' | '/knowledge';
  params?: Record<string, string>;
  color: string;
  badge?: string;
}[] = [
  {
    title: 'Questões',
    detail: 'Aprenda, revise e encontre seu próximo passo.',
    icon: 'check-square',
    route: '/questions',
    color: '#E7F3EC',
    badge: 'Prática adaptativa',
  },
  {
    title: 'Flashcards',
    detail: 'Pequenas revisões. Memória duradoura.',
    icon: 'layers',
    route: '/flashcards',
    color: '#EBF1F9',
    badge: 'Revisão diária',
  },
  {
    title: 'Revisão rápida',
    detail: 'O essencial para conectar as ideias.',
    icon: 'zap',
    route: '/session',
    color: '#FCF3E5',
  },
  {
    title: 'Casos clínicos',
    detail: 'Aplique conceitos em casos fictícios.',
    icon: 'activity',
    route: '/questions',
    params: { kind: 'cases' },
    color: '#FAECEC',
  },
  {
    title: 'Simulado',
    detail: 'Monte sua prova e veja a análise ao concluir.',
    icon: 'clipboard',
    route: '/questions',
    params: { kind: 'exam' },
    color: '#F0ECF6',
  },
  {
    title: 'Caderno de erros',
    detail: 'Transforme cada dúvida em aprendizado.',
    icon: 'edit-3',
    route: '/mistakes',
    color: '#FCF3E5',
  },
  {
    title: 'Plano de estudo',
    detail: 'Um caminho possível até a sua prova.',
    icon: 'calendar',
    route: '/planner',
    color: '#E7F3EC',
  },
  {
    title: 'Mapa de conhecimento',
    detail: 'Veja onde você está e para onde ir.',
    icon: 'compass',
    route: '/knowledge',
    color: '#EBF1F9',
  },
];
