import { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, View } from 'react-native';
import { Badge, Card, T, s } from './ui';
import { useMotion } from '@/hooks/useMotion';
import { colors, fonts } from '@/constants/theme';
import type { SubjectPerformance, TopicPerformance } from '@/types/insights';

function AccuracyColumn({ item, index }: { item?: TopicPerformance; index: number }) {
  const { reduced } = useMotion();
  const measured = Boolean(item?.metric.answered);
  const rate = measured && item ? (item.metric.correct / item.metric.answered) * 100 : 0;
  const height = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    height.stopAnimation();
    if (reduced) height.setValue(rate);
    else
      Animated.timing(height, {
        toValue: rate,
        duration: 480,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }).start();
    return () => height.stopAnimation();
  }, [height, rate, reduced]);
  return (
    <View
      accessible
      testID={`accuracy-column-${index}`}
      accessibilityLabel={
        item
          ? `${item.topic.name}: ${measured ? `${Math.round(rate)}% de acertos, ${item.metric.correct} acertos em ${item.metric.answered} respostas` : 'ainda sem respostas'}`
          : 'Sem dados de prática'
      }
      style={{ width: 66, alignItems: 'center', gap: 9 }}
    >
      <T
        style={{
          color: measured ? colors.primaryDark : colors.muted,
          fontFamily: fonts.semibold,
          fontSize: 12,
        }}
      >
        {measured ? `${Math.round(rate)}%` : '—'}
      </T>
      <View
        style={{
          width: 34,
          height: 140,
          borderRadius: 10,
          overflow: 'hidden',
          backgroundColor: measured ? colors.redLight : colors.neutral,
        }}
      >
        <Animated.View
          testID={`accuracy-fill-${index}`}
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: height.interpolate({
              inputRange: [0, 100],
              outputRange: [0, 140],
              extrapolate: 'clamp',
            }),
            backgroundColor: colors.primary,
            borderRadius: 8,
          }}
        />
      </View>
      <T
        muted
        numberOfLines={3}
        style={{ fontSize: 10, lineHeight: 14, textAlign: 'center', minHeight: 42 }}
      >
        {item?.topic.name ?? 'Sem prática'}
      </T>
    </View>
  );
}

export function AccuracyChart({
  performance,
  subject,
  simulated,
}: {
  performance: SubjectPerformance;
  subject: string;
  simulated: boolean;
}) {
  return (
    <Card>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <View>
          <Badge label={subject} />
        </View>
        <T style={[s.sectionTitle, { textAlign: 'center' }]}>Seus acertos, em perspectiva</T>
        <View accessibilityLiveRegion="polite" style={{ alignItems: 'center', gap: 4 }}>
          <T
            style={{
              fontSize: 44,
              lineHeight: 52,
              fontFamily: fonts.semibold,
              color: colors.primary,
            }}
          >
            {performance.accuracy === null ? '—' : `${performance.accuracy}%`}
          </T>
          <T muted style={{ fontSize: 12, textAlign: 'center' }}>
            {performance.answered
              ? `${performance.correct} acertos em ${performance.answered} respostas`
              : 'Ainda sem respostas nesta disciplina'}
          </T>
        </View>
      </View>
      <View
        testID="accuracy-chart"
        accessibilityLabel={`Gráfico de acertos de ${subject}: ${performance.accuracy === null ? 'sem respostas' : `${performance.accuracy}%`}`}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            gap: 10,
            paddingTop: 14,
            paddingBottom: 8,
          }}
        >
          {Array.from({ length: performance.topics.length || 4 }, (_, index) => (
            <AccuracyColumn key={index} index={index} item={performance.topics[index]} />
          ))}
        </ScrollView>
      </View>
      <View style={[s.row, { justifyContent: 'center', flexWrap: 'wrap', gap: 16 }]}>
        {[
          { label: `${performance.correct} acertos`, color: colors.primary },
          { label: `${performance.incorrect} erros`, color: colors.redLight },
        ].map((item) => (
          <View key={item.label} style={[s.row, { gap: 6 }]}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: item.color }} />
            <T muted style={{ fontSize: 11 }}>
              {item.label}
            </T>
          </View>
        ))}
      </View>
      <T muted style={{ fontSize: 11, textAlign: 'center', lineHeight: 18 }}>
        {simulated
          ? 'Dados demonstrativos e atividades deste espaço.'
          : 'Resultados das questões respondidas por você.'}{' '}
        Cada coluna mostra um conceito. Deslize para ver todos.
      </T>
    </Card>
  );
}
