import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type PropsWithChildren,
} from 'react';
import { router, usePathname, type Href } from 'expo-router';

type AppNavigation = {
  goBack: (fallback?: Href) => void;
  replace: (href: Href) => void;
  dismissTo: (href: Href) => void;
};

const AppNavigationContext = createContext<AppNavigation | null>(null);

export function AppNavigationProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const initialPath = useRef(pathname);
  const navigatedWithinApp = useRef(false);
  useEffect(() => {
    if (pathname !== initialPath.current) navigatedWithinApp.current = true;
  }, [pathname]);
  const goBack = useCallback((fallback: Href = '/') => {
    if (navigatedWithinApp.current && router.canGoBack()) router.back();
    else router.replace(fallback);
  }, []);
  const replace = useCallback((href: Href) => router.replace(href), []);
  const dismissTo = useCallback((href: Href) => router.dismissTo(href), []);
  const value = useMemo(() => ({ goBack, replace, dismissTo }), [goBack, replace, dismissTo]);
  return <AppNavigationContext.Provider value={value}>{children}</AppNavigationContext.Provider>;
}

export function useAppNavigation() {
  const value = useContext(AppNavigationContext);
  if (!value) throw new Error('AppNavigationProvider ausente.');
  return value;
}
