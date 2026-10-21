import { useEffect, useRef, type ComponentProps, type PropsWithChildren } from 'react';
import {
  Pressable,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type ViewStyle,
  type TextStyle,
  type TextInputProps,
  type TextProps,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { colors, fonts, readableAccentText, themeTint } from '@/constants/theme';
import { useStudy } from '@/hooks/useStudy';
import { ScreenMotion, Touch } from './Motion';
import { useMotion } from '@/hooks/useMotion';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import type { Href } from 'expo-router';
import { useLocalSearchParams, usePathname } from 'expo-router';
import { navigationLocation } from '@/constants/navigation';
import { NavigationTrail } from './NavigationTrail';
export type IconName = ComponentProps<typeof Feather>['name'];
export function Icon({
  name,
  size = 20,
  color = colors.primary,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Feather
      name={name}
      size={size}
      color={color}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
export function T({
  children,
  style,
  muted = false,
  ...props
}: PropsWithChildren<
  Omit<TextProps, 'style'> & { style?: TextStyle | TextStyle[]; muted?: boolean }
>) {
  const declaredColor = StyleSheet.flatten(style)?.color;
  const resolvedColor = readableAccentText(
    typeof declaredColor === 'string' ? declaredColor : muted ? colors.muted : colors.ink,
  );
  return (
    <Text {...props} style={[s.text, style, { color: resolvedColor }]}>
      {children}
    </Text>
  );
}
export function Screen({
  children,
  title,
  subtitle,
  back = false,
  backTo,
  onBack,
  scrollResetKey,
  eyebrow,
  action,
  topAction,
  footer,
  overlay,
  contentMaxWidth,
}: PropsWithChildren<{
  title: string;
  subtitle?: string;
  back?: boolean;
  backTo?: Href;
  onBack?: () => void;
  scrollResetKey?: string | number;
  eyebrow?: string;
  action?: React.ReactNode;
  topAction?: React.ReactNode;
  searchable?: boolean;
  footer?: React.ReactNode;
  overlay?: React.ReactNode;
  contentMaxWidth?: number;
}>) {
  const { width } = useWindowDimensions();
  const { mode, repository, data } = useStudy();
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const location = navigationLocation(
    pathname,
    {
      ...params,
      kind: params.kind ?? data.studio?.find((document) => document.id === params.id)?.kind,
    },
    title,
  );
  const insets = useSafeAreaInsets();
  const { goBack } = useAppNavigation();
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    if (scrollResetKey !== undefined) scroll.current?.scrollTo({ y: 0, animated: false });
  }, [scrollResetKey]);
  return (
    <ScreenMotion>
      <SafeAreaView
        testID="screen-root"
        edges={['top', 'left', 'right']}
        style={[s.safe, { backgroundColor: colors.background }]}
      >
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            s.container,
            contentMaxWidth ? { maxWidth: contentMaxWidth } : undefined,
            { paddingHorizontal: width < 600 ? 22 : 40, paddingBottom: 24 + insets.bottom },
          ]}
        >
          <View style={s.topline}>
            {back ? (
              <Touch
                accessibilityRole="button"
                accessibilityLabel="Voltar"
                onPress={() => (onBack ? onBack() : goBack(backTo ?? location.fallback))}
                style={s.back}
              >
                <Icon name="chevron-left" size={25} />
                <T style={{ fontSize: 13 }}>Voltar</T>
              </Touch>
            ) : (
              <NavigationTrail location={location} />
            )}
            <View style={[s.row, { gap: width < 380 ? 3 : 8 }]}>
              {topAction}
              <Badge label={mode === 'demo' ? 'DEMONSTRAÇÃO' : 'PESSOAL · LOCAL'} tone="neutral" />
            </View>
          </View>
          {back ? (
            <View style={{ marginBottom: 14 }}>
              <NavigationTrail location={location} />
            </View>
          ) : null}
          <View
            style={[
              s.row,
              { justifyContent: 'space-between', marginBottom: 24, alignItems: 'flex-start' },
            ]}
          >
            <View style={{ flex: 1 }}>
              {eyebrow ? (
                <T style={[s.eyebrow, { color: themeTint(colors.primary, '#B99AFF') }]}>
                  {eyebrow}
                </T>
              ) : null}
              <T accessibilityRole="header" style={[s.title, { fontSize: width < 390 ? 28 : 32 }]}>
                {title}
              </T>
              {subtitle ? (
                <T muted style={{ marginTop: 8, lineHeight: 23 }}>
                  {subtitle}
                </T>
              ) : null}
            </View>
            {action}
          </View>
          <View style={{ gap: 24 }}>
            {repository.storageError ? (
              <Notice text="Não foi possível acessar o armazenamento local. Alterações podem existir apenas nesta sessão; não feche o app antes de guardar suas anotações." />
            ) : null}
            {children}
          </View>
          <View style={s.footer}>
            <View style={[s.row, { gap: 6 }]}>
              <Icon name="shield" size={13} color={colors.muted} />
              <T muted style={{ fontSize: 11 }}>
                Seu espaço para aprender, um passo de cada vez.
              </T>
            </View>
          </View>
        </ScrollView>
        {footer ? (
          <View
            style={{
              width: '100%',
              maxWidth: 900,
              alignSelf: 'center',
              paddingHorizontal: width < 600 ? 16 : 40,
              paddingTop: 8,
              paddingBottom: 12,
              backgroundColor: colors.background,
            }}
          >
            {footer}
          </View>
        ) : null}
        {overlay}
      </SafeAreaView>
    </ScreenMotion>
  );
}
export function Card({
  children,
  style,
  onPress,
  label,
  testID,
}: PropsWithChildren<{
  style?: ViewStyle;
  onPress?: () => void;
  label?: string;
  testID?: string;
}>) {
  return onPress ? (
    <Touch
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[s.card, { backgroundColor: colors.surface, borderColor: colors.line }, style]}
    >
      {children}
    </Touch>
  ) : (
    <View
      testID={testID}
      style={[s.card, { backgroundColor: colors.surface, borderColor: colors.line }, style]}
    >
      {children}
    </View>
  );
}
export function Button({
  title,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  small = false,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'ghost' | 'light';
  disabled?: boolean;
  small?: boolean;
}) {
  const color = variant === 'primary' ? 'white' : colors.primaryDark;
  return (
    <Touch
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        s.button,
        {
          backgroundColor:
            variant === 'primary'
              ? colors.primary
              : variant === 'secondary'
                ? colors.lavender
                : variant === 'light'
                  ? colors.lime
                  : 'transparent',
          minHeight: small ? 44 : 50,
        },
      ]}
    >
      {icon ? <Icon name={icon} size={17} color={color} /> : null}
      <T
        style={{
          fontFamily: fonts.semibold,
          fontSize: small ? 13 : 14,
          color,
          flexShrink: 1,
          textAlign: 'center',
        }}
      >
        {title}
      </T>
    </Touch>
  );
}
export function Badge({
  label,
  tone = 'purple',
}: {
  label: string;
  tone?: 'green' | 'purple' | 'amber' | 'red' | 'neutral' | 'blue';
}) {
  const bg = {
    purple: colors.lavender,
    green: colors.mint,
    amber: colors.amberLight,
    red: colors.redLight,
    neutral: colors.neutral,
    blue: colors.blueLight,
  }[tone];
  const fg = {
    purple: colors.primaryDark,
    green: colors.teal,
    amber: colors.amber,
    red: colors.red,
    neutral: colors.muted,
    blue: colors.blue,
  }[tone];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 7,
        backgroundColor: bg,
      }}
    >
      <T style={{ color: fg, fontSize: 10, fontFamily: fonts.semibold, letterSpacing: 0.4 }}>
        {label}
      </T>
    </View>
  );
}
export function Section({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }]}>
      <T style={s.sectionTitle}>{title}</T>
      {action && onPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <T style={{ color: colors.primary, fontFamily: fonts.medium, fontSize: 12 }}>
            {action} →
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}
export function Progress({
  value,
  color = colors.primary,
  height = 6,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  const { reduced } = useMotion();
  const safeValue = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  const animated = useRef(new Animated.Value(safeValue)).current;
  useEffect(() => {
    animated.stopAnimation();
    if (reduced) animated.setValue(safeValue);
    else
      Animated.timing(animated, {
        toValue: safeValue,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    return () => animated.stopAnimation();
  }, [animated, safeValue, reduced]);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(safeValue) }}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safeValue)}
      style={{ height, borderRadius: 9, backgroundColor: colors.neutral, overflow: 'hidden' }}
    >
      <Animated.View
        style={{
          height,
          width: animated.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          borderRadius: 9,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
export function Field(props: TextInputProps & { label: string }) {
  const { label, ...rest } = props;
  return (
    <View style={{ gap: 8 }}>
      <T style={{ fontSize: 12, fontFamily: fonts.semibold }}>{label}</T>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...rest}
        style={[
          s.input,
          { backgroundColor: colors.surface, borderColor: colors.line, color: colors.ink },
          rest.multiline && { minHeight: 120, textAlignVertical: 'top' },
          rest.style,
        ]}
      />
    </View>
  );
}
export function Empty({
  title,
  message,
  icon = 'inbox',
}: {
  title: string;
  message: string;
  icon?: IconName;
}) {
  return (
    <Card style={{ alignItems: 'center', gap: 12, paddingVertical: 40 }}>
      <Icon name={icon} size={30} />
      <T style={s.sectionTitle}>{title}</T>
      <T muted style={{ textAlign: 'center', lineHeight: 23 }}>
        {message}
      </T>
    </Card>
  );
}
export function Notice({ text }: { text: string }) {
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        s.row,
        {
          backgroundColor: colors.lavender,
          borderRadius: 16,
          padding: 14,
          alignItems: 'flex-start',
        },
      ]}
    >
      <Icon name="info" size={16} />
      <T style={{ flex: 1, fontSize: 12, lineHeight: 19 }}>{text}</T>
    </View>
  );
}
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },
  text: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink, lineHeight: 21 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  brand: { fontFamily: fonts.bold, fontSize: 23, letterSpacing: -1, lineHeight: 30 },
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: { flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 44 },
  title: { fontFamily: fonts.semibold, letterSpacing: -1.2, lineHeight: 40 },
  eyebrow: {
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 1.7,
    fontFamily: fonts.semibold,
    marginBottom: 8,
  },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24, letterSpacing: -0.4 },
  card: {
    backgroundColor: colors.surface,
    padding: 22,
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.line,
    gap: 14,
  },
  button: {
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 14,
    minHeight: 48,
  },
  footer: { marginTop: 35, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  divider: { height: 1, backgroundColor: colors.line },
});
