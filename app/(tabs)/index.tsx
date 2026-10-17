import { View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Screen,
  Card,
  T,
  Button,
  Section,
  Icon,
  Progress,
  Badge,
  s,
  type IconName,
} from '@/components/ui';
import { TopicRow } from '@/components/TopicRow';
import { useStudy } from '@/hooks/useStudy';
import { recommendTopics } from '@/features/study/engine';
import { colors, fonts } from '@/constants/theme';
import { daysUntil, formatDate } from '@/utils/date';
export default function HomeScreen() {
  const { data } = useStudy();
  const wide = useWindowDimensions().width > 800;
  const ranked = recommendTopics(data);
  const next = ranked[0];
  const exam = data.exams[0];
  const preparation = Math.round(
    data.metrics.reduce((sum, m) => sum + m.mastery, 0) / data.metrics.length,
  );
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const stats: { icon: IconName; value: string; label: string; color: string }[] = [
    { icon: 'sun', value: `${data.user.streak} dias`, label: 'de constância', color: colors.amber },
    {
      icon: 'clock',
      value: `${data.user.minutes}`,
      label: 'minutos estudados',
      color: colors.primary,
    },
    {
      icon: 'check-square',
      value: `${data.user.answered}`,
      label: 'questões respondidas',
      color: colors.blue,
    },
    {
      icon: 'target',
      value: `${Math.round((data.user.correct / Math.max(1, data.user.answered)) * 100)}%`,
      label: 'de acertos',
      color: colors.violet,
    },
  ];
  return (
    <Screen
      title={`${greeting}, ${data.user.name}`}
      subtitle="Vamos continuar de onde você parou?"
      eyebrow="UM POUCO A CADA DIA. MUITO MAIS LONGE."
      action={
        <View
          style={{
            marginLeft: 12,
            width: 43,
            height: 43,
            borderRadius: 22,
            backgroundColor: '#E1EADF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <T style={{ fontFamily: fonts.semibold, color: colors.primary }}>V</T>
        </View>
      }
    >
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 22 }}>
        <View style={{ flex: wide ? 1.8 : undefined, gap: 24 }}>
          <LinearGradient
            colors={['#185F50', '#123F38']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 23, padding: wide ? 30 : 24, overflow: 'hidden', gap: 20 }}
          >
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                right: -60,
                top: 35,
                width: 230,
                height: 230,
                borderWidth: 1,
                borderColor: '#427568',
                borderRadius: 120,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.55,
              }}
            >
              <View
                style={{
                  width: 170,
                  height: 170,
                  borderWidth: 1,
                  borderColor: '#588C79',
                  borderRadius: 90,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: 105,
                    height: 105,
                    borderRadius: 60,
                    backgroundColor: '#347160',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="activity" size={46} color="#A7CDA3" />
                </View>
              </View>
              <View
                style={{
                  position: 'absolute',
                  left: 27,
                  top: 30,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: colors.lime,
                }}
              />
            </View>
            <View style={s.row}>
              <View
                style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.lime }}
              />
              <T
                style={{
                  color: '#D7E9DD',
                  fontSize: 10,
                  letterSpacing: 1.6,
                  fontFamily: fonts.semibold,
                }}
              >
                SEU ESTUDO DE HOJE
              </T>
            </View>
            <View style={{ maxWidth: '82%', gap: 10 }}>
              <T style={{ color: '#B8D5C7', fontSize: 11 }}>FISIOLOGIA RENAL</T>
              <T
                style={{
                  fontSize: wide ? 30 : 27,
                  lineHeight: 36,
                  fontFamily: fonts.semibold,
                  color: 'white',
                  letterSpacing: -0.8,
                }}
              >
                {next.topic.name}
              </T>
              <T style={{ color: '#CDDDD4', fontSize: 12, lineHeight: 20 }}>
                Um pequeno foco hoje. Mais confiança na próxima prova.
              </T>
            </View>
            <View style={[s.row, { flexWrap: 'wrap', gap: 15 }]}>
              {[
                { icon: 'clock' as const, text: '12 min de revisão' },
                { icon: 'check-square' as const, text: '5 questões' },
                { icon: 'layers' as const, text: `${data.flashcards.length} flashcards` },
              ].map((item) => (
                <View key={item.text} style={[s.row, { gap: 5 }]}>
                  <Icon name={item.icon} size={13} color="#C3DBCD" />
                  <T style={{ color: '#DFEAE3', fontSize: 10 }}>{item.text}</T>
                </View>
              ))}
            </View>
            <Button
              title="Começar estudo"
              icon="arrow-right"
              variant="light"
              onPress={() =>
                router.push({
                  pathname: '/session',
                  params: { topicId: next.topic.id, daily: 'true' },
                })
              }
            />
            <View style={[s.row, { gap: 7 }]}>
              <Icon name="zap" size={12} color="#A9CBAF" />
              <T style={{ color: '#B6D1BE', fontSize: 10 }}>
                Selecionado para você pelo Study Engine
              </T>
            </View>
          </LinearGradient>
          <View style={{ gap: 14 }}>
            <Section title="Seu progresso" />
            <View style={[s.grid, { gap: 10 }]}>
              {stats.map((stat) => (
                <Card
                  key={stat.label}
                  style={{ flexGrow: 1, flexBasis: '45%', padding: 17, gap: 8 }}
                >
                  <View style={[s.row, { justifyContent: 'space-between' }]}>
                    <Icon name={stat.icon} size={17} color={stat.color} />
                    <T muted style={{ fontSize: 9 }}>
                      ATÉ AGORA
                    </T>
                  </View>
                  <T
                    style={{
                      fontSize: 25,
                      fontFamily: fonts.semibold,
                      lineHeight: 32,
                      letterSpacing: -0.7,
                    }}
                  >
                    {stat.value}
                  </T>
                  <T muted style={{ fontSize: 11 }}>
                    {stat.label}
                  </T>
                </Card>
              ))}
            </View>
          </View>
          <Card style={{ backgroundColor: '#EDF3ED', borderColor: '#E0E9DE' }}>
            <View style={s.row}>
              <Icon name="trending-up" />
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: fonts.semibold }}>Consistência vale mais que pressa.</T>
                <T muted style={{ fontSize: 12, marginTop: 4 }}>
                  Você já estudou {data.user.weeklyMinutes} de {data.user.weeklyGoal} min da sua
                  meta semanal.
                </T>
              </View>
            </View>
            <Progress value={(data.user.weeklyMinutes / data.user.weeklyGoal) * 100} />
            <T style={{ color: colors.primary, fontSize: 11 }}>
              {Math.round((data.user.weeklyMinutes / data.user.weeklyGoal) * 100)}% da meta ·
              continue no seu ritmo
            </T>
          </Card>
        </View>
        <View style={{ flex: wide ? 1 : undefined, gap: 24 }}>
          <View style={{ gap: 12 }}>
            <Section
              title="Seu próximo avanço"
              action="Ver mapa"
              onPress={() => router.push('/knowledge')}
            />
            <T muted style={{ fontSize: 12, lineHeight: 19 }}>
              Pontos que precisam de atenção
            </T>
            {ranked.slice(0, 3).map((item) => (
              <TopicRow compact key={item.topic.id} topic={item.topic} metric={item.metric} />
            ))}
          </View>
          <Card>
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <View style={[s.row, { gap: 7 }]}>
                <Icon name="calendar" size={16} />
                <T style={{ fontSize: 11, fontFamily: fonts.semibold }}>PRÓXIMA PROVA</T>
              </View>
              <Badge label={`${daysUntil(exam.date)} dias`} tone="amber" />
            </View>
            <T style={{ fontSize: 20, fontFamily: fonts.semibold, letterSpacing: -0.5 }}>
              {exam.title}
            </T>
            <T muted style={{ fontSize: 12 }}>
              {formatDate(exam.date)} · {new Date(`${exam.date}T12:00:00`).getFullYear()}
            </T>
            <View style={{ gap: 9 }}>
              <View style={[s.row, { justifyContent: 'space-between' }]}>
                <T muted style={{ fontSize: 11 }}>
                  Sua preparação
                </T>
                <T style={{ fontSize: 12, fontFamily: fonts.semibold }}>{preparation}%</T>
              </View>
              <Progress value={preparation} />
            </View>
            <Button
              title="Organizar minha revisão"
              variant="secondary"
              small
              icon="arrow-right"
              onPress={() => router.push('/planner')}
            />
          </Card>
          <Card
            onPress={() => router.push('/tutor')}
            style={{ borderStyle: 'dashed', backgroundColor: 'transparent' }}
          >
            <View style={s.row}>
              <View style={{ padding: 10, backgroundColor: colors.mint, borderRadius: 12 }}>
                <Icon name="zap" />
              </View>
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: fonts.semibold }}>Aprender conversando</T>
                <T muted style={{ fontSize: 11 }}>
                  Um conceito. Uma pergunta de cada vez.
                </T>
              </View>
              <Icon name="arrow-up-right" size={18} />
            </View>
          </Card>
        </View>
      </View>
    </Screen>
  );
}
