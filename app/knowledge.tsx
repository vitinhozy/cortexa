import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen, T, Empty, Card, Progress, Button, s } from '@/components/ui';
import { router } from 'expo-router';
import { Choice } from '@/components/Choice';
import { TopicRow } from '@/components/TopicRow';
import { AccuracyChart } from '@/components/AccuracyChart';
import { useStudy } from '@/hooks/useStudy';
import { subjectPerformance } from '@/features/study/insights';
import { colors } from '@/constants/theme';
import { learnerModel } from '@/features/study/learner';

export default function KnowledgeScreen() {
  const { data, mode } = useStudy();
  const [selectedSubject, setSubject] = useState(
    data.user.subjectIds?.[0] ?? data.subjects[0]?.id ?? '',
  );
  const subject = data.subjects.find((item) => item.id === selectedSubject) ?? data.subjects[0];
  const performance = useMemo(
    () => subjectPerformance(data, subject?.id ?? ''),
    [data, subject?.id],
  );
  const orderedTopics = [...performance.topics].sort(
    (a, b) =>
      Number(b.metric.answered > 0) - Number(a.metric.answered > 0) ||
      a.metric.mastery - b.metric.mastery,
  );
  const concepts = useMemo(
    () =>
      learnerModel(data).concepts.filter((c) =>
        data.topics.some((t) => t.id === c.topicId && t.subjectId === subject?.id),
      ),
    [data, subject?.id],
  );
  return (
    <Screen
      title="Mapa de conhecimento"
      subtitle="Veja seus acertos e encontre os conceitos que precisam de revisão."
      eyebrow="SEU APRENDIZADO, EM PERSPECTIVA"
      back
    >
      <View style={[s.row, { flexWrap: 'wrap', gap: 8 }]}>
        {data.subjects.map((item) => (
          <Choice
            key={item.id}
            label={item.name}
            selected={item.id === subject?.id}
            onPress={() => setSubject(item.id)}
          />
        ))}
      </View>
      <AccuracyChart
        performance={performance}
        subject={subject?.name ?? 'Disciplina'}
        simulated={mode === 'demo'}
      />
      {orderedTopics.length ? (
        <>
          <T style={s.sectionTitle}>Domínio por assunto</T>
          <T muted style={{ fontSize: 12, lineHeight: 20 }}>
            Comece pelos conceitos com menor domínio estimado. Toque em um deles para revisar.
          </T>
          <View style={[s.row, { flexWrap: 'wrap', gap: 12 }]}>
            {[
              { label: '0–49 · Revisar', color: colors.red },
              { label: '50–74 · Desenvolvendo', color: colors.amber },
              { label: '75–89 · Bom', color: colors.primary },
              { label: '90–100 · Alto', color: colors.primaryDark },
            ].map((item) => (
              <View key={item.label} style={[s.row, { gap: 5 }]}>
                <View
                  style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.color }}
                />
                <T muted style={{ fontSize: 10 }}>
                  {item.label}
                </T>
              </View>
            ))}
          </View>
          <View style={{ gap: 12 }}>
            {orderedTopics.map((item) => (
              <TopicRow key={item.topic.id} topic={item.topic} metric={item.metric} />
            ))}
          </View>
        </>
      ) : (
        <Empty
          icon="compass"
          title="Um novo território para explorar"
          message="Adicione anotações nesta disciplina e pratique questões para acompanhar seus resultados aqui."
        />
      )}
      {concepts.length ? (
        <>
          <T style={s.sectionTitle}>Domínio por conceito</T>
          <T muted>Estimativa por evidência. A taxa de acertos acima é uma medida diferente.</T>
          {concepts.map((concept) => (
            <Card key={concept.id}>
              <T style={s.sectionTitle}>{concept.name}</T>
              <T>
                {concept.mastery.exposures
                  ? `${concept.mastery.value}% estimado · ${concept.mastery.exposures} exposições avaliadas`
                  : 'Ainda sem evidência de desempenho'}
              </T>
              {concept.mastery.exposures ? <Progress value={concept.mastery.value} /> : null}
              {!concept.mastery.sufficientEvidence && concept.mastery.exposures ? (
                <T muted>Evidência inicial; autoavaliações não substituem respostas objetivas.</T>
              ) : null}
            </Card>
          ))}
          <Button
            title="Ver minha memória de aprendizagem"
            variant="secondary"
            onPress={() => router.push('/learning')}
          />
        </>
      ) : null}
    </Screen>
  );
}
