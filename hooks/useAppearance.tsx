import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { ActivityIndicator, View } from 'react-native';
import { colors, setAppearancePalette, type AppearanceScheme } from '@/constants/theme';

const APPEARANCE_KEY = 'cortexa:appearance:v1';
const AppearanceContext = createContext<{
  scheme: AppearanceScheme;
  setScheme: (scheme: AppearanceScheme) => void;
} | null>(null);

export function AppearanceProvider({ children }: PropsWithChildren) {
  const [scheme, updateScheme] = useState<AppearanceScheme>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(APPEARANCE_KEY)
      .then((stored) => {
        if (active && (stored === 'light' || stored === 'dark')) {
          setAppearancePalette(stored);
          updateScheme(stored);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const setScheme = useCallback((next: AppearanceScheme) => {
    setAppearancePalette(next);
    updateScheme(next);
    void AsyncStorage.setItem(APPEARANCE_KEY, next).catch(() => {});
  }, []);

  return (
    <AppearanceContext.Provider value={{ scheme, setScheme }}>
      {ready ? (
        children
      ) : (
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('AppearanceProvider ausente.');
  return context;
}
