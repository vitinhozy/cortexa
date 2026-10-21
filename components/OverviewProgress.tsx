import { View } from 'react-native';
import { colors, fonts } from '@/constants/theme';
import { Card, Icon, T, type IconName } from './ui';

export type OverviewMetric = {
  icon: IconName;
  value: string;
  label: string;
  fill: string;
  ink: string;
};

export function OverviewProgress({ metrics }: { metrics: OverviewMetric[] }) {
  return (
    <View style={{ gap: 10 }}>
      <T style={{ fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 }}>Seu progresso</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {metrics.map((metric, index) => (
          <Card
            key={metric.label}
            testID={`overview-stat-${index}`}
            style={{
              flexBasis: '46%',
              flexGrow: 1,
              minWidth: 106,
              padding: 12,
              gap: 5,
              backgroundColor: metric.fill,
              borderColor: metric.fill,
            }}
          >
            <Icon name={metric.icon} size={15} color={metric.ink} />
            <T
              style={{
                fontSize: 19,
                lineHeight: 24,
                color: metric.ink,
                fontFamily: fonts.semibold,
              }}
            >
              {metric.value}
            </T>
            <T muted numberOfLines={2} style={{ fontSize: 10, lineHeight: 14 }}>
              {metric.label}
            </T>
          </Card>
        ))}
      </View>
    </View>
  );
}

export function demoOverviewMetrics(data: {
  user: { streak: number; minutes: number; answered: number; correct: number };
}): OverviewMetric[] {
  return [
    {
      icon: 'sun',
      value: `${data.user.streak} dias`,
      label: 'de constância',
      fill: colors.amberLight,
      ink: colors.amber,
    },
    {
      icon: 'clock',
      value: `${data.user.minutes}`,
      label: 'minutos estudados',
      fill: colors.lavender,
      ink: colors.primary,
    },
    {
      icon: 'check-square',
      value: `${data.user.answered}`,
      label: 'questões respondidas',
      fill: colors.blueLight,
      ink: colors.blue,
    },
    {
      icon: 'target',
      value: `${Math.round((data.user.correct / Math.max(1, data.user.answered)) * 100)}%`,
      label: 'de acertos',
      fill: colors.rose,
      ink: colors.pink,
    },
  ];
}

export function personalOverviewMetrics(data: {
  user: { streak: number; minutes: number };
  attempts: { correct: boolean }[];
}): OverviewMetric[] {
  const answered = data.attempts.length;
  const correct = data.attempts.filter((attempt) => attempt.correct).length;
  return [
    {
      icon: 'sun',
      value: `${data.user.streak} dias`,
      label: 'de constância',
      fill: colors.amberLight,
      ink: colors.amber,
    },
    {
      icon: 'clock',
      value: `${data.user.minutes}`,
      label: 'minutos estudados',
      fill: colors.lavender,
      ink: colors.primary,
    },
    {
      icon: 'check-square',
      value: `${answered}`,
      label: 'questões respondidas',
      fill: colors.blueLight,
      ink: colors.blue,
    },
    {
      icon: 'target',
      value: answered ? `${Math.round((correct / answered) * 100)}%` : '—',
      label: 'de acertos',
      fill: colors.rose,
      ink: colors.pink,
    },
  ];
}
