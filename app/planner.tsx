import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, Card, T, Button, Badge, Field, Notice, Icon, s } from '@/components/ui';
import { useStudy } from '@/hooks/useStudy';
import { addDays, daysUntil, formatDate, localDate } from '@/utils/date';
import { colors, fonts } from '@/constants/theme';
import type { StudyPlan } from '@/types/domain';
export default function PlannerScreen() {
  const { urgent, topicId } = useLocalSearchParams<{ urgent?: string; topicId?: string }>();
  const { data, services } = useStudy();
  const isUrgent = urgent === 'true';
  const [date, setDate] = useState(isUrgent ? addDays(localDate(), 1) : data.exams[0].date);
  const [minutes, setMinutes] = useState('60');
  const [selected, setSelected] = useState(topicId ? [topicId] : data.topics.map((t) => t.id));
  const [plan, setPlan] = useState<StudyPlan>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function generate() {
    const budget = Number(minutes);
    const dayCount = daysUntil(date);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(`${date}T12:00:00`)) ||
      localDate(new Date(`${date}T12:00:00`)) !== date ||
      date < localDate() ||
      dayCount > 60
    ) {
      setError('Informe uma data válida entre hoje e os próximos 60 dias, no formato AAAA-MM-DD.');
      return;
    }
    if (!Number.isInteger(budget) || budget < 5 || budget > 480 || !selected.length) {
      setError('Selecione ao menos um assunto e de 5 a 480 minutos por dia.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      setPlan(await services.studyService.plan(selected, budget, date));
    } catch {
      setError('Não foi possível montar o plano. Confira os campos.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen
      title={isUrgent ? 'Sua prova é amanhã.' : 'Um plano que cabe no seu dia.'}
      subtitle={
        isUrgent
          ? 'Vamos fazer o melhor com o tempo que você tem.'
          : 'Defina o destino. A gente ajuda a organizar os próximos passos.'
      }
      eyebrow="PLANEJADOR DE ESTUDOS"
      back
    >
      {!plan ? (
        <>
          <Card>
            <T style={s.sectionTitle}>Disciplina</T>
            <Badge label="FISIOLOGIA RENAL" />
            <T muted style={{ fontSize: 12 }}>
              Disciplina disponível nesta demonstração.
            </T>
            {!isUrgent ? (
              <Field
                label="Data da prova (AAAA-MM-DD)"
                value={date}
                onChangeText={setDate}
                placeholder="2026-10-22"
                maxLength={10}
              />
            ) : (
              <T>Prova em {formatDate(date)}</T>
            )}
          </Card>
          <Card>
            <T style={s.sectionTitle}>
              {isUrgent ? 'Tempo disponível' : 'Tempo disponível por dia'}
            </T>
            <View style={[s.row, { flexWrap: 'wrap', gap: 8 }]}>
              {[30, 60, 120, 180].map((value) => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: minutes === String(value) }}
                  onPress={() => setMinutes(String(value))}
                  style={{
                    padding: 13,
                    borderRadius: 10,
                    backgroundColor: minutes === String(value) ? colors.primary : colors.mint,
                  }}
                >
                  <T
                    style={{
                      color: minutes === String(value) ? 'white' : colors.primary,
                      fontSize: 12,
                    }}
                  >
                    {value < 60 ? `${value} min` : `${value / 60} h`}
                  </T>
                </Pressable>
              ))}
            </View>
            <Field
              label="Personalizado (minutos)"
              keyboardType="number-pad"
              value={minutes}
              onChangeText={setMinutes}
              maxLength={3}
            />
          </Card>
          <Card>
            <T style={s.sectionTitle}>Assuntos da prova</T>
            {data.topics.map((topic) => (
              <Pressable
                key={topic.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected.includes(topic.id) }}
                onPress={() =>
                  setSelected((ids) =>
                    ids.includes(topic.id)
                      ? ids.filter((id) => id !== topic.id)
                      : [...ids, topic.id],
                  )
                }
                style={[s.row, { minHeight: 44 }]}
              >
                <Icon name={selected.includes(topic.id) ? 'check-square' : 'square'} size={19} />
                <T style={{ flex: 1, fontSize: 13 }}>{topic.name}</T>
              </Pressable>
            ))}
          </Card>
          <Button
            title={busy ? 'Organizando...' : 'Gerar meu plano'}
            icon="calendar"
            disabled={busy}
            onPress={generate}
          />
          {data.plans.length ? (
            <Button
              title="Abrir último plano salvo"
              variant="ghost"
              onPress={() => setPlan(data.plans[data.plans.length - 1])}
            />
          ) : null}
        </>
      ) : (
        <>
          <Notice text="Plano calculado localmente: menor domínio, erros e revisões pendentes recebem prioridade. Os minutos de cada dia respeitam seu limite." />
          <Card style={{ backgroundColor: colors.mint }}>
            <Badge label="SEU PLANO ESTÁ PRONTO" />
            <T style={s.sectionTitle}>{plan.title}</T>
            <T>
              {plan.dailyMinutes} min por dia · prova em {formatDate(plan.examDate)}
            </T>
          </Card>
          {Array.from(new Set(plan.blocks.map((b) => b.day))).map((day) => (
            <View key={day} style={{ gap: 12 }}>
              <T style={{ fontFamily: fonts.semibold }}>
                {day === localDate() ? 'Hoje' : formatDate(day)}
              </T>
              {plan.blocks
                .filter((b) => b.day === day)
                .map((block) => (
                  <Card key={`${day}-${block.topicId}`}>
                    <View style={[s.row, { justifyContent: 'space-between' }]}>
                      <Badge
                        label={`${block.priority.toUpperCase()} PRIORIDADE`}
                        tone={block.priority === 'Alta' ? 'amber' : 'green'}
                      />
                      <T style={{ fontFamily: fonts.semibold }}>{block.minutes} min</T>
                    </View>
                    <T style={s.sectionTitle}>
                      {data.topics.find((t) => t.id === block.topicId)?.name}
                    </T>
                    <Button
                      title="Estudar este bloco"
                      small
                      variant="ghost"
                      onPress={() =>
                        router.push({ pathname: '/session', params: { topicId: block.topicId } })
                      }
                    />
                  </Card>
                ))}
            </View>
          ))}
          <Button
            title="Começar plano"
            icon="arrow-right"
            onPress={() =>
              router.push({ pathname: '/session', params: { topicId: plan.blocks[0].topicId } })
            }
          />
          <Button title="Ajustar plano" variant="ghost" onPress={() => setPlan(undefined)} />
        </>
      )}
      {error ? <Notice text={error} /> : null}
    </Screen>
  );
}
