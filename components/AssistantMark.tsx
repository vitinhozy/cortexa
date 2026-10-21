import { useEffect, useRef } from 'react';
import { Animated, Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, T, s } from './ui';
import { useMotion } from '@/hooks/useMotion';
import { colors, themeTint } from '@/constants/theme';

export function AssistantMark({ size = 96, brand = false }: { size?: number; brand?: boolean }) {
  return (
    <View
      accessible={false}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: themeTint('#DFD0F3', '#3A2A58'),
        }}
      />
      <LinearGradient
        colors={[
          themeTint('#F2DDFF'),
          themeTint('#D4CBFF', '#34264E'),
          themeTint('#AA91DA', '#211832'),
        ]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size * 0.8,
          height: size * 0.8,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {brand ? (
          <Image
            source={require('../assets/cortexa-mark.png')}
            resizeMode="contain"
            accessible={false}
            style={{ width: size * 0.66, height: size * 0.66 }}
          />
        ) : (
          <Icon name="zap" size={size * 0.32} color={colors.primaryDark} />
        )}
      </LinearGradient>
    </View>
  );
}
export function Thinking() {
  const { reduced } = useMotion();
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) {
      progress.setValue(0.5);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(progress, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [progress, reduced]);
  return (
    <View accessibilityLiveRegion="polite" style={s.row}>
      <View accessible={false} style={[s.row, { gap: 4 }]}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.primary,
              opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: index === 1 ? [1, 0.35] : [0.35, 1],
              }),
            }}
          />
        ))}
      </View>
      <T muted style={{ flex: 1, fontSize: 12 }}>
        Preparando uma explicação demonstrativa...
      </T>
    </View>
  );
}
