import { View } from 'react-native';
import { Button, Card, Empty, Field, Icon, Notice, T, s } from '@/components/ui';
import { Choice, Choices } from '@/components/Choice';
import { useStudy } from '@/hooks/useStudy';
import { fonts } from '@/constants/theme';
import { practiceConcepts, practicePool } from '@/features/study/practice';
import { practiceModeLabels as modeLabels } from '@/constants/practice';
import type { PracticeConfig, PracticeMode } from '@/types/practice';
import { stagePolicies } from '@/features/study/policy';
import { academicStageLabels } from '@/constants/academic';
export function PracticeSettings({
  config,
  update,
  busy,
  questionId,
  form,
  go,
  start,
  authorQuestion,
}: {
  config: PracticeConfig;
  update: (patch: Partial<PracticeConfig>) => void;
  busy: boolean;
  questionId?: string;
  form: {
    quantity: string;
    setQuantity: (quantity: string) => void;
    customCount: boolean;
    setCustomCount: (custom: boolean) => void;
    timer: string;
    setTimer: (timer: string) => void;
  };
  go: (stage: 'manual') => void;
  start: () => Promise<void>;
  authorQuestion: () => void;
}) {
  const { data, mode } = useStudy();
  const { quantity, setQuantity, customCount, setCustomCount, timer, setTimer } = form;
  const available = practicePool(data, config);
  const allConcepts = practiceConcepts(data).filter((concept) =>
    config.topicIds.includes(concept.topicId),
  );
  const insufficientDiagnostic = config.mode === 'diagnostic' && available.length < 5;
  const stage = data.academicJourney?.stage ?? 'UNKNOWN';
  return (
    <>
      {stage !== 'UNKNOWN' ? (
        <Notice
          text={`${academicStageLabels[stage]} · ${stagePolicies[stage].objective} A seleção respeita o banco disponível; o app não gera conteúdo inexistente.`}
        />
      ) : null}
      <Card>
        <View style={s.row}>
          <Icon name="book-open" />
          <T style={{ flex: 1, fontFamily: fonts.semibold }}>
            {data.topics
              .filter((topic) => config.topicIds.includes(topic.id))
              .map((topic) => topic.name)
              .join(' · ') || 'Escolha os conteúdos'}
          </T>
        </View>
        <T muted style={{ fontSize: 12 }}>
          {config.conceptIds.length || allConcepts.length} conceitos · {available.length} questões
          disponíveis
        </T>
        <Button title="Alterar conteúdos" variant="ghost" small onPress={() => go('manual')} />
      </Card>
      <View style={{ gap: 12 }}>
        <T style={s.sectionTitle}>Objetivo</T>
        <Choices>
          {(config.mode === 'diagnostic'
            ? ['diagnostic']
            : (['learn', 'review', 'exam'] as PracticeMode[])
          ).map((value) => (
            <Choice
              key={value}
              label={modeLabels[value as PracticeMode]}
              selected={config.mode === value}
              onPress={() => update({ mode: value as PracticeMode })}
            />
          ))}
        </Choices>
        <T muted style={{ fontSize: 12, lineHeight: 20 }}>
          {config.mode === 'exam'
            ? 'Responda no seu ritmo, marque dúvidas e veja as explicações ao concluir.'
            : config.mode === 'diagnostic'
              ? 'Um primeiro retrato dos conceitos. A estimativa inicial ajuda a montar a próxima sessão.'
              : 'Receba feedback, compare seu raciocínio e reconstrua o conceito antes de avançar.'}
        </T>
      </View>
      <View style={{ gap: 12 }}>
        <T style={s.sectionTitle}>Quantidade</T>
        <Choices>
          {(config.mode === 'diagnostic' ? [5, 10] : [5, 10, 20]).map((count) => (
            <Choice
              key={count}
              label={`${count} questões`}
              selected={!customCount && Number(quantity) === count}
              onPress={() => {
                setCustomCount(false);
                setQuantity(String(count));
              }}
            />
          ))}
          {config.mode !== 'diagnostic' ? (
            <Choice
              label="Personalizado"
              selected={customCount}
              onPress={() => setCustomCount(true)}
            />
          ) : null}
        </Choices>
        {customCount || (questionId && Number(quantity) === 1) ? (
          <Field
            label="Quantidade de questões"
            value={quantity}
            keyboardType="number-pad"
            maxLength={2}
            onChangeText={setQuantity}
          />
        ) : null}
        {Number(quantity) > available.length && available.length > 0 ? (
          <T muted style={{ fontSize: 12 }}>
            Este banco tem {available.length} questões únicas para sua seleção. A sessão terá{' '}
            {available.length}, sem repetir enunciados.
          </T>
        ) : null}
      </View>
      <View style={{ gap: 12 }}>
        <T style={s.sectionTitle}>Dificuldade</T>
        <Choices>
          {(['adaptive', 'Fácil', 'Média', 'Difícil'] as const).map((value) => (
            <Choice
              key={value}
              label={value === 'adaptive' ? 'Adaptativa · recomendada' : value}
              selected={config.difficulty === value}
              onPress={() => update({ difficulty: value })}
            />
          ))}
        </Choices>
        <T muted style={{ fontSize: 12, lineHeight: 20 }}>
          {config.mode === 'exam'
            ? 'A dificuldade adaptativa usa seu histórico para montar a prova antes do início.'
            : 'A dificuldade adaptativa ajusta a próxima questão ao seu histórico e à confiança das respostas.'}
        </T>
      </View>
      {config.mode === 'exam' ? (
        <Card>
          <T style={s.sectionTitle}>Seu simulado</T>
          <Field
            label="Tempo em minutos (opcional)"
            placeholder="Sem limite de tempo"
            keyboardType="number-pad"
            value={timer}
            maxLength={3}
            onChangeText={setTimer}
          />
          <T muted style={{ fontSize: 11 }}>
            O relógio de uma prova com limite continua contando se você sair.
          </T>
          <T>Estilo de prova</T>
          <Choices>
            {(['mixed', 'clinical', 'conceptual'] as const).map((style) => (
              <Choice
                key={style}
                label={
                  {
                    mixed: 'Misto',
                    clinical: 'Casos e interpretação',
                    conceptual: 'Conceitual',
                  }[style]
                }
                selected={config.style === style}
                onPress={() => update({ style })}
              />
            ))}
          </Choices>
        </Card>
      ) : null}
      <Choice
        label="Intercalar conceitos relacionados"
        selected={config.interleaved}
        onPress={() => update({ interleaved: !config.interleaved })}
      />
      {!available.length ? (
        <>
          <Empty
            title="Nenhuma questão disponível nesta seleção"
            message="Altere o estilo ou o conteúdo, ou cadastre uma questão. Novas questões por IA ainda não estão disponíveis."
          />
          <Button title="Criar questão manualmente" variant="secondary" onPress={authorQuestion} />
        </>
      ) : null}
      {insufficientDiagnostic ? (
        <Notice text="O diagnóstico precisa de pelo menos 5 questões disponíveis. Escolha mais conceitos ou cadastre questões antes de começar." />
      ) : null}
      {mode === 'demo' ? (
        <T muted style={{ fontSize: 11, lineHeight: 18 }}>
          Banco de demonstração · exercícios didáticos fictícios. As fontes apresentadas não
          representam arquivos enviados nem referências clínicas verificadas.
        </T>
      ) : null}
      <Button
        title={
          busy
            ? 'Preparando sessão...'
            : config.mode === 'exam'
              ? 'Iniciar simulado'
              : config.mode === 'diagnostic'
                ? 'Começar diagnóstico'
                : 'Iniciar sessão'
        }
        icon="arrow-right"
        disabled={
          busy ||
          !available.length ||
          insufficientDiagnostic ||
          !Number.isInteger(Number(quantity)) ||
          Number(quantity) < 1 ||
          Number(quantity) > 50
        }
        onPress={() => void start()}
      />
    </>
  );
}
