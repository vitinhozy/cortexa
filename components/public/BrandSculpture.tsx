import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { useMotion } from '@/hooks/useMotion';

const mark = require('../../assets/cortexa-mark.png');
const hand = require('../../assets/cortexa-hand.png');
const glowLayers = [1, 0.88, 0.76, 0.64, 0.52, 0.4];

/** Decorative scene: original assets, native transforms, and a still compact/reduced mode. */
export function BrandSculpture({
  size = 420,
  compact = false,
}: {
  size?: number;
  compact?: boolean;
}) {
  const { reduced } = useMotion();
  const phase = useRef(new Animated.Value(0)).current;
  const still = reduced || compact;

  useEffect(() => {
    phase.setValue(0);
    // Small compositions stay still so the form remains the focus on mobile.
    if (reduced || compact) return;
    const drift = Animated.loop(
      Animated.sequence([
        Animated.timing(phase, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          useNativeDriver: true,
        }),
        Animated.timing(phase, {
          toValue: -1,
          duration: 12000,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          useNativeDriver: true,
        }),
        Animated.timing(phase, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          useNativeDriver: true,
        }),
      ]),
    );
    drift.start();
    return () => {
      drift.stop();
      phase.stopAnimation();
    };
  }, [compact, phase, reduced]);

  return (
    <View
      testID="brand-sculpture"
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      style={[styles.scene, { width: size, height: size }]}
    >
      {/* Nested translucent ellipses soften the light without filters or animated shadows. */}
      <View style={styles.atmosphere}>
        {(compact ? glowLayers.slice(0, 3) : glowLayers).map((scale) => (
          <View
            key={scale}
            style={[
              styles.glow,
              {
                width: size * 0.8 * scale,
                height: size * 0.5 * scale,
                borderRadius: size,
              },
            ]}
          />
        ))}
      </View>
      {!compact ? (
        <View
          style={[
            styles.orbit,
            {
              left: size * 0.09,
              top: size * 0.22,
              width: size * 0.82,
              height: size * 0.22,
              borderRadius: size,
              borderColor: 'rgba(255, 92, 92, 0.28)',
              transform: [{ rotate: '-22deg' }],
            },
          ]}
        />
      ) : null}
      <Animated.View
        style={[
          styles.layer,
          {
            transform: still
              ? []
              : [
                  {
                    translateY: phase.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [size * 0.003, -size * 0.003],
                    }),
                  },
                  {
                    rotate: phase.interpolate({
                      inputRange: [-1, 1],
                      outputRange: ['-0.6deg', '0.6deg'],
                    }),
                  },
                  { scale: phase.interpolate({ inputRange: [-1, 1], outputRange: [1, 1.008] }) },
                ],
          },
        ]}
      >
        <Image source={hand} resizeMode="contain" accessible={false} style={styles.layer} />
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute',
          left: size * 0.26,
          top: size * 0.06,
          width: size * 0.48,
          height: size * 0.48,
          transform: still
            ? []
            : [
                { perspective: size * 3 },
                {
                  translateY: phase.interpolate({
                    inputRange: [-1, 1],
                    outputRange: [size * 0.014, -size * 0.014],
                  }),
                },
                {
                  rotateX: phase.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ['-3deg', '3deg'],
                  }),
                },
                {
                  rotateY: phase.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ['-8deg', '8deg'],
                  }),
                },
                {
                  rotateZ: phase.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ['-2deg', '2deg'],
                  }),
                },
              ],
        }}
      >
        <Image source={mark} resizeMode="contain" accessible={false} style={styles.layer} />
      </Animated.View>
      {!compact ? (
        <View
          style={[
            styles.orbit,
            {
              left: size * 0.12,
              top: size * 0.26,
              width: size * 0.76,
              height: size * 0.2,
              borderRadius: size,
              borderColor: 'rgba(67, 126, 255, 0.34)',
              borderTopColor: 'rgba(67, 126, 255, 0.08)',
              transform: [{ rotate: '19deg' }],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { position: 'relative' },
  atmosphere: {
    position: 'absolute',
    left: 0,
    top: '12%',
    width: '100%',
    height: '56%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: { position: 'absolute', backgroundColor: 'rgba(66, 100, 255, 0.018)' },
  orbit: { position: 'absolute', borderWidth: 1 },
  layer: { position: 'absolute', width: '100%', height: '100%' },
});

export default BrandSculpture;
