import { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors } from '@/constants/theme';
import { useAppearance } from '@/hooks/useAppearance';
import { useMotion } from '@/hooks/useMotion';

export function ThemeToggle() {
  const { scheme, setScheme } = useAppearance();
  const { reduced } = useMotion();
  const progress = useRef(new Animated.Value(scheme === 'dark' ? 1 : 0)).current;

  useEffect(() => {
    if (reduced) {
      progress.setValue(scheme === 'dark' ? 1 : 0);
      return;
    }
    Animated.spring(progress, {
      toValue: scheme === 'dark' ? 1 : 0,
      stiffness: 220,
      damping: 16,
      mass: 0.65,
      useNativeDriver: true,
    }).start();
    return () => progress.stopAnimation();
  }, [progress, reduced, scheme]);

  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const scale = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.65, 1] });
  const next = scheme === 'light' ? 'escuro' : 'claro';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ativar tema ${next}`}
      accessibilityState={{ selected: scheme === 'dark' }}
      onPress={() => setScheme(scheme === 'light' ? 'dark' : 'light')}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
      }}
    >
      <Animated.View style={{ transform: [{ rotate }, { scale }] }}>
        <Feather name={scheme === 'light' ? 'sun' : 'moon'} size={18} color={colors.primary} />
      </Animated.View>
    </Pressable>
  );
}
