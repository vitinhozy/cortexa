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
}: {
  topic: Topic;
  metric: KnowledgeMetric;
  compact?: boolean;
}) {
  const color = masteryColor(metric.mastery);
  return (
    <Card
      onPress={() => router.push({ pathname: '/topic/[id]', params: { id: topic.id } })}
      label={`${topic.name}, ${metric.mastery}%`}
      style={{ padding: compact ? 16 : 21 }}
    >
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <View style={{ flex: 1, gap: 4 }}>
          <T style={{ fontFamily: fonts.medium, fontSize: compact ? 13 : 15 }}>{topic.name}</T>
          {!compact ? (
            <T muted style={{ fontSize: 11 }}>
              {masteryLabel(metric.mastery)}
            </T>
          ) : null}
        </View>
        <T style={{ color, fontFamily: fonts.semibold }}>{metric.mastery}%</T>
        <Icon name="chevron-right" size={16} color={colors.muted} />
      </View>
      <Progress value={metric.mastery} color={color} />
    </Card>
  );
}
