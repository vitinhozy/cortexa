import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen, Card, T, Button, Icon, Notice, Empty, Progress, s } from '@/components/ui';
import { BottomSheet } from '@/components/BottomSheet';
import { Choice, Choices } from '@/components/Choice';
import { useStudy } from '@/hooks/useStudy';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { attemptForItem, studySources } from '@/features/study/practice';
import { colors, fonts } from '@/constants/theme';
import { QuestionFeedback, QuestionOptions } from './QuestionContent';
import { PracticeResult, durationLabel } from './PracticeResult';
import type { Confidence } from '@/types/practice';

export function PracticeRunner({ id }: { id: string }) {
  const { data, services, repository } = useStudy();
  const { replace, dismissTo } = useAppNavigation();
  const session = data.practice?.sessions.find((value) => value.id === id);
  const completed = session?.status === 'completed';
  const [clock, setClock] = useState(Date.now());
  const [finishSheet, setFinishSheet] = useState(false);
  const [conceptSheet, setConceptSheet] = useState(false);
  const [indexSheet, setIndexSheet] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const saveElapsed = useRef<() => void>(() => {});
  useFocusEffect(
    useCallback(() => {
      if (
        completed ||
        !repository.getSnapshot().practice?.sessions.some((value) => value.id === id)
      )
        return;
      services.practiceService.resume(id);
      let last = Date.now();
      let active = AppState.currentState === 'active';
      const saveTime = () => {
        const seconds = Math.floor((Date.now() - last) / 1000);
        if (active && seconds > 0) services.practiceService.tick(id, Math.min(30, seconds));
        last = Date.now();
      };
      saveElapsed.current = saveTime;
      setClock(Date.now());
      const subscription = AppState.addEventListener('change', (state) => {
        saveTime();
        active = state === 'active';
      });
      const interval = setInterval(() => {
        setClock(Date.now());
        if (active && Date.now() - last >= 5000) saveTime();
        else if (!active) last = Date.now();
      }, 1000);
      return () => {
        clearInterval(interval);
        subscription.remove();
        saveTime();
        saveElapsed.current = () => {};
      };
    }, [completed, id, repository, services]),
  );
  useEffect(() => {
    if (session?.deadlineAt && !completed && clock >= Date.parse(session.deadlineAt))
      services.practiceService.finish(id);
  }, [clock, completed, id, services, session?.deadlineAt]);
  if (!session)
    return (
      <Screen title="Esta sessão não está disponível." back backTo="/questions">
        <Empty
          title="Vamos preparar uma nova prática?"
          message="A sessão não está neste espaço de estudo. Seu histórico e suas fontes continuam separados por usuário."
        />
        <Button title="Abrir Questões" onPress={() => replace('/questions')} />
      </Screen>
    );
  if (completed) return <PracticeResult session={session} />;
  const exam = session.config.mode === 'exam';
  const item = session.items[session.currentIndex];
  const question = item.question;
  const topic = data.topics.find((value) => value.id === question.topicId);
  const attempt = !exam ? attemptForItem(data, session, session.currentIndex) : undefined;
  const remaining = session.deadlineAt
    ? Math.max(0, Math.ceil((Date.parse(session.deadlineAt) - clock) / 1000))
    : undefined;
  const sourceIds =
    question.citations?.flatMap((citation) => (citation.sourceId ? [citation.sourceId] : [])) ?? [];
  const sourceContent = studySources(data).filter(
    (source) => sourceIds.includes(source.id) && source.content,
  );
  async function commit(confidence: Confidence) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      saveElapsed.current();
      services.practiceService.answer(id, confidence);
      await repository.flush();
      if (repository.storageError)
        throw new Error(
          'Resposta registrada nesta sessão, mas não foi possível gravar no dispositivo.',
        );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível registrar a resposta.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function leave() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      saveElapsed.current();
      services.practiceService.pause(id);
      await repository.flush();
      if (repository.storageError)
        throw new Error(
          'Não foi possível gravar a pausa no dispositivo. Sua sessão permanece aberta; tente novamente antes de fechar o app.',
        );
      dismissTo('/questions');
    } catch (reason) {
      services.practiceService.resume(id);
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar a pausa.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Screen
      title={
        exam
          ? 'Seu simulado.'
          : session.config.mode === 'diagnostic'
            ? 'Vamos conhecer seu ritmo.'
            : 'Uma ideia de cada vez.'
      }
      subtitle={topic?.name}
      eyebrow={exam ? 'AVALIAÇÃO, NO SEU TEMPO' : 'RECUPERE. COMPARE. COMPREENDA.'}
      back
      backTo="/questions"
      onBack={() => leave()}
      scrollResetKey={`${id}:${session.currentIndex}`}
    >
      <View style={{ width: '100%', maxWidth: 760, alignSelf: 'center', gap: 22 }}>
        <View style={{ gap: 10 }}>
          <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
            <T style={{ fontFamily: fonts.medium, fontSize: 13 }}>
              Questão {session.currentIndex + 1} de {session.config.count}
            </T>
            {exam ? (
              <T
                accessibilityLiveRegion={
                  remaining !== undefined && remaining <= 10 ? 'polite' : 'none'
                }
                style={{
                  fontSize: 13,
                  color: remaining !== undefined && remaining < 60 ? colors.red : colors.muted,
                }}
              >
                Tempo:{' '}
                {remaining === undefined
                  ? durationLabel(session.elapsedSeconds)
                  : durationLabel(remaining)}
              </T>
            ) : (
              <T muted style={{ fontSize: 12 }}>
                {question.authored ? 'Criada por você' : 'Exercício fictício · demonstração'}
              </T>
            )}
          </View>
          <Progress value={((session.currentIndex + 1) / session.config.count) * 100} height={4} />
        </View>
        <Card>
          {question.caseGroupId ? (
            <T muted style={{ fontSize: 12 }}>
              Caso progressivo · etapa {question.caseStep}
            </T>
          ) : null}
          <T
            testID="practice-prompt"
            style={{ fontFamily: fonts.medium, fontSize: 18, lineHeight: 30 }}
          >
            {question.prompt}
          </T>
        </Card>
        <QuestionOptions
          question={question}
          selected={item.selectedOptionId}
          locked={!exam && !!item.locked}
          attempt={attempt}
          onSelect={(optionId) => services.practiceService.select(id, optionId)}
        />
        {error ? <Notice text={error} /> : null}
        {exam ? (
          <>
            <Choice
              label={item.flagged ? 'Marcada para revisar' : 'Marcar para revisar'}
              selected={!!item.flagged}
              onPress={() => services.practiceService.flag(id)}
            />
            <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
              <Button
                title="Anterior"
                icon="arrow-left"
                variant="secondary"
                disabled={session.currentIndex === 0}
                onPress={() => services.practiceService.move(id, session.currentIndex - 1)}
              />
              <Button
                title="Próxima"
                icon="arrow-right"
                disabled={session.currentIndex === session.items.length - 1}
                onPress={() => services.practiceService.move(id, session.currentIndex + 1)}
              />
            </View>
            <Button title="Revisar marcações" variant="ghost" onPress={() => setIndexSheet(true)} />
            <Button title="Finalizar simulado" onPress={() => setFinishSheet(true)} />
          </>
        ) : !item.locked ? (
          <Button
            title="Responder"
            disabled={!item.selectedOptionId}
            onPress={() => services.practiceService.lock(id)}
          />
        ) : !attempt ? (
          <Card style={{ borderColor: colors.lavenderLine }}>
            <T style={s.sectionTitle}>Quão seguro você estava?</T>
            <T muted style={{ fontSize: 12, lineHeight: 21 }}>
              Antes de ver a explicação, como você chegou a essa resposta?
            </T>
            <Choices>
              {(
                [
                  ['certain', 'Tinha certeza'],
                  ['unsure', 'Estava em dúvida'],
                  ['guess', 'Chutei'],
                ] as [Confidence, string][]
              ).map(([value, label]) => (
                <Button
                  key={value}
                  title={label}
                  small
                  variant="secondary"
                  disabled={busy}
                  onPress={() => void commit(value)}
                />
              ))}
            </Choices>
          </Card>
        ) : (
          <>
            <QuestionFeedback question={question} attempt={attempt} />
            <Button
              title="Revisar conceito"
              variant="secondary"
              icon="book-open"
              onPress={() => setConceptSheet(true)}
            />
            <Button
              title={
                session.currentIndex + 1 >= session.config.count
                  ? 'Ver resultado'
                  : 'Próxima questão'
              }
              icon="arrow-right"
              disabled={busy}
              onPress={() => {
                setNotice('');
                services.practiceService.advance(id);
              }}
            />
            <Button
              title={
                attempt.correct ? 'Criar flashcard desta questão' : 'Criar flashcard deste erro'
              }
              variant="ghost"
              icon="layers"
              onPress={async () => {
                try {
                  await services.flashcardService.fromQuestion(question.id);
                  setNotice('Flashcard salvo! Ele já está disponível na sua revisão.');
                } catch {
                  setError(
                    'Não foi possível criar o flashcard. A questão pode ter sido removida do banco.',
                  );
                }
              }}
            />
          </>
        )}
        {notice ? <Notice text={notice} /> : null}
        <Button
          title="Pausar e sair"
          variant="ghost"
          disabled={busy}
          onPress={() => void leave()}
        />
        <BottomSheet
          visible={conceptSheet}
          onClose={() => setConceptSheet(false)}
          title="Revisar conceito"
        >
          <T style={s.sectionTitle}>{question.conceptName ?? topic?.name}</T>
          <T style={{ lineHeight: 25 }}>{question.explanation}</T>
          {topic?.keyPoints.map((point) => (
            <View key={point} style={[s.row, { alignItems: 'flex-start' }]}>
              <Icon name="chevron-right" size={16} />
              <T style={{ flex: 1, lineHeight: 23 }}>{point}</T>
            </View>
          ))}
          {sourceContent.map((source) => (
            <Card key={source.id}>
              <T style={{ fontFamily: fonts.semibold }}>Do seu material: {source.title}</T>
              <T style={{ lineHeight: 23 }}>{source.content}</T>
            </Card>
          ))}
          <Button title="Voltar à questão" onPress={() => setConceptSheet(false)} />
        </BottomSheet>
        <BottomSheet
          visible={indexSheet}
          onClose={() => setIndexSheet(false)}
          title="Suas marcações"
        >
          <T muted>Revise respostas e questões em branco antes de entregar.</T>
          <Choices>
            {session.items.map((entry, index) => (
              <Choice
                key={entry.question.id}
                label={`Questão ${index + 1}${entry.flagged ? ' · marcada' : ''}${entry.selectedOptionId ? ' · respondida' : ' · em branco'}`}
                selected={session.currentIndex === index}
                onPress={() => {
                  services.practiceService.move(id, index);
                  setIndexSheet(false);
                }}
              />
            ))}
          </Choices>
          <Button title="Voltar ao simulado" onPress={() => setIndexSheet(false)} />
        </BottomSheet>
        <BottomSheet
          visible={finishSheet}
          onClose={() => setFinishSheet(false)}
          title="Entregar simulado?"
        >
          <T style={{ lineHeight: 24 }}>
            {session.items.filter((entry) => entry.selectedOptionId).length} de{' '}
            {session.items.length} questões respondidas.{' '}
            {session.items.filter((entry) => entry.flagged).length} marcadas para revisar.
          </T>
          <T muted>
            Depois de entregar, você verá o resultado e as explicações. As respostas ficarão
            bloqueadas.
          </T>
          <Button
            title="Entregar e ver análise"
            onPress={() => {
              setFinishSheet(false);
              services.practiceService.finish(id);
            }}
          />
          <Button
            title="Continuar respondendo"
            variant="ghost"
            onPress={() => setFinishSheet(false)}
          />
        </BottomSheet>
      </View>
    </Screen>
  );
}
