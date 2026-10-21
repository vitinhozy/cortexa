import { useMemo, useState } from 'react';
import { View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Card, Icon, T, s } from './ui';
import { Touch } from './Motion';
import { useStudy } from '@/hooks/useStudy';
import { studyMonth, shiftStudyMonth } from '@/features/study/rhythm';
import { localDate } from '@/utils/date';
import { colors, fonts } from '@/constants/theme';

export function StudyCalendar({ compact = false }: { compact?: boolean }) {
  const { data } = useStudy();
  const today = localDate();
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const days = useMemo(() => studyMonth(data, month, today), [data, month, today]);
  const active = days.filter((day) => day.active).length;
  const monthLabel = new Date(`${month}-01T12:00:00`).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  return (
    <Card testID="study-calendar-card" style={compact ? { padding: 14, gap: 10 } : undefined}>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <T style={compact ? [s.sectionTitle, { fontSize: 14, lineHeight: 19 }] : s.sectionTitle}>
          Seu calendário de estudo
        </T>
        <Icon name="calendar" size={compact ? 17 : 20} />
      </View>
      <View style={[s.row, { justifyContent: 'space-between', gap: 4 }]}>
        <T style={{ flex: 1, fontFamily: fonts.medium, fontSize: compact ? 12 : 14 }}>
          {monthLabel.charAt(0).toLocaleUpperCase('pt-BR') + monthLabel.slice(1)}
        </T>
        <Touch
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          onPress={() => setMonth((value) => shiftStudyMonth(value, -1))}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="chevron-left" size={19} />
        </Touch>
        <Touch
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
          disabled={month >= today.slice(0, 7)}
          accessibilityState={{ disabled: month >= today.slice(0, 7) }}
          onPress={() => setMonth((value) => shiftStudyMonth(value, 1))}
          style={{
            width: 44,
            height: 44,
            opacity: month >= today.slice(0, 7) ? 0.35 : 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="chevron-right" size={19} />
        </Touch>
      </View>
      <View testID="study-calendar" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
          <View
            key={day}
            style={{
              width: '14.2857%',
              alignItems: 'center',
              paddingBottom: compact ? 5 : 10,
            }}
          >
            <T muted style={{ fontSize: compact ? 9 : 10 }}>
              {day}
            </T>
          </View>
        ))}
        {days.map((day) => (
          <View
            key={day.date}
            style={{
              width: '14.2857%',
              alignItems: 'center',
              paddingVertical: compact ? 1 : 2,
            }}
          >
            <View
              accessible
              accessibilityLabel={`${new Date(`${day.date}T12:00:00`).toLocaleDateString('pt-BR')}: ${day.active ? 'estudo registrado' : day.date > today ? 'dia futuro' : 'sem estudo registrado'}${day.today ? ', hoje' : ''}`}
              style={{
                width: '90%',
                minHeight: compact ? 30 : 42,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                borderRadius: compact ? 9 : 12,
                backgroundColor: day.active ? colors.amberLight : 'transparent',
                borderWidth: day.today ? 1 : 0,
                borderColor: colors.primary,
                opacity: day.inMonth ? 1 : 0.25,
              }}
            >
              <T
                style={{
                  fontSize: compact ? 10 : 12,
                  lineHeight: compact ? 13 : 17,
                  fontFamily: day.today || day.active ? fonts.semibold : fonts.regular,
                  color: day.active ? colors.amber : colors.ink,
                }}
              >
                {Number(day.date.slice(-2))}
              </T>
              {day.active ? (
                <MaterialCommunityIcons
                  name="fire"
                  size={compact ? 11 : 15}
                  color={colors.orange}
                />
              ) : null}
            </View>
          </View>
        ))}
      </View>
      <View style={[s.row, { justifyContent: 'center', gap: 6 }]}>
        <MaterialCommunityIcons name="fire" size={compact ? 14 : 17} color={colors.orange} />
        <T muted style={{ fontSize: compact ? 10 : 11 }}>
          {active} {active === 1 ? 'dia estudado' : 'dias estudados'} neste mês
        </T>
      </View>
      <T muted style={{ fontSize: compact ? 9 : 10, textAlign: 'center', lineHeight: 16 }}>
        Sessões concluídas, questões e revisões registradas. Dias sem atividade ficam sem chama.
      </T>
    </Card>
  );
}
