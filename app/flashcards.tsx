import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, Card, T, Badge, Progress, Button, Empty, Icon, Notice, s } from '@/components/ui';
import { useStudy } from '@/hooks/useStudy';
import { colors, fonts } from '@/constants/theme';
import type { ReviewRating } from '@/types/domain';
import { useMotion } from '@/hooks/useMotion';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { uid } from '@/utils/date';
const ratings: { value: ReviewRating; label: string; time: string; color: string }[] = [
  { value: 'again', label: 'Não lembrei', time: '10 min', color: colors.redLight },
  { value: 'hard', label: 'Difícil', time: '1 dia', color: colors.amberLight },
  { value: 'good', label: 'Bom', time: '3+ dias', color: colors.mint },
  { value: 'easy', label: 'Fácil', time: '7+ dias', color: colors.blueLight },
];
export default function FlashcardsScreen() {
  const { replace, dismissTo } = useAppNavigation();
  const { topicId, flashcardId } = useLocalSearchParams<{
    topicId?: string;
    flashcardId?: string;
  }>();
  const { reduced, tap } = useMotion();
  const { data, services, repository } = useStudy();
  const [queue] = useState(() =>
    data.flashcards.filter((c) =>
      flashcardId
        ? c.id === flashcardId
        : (!topicId || c.topicId === topicId) &&
          Date.parse(c.dueAt.length === 10 ? `${c.dueAt}T00:00:00` : c.dueAt) <= Date.now(),
    ),
  );
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const reviewOperations = useRef<Record<string, string>>({});
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => () => opacity.stopAnimation(), [opacity]);
  const card = queue[index];
  function flip() {
    tap();
    opacity.stopAnimation();
    if (reduced) {
      opacity.setValue(1);
      setFlipped((value) => !value);
      return;
    }
    Animated.timing(opacity, { toValue: 0.2, duration: 100, useNativeDriver: true }).start(
      ({ finished }) => {
        if (!finished) return;
        setFlipped((value) => !value);
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      },
    );
  }
  async function review(rating: ReviewRating) {
    if (!card || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const operationKey = `${card.id}:${rating}`;
      const operationId =
        reviewOperations.current[operationKey] ??
        (reviewOperations.current[operationKey] = uid('review'));
      await services.flashcardService.review(card.id, rating, operationId);
      if (!(await repository.flush()) && !(await repository.retryPersistence()))
        throw new Error('Falha ao gravar a revisão.');
      setFlipped(false);
      setIndex((i) => i + 1);
    } catch {
      setError('Não foi possível salvar sua revisão. Tente novamente.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Screen
      title="Lembrar fica mais fácil."
      subtitle="Pense na resposta. Depois, vire o card."
      eyebrow="FLASHCARDS"
      back
      backTo="/study"
    >
      <Button
        title="Criar flashcard"
        icon="plus"
        variant="secondary"
        onPress={() => router.push({ pathname: '/compose', params: { kind: 'flashcards' } })}
      />
      {!card ? (
        <>
          <Empty
            icon="check-circle"
            title={queue.length ? 'Revisão concluída!' : 'Tudo revisado por aqui'}
            message={
              queue.length
                ? `Você revisou ${queue.length} cards. As próximas revisões foram agendadas conforme suas respostas.`
                : 'Nenhum card está vencido neste assunto. Os próximos aparecerão na data agendada.'
            }
          />
          <Button title="Ver mapa de conhecimento" onPress={() => replace('/knowledge')} />
          <Button title="Voltar a Estudar" variant="ghost" onPress={() => dismissTo('/study')} />
        </>
      ) : (
        <>
          {flashcardId ? (
            <Notice text="Card aberto pela busca. Você pode consultar a resposta sem avaliar; escolher uma avaliação reagenda sua próxima revisão." />
          ) : null}
          <View style={{ gap: 10 }}>
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <T muted>{queue.length - index} cards restantes</T>
              <T muted style={{ fontSize: 12 }}>
                {index + 1} / {queue.length}
              </T>
            </View>
            <Progress value={(index / queue.length) * 100} />
          </View>
          <Badge label={data.topics.find((t) => t.id === card.topicId)?.name ?? 'Fisiologia'} />
          <Animated.View style={{ opacity }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={flipped ? 'Ver pergunta' : 'Virar flashcard'}
              onPress={flip}
            >
              <Card
                style={{
                  minHeight: 310,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingVertical: 40,
                  backgroundColor: flipped ? colors.lavender : colors.surface,
                }}
              >
                <T style={{ fontSize: 10, letterSpacing: 2, color: colors.primary }}>
                  {flipped ? 'RESPOSTA' : 'PERGUNTA'}
                </T>
                <T
                  style={{
                    fontSize: 22,
                    fontFamily: fonts.medium,
                    lineHeight: 34,
                    textAlign: 'center',
                    paddingVertical: 15,
                  }}
                >
                  {flipped ? card.back : card.front}
                </T>
                <View style={s.row}>
                  <Icon name="rotate-cw" size={14} color={colors.muted} />
                  <T muted style={{ fontSize: 11 }}>
                    Toque para {flipped ? 'ver a pergunta' : 'revelar a resposta'}
                  </T>
                </View>
              </Card>
            </Pressable>
          </Animated.View>
          {flipped ? (
            <View style={{ gap: 14 }}>
              <T style={{ textAlign: 'center', fontFamily: fonts.medium }}>Como foi lembrar?</T>
              <View style={[s.grid, { gap: 9 }]}>
                {ratings.map((rating) => (
                  <Pressable
                    key={rating.value}
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() => review(rating.value)}
                    style={{
                      flexBasis: '45%',
                      flexGrow: 1,
                      minHeight: 72,
                      borderRadius: 14,
                      backgroundColor: rating.color,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      opacity: busy ? 0.5 : 1,
                    }}
                  >
                    <T style={{ fontFamily: fonts.semibold, fontSize: 13 }}>{rating.label}</T>
                    <T muted style={{ fontSize: 11 }}>
                      {rating.time}
                    </T>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <Button title="Mostrar resposta" onPress={flip} variant="secondary" />
          )}
          <T muted style={{ fontSize: 11, textAlign: 'center' }}>
            Sua resposta define quando este card volta à revisão.
          </T>
        </>
      )}
      {error ? <Notice text={error} /> : null}
    </Screen>
  );
}
