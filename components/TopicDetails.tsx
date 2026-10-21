import { View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Badge, Button, Card, Progress, Section, T, s } from './ui';
import { masteryColor } from './TopicRow';
import { useStudy } from '@/hooks/useStudy';
import { masteryLabel } from '@/features/study/engine';
import { fonts } from '@/constants/theme';
import { formatDate } from '@/utils/date';
import type { KnowledgeMetric, Topic } from '@/types/domain';

export function TopicDetails({
  topic,
  metric,
  onNavigate = (href) => router.push(href),
}: {
  topic: Topic;
  metric: KnowledgeMetric;
  onNavigate?: (href: Href) => void;
}) {
  const { data, mode } = useStudy();
  const mistakes = data.mistakes.filter((mistake) => mistake.topicId === topic.id);
  return (
    <View style={{ gap: 20 }}>
      <Card>
        <Badge
          label={metric.answered ? masteryLabel(metric.mastery) : 'Ainda sem prática suficiente'}
          tone={metric.mastery < 50 ? 'red' : metric.mastery < 75 ? 'amber' : 'green'}
        />
        <T
          style={{
            fontSize: 38,
            lineHeight: 48,
            fontFamily: fonts.semibold,
            color: masteryColor(metric.mastery),
          }}
        >
          {metric.answered ? `${metric.mastery}%` : '—'}
        </T>
        {metric.answered ? (
          <Progress value={metric.mastery} color={masteryColor(metric.mastery)} />
        ) : null}
        <T muted>{topic.summary}</T>
      </Card>
      <View style={s.grid}>
        {[
          { label: 'Questões feitas', value: metric.answered },
          {
            label: 'Taxa de acerto',
            value: metric.answered
              ? `${Math.round((metric.correct / metric.answered) * 100)}%`
              : '—',
          },
          {
            label: 'Flashcards',
            value: data.flashcards.filter((card) => card.topicId === topic.id).length,
          },
        ].map((stat) => (
          <Card key={stat.label} style={{ flexBasis: '28%', flexGrow: 1, padding: 15 }}>
            <T style={{ fontSize: 23, fontFamily: fonts.semibold }}>{stat.value}</T>
            <T muted style={{ fontSize: 10 }}>
              {stat.label}
            </T>
          </Card>
        ))}
      </View>
      <Button
        title="Estudar agora"
        icon="arrow-right"
        onPress={() => onNavigate({ pathname: '/session', params: { topicId: topic.id } })}
      />
      <Button
        title="Praticar questões deste assunto"
        variant="secondary"
        onPress={() => onNavigate({ pathname: '/questions', params: { topicId: topic.id } })}
      />
      <Section title="Últimos erros" />
      {mistakes.length ? (
        mistakes.slice(0, 3).map((mistake) => (
          <Card key={mistake.id}>
            <T muted style={{ fontSize: 11 }}>
              {formatDate(mistake.createdAt)} ·{' '}
              {mode === 'demo' ? 'hipótese simulada' : 'hipótese didática'}
            </T>
            <T>{mistake.probableCause}</T>
            <Button
              title="Abrir caderno de erros"
              small
              variant="ghost"
              onPress={() => onNavigate({ pathname: '/mistakes', params: { topicId: topic.id } })}
            />
          </Card>
        ))
      ) : (
        <T muted>Nenhum erro registrado neste assunto.</T>
      )}
    </View>
  );
}
