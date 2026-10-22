import { useEffect, useRef, type PropsWithChildren, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BrandLogo } from '@/components/BrandLogo';
import { Reveal, Touch } from '@/components/Motion';
import { Icon, T } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { BrandSculpture } from './BrandSculpture';

/** Public authentication shell: deliberately independent of the study workspace's Screen. */
export function AuthLayout({
  children,
  title,
  subtitle,
  scrollResetKey,
  overlay,
}: PropsWithChildren<{
  title: string;
  subtitle?: string;
  scrollResetKey?: string;
  overlay?: ReactNode;
}>) {
  const { width } = useWindowDimensions();
  const desktop = width >= 960;
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [scrollResetKey]);

  return (
    <SafeAreaView
      testID="auth-layout"
      edges={['top', 'bottom', 'left', 'right']}
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.safe}
      >
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[styles.container, { paddingHorizontal: width < 600 ? 22 : 48 }]}
        >
          <View style={styles.header}>
            <Touch
              accessibilityRole="link"
              accessibilityLabel="Cortexa, voltar ao início"
              onPress={() => router.replace('/')}
              style={styles.headerLink}
            >
              <BrandLogo size={32} />
            </Touch>
            <Touch
              accessibilityRole="link"
              accessibilityLabel="Voltar ao início"
              onPress={() => router.replace('/')}
              style={styles.headerLink}
            >
              <Icon name="arrow-left" size={16} color={colors.muted} />
              <T muted style={styles.backLabel}>
                Voltar ao início
              </T>
            </Touch>
          </View>

          <View
            style={[
              styles.main,
              {
                flexDirection: desktop ? 'row' : 'column',
                gap: desktop ? 64 : 0,
                paddingTop: desktop ? 32 : 24,
                paddingBottom: desktop ? 64 : 40,
              },
            ]}
          >
            {desktop ? (
              <Reveal style={styles.visual}>
                <BrandSculpture size={Math.min(470, (width - 180) * 0.49)} />
                <View style={styles.visualCopy}>
                  <T style={[styles.eyebrow, { color: colors.primaryDark }]}>
                    SEU ESTUDO, CONECTADO.
                  </T>
                  <T style={styles.visualTitle}>Conhecimento que acompanha você.</T>
                  <T muted style={styles.visualDescription}>
                    Um espaço para estudar Medicina, conectar conceitos e seguir no seu ritmo.
                  </T>
                </View>
              </Reveal>
            ) : null}

            <View style={[styles.formColumn, { flex: desktop ? 1 : undefined }]}>
              <Reveal key={scrollResetKey} style={styles.form}>
                <View style={styles.formHeading}>
                  <T accessibilityRole="header" style={styles.title}>
                    {title}
                  </T>
                  {subtitle ? (
                    <T muted style={styles.subtitle}>
                      {subtitle}
                    </T>
                  ) : null}
                </View>
                {children}
              </Reveal>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {overlay}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flexGrow: 1, width: '100%', maxWidth: 1280, alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 18,
    paddingBottom: 18,
  },
  headerLink: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  backLabel: { fontFamily: fonts.medium, fontSize: 12 },
  main: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  visual: { flex: 1.1, alignItems: 'center', gap: 22 },
  visualCopy: { width: '100%', maxWidth: 440, gap: 14 },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 1.8 },
  visualTitle: { fontFamily: fonts.semibold, fontSize: 38, lineHeight: 46, letterSpacing: -1.5 },
  visualDescription: { maxWidth: 370, fontSize: 15, lineHeight: 25 },
  formColumn: { width: '100%', maxWidth: 420, justifyContent: 'center' },
  form: { width: '100%', gap: 24 },
  formHeading: { gap: 10 },
  title: { fontFamily: fonts.semibold, fontSize: 30, lineHeight: 38, letterSpacing: -1 },
  subtitle: { fontSize: 14, lineHeight: 23 },
});

export default AuthLayout;
