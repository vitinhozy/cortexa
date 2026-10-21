import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  type PressableProps,
  type ViewStyle,
  type StyleProp,
  View,
} from 'react-native';
import { useMotion } from '@/hooks/useMotion';
import { motion } from '@/constants/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export function Touch({
  children,
  style,
  onPress,
  disabled,
  disabledOpacity = 0.45,
  ...props
}: PropsWithChildren<
  Omit<PressableProps, 'style' | 'children'> & {
    style?: StyleProp<ViewStyle>;
    disabledOpacity?: number;
  }
>) {
  const { reduced, tap } = useMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);
  useEffect(() => () => scale.stopAnimation(), [scale]);
  function animate(value: number) {
    scale.stopAnimation();
    if (reduced) {
      scale.setValue(1);
      return;
    }
    Animated.spring(scale, { toValue: value, ...motion.spring, useNativeDriver: true }).start();
  }
  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPress={(event) => {
        tap();
        onPress?.(event);
      }}
      onPressIn={(event) => {
        setPressed(true);
        animate(motion.pressScale);
        props.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        animate(1);
        props.onPressOut?.(event);
      }}
      style={[
        style,
        { opacity: disabled ? disabledOpacity : pressed ? 0.8 : 1, transform: [{ scale }] },
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function ScreenMotion({ children }: PropsWithChildren) {
  return <>{children}</>;
}

export function AnimatedDisclosure({
  expanded,
  children,
}: PropsWithChildren<{ expanded: boolean }>) {
  const { reduced } = useMotion();
  const height = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const [present, setPresent] = useState(expanded);

  useEffect(() => {
    if (expanded) setPresent(true);
    height.stopAnimation();
    opacity.stopAnimation();
    if (reduced) {
      height.setValue(expanded ? measuredHeight : 0);
      opacity.setValue(expanded ? 1 : 0);
      if (!expanded) setPresent(false);
      return;
    }
    const transition = Animated.parallel([
      Animated.timing(height, {
        toValue: expanded ? measuredHeight : 0,
        duration: expanded ? motion.enter : motion.exit,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: expanded ? 1 : 0,
        duration: expanded ? motion.enter : motion.quick,
        useNativeDriver: true,
      }),
    ]);
    transition.start(({ finished }) => {
      if (finished && !expanded) setPresent(false);
    });
    return () => transition.stop();
  }, [expanded, measuredHeight, reduced, height, opacity]);

  if (!present && !expanded) return null;
  return (
    <Animated.View
      pointerEvents={expanded ? 'auto' : 'none'}
      accessibilityElementsHidden={!expanded}
      importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
      aria-hidden={!expanded}
      style={{ height, overflow: 'hidden' }}
    >
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, opacity }}>
        <View onLayout={(event) => setMeasuredHeight(event.nativeEvent.layout.height)}>
          {children}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export function Reveal({
  children,
  style,
  variant = 'soft',
}: PropsWithChildren<{ style?: StyleProp<ViewStyle>; variant?: 'soft' | 'inflate' }>) {
  const { reduced } = useMotion();
  const progress = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const animation =
      variant === 'inflate'
        ? Animated.spring(progress, { toValue: 1, ...motion.inflate, useNativeDriver: true })
        : Animated.timing(progress, {
            toValue: 1,
            duration: motion.enter,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          });
    animation.start();
    return () => progress.stopAnimation();
  }, [progress, reduced, variant]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
            extrapolate: 'clamp',
          }),
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
            {
              scaleX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [variant === 'inflate' ? 0.88 : 1, 1],
              }),
            },
            {
              scaleY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [variant === 'inflate' ? 0.8 : 1, 1],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
