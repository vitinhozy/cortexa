import { useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Icon, Notice, Progress, Screen, T, s } from '@/components/ui';
import { QuestionFeedback, QuestionOptions } from './QuestionContent';
import { useStudy } from '@/hooks/useStudy';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { attemptForItem, practiceReport } from '@/features/study/practice';
import { colors, fonts } from '@/constants/theme';
import type { PracticeSession } from '@/types/practice';

export const durationLabel = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
export function PracticeResult({ session }: { session: PracticeSession }) {
  const { data, services, repository } = useStudy();
  const { replace, dismissTo } = useAppNavigation();
  const lock = useRef(false);
  const [reviewIndex, setReviewIndex] = useState<number>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const report = practiceReport(data, session);
  const diagnostic = session.config.mode === 'diagnostic';
  const item = reviewIndex !== undefined ? session.items[reviewIndex] : undefined;
  const attempt =
    reviewIndex !== undefined ? attemptForItem(data, session, reviewIndex) : undefined;
  return (
    <Screen
      title={
        diagnostic
          ? 'Seu ponto de partida.'
          : session.config.mode === 'exam'
            ? 'Simulado concluído.'
            : 'Sessão concluída.'
      }
      subtitle={
        diagnostic
          ? 'Já temos uma ideia de onde concentrar seus estudos. Cada resposta ajuda a escolher o próximo passo.'
          : 'Veja o que ficou mais claro e o que merece outra tentativa.'
      }
      eyebrow={diagnostic ? 'CONHECER PARA APRENDER' : 'SEU APRENDIZADO, EM PERSPECTIVA'}
      back
      backTo="/questions"
      onBack={() => dismissTo('/questions')}
    >
      <View style={{ width: '100%', maxWidth: 800, alignSelf: 'center', gap: 24 }}>
        <Card style={{ backgroundColor: colors.lavender, borderColor: colors.lavenderLine }}>
          <Icon name="check-circle" size={28} />
          <T style={{ fontFamily: fonts.semibold, fontSize: 32, lineHeight: 40 }}>
            {diagnostic
              ? `${report.attempts.length} respostas registradas`
              : `${report.correct} / ${session.items.length} questões`}
          </T>
          <T muted>
            {diagnostic
              ? 'Um primeiro retrato, sem nota ou julgamento.'
              : `${report.attempts.length} respondidas · ${session.items.length - report.attempts.length} sem resposta`}
          </T>
          <T style={{ fontSize: 13 }}>Tempo de prática: {durationLabel(session.elapsedSeconds)}</T>
          <T muted style={{ fontSize: 11, lineHeight: 19 }}>
            O domínio é uma estimativa baseada em respostas, dificuldade, confiança e recência.
            Poucas respostas ainda não demonstram domínio consolidado.
          </T>
        </Card>
        {report.strengths.length ? (
          <Card>
            <View style={s.row}>
              <Icon name="check" color={colors.teal} />
              <T style={s.sectionTitle}>Pontos fortes nesta sessão</T>
            </View>
            {report.strengths.map((concept) => (
              <T key={concept.id} style={{ lineHeight: 23 }}>
                {concept.name} · {concept.correct} acertos
              </T>
            ))}
          </Card>
        ) : null}
        {report.weak.length ? (
          <Card>
            <View style={s.row}>
              <Icon name="refresh-cw" color={colors.amber} />
              <T style={s.sectionTitle}>Você precisa revisar</T>
            </View>
            {report.weak.map((concept) => (
              <View key={concept.id} style={{ gap: 5 }}>
                <T style={{ fontFamily: fonts.medium }}>{concept.name}</T>
                <T muted style={{ fontSize: 12 }}>
                  {concept.errors
                    ? `${concept.errors} ${concept.errors === 1 ? 'erro' : 'erros'}`
                    : 'Evidência ainda inicial'}
                  {concept.confidentErrors
                    ? ` · ${concept.confidentErrors} com alta confiança`
                    : ''}
                </T>
              </View>
            ))}
          </Card>
        ) : null}
        <T style={s.sectionTitle}>
          {diagnostic ? 'Como estão os conceitos' : 'Domínio estimado por conceito'}
        </T>
        {report.concepts.map((concept) => (
          <Card key={concept.id}>
            <View style={[s.row, { justifyContent: 'space-between', gap: 12 }]}>
              <T style={{ flex: 1, fontFamily: fonts.medium }}>{concept.name}</T>
              <T style={{ color: colors.primary, fontFamily: fonts.semibold }}>
                {concept.mastery.exposures
                  ? `${concept.before ? `${concept.before}% → ` : ''}${concept.mastery.value}%`
                  : 'Sem evidência'}
              </T>
            </View>
            <Progress value={concept.mastery.value} />
            <T muted style={{ fontSize: 11 }}>
              {concept.mastery.exposures} respostas no histórico ·{' '}
              {concept.mastery.sufficientEvidence
                ? 'Estimativa em desenvolvimento'
                : 'Estimativa inicial; precisamos de mais tentativas'}
            </T>
          </Card>
        ))}
        <Card style={{ borderColor: colors.lavenderLine }}>
          <T style={s.sectionTitle}>Seu próximo passo</T>
          <T style={{ lineHeight: 25 }}>{report.recommendation.detail}</T>
          <T muted style={{ fontSize: 12 }}>
            As próximas revisões estão na área de Questões. O conceito retorna com outra pergunta
            quando houver uma variante disponível.
          </T>
        </Card>
        {error ? <Notice text={error} /> : null}
        <Button
          title="Revisar minhas respostas"
          variant="secondary"
          icon="list"
          onPress={() => setReviewIndex(0)}
        />
        {item ? (
          <Card>
            <T style={s.sectionTitle}>
              Questão {(reviewIndex ?? 0) + 1} de {session.items.length}
              {item.flagged ? ' · marcada' : ''}
            </T>
            <T style={{ lineHeight: 27, fontFamily: fonts.medium }}>{item.question.prompt}</T>
            <QuestionOptions
              question={item.question}
              selected={item.selectedOptionId}
              attempt={attempt}
              locked
              onSelect={() => {}}
            />
            {attempt ? (
              <QuestionFeedback question={item.question} attempt={attempt} />
            ) : (
              <Notice
                text={`Você não respondeu esta questão. Alternativa correta: ${item.question.correctOptionId}. ${item.question.explanation}`}
              />
            )}
            <View style={[s.row, { flexWrap: 'wrap' }]}>
              <Button
                title="Resposta anterior"
                small
                variant="ghost"
                disabled={reviewIndex === 0}
                onPress={() => setReviewIndex((index) => Math.max(0, (index ?? 0) - 1))}
              />
              <Button
                title="Próxima resposta"
                small
                variant="ghost"
                disabled={reviewIndex === session.items.length - 1}
                onPress={() =>
                  setReviewIndex((index) => Math.min(session.items.length - 1, (index ?? 0) + 1))
                }
              />
            </View>
          </Card>
        ) : null}
        <Button
          title="Revisar meus erros"
          icon="edit-3"
          variant="secondary"
          onPress={() =>
            router.push({ pathname: '/mistakes', params: { practiceSessionId: session.id } })
          }
        />
        <Button
          title={busy ? 'Preparando...' : 'Fazer mais 5 questões'}
          disabled={busy}
          onPress={async () => {
            if (lock.current) return;
            lock.current = true;
            setBusy(true);
            setError('');
            try {
              const next = await services.practiceService.create({
                ...session.config,
                mode: 'learn',
                count: 5,
                preferredQuestionId: undefined,
                timeLimitSeconds: undefined,
              });
              await repository.flush();
              if (repository.storageError)
                throw new Error('Não foi possível gravar a sessão no dispositivo.');
              replace({ pathname: '/practice/[id]', params: { id: next.id } });
            } catch (reason) {
              setError(
                reason instanceof Error
                  ? reason.message
                  : 'Não foi possível preparar outra sessão.',
              );
            } finally {
              lock.current = false;
              setBusy(false);
            }
          }}
        />
        {report.weak[0] ? (
          <Button
            title="Estudar pontos fracos"
            variant="ghost"
            icon="book-open"
            onPress={() =>
              router.push({ pathname: '/session', params: { topicId: report.weak[0].topicId } })
            }
          />
        ) : null}
        <Button title="Encerrar" variant="ghost" onPress={() => dismissTo('/questions')} />
      </View>
    </Screen>
  );
}
