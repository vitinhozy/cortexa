import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Screen, Card, T, Button, Badge, Section, Empty, Notice, Icon, s } from '@/components/ui';
import { useStudy } from '@/hooks/useStudy';
import { colors, fonts } from '@/constants/theme';
import { recommendTopics } from '@/features/study/engine';
import { useMotion } from '@/hooks/useMotion';
import { Reveal } from '@/components/Motion';
import { useAppNavigation } from '@/hooks/useAppNavigation';
export default function SessionScreen() {
  const { replace } = useAppNavigation();
  const { topicId, daily, materialId } = useLocalSearchParams<{
    topicId?: string;
    daily?: string;
    materialId?: string;
  }>();
  const { data, services, mode } = useStudy();
  const { tap } = useMotion();
  const material = data.materials.find((item) => item.id === materialId);
  const topic =
    data.topics.find((t) => t.id === topicId) ??
    (!topicId ? recommendTopics(data)[0]?.topic : undefined);
  const [startedAt] = useState(() => new Date().toISOString());
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState('');
  if (!topic)
    return (
      <Screen title="Estudo" back>
        <Empty title="Assunto não encontrado" message="Abra uma sessão a partir do mapa." />
      </Screen>
    );
  return (
    <Screen
      title={finished ? 'Um pouco mais perto.' : topic.name}
      subtitle={
        finished
          ? 'Seu tempo e sua atividade foram registrados.'
          : 'Leia com calma, conecte as ideias e coloque em prática.'
      }
      eyebrow="SESSÃO DE ESTUDO"
      back
    >
      {finished ? (
        <>
          <Reveal>
            <Card style={{ alignItems: 'center', padding: 35 }}>
              <Icon name="check-circle" size={40} />
              <T style={s.sectionTitle}>Sessão concluída</T>
              <Badge label="+20 XP" />
              <T muted style={{ textAlign: 'center' }}>
                O tempo é registrado em minutos completos. Continue com uma revisão ou acompanhe seu
                mapa.
              </T>
            </Card>
          </Reveal>
          <Button title="Ver meu progresso" onPress={() => replace('/knowledge')} />
        </>
      ) : (
        <>
          <View style={[s.row, { flexWrap: 'wrap' }]}>
            <Badge label={topic.unit} />
            <Badge label="12 MIN · RITMO SUGERIDO" tone="neutral" />
          </View>
          <Card>
            <T style={s.sectionTitle}>Primeiro, conecte o conceito.</T>
            <T style={{ lineHeight: 26, fontSize: 16 }}>
              {material?.topicId === topic.id ? material.content : topic.summary}
            </T>
          </Card>
          {topic.keyPoints.length ? <Section title="Leve estas ideias com você" /> : null}
          {topic.keyPoints.map((point, i) => (
            <Card key={point}>
              <View style={[s.row, { alignItems: 'flex-start' }]}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 9,
                    backgroundColor: colors.mint,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <T style={{ color: colors.primary, fontFamily: fonts.semibold }}>{i + 1}</T>
                </View>
                <T style={{ flex: 1, lineHeight: 24 }}>{point}</T>
              </View>
            </Card>
          ))}
          <Notice
            text={
              mode === 'demo'
                ? 'Conteúdo demonstrativo simplificado, exclusivo para estudo. Os exemplos não foram gerados a partir de um material real.'
                : 'Anotação escrita por você. Nenhum resumo ou conteúdo adicional foi gerado por IA.'
            }
          />
          <Section title="Agora, pratique" />
          <Button
            title="Praticar questões"
            icon="check-square"
            onPress={() =>
              router.push({ pathname: '/questions', params: { topicId: topic.id, daily } })
            }
          />
          <Button
            title="Revisar flashcards"
            icon="layers"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: '/flashcards',
                params: daily === 'true' ? {} : { topicId: topic.id },
              })
            }
          />
          <Button
            title="Me ensine com perguntas"
            icon="zap"
            variant="secondary"
            onPress={() => router.push('/tutor')}
            disabled={mode === 'personal'}
          />
          <Button
            title="Concluir sessão"
            variant="ghost"
            onPress={async () => {
              try {
                await services.studyService.finish(
                  topic.id,
                  startedAt,
                  material?.id ? [`material:${material.id}`] : [],
                );
                tap('success');
                setFinished(true);
              } catch {
                setError('Não foi possível concluir. Tente novamente.');
              }
            }}
          />
        </>
      )}
      {error ? <Notice text={error} /> : null}
    </Screen>
  );
}
