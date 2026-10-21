import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useStudy } from './useStudy';
import { feedback } from '@/services/feedback';

const MotionContext = createContext({
  reduced: true,
  tap: (_kind?: 'selection' | 'success') => {},
});
export function MotionProvider({ children }: PropsWithChildren) {
  const { data } = useStudy();
  const [systemReduced, setSystemReduced] = useState(true);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setSystemReduced(value);
      })
      .catch(() => {
        if (active) setSystemReduced(true);
      });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setSystemReduced,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return (
    <MotionContext.Provider
      value={{
        reduced: systemReduced || Boolean(data.preferences.reduceMotion),
        tap: (kind = 'selection') => {
          if (data.preferences.haptics !== false) feedback(kind);
        },
      }}
    >
      {children}
    </MotionContext.Provider>
  );
}
export const useMotion = () => useContext(MotionContext);
