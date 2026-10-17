import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Screen, Card, T, Section, Button, Badge, Progress, Empty, s } from '@/components/ui';
import { useStudy } from '@/hooks/useStudy';
import { masteryColor } from '@/components/TopicRow';
import { masteryLabel } from '@/features/study/engine';
import { fonts } from '@/constants/theme';
import { formatDate } from '@/utils/date';
export default function TopicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useStudy();
  const topic = data.topics.find((t) => t.id === id);
  const metric = data.metrics.find((m) => m.topicId === id);
  if (!topic || !metric)
    return (
      <Screen title="Assunto indisponível" back>
        <Empty
          title="Assunto não encontrado"
          message="Escolha um assunto pelo mapa de conhecimento."
        />
      </Screen>
    );
  const mistakes = data.mistakes.filter((m) => m.topicId === id);
  return (
    <Screen title={topic.name} subtitle={topic.unit} back eyebrow="SEU MAPA, MAIS DE PERTO">
      <Card>
        <Badge
          label={masteryLabel(metric.mastery)}
          tone={metric.mastery < 50 ? 'red' : metric.mastery < 75 ? 'amber' : 'green'}
        />
        <T
          style={{
            fontSize: 44,
            lineHeight: 55,
            fontFamily: fonts.semibold,
            color: masteryColor(metric.mastery),
          }}
        >
          {metric.mastery}%
        </T>
        <Progress value={metric.mastery} color={masteryColor(metric.mastery)} />
        <T muted>{topic.summary}</T>
      </Card>
      <View style={s.grid}>
        {[
          { label: 'Questões feitas', value: metric.answered },
          {
            label: 'Taxa de acerto',
            value: `${Math.round((metric.correct / Math.max(1, metric.answered)) * 100)}%`,
          },
          { label: 'Flashcards', value: data.flashcards.filter((f) => f.topicId === id).length },
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
        onPress={() => router.push({ pathname: '/session', params: { topicId: id } })}
      />
      <Button
        title="Praticar questões deste assunto"
        variant="secondary"
        onPress={() => router.push({ pathname: '/questions', params: { topicId: id } })}
      />
      <Section title="Últimos erros" />
      {mistakes.length ? (
        mistakes.slice(0, 3).map((m) => (
          <Card key={m.id}>
            <T muted style={{ fontSize: 11 }}>
              {formatDate(m.createdAt)} · hipótese simulada
            </T>
            <T>{m.probableCause}</T>
            <Button
              title="Abrir caderno de erros"
              small
              variant="ghost"
              onPress={() => router.push({ pathname: '/mistakes', params: { topicId: id } })}
            />
          </Card>
        ))
      ) : (
        <T muted>Nenhum erro registrado neste assunto.</T>
      )}
    </Screen>
  );
}
