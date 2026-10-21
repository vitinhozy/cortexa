import { useRef, useState } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Screen, Card, T, Button, Section, Icon, Progress, Badge, s } from '@/components/ui';
import { StudyCalendar } from '@/components/StudyCalendar';
import { OverviewProgress, demoOverviewMetrics } from '@/components/OverviewProgress';
import { ReviewPriorities } from '@/components/ReviewPriorities';
import { PersonalHome } from '@/components/PersonalHome';
import { ToolGrid } from '@/components/WorkspaceTools';
import { CreateStudyMenu } from '@/components/CreateStudyMenu';
import { Reveal } from '@/components/Motion';
import { useStudy } from '@/hooks/useStudy';
import { recommendTopics } from '@/features/study/engine';
import { colors, fonts, themeTint } from '@/constants/theme';
import { daysUntil, formatDate, localDate } from '@/utils/date';
import { useAvailableWidth } from '@/hooks/useAvailableWidth';
import { WeeklyGoalIndicator } from '@/components/WeeklyGoalIndicator';
import { BrandLogo } from '@/components/BrandLogo';
import { ExamReviewSheet } from '@/components/ExamReviewSheet';
import { BottomSheet } from '@/components/BottomSheet';

export default function OverviewScreen() {
  const { mode } = useStudy();
  return mode === 'personal' ? <PersonalHome /> : <DemoHome />;
}
function DemoHome() {
  const { data } = useStudy();
  const wide = useAvailableWidth() >= 760;
  const [create, setCreate] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const plannerAfterDismiss = useRef(false);
  const tutorAfterDismiss = useRef(false);
  const ranked = recommendTopics(data);
  const next = ranked[0];
  const exam = data.exams
    .filter((item) => item.date >= localDate())
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const preparation = Math.round(
    data.metrics.reduce((sum, metric) => sum + metric.mastery, 0) /
      Math.max(1, data.metrics.length),
  );
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const progressMetrics = demoOverviewMetrics(data);
  if (!next) return <PersonalHome />;
  return (
    <Screen
      title={`${greeting}, ${data.user.name}`}
      subtitle="Um lugar para conectar tudo o que você aprende."
      eyebrow="SEU ESPAÇO DE POSSIBILIDADES"
      topAction={
        <WeeklyGoalIndicator minutes={data.user.weeklyMinutes} goal={data.user.weeklyGoal} />
      }
    >
      <View
        style={{
          flexDirection: wide ? 'row' : 'column',
          alignItems: wide ? 'flex-start' : 'stretch',
          gap: 20,
        }}
      >
        <View style={{ flex: wide ? 1.65 : undefined, gap: 22 }}>
          <Reveal variant="inflate">
            <LinearGradient
              testID="overview-study-card"
              colors={[colors.heroStart, colors.heroEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                justifyContent: 'space-between',
                borderRadius: 28,
                borderCurve: 'continuous',
                padding: wide ? 30 : 24,
                gap: 20,
                overflow: 'hidden',
              }}
            >
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  right: -38,
                  top: -36,
                  width: 180,
                  height: 180,
                  borderRadius: 90,
                  backgroundColor: themeTint('#FFFFFF3D', '#7C3AED20'),
                  borderWidth: 1,
                  borderColor: themeTint('#FFFFFFA0', '#7C3AED55'),
                }}
              />
              <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }]}>
                <Badge label="SEU ESTUDO DE HOJE" />
                <BrandLogo size={31} wordmark={false} />
              </View>
              <View style={{ gap: 10 }}>
                <T style={{ color: colors.primaryDark, fontSize: 11, letterSpacing: 1.5 }}>
                  FISIOLOGIA RENAL
                </T>
                <T
                  style={{
                    fontSize: wide ? 32 : 28,
                    lineHeight: 38,
                    fontFamily: fonts.semibold,
                    letterSpacing: -0.9,
                  }}
                >
                  {next.topic.name}
                </T>
                <T style={{ color: colors.primaryDark, lineHeight: 23, maxWidth: 400 }}>
                  Uma ideia por vez. Mais clareza para a sua próxima prova.
                </T>
              </View>
              <View style={[s.row, { flexWrap: 'wrap', gap: 14 }]}>
                {[
                  { icon: 'clock' as const, text: '12 min de revisão' },
                  { icon: 'check-square' as const, text: '5 questões' },
                  { icon: 'layers' as const, text: `${data.flashcards.length} flashcards` },
                ].map((item) => (
                  <View key={item.text} style={[s.row, { gap: 6 }]}>
                    <Icon name={item.icon} size={13} />
                    <T style={{ fontSize: 11, color: colors.primaryDark }}>{item.text}</T>
                  </View>
                ))}
              </View>
              <Button
                title="Começar estudo"
                icon="arrow-right"
                onPress={() =>
                  router.push({
                    pathname: '/session',
                    params: { topicId: next.topic.id, daily: 'true' },
                  })
                }
              />
            </LinearGradient>
          </Reveal>
          {wide ? <ReviewPriorities compact /> : null}
        </View>
        <View style={{ flex: wide ? 1 : undefined, gap: 14 }}>
          <StudyCalendar compact={wide} />
          <OverviewProgress metrics={progressMetrics} />
          {exam ? (
            <Card style={{ backgroundColor: colors.peach, borderColor: colors.peach }}>
              <View style={[s.row, { justifyContent: 'space-between' }]}>
                <Icon name="calendar" color={colors.orange} />
                <Badge label={`${daysUntil(exam.date)} dias`} tone="amber" />
              </View>
              <T style={s.sectionTitle}>{exam.title}</T>
              <T muted style={{ fontSize: 12 }}>
                {formatDate(exam.date)} {'\u00b7'} {'prepara\u00e7\u00e3o demonstrativa de '}{' '}
                {preparation}%
              </T>
              <Progress value={preparation} color={colors.orange} />
              <Button
                title={'Organizar minha revis\u00e3o'}
                variant="ghost"
                onPress={() => setReviewOpen(true)}
              />
            </Card>
          ) : (
            <Button title="Cadastrar prova" onPress={() => router.push('/exams')} />
          )}
        </View>
      </View>
      {!wide ? <ReviewPriorities /> : null}
      <View style={{ gap: 22 }}>
        <Section
          title="Dê forma às suas ideias"
          action="Criar material"
          onPress={() => setCreate(true)}
        />
        <ToolGrid />
        <Card style={{ backgroundColor: colors.blueLight, borderColor: colors.blueLight }}>
          <View style={s.row}>
            <View style={{ padding: 11, borderRadius: 14, backgroundColor: colors.surface }}>
              <Icon name="message-circle" color={colors.blue} />
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <T style={s.sectionTitle}>Aprender conversando</T>
              <T muted style={{ fontSize: 12 }}>
                Um conceito. Uma pergunta de cada vez.
              </T>
            </View>
          </View>
          <Button
            title="Abrir tutor de demonstração"
            variant="ghost"
            onPress={() => setTutorOpen(true)}
          />
        </Card>
      </View>
      <ExamReviewSheet
        visible={reviewOpen}
        exam={exam}
        preparation={preparation}
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
      <BottomSheet
        visible={tutorOpen}
        title="Aprender conversando"
        onClose={() => {
          tutorAfterDismiss.current = false;
          setTutorOpen(false);
        }}
        onDismiss={() => {
          if (!tutorAfterDismiss.current) return;
          tutorAfterDismiss.current = false;
          router.push('/tutor');
        }}
      >
        <Card style={{ backgroundColor: colors.blueLight, borderColor: colors.blueLight }}>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <Icon name="message-circle" color={colors.blue} />
            <Badge label="ROTEIRO SIMULADO" />
          </View>
          <T style={s.sectionTitle}>Uma pergunta de cada vez</T>
          <T muted>
            {
              'A aula guiada explora equil\u00edbrio \u00e1cido-base com respostas locais de demonstra\u00e7\u00e3o.'
            }
          </T>
        </Card>
        <Button
          title={'Come\u00e7ar conversa guiada'}
          icon="arrow-right"
          onPress={() => {
            tutorAfterDismiss.current = true;
            setTutorOpen(false);
          }}
        />
      </BottomSheet>
      <CreateStudyMenu visible={create} onClose={() => setCreate(false)} />
    </Screen>
  );
}
