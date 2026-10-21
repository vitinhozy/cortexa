import { View } from 'react-native';
import { router } from 'expo-router';
import { Card, Screen, T, Button, Section, Empty, Badge, Notice, s } from './ui';
import { useStudy } from '@/hooks/useStudy';
import { studentContext } from '@/features/study/context';
import { localDate, formatDate } from '@/utils/date';
import { colors, fonts } from '@/constants/theme';
import { useRef, useState } from 'react';
import { ToolGrid } from './WorkspaceTools';
import { CreateStudyMenu } from './CreateStudyMenu';
import { Reveal } from './Motion';
import { useAvailableWidth } from '@/hooks/useAvailableWidth';
import { StudyCalendar } from './StudyCalendar';
import { OverviewProgress, personalOverviewMetrics } from './OverviewProgress';
import { ExamReviewSheet } from './ExamReviewSheet';
import { ReviewPriorities } from './ReviewPriorities';
import { WeeklyGoalIndicator } from './WeeklyGoalIndicator';
import { studyRecommendations } from '@/features/study/learner';
import { academicStageLabels } from '@/constants/academic';

export function PersonalHome() {
  const { data } = useStudy();
  const [create, setCreate] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const plannerAfterDismiss = useRef(false);
  const wide = useAvailableWidth() >= 760;
  const context = studentContext(data);
  const exam = data.exams
    .filter((e) => e.date >= localDate())
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const recent = [...data.materials]
    .sort((a, b) => (b.lastOpenedAt ?? b.createdAt).localeCompare(a.lastOpenedAt ?? a.createdAt))
    .slice(0, 3);
  const lastSession = data.sessions[data.sessions.length - 1];
  const lastTopic = data.topics.find((topic) => topic.id === lastSession?.topicId);
  const recommendation = studyRecommendations(data)[0];
  const concept = data.learning?.concepts.find((c) => c.id === recommendation?.conceptId);
  return (
    <Screen
      title={`Olá, ${data.user.name}.`}
      subtitle="Seus materiais, sua rotina e os próximos passos."
      eyebrow="UM POUCO A CADA DIA"
      topAction={
        <WeeklyGoalIndicator
          minutes={data.user.weeklyMinutes}
          goal={data.user.weeklyGoal}
          onPress={() => router.push('/profile-edit')}
        />
      }
    >
      {!data.user.onboardingComplete ? (
        <Card style={{ backgroundColor: colors.lavender }}>
          <T style={s.sectionTitle}>Vamos conhecer sua rotina?</T>
          <T>Escolha suas disciplinas e uma meta possível para começar.</T>
          <Button title="Configurar meu estudo" onPress={() => router.push('/onboarding')} />
        </Card>
      ) : null}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 24 }}>
        <View style={{ flex: 1.5, gap: 24 }}>
          <Reveal variant="inflate">
            <Card
              style={{
                justifyContent: 'space-between',
                backgroundColor: colors.lavender,
                borderColor: colors.lavenderLine,
              }}
            >
              <Badge label="SEU PRÓXIMO PASSO" />
              <T
                style={{
                  color: colors.ink,
                  fontSize: 24,
                  lineHeight: 32,
                  fontFamily: fonts.semibold,
                }}
              >
                {recommendation
                  ? `Retome: ${concept?.name ?? 'seu próximo conceito'}`
                  : lastTopic
                    ? `Continue: ${lastTopic.name}`
                    : recent.length
                      ? 'Dê um tempo para suas ideias.'
                      : 'Comece com uma anotação da aula.'}
              </T>
              <T style={{ color: colors.primaryDark }}>
                {recommendation?.explanation ||
                  data.user.goal ||
                  'Organize o que você está aprendendo. Seu histórico será construído com suas atividades.'}
              </T>
              <Button
                title={
                  recommendation
                    ? 'Começar sessão recomendada'
                    : lastTopic
                      ? 'Retomar estudo'
                      : recent.length
                        ? 'Abrir minha biblioteca'
                        : 'Criar primeira anotação'
                }
                variant="primary"
                onPress={() =>
                  recommendation
                    ? router.push(
                        data.questions.some(
                          (q) => (q.conceptId ?? q.topicId) === recommendation.conceptId,
                        )
                          ? {
                              pathname: '/questions',
                              params: {
                                topicId: recommendation.topicId,
                                conceptIds: recommendation.conceptId,
                                kind: 'review',
                              },
                            }
                          : {
                              pathname: '/flashcards',
                              params: { topicId: recommendation.topicId },
                            },
                      )
                    : lastTopic
                      ? router.push({ pathname: '/session', params: { topicId: lastTopic.id } })
                      : router.push(recent.length ? '/library' : '/material/add')
                }
              />
            </Card>
          </Reveal>
          {wide ? <ReviewPriorities compact /> : null}
        </View>
        <View style={{ flex: 1, gap: 14 }}>
          <StudyCalendar compact={wide} />
          <OverviewProgress metrics={personalOverviewMetrics(data)} />
        </View>
      </View>
      {!wide ? <ReviewPriorities /> : null}
      <Button
        title="Minha jornada e memória"
        variant="ghost"
        onPress={() => router.push('/learning')}
      />
      {data.academicJourney?.stage && data.academicJourney.stage !== 'UNKNOWN' ? (
        <T muted>
          {academicStageLabels[data.academicJourney.stage]} · {recommendation?.minutes ?? 12}{' '}
          minutos sugeridos para a próxima prática
        </T>
      ) : null}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 24 }}>
        <View style={{ flex: 1.5, gap: 24 }}>
          <Section
            title="Dê forma às suas ideias"
            action="Criar material"
            onPress={() => setCreate(true)}
          />
          <ToolGrid />
          <Section
            title="Materiais recentes"
            action="Ver biblioteca"
            onPress={() => router.push('/library')}
          />
          {recent.length ? (
            recent.map((material) => (
              <Card
                key={material.id}
                label={material.title}
                onPress={() =>
                  router.push({ pathname: '/material/[id]', params: { id: material.id } })
                }
              >
                <T style={s.sectionTitle}>{material.title}</T>
                <T muted>
                  {data.subjects.find((subject) => subject.id === material.subjectId)?.name} ·{' '}
                  {material.type}
                </T>
              </Card>
            ))
          ) : (
            <Empty
              title="Sua biblioteca começa com você"
              message="Salve uma anotação e organize-a por disciplina e pasta."
            />
          )}
        </View>
        <View style={{ flex: 1, gap: 24 }}>
          <Card>
            <T style={s.sectionTitle}>Próxima prova</T>
            {exam ? (
              <>
                <T>{exam.title}</T>
                <T muted>{formatDate(exam.date)}</T>
                <Button
                  title="Organizar revisão"
                  variant="secondary"
                  onPress={() => setReviewOpen(true)}
                />
              </>
            ) : (
              <T muted>Você ainda não cadastrou uma prova futura.</T>
            )}
            <Button
              title="Gerenciar provas"
              variant="ghost"
              onPress={() => router.push('/exams')}
            />
          </Card>
          {context.dueFlashcardIds.length ? (
            <Button title="Revisar flashcards de hoje" onPress={() => router.push('/flashcards')} />
          ) : null}
          <Notice text="A IA e a leitura automática de arquivos ainda não estão conectadas. Suas anotações são salvas como você as escreveu, sem processamento simulado." />
        </View>
      </View>
      <ExamReviewSheet
        visible={reviewOpen}
        exam={exam}
        onClose={() => {
          plannerAfterDismiss.current = false;
          setReviewOpen(false);
        }}
        onPlan={() => {
          plannerAfterDismiss.current = true;
          setReviewOpen(false);
        }}
        onDismiss={() => {
          if (!plannerAfterDismiss.current || !exam) return;
          plannerAfterDismiss.current = false;
          router.push({ pathname: '/planner', params: { examId: exam.id } });
        }}
      />
      <CreateStudyMenu visible={create} onClose={() => setCreate(false)} />
    </Screen>
  );
}
