import type { Href } from 'expo-router';

const privateRoots = new Set([
  'overview',
  'study',
  'library',
  'ai',
  'profile',
  'onboarding',
  'tutor',
  'topic',
  'studio',
  'session',
  'search',
  'questions',
  'profile-edit',
  'practice',
  'planner',
  'mistakes',
  'membership',
  'exams',
  'compose',
  'material',
  'learning',
  'knowledge',
  'history',
  'flashcards',
]);

/** Only app destinations may survive an authentication round trip. */
export function safeReturnPath(value?: string): Href | undefined {
  if (!value || !value.startsWith('/') || /[\\\u0000-\u0020]/.test(value)) return undefined;
  try {
    const url = new URL(value, 'https://cortexa.invalid');
    if (url.origin !== 'https://cortexa.invalid') return undefined;
    const path = decodeURIComponent(url.pathname);
    if (/[\\%]/.test(path) || path.includes('//') || path.split('/').includes('..'))
      return undefined;
    if (!privateRoots.has(path.split('/')[1])) return undefined;
    return (url.pathname + url.search) as Href;
  } catch {
    return undefined;
  }
}

export function isPublicPath(pathname: string) {
  return pathname === '/' || pathname === '/account';
}

export function requestedStudyPath(pathname: string, params: Record<string, unknown>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') query.set(key, value);
    else if (Array.isArray(value))
      for (const item of value) if (typeof item === 'string') query.append(key, item);
  }
  const search = query.toString();
  return String(safeReturnPath(pathname + (search ? '?' + search : '')) ?? '/overview');
}
