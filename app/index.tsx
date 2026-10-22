import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandLogo } from '@/components/BrandLogo';
import { ProductDemo } from '@/components/public/ProductDemo';
import { NeuralPath } from '@/components/public/NeuralPath';
import { StoryChapter } from '@/components/public/StoryChapter';
import { Reveal, Touch } from '@/components/Motion';
import { Button, Icon, T } from '@/components/ui';
import { learningStory } from '@/constants/publicExperience';
import { colors, fonts } from '@/constants/theme';
import { useMotion } from '@/hooks/useMotion';

const chapterStepHeight = (height: number, mobile: boolean) =>
  mobile ? Math.max(740, Math.min(800, height * 0.86)) : Math.max(520, Math.min(690, height * 0.8));

export default function PublicLanding() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { reduced } = useMotion();
  const isMobile = width < 900;
  const denseMobile = width < 470;
  const stepHeight = chapterStepHeight(height, isMobile);
  const scroll = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [storyTop, setStoryTop] = useState(0);
  const [pageHeight, setPageHeight] = useState(height * 5.5);

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: Platform.OS !== 'web',
      }),
    [scrollY],
  );

  const updateStoryTop = useCallback(
    (event: { nativeEvent: { layout: { y: number; height: number } } }) => {
      setStoryTop(event.nativeEvent.layout.y);
    },
    [],
  );

  const openAccount = useCallback((mode: 'login' | 'signup' = 'login') => {
    router.push({ pathname: '/account', params: mode === 'signup' ? { mode: 'signup' } : {} });
  }, []);
  const scrollToStory = useCallback(() => {
    scroll.current?.scrollTo({
      y: Math.max(0, storyTop - (isMobile ? 150 : 130)),
      animated: !reduced,
    });
  }, [isMobile, reduced, storyTop]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { maxWidth: 1320, paddingHorizontal: width < 600 ? 22 : 42 }]}>
        <Touch
          accessibilityRole="link"
          accessibilityLabel="Cortexa, início"
          onPress={() => scroll.current?.scrollTo({ y: 0, animated: !reduced })}
          style={{ minHeight: 46, justifyContent: 'center' }}
        >
          <BrandLogo size={31} />
        </Touch>
        {!isMobile ? (
          <View style={styles.headerLinks}>
            <Touch accessibilityRole="button" onPress={scrollToStory} style={styles.navLink}>
              <T style={styles.navText}>Como funciona</T>
            </Touch>
          </View>
        ) : null}
        <View style={styles.headerActions}>
          <Touch
            accessibilityRole="button"
            onPress={() => openAccount('login')}
            style={styles.navLink}
          >
            <T style={[styles.navText, { color: colors.primaryDark }]}>Entrar</T>
          </Touch>
          <Button title="Começar" onPress={() => openAccount('signup')} small />
        </View>
      </View>
      <View pointerEvents="none" style={{ height: 1, backgroundColor: colors.line }} />

      <Animated.ScrollView
        ref={scroll}
        testID="public-landing"
        accessibilityLabel="Página pública do Cortexa"
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View
          onLayout={(event) =>
            setPageHeight(Math.max(height * 5.5, event.nativeEvent.layout.height))
          }
          style={[styles.page, { maxWidth: 1360 }]}
        >
          <NeuralPath
            width={width < 1360 ? width : 1360}
            height={pageHeight}
            scrollY={scrollY}
            reduced={reduced}
            compact={isMobile}
            viewportHeight={height}
          />

          <View
            style={[
              styles.hero,
              {
                minHeight: isMobile ? undefined : Math.max(710, height - 90),
                paddingHorizontal: width < 600 ? 24 : 54,
                paddingVertical: isMobile ? 52 : 44,
                gap: isMobile ? 35 : 48,
                flexDirection: isMobile ? 'column' : 'row',
              },
            ]}
          >
            <Reveal
              style={{
                flex: isMobile ? undefined : 0.94,
                width: isMobile ? '100%' : undefined,
                zIndex: 1,
              }}
            >
              <T style={styles.heroEyebrow}>FEITO PARA QUEM ESTUDA MEDICINA</T>
              <T
                accessibilityRole="header"
                style={[
                  styles.heroTitle,
                  {
                    fontSize: denseMobile ? 44 : isMobile ? 54 : width < 1100 ? 59 : 70,
                    lineHeight: denseMobile ? 51 : isMobile ? 62 : width < 1100 ? 68 : 78,
                  },
                ]}
              >
                Aprenda Medicina.{'\n'}
                <Text style={{ color: colors.primaryDark }}>Conecte o que importa.</Text>
              </T>
              <T
                muted
                style={[styles.heroDescription, { fontSize: denseMobile ? 15 : 16, maxWidth: 510 }]}
              >
                Organize o que você estuda, pratique com intenção e descubra o que revisar. Seu
                próximo passo começa no seu próprio percurso.
              </T>
              <View
                style={[
                  styles.heroActions,
                  {
                    flexDirection: denseMobile ? 'column' : 'row',
                    alignItems: denseMobile ? 'stretch' : 'center',
                  },
                ]}
              >
                <Button
                  title="Começar no Cortexa"
                  icon="arrow-right"
                  onPress={() => openAccount('signup')}
                />
                <Touch
                  accessibilityRole="button"
                  onPress={scrollToStory}
                  style={styles.secondaryAction}
                >
                  <T
                    style={{ color: colors.primaryDark, fontFamily: fonts.semibold, fontSize: 13 }}
                  >
                    Conhecer o Cortexa
                  </T>
                  <Icon name="arrow-down" size={15} />
                </Touch>
              </View>
              <View style={[styles.inline, { gap: 8, marginTop: 27 }]}>
                <Icon name="shield" size={14} color={colors.muted} />
                <T muted style={{ fontSize: 11, flex: 1 }}>
                  Um espaço de estudo pessoal, separado por conta neste dispositivo.
                </T>
              </View>
            </Reveal>

            <View
              style={{
                flex: isMobile ? undefined : 1.06,
                width: isMobile ? '100%' : undefined,
                minHeight: isMobile ? 370 : 450,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              <LinearGradient
                pointerEvents="none"
                colors={[colors.heroStart, colors.heroEnd]}
                style={[
                  styles.heroAura,
                  { width: isMobile ? width * 0.78 : '95%', height: isMobile ? 300 : 410 },
                ]}
              />
              <Animated.View
                style={{
                  width: '100%',
                  alignItems: 'center',
                  transform: [
                    {
                      translateY: scrollY.interpolate({
                        inputRange: [0, isMobile ? 500 : 780],
                        outputRange: [0, reduced ? 0 : -34],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                  opacity: scrollY.interpolate({
                    inputRange: [0, isMobile ? 500 : 820, isMobile ? 760 : 1080],
                    outputRange: [1, 1, 0.2],
                    extrapolate: 'clamp',
                  }),
                }}
              >
                <ProductDemo />
              </Animated.View>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              paddingHorizontal: width < 600 ? 24 : 54,
              marginTop: 8,
              zIndex: 1,
            }}
          >
            <View style={{ maxWidth: 565, marginBottom: 20 }}>
              <T style={styles.sectionEyebrow}>UM PERCURSO, PASSO A PASSO</T>
              <T
                accessibilityRole="header"
                style={[
                  styles.sectionHeading,
                  { fontSize: denseMobile ? 30 : 38, lineHeight: denseMobile ? 38 : 46 },
                ]}
              >
                Conhecimento que encontra conexão.
              </T>
            </View>
          </View>

          <View
            onLayout={updateStoryTop}
            style={[
              styles.story,
              {
                paddingHorizontal: width < 600 ? 24 : 54,
                minHeight: stepHeight * learningStory.length,
                paddingBottom: 48,
              },
            ]}
          >
            {learningStory.map((chapter, index) => (
              <StoryChapter
                key={chapter.label}
                chapter={chapter}
                index={index}
                scrollY={scrollY}
                storyTop={storyTop}
                minHeight={stepHeight}
                viewportHeight={height}
                mobile={isMobile}
                reduced={reduced}
              />
            ))}
          </View>

          <View
            style={[
              styles.closing,
              {
                backgroundColor: colors.surface,
                borderColor: colors.line,
                marginHorizontal: width < 600 ? 22 : 54,
                padding: width < 600 ? 27 : 48,
                flexDirection: width < 760 ? 'column' : 'row',
                alignItems: width < 760 ? 'flex-start' : 'center',
              },
            ]}
          >
            <View style={{ flex: 1, gap: 12 }}>
              <T style={styles.sectionEyebrow}>SEU PRÓXIMO CAPÍTULO</T>
              <T
                accessibilityRole="header"
                style={[
                  styles.closingTitle,
                  { fontSize: denseMobile ? 30 : 38, lineHeight: denseMobile ? 38 : 46 },
                ]}
              >
                Pronto para transformar sua forma de estudar Medicina?
              </T>
              <T muted style={{ fontSize: 14, lineHeight: 23, maxWidth: 470 }}>
                Comece pelo que você já sabe. O próximo passo fica mais claro a cada prática.
              </T>
            </View>
            <Button
              title="Criar minha conta"
              icon="arrow-right"
              onPress={() => openAccount('signup')}
            />
          </View>

          <View
            style={[
              styles.footer,
              {
                paddingHorizontal: width < 600 ? 24 : 54,
                paddingBottom: Math.max(insets.bottom, 18),
              },
            ]}
          >
            <BrandLogo size={25} />
            <T muted style={{ fontSize: 10, textAlign: 'right', flex: 1 }}>
              Um espaço de estudo feito para a Medicina.
            </T>
            <Touch
              accessibilityRole="button"
              onPress={() => openAccount('login')}
              style={styles.footerLink}
            >
              <T style={{ color: colors.primaryDark, fontSize: 11, fontFamily: fonts.medium }}>
                Entrar
              </T>
            </Touch>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    width: '100%',
    minHeight: 68,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLinks: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  navLink: { minHeight: 44, paddingHorizontal: 5, justifyContent: 'center' },
  navText: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium },
  page: { width: '100%', alignSelf: 'center', position: 'relative', overflow: 'hidden' },
  hero: { width: '100%', alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  heroEyebrow: {
    color: colors.primaryDark,
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 1.6,
    fontFamily: fonts.semibold,
    marginBottom: 20,
  },
  heroTitle: { fontFamily: fonts.semibold, letterSpacing: -3.5, marginBottom: 20 },
  heroDescription: { lineHeight: 26 },
  heroActions: { gap: 13, marginTop: 28, flexWrap: 'wrap' },
  secondaryAction: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
    gap: 8,
    borderRadius: 14,
  },
  inline: { flexDirection: 'row', alignItems: 'center' },
  heroAura: { position: 'absolute', borderRadius: 600, opacity: 0.56 },
  story: { width: '100%', position: 'relative' },
  sectionEyebrow: {
    color: colors.primaryDark,
    letterSpacing: 1.3,
    fontFamily: fonts.semibold,
    fontSize: 9,
    lineHeight: 16,
    marginBottom: 14,
  },
  sectionHeading: { fontFamily: fonts.semibold, letterSpacing: -1.8 },
  closing: {
    gap: 27,
    borderWidth: 1,
    borderRadius: 27,
    marginTop: 26,
  },
  closingTitle: { fontFamily: fonts.semibold, letterSpacing: -1.8 },
  footer: {
    width: '100%',
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginTop: 20,
  },
  footerLink: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 9 },
});
