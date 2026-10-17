import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Screen, Card, T, Badge, Progress, Empty, s } from '@/components/ui';
import { TopicRow } from '@/components/TopicRow';
import { useStudy } from '@/hooks/useStudy';
import { colors, fonts } from '@/constants/theme';
export default function KnowledgeScreen() {
  const { data } = useStudy();
  const [subject, setSubject] = useState('physiology');
  const topics = data.topics.filter((t) => t.subjectId === subject);
  const average = topics.length
    ? Math.round(
        topics.reduce(
          (sum, topic) => sum + (data.metrics.find((m) => m.topicId === topic.id)?.mastery ?? 0),
          0,
        ) / topics.length,
      )
    : 0;
  return (
    <Screen
      title="Mapa de conhecimento"
      subtitle="Enxergue suas conquistas. Encontre seu próximo avanço."
      eyebrow="SEU APRENDIZADO, EM PERSPECTIVA"
      back
    >
      <View style={[s.row, { flexWrap: 'wrap', gap: 8 }]}>
        {data.subjects.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected: item.id === subject }}
            onPress={() => setSubject(item.id)}
            style={{
              backgroundColor: item.id === subject ? colors.primary : 'white',
              padding: 12,
              borderRadius: 10,
            }}
          >
            <T style={{ color: item.id === subject ? 'white' : colors.muted, fontSize: 12 }}>
              {item.name}
            </T>
          </Pressable>
        ))}
      </View>
      {topics.length ? (
        <>
          <Card style={{ backgroundColor: colors.mint }}>
            <Badge label="FISIOLOGIA RENAL" />
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <T style={s.sectionTitle}>Uma base cada vez mais sólida.</T>
              <T
                style={{
                  fontSize: 27,
                  lineHeight: 34,
                  fontFamily: fonts.semibold,
                  color: colors.primary,
                }}
              >
                {average}%
              </T>
            </View>
            <Progress value={average} />
            <T muted style={{ fontSize: 12 }}>
              Domínio estimado a partir dos dados demonstrativos e das suas atividades.
            </T>
          </Card>
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
            {topics.map((topic) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                metric={data.metrics.find((m) => m.topicId === topic.id)!}
              />
            ))}
          </View>
        </>
      ) : (
        <Empty
          icon="compass"
          title="Um novo território para explorar"
          message="Os primeiros conteúdos desta disciplina chegarão em uma próxima versão. Explore Fisiologia para testar o mapa."
        />
      )}
    </Screen>
  );
}
