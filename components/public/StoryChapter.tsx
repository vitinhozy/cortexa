import { memo, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { T, Icon } from '@/components/ui';
import { ProductDemo } from './ProductDemo';
import { colors, fonts } from '@/constants/theme';
import type { learningStory } from '@/constants/publicExperience';

const brain = require('../../assets/cortexa-brain.png');
const neuron = require('../../assets/cortexa-neuron.png');

/** Layout stays in normal flow; only decorative layers follow scroll progress. */
export const StoryChapter = memo(function StoryChapter({
  chapter,
  index,
  scrollY,
  storyTop,
  minHeight,
  viewportHeight,
  mobile,
  reduced,
}: {
  chapter: (typeof learningStory)[number];
  index: number;
  scrollY: Animated.Value;
  storyTop: number;
  minHeight: number;
  viewportHeight: number;
  mobile: boolean;
  reduced: boolean;
}) {
  const [offset, setOffset] = useState(0);
  const start = storyTop + offset - viewportHeight * 0.8;
  const end = storyTop + offset - viewportHeight * 0.16;
  const progress = (outputRange: number[]) =>
    scrollY.interpolate({ inputRange: [start, end], outputRange, extrapolate: 'clamp' });
  const anatomical = index === 1 || index === 3;
  return (
    <View
      testID={`story-chapter-${index}`}
      onLayout={(event) => setOffset(event.nativeEvent.layout.y)}
      style={{
        minHeight,
        paddingVertical: mobile ? 52 : 80,
        gap: mobile ? 36 : 72,
        flexDirection: mobile ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Animated.View
        style={{
          width: mobile ? '100%' : '43%',
          zIndex: 1,
          opacity: reduced ? 1 : progress([0.3, 1]),
          transform: reduced ? undefined : [{ translateY: progress([24, 0]) }],
        }}
      >
        <T style={[styles.eyebrow, { color: colors.primaryDark }]}>{chapter.label}</T>
        <T
          testID={`chapter-title-${index}`}
          accessibilityRole="header"
          style={[styles.title, { fontSize: mobile ? 32 : 45, lineHeight: mobile ? 40 : 54 }]}
        >
          {chapter.title}
        </T>
        <T testID={`chapter-description-${index}`} style={styles.description}>
          {chapter.description}
        </T>
        <T muted style={styles.detail}>
          {chapter.detail}
        </T>
        {index === 2 ? (
          <View style={styles.note}>
            <Icon name="check-circle" size={15} />
            <T muted style={{ fontSize: 11, lineHeight: 18, flex: 1 }}>
              Acertos e erros contam. Apenas a prática gera evidências.
            </T>
          </View>
        ) : null}
      </Animated.View>
      <View
        style={{
          width: mobile ? '100%' : '50%',
          alignItems: 'center',
          paddingTop: anatomical ? (mobile ? 90 : 72) : 0,
        }}
      >
        {anatomical ? (
          <Animated.View
            pointerEvents="none"
            aria-hidden
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              position: 'absolute',
              top: mobile ? -36 : -92,
              right: mobile ? -12 : -40,
              width: mobile ? 210 : 300,
              height: mobile ? 210 : 300,
              opacity: reduced ? 0.85 : progress([0.2, 0.85]),
              transform: reduced
                ? undefined
                : [
                    { translateY: progress([38, -12]) },
                    {
                      rotate: scrollY.interpolate({
                        inputRange: [start, end],
                        outputRange: ['-9deg', '4deg'],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
            }}
          >
            <Image
              source={index === 1 ? brain : neuron}
              resizeMode="contain"
              style={{ width: '100%', height: '100%' }}
            />
          </Animated.View>
        ) : null}
        <Animated.View
          testID={`chapter-card-${index}`}
          style={{
            width: '100%',
            alignItems: 'center',
            opacity: reduced ? 1 : progress([0.22, 1]),
            transform: reduced
              ? undefined
              : [
                  { translateY: progress([mobile ? 32 : 64, 0]) },
                  { scale: progress([0.96, 1]) },
                  {
                    rotate: scrollY.interpolate({
                      inputRange: [start, end],
                      outputRange: [index % 2 ? '2deg' : '-2deg', '0deg'],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
          }}
        >
          <ProductDemo stage={index} compact />
        </Animated.View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 9,
    lineHeight: 16,
    letterSpacing: 1.3,
    fontFamily: fonts.semibold,
    marginBottom: 16,
  },
  title: { fontFamily: fonts.semibold, letterSpacing: -1.5, marginBottom: 18 },
  description: { fontSize: 16, lineHeight: 27, marginBottom: 12 },
  detail: { fontSize: 13, lineHeight: 23 },
  note: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 20 },
});
