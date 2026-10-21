import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Screen, Card, T, Button, Notice, Empty, Icon, s } from '@/components/ui';
import { useStudy } from '@/hooks/useStudy';
import { colors, fonts } from '@/constants/theme';
import { formatDate } from '@/utils/date';
import { estimateConceptMastery } from '@/features/study/practice';
import type { Mistake } from '@/types/domain';
import { academicStageLabels } from '@/constants/academic';

export default function MistakesScreen() {
  const { topicId, practiceSessionId } = useLocalSearchParams<{
    topicId?: string;
    practiceSessionId?: string;
  }>();
  const { data, services } = useStudy();
  const [notice, setNotice] = useState('');
  const mistakes = data.mistakes
    .filter(
      (mistake) =>
        (!topicId || mistake.topicId === topicId) &&
        (!practiceSessionId ||
          data.attempts.some(
            (attempt) =>
              attempt.id === mistake.attemptId && attempt.practiceSessionId === practiceSessionId,
          )),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const questions = [
    ...data.questions,
    ...(data.practice?.sessions.flatMap((session) => session.pool) ?? []),
  ];
  const mistakeConcept = (mistake: Mistake) =>
    mistake.conceptId ??
    questions.find((question) => question.id === mistake.questionId)?.conceptId ??
    mistake.topicId;
  const groups = [...new Set(mistakes.map(mistakeConcept))].map((id) => ({
    id,
    mistakes: mistakes.filter((mistake) => mistakeConcept(mistake) === id),
  }));
  return (
    <Screen
      title="Seu caderno de erros"
      subtitle="Encontre o conceito por trás do erro e tente uma nova situação."
      eyebrow="ERROS QUE ENSINAM"
      back
      backTo="/study"
    >
      <Notice text="As possíveis confusões são hipóteses didáticas do banco ou explicações cadastradas por você. A análise individual por IA ainda não está conectada." />
      {notice ? <Notice text={notice} /> : null}
      <T muted style={{ fontSize: 12 }}>
        {groups.length} oportunidades de revisão · {mistakes.length} erros registrados
      </T>
      {groups.map((group) => {
        const mistake = group.mistakes[0];
        if (!mistake) return null;
        const question = questions.find((value) => value.id === mistake.questionId);
        if (!question) return null;
        const mastery = estimateConceptMastery(data, group.id);
        const revisions = data.attempts.filter(
          (attempt) =>
            attempt.createdAt > mistake.createdAt &&
            (attempt.conceptId ??
              data.questions.find((value) => value.id === attempt.questionId)?.conceptId) ===
              group.id,
        ).length;
        const name =
          mistake.conceptName ??
          question.conceptName ??
          data.topics.find((topic) => topic.id === mistake.topicId)?.name ??
          'Conceito para revisar';
        return (
          <Card key={group.id}>
            <View style={[s.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
              <View style={{ flex: 1, gap: 6 }}>
                <T style={s.sectionTitle}>{name}</T>
                <T muted style={{ fontSize: 11 }}>
                  {formatDate(mistake.createdAt)} · {group.mistakes.length}{' '}
                  {group.mistakes.length === 1 ? 'erro' : 'erros'} neste conceito
                </T>
              </View>
              <Icon name="refresh-cw" color={colors.amber} />
            </View>
            {mistake.confidence === 'certain' ? (
              <Notice text="O último erro foi respondido com alta confiança. Vale comparar o mecanismo antes de tentar outra aplicação." />
            ) : null}
            <View
              style={{ padding: 16, borderRadius: 16, backgroundColor: colors.amberLight, gap: 7 }}
            >
              <T style={{ fontFamily: fonts.semibold, fontSize: 12 }}>Possível confusão</T>
              <T style={{ fontSize: 13, lineHeight: 22 }}>{mistake.probableCause}</T>
            </View>
            <T muted style={{ fontSize: 12, lineHeight: 21 }}>
              Última situação: {question.prompt}
            </T>
            <T style={{ fontSize: 12 }}>
              Sua resposta: {mistake.selectedOptionId} ·{' '}
              {question.options.find((option) => option.id === mistake.selectedOptionId)?.text}
            </T>
            <T style={{ fontSize: 12, color: colors.primaryDark }}>
              Resposta correta: {mistake.correctOptionId} ·{' '}
              {question.options.find((option) => option.id === mistake.correctOptionId)?.text}
            </T>
            <T muted style={{ fontSize: 11 }}>
              {mistake.academicStage ? `${academicStageLabels[mistake.academicStage]} · ` : ''}
              Confiança:{' '}
              {mistake.confidence
                ? { certain: 'tinha certeza', unsure: 'em dúvida', guess: 'chutei' }[
                    mistake.confidence
                  ]
                : 'não informada no histórico anterior'}{' '}
              · {mastery.exposures || mistake.exposures || group.mistakes.length} exposições ·{' '}
              {revisions} revisões após o último erro
            </T>
            {mistake.masteryBefore !== undefined && mistake.masteryAfter !== undefined ? (
              <T muted>
                Domínio no registro: {mistake.masteryBefore}% → {mistake.masteryAfter}%
              </T>
            ) : null}
            <Button
              title="Praticar novamente"
              icon="arrow-right"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/questions',
                  params: { topicId: mistake.topicId, conceptIds: group.id, kind: 'review' },
                })
              }
            />
            <Button
              title="Revisar assunto"
              variant="ghost"
              small
              icon="book-open"
              onPress={() =>
                router.push({ pathname: '/session', params: { topicId: mistake.topicId } })
              }
            />
            <Button
              title={
                data.flashcards.some((card) => card.sourceQuestionId === question.id)
                  ? 'Flashcard salvo ✓'
                  : 'Criar flashcard'
              }
              variant="ghost"
              small
              onPress={async () => {
                try {
                  await services.flashcardService.fromQuestion(question.id);
                  setNotice('Flashcard salvo na sua coleção.');
                } catch {
                  setNotice('Não foi possível salvar. Tente novamente.');
                }
              }}
            />
          </Card>
        );
      })}
      {!groups.length ? (
        <Empty
          icon="check-circle"
          title="Um novo começo"
          message="Quando um conceito pedir revisão, você encontrará aqui a resposta, a confiança e uma próxima tentativa."
        />
      ) : null}
    </Screen>
  );
}
