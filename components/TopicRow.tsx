import { View } from 'react-native';
import { router } from 'expo-router';
import { Card, T, Progress, Icon, s } from './ui';
import { colors, fonts } from '@/constants/theme';
import { masteryLabel } from '@/features/study/engine';
import type { KnowledgeMetric, Topic } from '@/types/domain';
export function masteryColor(value: number) {
  return value < 50 ? colors.red : value < 75 ? colors.amber : colors.primary;
}
export function TopicRow({
  topic,
  metric,
  compact = false,
  onPress,
}: {
  topic: Topic;
  metric: KnowledgeMetric;
  compact?: boolean;
  onPress?: () => void;
}) {
  const color = masteryColor(metric.mastery);
  const measured = metric.answered > 0;
  return (
    <Card
      onPress={
        onPress ?? (() => router.push({ pathname: '/topic/[id]', params: { id: topic.id } }))
      }
      label={`${topic.name}, ${measured ? `${metric.mastery}%` : 'ainda sem prática'}`}
      style={{ padding: compact ? 16 : 21 }}
    >
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <View style={{ flex: 1, gap: 4 }}>
          <T style={{ fontFamily: fonts.medium, fontSize: compact ? 13 : 15 }}>{topic.name}</T>
          {!compact ? (
            <T muted style={{ fontSize: 11 }}>
              {measured ? masteryLabel(metric.mastery) : 'Ainda sem prática suficiente'}
            </T>
          ) : null}
        </View>
        <T style={{ color: measured ? color : colors.muted, fontFamily: fonts.semibold }}>
          {measured ? `${metric.mastery}%` : '—'}
        </T>
        <Icon name="chevron-right" size={16} color={colors.muted} />
      </View>
      {measured ? <Progress value={metric.mastery} color={color} /> : null}
    </Card>
  );
}
