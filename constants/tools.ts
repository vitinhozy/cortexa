import type { Href } from 'expo-router';
import type { IconName } from '@/components/ui';
import { colors } from './theme';

export const workspaceTools: {
  id: string;
  label: string;
  detail: string;
  icon: IconName;
  color: string;
  ink: string;
  route: Href;
}[] = [
  {
    id: 'library',
    label: 'Biblioteca',
    detail: 'Anotações e materiais organizados.',
    icon: 'file-text',
    get color() {
      return colors.blueLight;
    },
    get ink() {
      return colors.blue;
    },
    route: '/library',
  },
  {
    id: 'transcript',
    label: 'Transcrições',
    detail: 'Organize e revise textos de aulas.',
    icon: 'mic',
    get color() {
      return colors.mint;
    },
    get ink() {
      return colors.teal;
    },
    route: { pathname: '/studio', params: { kind: 'transcript' } },
  },
  {
    id: 'mindmap',
    label: 'Mapas mentais',
    detail: 'Conecte suas ideias, visualmente.',
    icon: 'git-branch',
    get color() {
      return colors.rose;
    },
    get ink() {
      return colors.pink;
    },
    route: { pathname: '/studio', params: { kind: 'mindmap' } },
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    detail: 'Crie cartões e pratique a memória.',
    icon: 'layers',
    get color() {
      return colors.amberLight;
    },
    get ink() {
      return colors.amber;
    },
    route: '/flashcards',
  },
  {
    id: 'assessment',
    label: 'Avaliações',
    detail: 'Monte questões e teste o que sabe.',
    icon: 'check-square',
    get color() {
      return colors.peach;
    },
    get ink() {
      return colors.orange;
    },
    route: '/questions',
  },
  {
    id: 'slides',
    label: 'Slides',
    detail: 'Dê uma sequência às suas ideias.',
    icon: 'monitor',
    get color() {
      return colors.blueLight;
    },
    get ink() {
      return colors.blue;
    },
    route: { pathname: '/studio', params: { kind: 'slides' } },
  },
];
