import type { Href } from 'expo-router';
import type { NavigationCrumb, NavigationLocation, NavigationSection } from '@/types/navigation';

const sectionLabels: Record<NavigationSection, string> = {
  '/ai': 'Conversar',
  '/overview': 'Visão geral',
  '/study': 'Estudar',
  '/library': 'Biblioteca',
  '/profile': 'Perfil',
};

export function navigationLocation(
  pathname: string,
  params: Record<string, string | string[] | undefined> = {},
  title?: string,
): NavigationLocation {
  const value = (key: string) => (Array.isArray(params[key]) ? params[key]?.[0] : params[key]);
  const kind = value('kind');
  const location = (
    sectionHref: NavigationSection,
    currentLabel: string,
    fallback: Href = sectionHref,
    parents: NavigationCrumb[] = [],
  ): NavigationLocation => ({
    sectionHref,
    currentLabel,
    fallback,
    crumbs: [
      {
        label: sectionLabels[sectionHref],
        ...(pathname === sectionHref ? {} : { href: sectionHref }),
      },
      ...parents,
      ...(pathname === sectionHref ? [] : [{ label: currentLabel }]),
    ],
  });
  if (pathname === '/') return location('/overview', sectionLabels['/overview']);
  if (pathname in sectionLabels)
    return location(pathname as NavigationSection, sectionLabels[pathname as NavigationSection]);
  if (pathname === '/questions')
    return location(
      '/study',
      kind === 'exam' ? 'Simulado' : kind === 'cases' ? 'Casos clínicos' : 'Questões',
    );
  if (pathname.startsWith('/practice/'))
    return location('/study', 'Sessão de questões', '/questions', [
      { label: 'Questões', href: '/questions' },
    ]);
  const studyScreens: Record<string, string> = {
    '/flashcards': 'Flashcards',
    '/mistakes': 'Caderno de erros',
    '/session': 'Revisão rápida',
    '/planner': 'Plano de estudo',
    '/knowledge': 'Mapa de conhecimento',
    '/exams': 'Provas',
    '/tutor': 'Tutor',
  };
  if (studyScreens[pathname]) return location('/study', studyScreens[pathname]);
  if (pathname.startsWith('/topic/'))
    return location('/study', title ?? 'Assunto', '/knowledge', [
      { label: 'Mapa de conhecimento', href: '/knowledge' },
    ]);
  if (pathname === '/compose') {
    const assessment = kind === 'assessment';
    const parent = assessment ? '/questions' : '/flashcards';
    return location('/study', assessment ? 'Criar questão' : 'Criar flashcard', parent, [
      { label: assessment ? 'Questões' : 'Flashcards', href: parent },
    ]);
  }
  if (pathname.startsWith('/material/'))
    return location(
      '/library',
      pathname === '/material/add' ? 'Adicionar material' : (title ?? 'Material'),
    );
  if (pathname === '/studio' || pathname.startsWith('/studio/')) {
    const studioKind = kind === 'slides' || kind === 'transcript' ? kind : 'mindmap';
    const label = { slides: 'Slides', transcript: 'Transcrições', mindmap: 'Mapas mentais' }[
      studioKind
    ];
    const studioHref: Href = { pathname: '/studio', params: { kind: studioKind } };
    if (pathname === '/studio') return location('/library', label);
    const id = value('id');
    const editing = pathname === '/studio/edit';
    return location(
      '/library',
      editing ? (id ? 'Editar conteúdo' : 'Criar conteúdo') : (title ?? 'Documento'),
      editing && id ? { pathname: '/studio/[id]', params: { id } } : studioHref,
      [{ label, href: studioHref }],
    );
  }
  const profileScreens: Record<string, string> = {
    '/profile-edit': 'Editar perfil',
    '/account': 'Conta e acesso',
    '/membership': 'Cortexa Plus',
    '/onboarding': 'Minha rotina',
    '/learning': 'Minha jornada',
  };
  if (profileScreens[pathname]) return location('/profile', profileScreens[pathname]);
  if (pathname === '/history') return location('/ai', 'Conversas recentes');
  if (pathname === '/search') return location('/library', 'Buscar');
  return location('/study', title ?? 'Estudo');
}
