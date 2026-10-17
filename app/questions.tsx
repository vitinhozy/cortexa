import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, Card, T, Badge, Button, Progress, Notice, Empty, Icon, s } from '@/components/ui';
import { useStudy } from '@/hooks/useStudy';
import { colors, fonts } from '@/constants/theme';
import { uid } from '@/utils/date';
import type { QuestionAttempt } from '@/types/domain';
export default function QuestionsScreen() {
  const { topicId, kind, questionId, daily } = useLocalSearchParams<{
    topicId?: string;
    kind?: string;
    questionId?: string;
    daily?: string;
  }>();
  const { data, services } = useStudy();
  const [queue] = useState(() => {
    let all = data.questions.filter((q) => !topicId || q.topicId === topicId);
    if (daily === 'true')
      all = [...all, ...data.questions.filter((q) => q.topicId !== topicId)].slice(0, 5);
    if (kind === 'cases') all = all.filter((q) => ['q-acid-1', 'q-aki'].includes(q.id));
    if (kind === 'exam') all = all.slice(0, 5);
    if (questionId)
      all = [...all.filter((q) => q.id !== questionId), ...all.filter((q) => q.id === questionId)];
    return all;
  });
  const [sessionId] = useState(() => uid('quiz'));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [attempt, setAttempt] = useState<QuestionAttempt>();
  const [score, setScore] = useState(0);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const question = queue[index];
  const topic = data.topics.find((t) => t.id === question?.topicId);
  async function submit() {
    if (!question || !selected || lock.current || attempt) return;
    lock.current = true;
    setBusy(true);
    try {
      const result = await services.questionService.answer(
        question.id,
        selected,
        `${sessionId}-${index}`,
      );
      setAttempt(result);
      setScore((n) => n + Number(result.correct));
    } catch {
      setNotice('Não foi possível registrar. Tente novamente.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function createCard() {
    if (!question) return;
    try {
      await services.flashcardService.fromQuestion(question.id);
      setNotice('Flashcard salvo! Ele já está disponível na sua revisão.');
    } catch {
      setNotice('Não foi possível criar o flashcard.');
    }
  }
  if (!queue.length)
    return (
      <Screen title="Questões" back>
        <Empty
          title="Novas questões em breve"
          message="Este assunto ainda não tem questões nesta demonstração."
        />
      </Screen>
    );
  if (!question)
    return (
      <Screen
        title="Mais um passo dado."
        subtitle="Praticar é descobrir o que merece uma nova atenção."
        back
      >
        <Card style={{ alignItems: 'center', paddingVertical: 35 }}>
          <Icon name="check-circle" size={44} />
          <T style={{ fontSize: 38, lineHeight: 48, fontFamily: fonts.semibold }}>
            {score}/{queue.length}
          </T>
          <T muted>questões corretas nesta sessão</T>
          <Badge label={`${Math.round((score / queue.length) * 100)}% DE ACERTO`} />
          <T muted style={{ textAlign: 'center' }}>
            Seu mapa de conhecimento e caderno de erros foram atualizados.
          </T>
        </Card>
        <Button
          title="Revisar meus erros"
          icon="edit-3"
          onPress={() => router.replace('/mistakes')}
        />
        <Button
          title="Revisar flashcards"
          variant="secondary"
          onPress={() => router.replace('/flashcards')}
        />
        <Button title="Voltar ao estudo" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  return (
    <Screen
      title={
        kind === 'cases'
          ? 'Raciocínio em prática'
          : kind === 'exam'
            ? 'Simulado de Fisiologia'
            : 'Uma questão de cada vez'
      }
      subtitle={topic?.name}
      eyebrow="PRÁTICA ATIVA"
      back
    >
      <View style={{ gap: 10 }}>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <T muted style={{ fontSize: 12 }}>
            Questão {index + 1} de {queue.length}
          </T>
          <Badge label={question.difficulty} tone="neutral" />
        </View>
        <Progress value={(index / queue.length) * 100} />
      </View>
      <Card>
        <Badge label="CASO DIDÁTICO · FICTÍCIO" tone="blue" />
        <T style={{ fontSize: 17, lineHeight: 28, fontFamily: fonts.medium }}>{question.prompt}</T>
      </Card>
      <View style={{ gap: 10 }}>
        {question.options.map((option) => {
          const correct = attempt && option.id === question.correctOptionId;
          const wrong = attempt && !attempt.correct && option.id === selected;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityLabel={`${option.id}. ${option.text}`}
              accessibilityState={{ checked: selected === option.id, disabled: !!attempt }}
              disabled={!!attempt}
              onPress={() => setSelected(option.id)}
              style={{
                borderWidth: 1.5,
                borderColor: correct
                  ? colors.primary
                  : wrong
                    ? colors.red
                    : selected === option.id
                      ? colors.primary
                      : colors.line,
                backgroundColor: correct ? colors.mint : wrong ? colors.redLight : 'white',
                padding: 17,
                borderRadius: 15,
              }}
            >
              <View style={s.row}>
                <View
                  style={{
                    width: 29,
                    height: 29,
                    borderRadius: 9,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected === option.id ? colors.primary : '#F1F4F2',
                  }}
                >
                  <T
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: 12,
                      color: selected === option.id ? 'white' : colors.muted,
                    }}
                  >
                    {option.id}
                  </T>
                </View>
                <T style={{ flex: 1, fontSize: 13 }}>{option.text}</T>
                {correct ? <Icon name="check-circle" size={18} /> : null}
                {wrong ? <Icon name="x-circle" size={18} color={colors.red} /> : null}
              </View>
              {attempt ? (
                <T muted style={{ marginTop: 12, fontSize: 12, lineHeight: 20 }}>
                  {option.explanation}
                </T>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {!attempt ? (
        <Button
          title={busy ? 'Registrando...' : 'Responder'}
          disabled={!selected || busy}
          onPress={submit}
        />
      ) : (
        <>
          <Card style={{ backgroundColor: attempt.correct ? colors.mint : colors.amberLight }}>
            <T style={s.sectionTitle}>
              {attempt.correct
                ? 'Isso mesmo. Conceito consolidado!'
                : 'Um erro, uma oportunidade de entender.'}
            </T>
            <T style={{ fontFamily: fonts.semibold }}>
              Alternativa correta: {question.correctOptionId}
            </T>
            <T style={{ lineHeight: 24 }}>{question.explanation}</T>
            <T muted style={{ fontSize: 11 }}>
              {question.source}
            </T>
            {!attempt.correct ? (
              <T style={{ fontSize: 12 }}>
                Registramos este erro e ajustamos a prioridade do assunto no seu mapa.
              </T>
            ) : null}
          </Card>
          <View style={{ gap: 9 }}>
            <Button
              title="Explicar com IA"
              variant="secondary"
              icon="zap"
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/ai',
                  params: {
                    topicId: question.topicId,
                    prompt: `Explique a questão: ${question.prompt}`,
                  },
                })
              }
            />
            <Button
              title={
                attempt.correct ? 'Criar flashcard desta questão' : 'Criar flashcard deste erro'
              }
              variant="secondary"
              icon="layers"
              onPress={createCard}
            />
            <Button
              title="Estudar este assunto"
              variant="ghost"
              onPress={() =>
                router.push({ pathname: '/session', params: { topicId: question.topicId } })
              }
            />
            <Button
              title={index === queue.length - 1 ? 'Ver resultado' : 'Próxima questão'}
              icon="arrow-right"
              onPress={() => {
                setIndex((n) => n + 1);
                setSelected('');
                setAttempt(undefined);
                setNotice('');
              }}
            />
          </View>
        </>
      )}
      {notice ? <Notice text={notice} /> : null}
    </Screen>
  );
}
