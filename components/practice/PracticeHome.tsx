import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Empty, Icon, T, s, type IconName } from '@/components/ui';
import { useStudy } from '@/hooks/useStudy';
import { useAvailableWidth } from '@/hooks/useAvailableWidth';
import { colors, fonts } from '@/constants/theme';
import {
  continuingTopics,
  estimateConceptMastery,
  practiceConcepts,
  practiceWeakConcepts,
} from '@/features/study/practice';
import { formatDate } from '@/utils/date';
import type { PracticeConfig, PracticeMode } from '@/types/practice';
export function PracticeHome({
  update,
  busy,
  chooseTopics,
  go,
  authorQuestion,
  setQuantity,
}: {
  update: (patch: Partial<PracticeConfig>) => void;
  busy: boolean;
  chooseTopics: (
    topicIds: string[],
    sourceIds?: string[],
    conceptIds?: string[],
    mode?: PracticeMode,
  ) => Promise<void>;
  go: (stage: 'sources' | 'new' | 'manual') => void;
  authorQuestion: () => void;
  setQuantity: (quantity: string) => void;
}) {
  const { data, mode } = useStudy();
  const width = useAvailableWidth();
  const weak = practiceWeakConcepts(data);
  const due = (data.practice?.reviews ?? []).filter(
    (review) =>
      Date.parse(review.dueAt) <= Date.now() &&
      practiceConcepts(data).some((c) => c.id === review.conceptId),
  );
  const continuing = continuingTopics(data).slice(0, width >= 850 ? 3 : 4);
  const unfinished = [...(data.practice?.sessions ?? [])]
    .reverse()
    .find((session) => session.status !== 'completed');
  const lastResult = [...(data.practice?.sessions ?? [])]
    .reverse()
    .find((session) => session.status === 'completed');
  return (
    <>
      {unfinished ? (
        <Card style={{ padding: 14, gap: 10 }}>
          <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
            <View style={[s.row, { flex: 1, minWidth: 180 }]}>
              <Icon name="play-circle" />
              <View style={{ flex: 1, gap: 3 }}>
                <T style={{ fontFamily: fonts.semibold }}>Sessão em andamento</T>
                <T muted style={{ fontSize: 11 }}>
                  {
                    unfinished.items.filter((item) => item.attemptId || item.selectedOptionId)
                      .length
                  }{' '}
                  de {unfinished.config.count} questões salvas neste dispositivo
                </T>
              </View>
            </View>
            <Button
              title="Retomar sessão"
              small
              onPress={() =>
                router.push({ pathname: '/practice/[id]', params: { id: unfinished.id } })
              }
            />
          </View>
        </Card>
      ) : null}
      {weak.length ? (
        <Card style={{ backgroundColor: colors.lavender, borderColor: colors.lavenderLine }}>
          <T style={{ fontSize: 10, color: colors.primaryDark, letterSpacing: 1 }}>
            RECOMENDADO PARA VOCÊ
          </T>
          <T style={{ fontSize: 23, fontFamily: fonts.semibold }}>Revisar pontos fracos</T>
          <T muted>
            {weak.length} {weak.length === 1 ? 'conceito merece' : 'conceitos merecem'} uma nova
            tentativa, em situações diferentes.
          </T>
          <View style={{ gap: 10 }}>
            {weak.slice(0, 3).map((concept) => {
              const mastery = estimateConceptMastery(data, concept.id);
              return (
                <View
                  key={concept.id}
                  style={[s.row, { justifyContent: 'space-between', gap: 12 }]}
                >
                  <T style={{ flex: 1, fontSize: 13 }}>{concept.name}</T>
                  <T muted style={{ fontSize: 12 }}>
                    {mastery.exposures ? `${mastery.value}% estimado` : 'Revisão indicada'}
                  </T>
                </View>
              );
            })}
          </View>
          <Button
            title="Começar revisão"
            icon="arrow-right"
            disabled={busy}
            onPress={() => {
              setQuantity('5');
              void chooseTopics(
                [...new Set(weak.map((concept) => concept.topicId))],
                [],
                weak.map((concept) => concept.id),
                'review',
              );
            }}
          />
        </Card>
      ) : null}
      {due.length ? (
        <Card>
          <View style={s.row}>
            <Icon name="refresh-cw" />
            <T style={s.sectionTitle}>Revisões para hoje</T>
          </View>
          {due.slice(0, 3).map((review) => (
            <T key={review.conceptId} muted>
              {practiceConcepts(data).find((concept) => concept.id === review.conceptId)?.name ??
                data.topics.find((topic) => topic.id === review.topicId)?.name}
            </T>
          ))}
          <Button
            title="Revisar conceitos de hoje"
            variant="secondary"
            onPress={() => {
              setQuantity('5');
              void chooseTopics(
                [...new Set(due.map((review) => review.topicId))],
                [],
                due.map((review) => review.conceptId),
                'review',
              );
            }}
          />
        </Card>
      ) : null}
      {continuing.length ? (
        <>
          <T style={s.sectionTitle}>Assuntos para praticar</T>
          <View style={[s.grid, { gap: 12 }]}>
            {continuing.map(({ topic, metric, lastActivity }) => (
              <Card
                key={topic.id}
                label={`Praticar ${topic.name}`}
                onPress={() => void chooseTopics([topic.id])}
                style={{
                  flexBasis: width >= 800 ? '30%' : '100%',
                  flexGrow: 1,
                  minHeight: 156,
                  justifyContent: 'space-between',
                }}
              >
                <View style={[s.row, { justifyContent: 'space-between' }]}>
                  <Icon name="book-open" size={20} />
                  <Icon name="arrow-up-right" size={16} color={colors.muted} />
                </View>
                <T style={{ fontFamily: fonts.semibold }}>{topic.name}</T>
                <T muted style={{ fontSize: 11 }}>
                  Última atividade: {formatDate(lastActivity!)}
                </T>
                {metric?.answered ? (
                  <T style={{ color: colors.primaryDark, fontSize: 12 }}>
                    {metric.mastery}% de domínio{' '}
                    {mode === 'demo' &&
                    !data.attempts.some((attempt) => attempt.topicId === topic.id)
                      ? 'demonstrativo'
                      : 'estimado'}
                  </T>
                ) : (
                  <T muted style={{ fontSize: 12 }}>
                    Ainda sem estimativa de domínio
                  </T>
                )}
              </Card>
            ))}
          </View>
        </>
      ) : (
        <Empty
          title="Seu próximo estudo começa aqui"
          message="Escolha um assunto ou um material. Seu histórico será construído a partir das atividades que você realizar."
        />
      )}
      <T style={s.sectionTitle}>Outras formas de praticar</T>
      <View style={[s.grid, { gap: 12 }]}>
        {(
          [
            [
              'Usar meus materiais',
              'Arquivos, anotações, conversas e conteúdos salvos.',
              'file-text',
              () => go('sources'),
            ],
            [
              'Adicionar novo material',
              'Comece com um texto ou anotação.',
              'plus',
              () => go('new'),
            ],
            [
              'Escolher assunto',
              'Encontre o conceito que quer praticar.',
              'search',
              () => go('manual'),
            ],
            [
              'Diagnóstico rápido',
              'Um ponto de partida, sem nota ou julgamento.',
              'compass',
              () => {
                update({ mode: 'diagnostic', count: 5 });
                setQuantity('5');
                go('manual');
              },
            ],
          ] as [string, string, IconName, () => void][]
        ).map(([label, detail, icon, onPress]) => (
          <Card
            key={label}
            label={label}
            onPress={onPress}
            style={{ flexBasis: width >= 650 ? '46%' : '100%', flexGrow: 1 }}
          >
            <View style={s.row}>
              <Icon name={icon} />
              <T style={{ fontFamily: fonts.semibold, flex: 1 }}>{label}</T>
              <Icon name="chevron-right" size={17} color={colors.muted} />
            </View>
            <T muted style={{ fontSize: 12, lineHeight: 19 }}>
              {detail}
            </T>
          </Card>
        ))}
      </View>
      {data.attempts.length < 5 ? (
        <T muted style={{ lineHeight: 22 }}>
          Ainda estamos conhecendo seu ritmo. O diagnóstico curto ajuda a escolher por onde começar
          e mostra quando há pouca evidência.
        </T>
      ) : null}
      <Button
        title="Criar questão manualmente"
        variant="ghost"
        icon="edit-3"
        onPress={authorQuestion}
      />
      {lastResult ? (
        <Button
          title="Ver último resultado"
          variant="ghost"
          onPress={() => router.push({ pathname: '/practice/[id]', params: { id: lastResult.id } })}
        />
      ) : null}
    </>
  );
}
