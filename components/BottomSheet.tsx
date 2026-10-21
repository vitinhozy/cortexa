import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  findNodeHandle,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMotion } from '@/hooks/useMotion';
import { useStudy } from '@/hooks/useStudy';
import { motion } from '@/constants/motion';
import { colors } from '@/constants/theme';
import { Icon, T, s } from './ui';
import { Touch } from './Motion';

export function BottomSheet({
  visible,
  onClose,
  onDismiss,
  onBack,
  backLabel = 'Voltar para etapa anterior',
  title,
  size = 'default',
  children,
}: PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  onBack?: () => void;
  backLabel?: string;
  title: string;
  size?: 'default' | 'large';
}>) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { reduced } = useMotion();
  const { transitioning } = useStudy();
  const [present, setPresent] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  const heading = useRef<View>(null);
  const wasVisible = useRef(visible);
  const dismissRef = useRef(onDismiss);
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);
  useEffect(() => {
    progress.stopAnimation();
    if (visible) {
      wasVisible.current = true;
      drag.stopAnimation();
      drag.setValue(0);
      setPresent(true);
    }
    if (reduced) {
      progress.setValue(visible ? 1 : 0);
      if (!visible) {
        setPresent(false);
        if (wasVisible.current) dismissRef.current?.();
        wasVisible.current = false;
      }
      return;
    }
    const transition = visible
      ? Animated.spring(progress, { toValue: 1, ...motion.inflate, useNativeDriver: true })
      : Animated.timing(progress, {
          toValue: visible ? 1 : 0,
          duration: visible ? motion.enter : motion.exit,
          easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
          useNativeDriver: true,
        });
    transition.start(({ finished }) => {
      if (finished && !visible) {
        setPresent(false);
        if (wasVisible.current) dismissRef.current?.();
        wasVisible.current = false;
      }
    });
    return () => progress.stopAnimation();
  }, [visible, reduced, progress, drag]);
  const gesture = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, state) =>
          state.dy > 6 && Math.abs(state.dy) > Math.abs(state.dx),
        onPanResponderMove: (_, state) => drag.setValue(Math.max(0, state.dy)),
        onPanResponderRelease: (_, state) => {
          if (state.dy > 85 || state.vy > 0.9) onClose();
          else if (reduced) drag.setValue(0);
          else
            Animated.spring(drag, { toValue: 0, ...motion.spring, useNativeDriver: true }).start();
        },
        onPanResponderTerminate: () => drag.setValue(0),
      }),
    [drag, onClose, reduced],
  );
  // Modals live outside the hidden workspace view; close immediately on identity changes.
  if (!present || transitioning) return null;
  return (
    <Modal
      accessibilityLabel={title}
      transparent
      visible
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      onShow={() => {
        if (Platform.OS !== 'web') {
          const target = findNodeHandle(heading.current);
          if (target) AccessibilityInfo.setAccessibilityFocus(target);
        }
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          flex: 1,
          justifyContent: width >= 900 ? 'center' : 'flex-end',
          paddingHorizontal: width >= 700 ? 24 : 0,
        }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: '#302141',
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.24],
              extrapolate: 'clamp',
            }),
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar painel"
            onPress={onClose}
            style={{ flex: 1 }}
          />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          role={Platform.OS === 'web' ? undefined : 'dialog'}
          accessibilityLabel={title}
          style={{
            width: '100%',
            maxWidth: size === 'large' ? 1000 : 600,
            maxHeight: height * (size === 'large' ? 0.94 : 0.88),
            alignSelf: 'center',
            backgroundColor: colors.background,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            borderBottomLeftRadius: size === 'large' || width >= 900 ? 30 : 0,
            borderBottomRightRadius: size === 'large' || width >= 900 ? 30 : 0,
            borderCurve: 'continuous',
            overflow: 'hidden',
            paddingBottom: Math.max(20, insets.bottom),
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.96, 1],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                translateY: Animated.add(
                  drag,
                  progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width >= 900 ? 14 : 28, 0],
                    extrapolate: 'clamp',
                  }),
                ),
              },
              { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) },
            ],
          }}
        >
          <View
            {...gesture.panHandlers}
            style={{ paddingTop: 12, paddingHorizontal: 24, paddingBottom: 16 }}
          >
            <View
              accessible={false}
              style={{
                width: 36,
                height: 5,
                borderRadius: 3,
                backgroundColor: colors.lavenderLine,
                alignSelf: 'center',
                marginBottom: 17,
              }}
            />
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <View
                ref={heading}
                accessible
                accessibilityRole="header"
                accessibilityLabel={title}
                style={{ flex: 1 }}
              >
                <T style={s.sectionTitle}>{title}</T>
              </View>
              <View style={[s.row, { gap: 6 }]}>
                {onBack ? (
                  <Touch
                    accessibilityRole="button"
                    accessibilityLabel={backLabel}
                    onPress={onBack}
                    style={{
                      height: 44,
                      paddingHorizontal: 10,
                      borderRadius: 22,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3,
                    }}
                  >
                    <Icon name="chevron-left" size={20} color={colors.primary} />
                    <T style={{ fontSize: 12, color: colors.primary }}>Voltar</T>
                  </Touch>
                ) : null}
                <Touch
                  accessibilityRole="button"
                  accessibilityLabel={`Fechar ${title}`}
                  onPress={onClose}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.neutral,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="x" size={18} color={colors.muted} />
                </Touch>
              </View>
            </View>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16, gap: 20 }}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
