import type { ComponentProps, PropsWithChildren } from 'react';
import {
  Pressable,
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
import { router } from 'expo-router';
import { colors, fonts } from '@/constants/theme';
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
  return (
    <Text {...props} style={[s.text, muted && { color: colors.muted }, style]}>
      {children}
    </Text>
  );
}
export function Screen({
  children,
  title,
  subtitle,
  back = false,
  eyebrow,
  action,
}: PropsWithChildren<{
  title: string;
  subtitle?: string;
  back?: boolean;
  eyebrow?: string;
  action?: React.ReactNode;
}>) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={s.safe}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          s.container,
          { paddingHorizontal: width < 600 ? 22 : 40, paddingBottom: 24 + insets.bottom },
        ]}
      >
        <View style={s.topline}>
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              style={s.back}
            >
              <Icon name="arrow-left" />
              <T style={{ fontSize: 13 }}>Voltar</T>
            </Pressable>
          ) : (
            <View style={s.row}>
              <View style={s.brandIcon}>
                <Icon name="activity" color="white" size={17} />
              </View>
              <T style={s.brand}>
                cortexa<T style={{ color: colors.primary }}>.</T>
              </T>
            </View>
          )}
          <Badge label="DEMONSTRAÇÃO" tone="neutral" />
        </View>
        <View
          style={[
            s.row,
            { justifyContent: 'space-between', marginBottom: 24, alignItems: 'flex-start' },
          ]}
        >
          <View style={{ flex: 1 }}>
            {eyebrow ? <T style={s.eyebrow}>{eyebrow}</T> : null}
            <T style={[s.title, { fontSize: width < 390 ? 28 : 32 }]}>{title}</T>
            {subtitle ? (
              <T muted style={{ marginTop: 8, lineHeight: 23 }}>
                {subtitle}
              </T>
            ) : null}
          </View>
          {action}
        </View>
        <View style={{ gap: 24 }}>{children}</View>
        <View style={s.footer}>
          <View style={[s.row, { gap: 6 }]}>
            <Icon name="shield" size={13} color={colors.muted} />
            <T muted style={{ fontSize: 11 }}>
              Seu espaço para aprender, um passo de cada vez.
            </T>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
export function Card({
  children,
  style,
  onPress,
  label,
}: PropsWithChildren<{ style?: ViewStyle; onPress?: () => void; label?: string }>) {
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        s.card,
        style,
        pressed && { opacity: 0.8, transform: [{ scale: 0.995 }] },
      ]}
    >
      {children}
    </Pressable>
  ) : (
    <View style={[s.card, style]}>{children}</View>
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        {
          backgroundColor:
            variant === 'primary'
              ? colors.primary
              : variant === 'secondary'
                ? colors.mint
                : variant === 'light'
                  ? colors.lime
                  : 'transparent',
          minHeight: small ? 44 : 50,
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
        },
      ]}
    >
      {icon ? <Icon name={icon} size={17} color={color} /> : null}
      <T style={{ fontFamily: fonts.semibold, fontSize: small ? 13 : 14, color }}>{title}</T>
    </Pressable>
  );
}
export function Badge({
  label,
  tone = 'green',
}: {
  label: string;
  tone?: 'green' | 'amber' | 'red' | 'neutral' | 'blue';
}) {
  const bg = {
    green: colors.mint,
    amber: colors.amberLight,
    red: colors.redLight,
    neutral: '#EDF0EF',
    blue: colors.blueLight,
  }[tone];
  const fg = {
    green: colors.primary,
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
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value) }}
      style={{ height, borderRadius: 9, backgroundColor: '#EDF1EF', overflow: 'hidden' }}
    >
      <View
        style={{
          height,
          width: `${Math.min(100, Math.max(0, value))}%`,
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
        { backgroundColor: colors.mint, borderRadius: 12, padding: 14, alignItems: 'flex-start' },
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 14,
  },
  button: {
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  input: {
    backgroundColor: 'white',
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
