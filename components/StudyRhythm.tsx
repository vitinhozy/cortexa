import { View } from 'react-native';
import { Card, Icon, Progress, T, s } from './ui';
import { Reveal } from './Motion';
import { useStudy } from '@/hooks/useStudy';
import { studyWeek } from '@/features/study/rhythm';
import { colors, fonts } from '@/constants/theme';

export function StudyRhythm() {
  const { data, mode } = useStudy();
  const week = studyWeek(data);
  return (
    <Card>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <View style={{ flex: 1, gap: 4 }}>
          <T style={s.sectionTitle}>Seu ritmo de estudo</T>
          <T muted style={{ fontSize: 12 }}>
            {data.user.streak
              ? `${data.user.streak} ${data.user.streak === 1 ? 'dia de constância' : 'dias de constância'}`
              : 'Seu primeiro dia pode ser hoje.'}
          </T>
        </View>
        <Icon name="sun" size={28} />
      </View>
      <View style={[s.row, { gap: 5, justifyContent: 'space-between' }]}>
        {week.map((day) => (
          <View
            key={day.date}
            accessible
            accessibilityLabel={`${new Date(`${day.date}T12:00:00`).toLocaleDateString('pt-BR')}: ${day.active ? 'estudo registrado' : 'sem atividade registrada'}${day.today ? ', hoje' : ''}`}
            style={{ flex: 1, alignItems: 'center', gap: 8 }}
          >
            <T muted style={{ fontSize: 10 }}>
              {new Date(`${day.date}T12:00:00`)
                .toLocaleDateString('pt-BR', { weekday: 'short' })
                .replace('.', '')}
            </T>
            <Reveal>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: day.active ? colors.primary : colors.lavender,
                  borderWidth: day.today ? 1 : 0,
                  borderColor: colors.primary,
                }}
              >
                {day.active ? (
                  <Icon name="check" size={15} color="white" />
                ) : (
                  <T style={{ fontSize: 10, color: colors.muted, fontFamily: fonts.medium }}>
                    {day.date.slice(-2)}
                  </T>
                )}
              </View>
            </Reveal>
          </View>
        ))}
      </View>
      <Progress
        value={(data.user.weeklyMinutes / Math.max(1, data.user.weeklyGoal)) * 100}
        height={8}
      />
      <T muted style={{ fontSize: 11 }}>
        {data.user.weeklyMinutes} de {data.user.weeklyGoal} minutos nesta semana
      </T>
      <T muted style={{ fontSize: 11 }}>
        {mode === 'demo'
          ? 'Sequência e metas demonstrativas. Os círculos mostram apenas atividades registradas neste espaço.'
          : 'Os últimos sete dias, com sessões concluídas, questões ou revisões. Cada passo conta.'}
      </T>
    </Card>
  );
}
