import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

export type NavigationLayout = 'left' | 'bottom';
const KEY = 'cortexa:navigation-layout:v1';
const COLLAPSED_KEY = 'cortexa:navigation-collapsed:v1';
const NavigationLayoutContext = createContext<{
  layout: NavigationLayout;
  setLayout: (layout: NavigationLayout) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
} | null>(null);

export function NavigationLayoutProvider({ children }: PropsWithChildren) {
  const [layout, updateLayout] = useState<NavigationLayout>('bottom');
  const [collapsed, updateCollapsed] = useState(false);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY)
      .then((saved) => {
        if (active && (saved === 'left' || saved === 'bottom')) updateLayout(saved);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(COLLAPSED_KEY)
      .then((saved) => {
        if (active && saved === 'true') updateCollapsed(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const setLayout = useCallback((next: NavigationLayout) => {
    updateLayout(next);
    void AsyncStorage.setItem(KEY, next).catch(() => {});
  }, []);
  const setCollapsed = useCallback((next: boolean) => {
    updateCollapsed(next);
    void AsyncStorage.setItem(COLLAPSED_KEY, String(next)).catch(() => {});
  }, []);
  return (
    <NavigationLayoutContext.Provider value={{ layout, setLayout, collapsed, setCollapsed }}>
      {children}
    </NavigationLayoutContext.Provider>
  );
}

export function useNavigationLayout() {
  const value = useContext(NavigationLayoutContext);
  if (!value) throw new Error('NavigationLayoutProvider ausente.');
  return value;
}
