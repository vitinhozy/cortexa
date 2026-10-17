import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Screen, Card, T, Badge, Button, Notice, Empty, s } from '@/components/ui';
import { useStudy } from '@/hooks/useStudy';
import { colors, fonts } from '@/constants/theme';
import { formatDate } from '@/utils/date';
export default function MistakesScreen() {
  const { topicId } = useLocalSearchParams<{ topicId?: string }>();
  const { data, services } = useStudy();
  const [notice, setNotice] = useState('');
  const mistakes = data.mistakes.filter((m) => !topicId || m.topicId === topicId);
  return (
    <Screen
      title="Seu caderno de erros"
      subtitle="O que você errou não define o que você sabe. Mostra por onde continuar."
      eyebrow="ERROS QUE ENSINAM"
      back
    >
      <Notice text="As causas abaixo são hipóteses didáticas predefinidas. A análise individual por IA será adicionada futuramente." />
      {notice ? <Notice text={notice} /> : null}
      <T muted style={{ fontSize: 12 }}>
        {mistakes.length} oportunidades de revisão
      </T>
      {mistakes.map((mistake) => {
        const question = data.questions.find((q) => q.id === mistake.questionId);
        if (!question) return null;
        return (
          <Card key={mistake.id}>
            <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
              <Badge
                label={data.topics.find((t) => t.id === mistake.topicId)?.name ?? 'Fisiologia'}
                tone="amber"
              />
              <T muted style={{ fontSize: 11 }}>
                {formatDate(mistake.createdAt)}
              </T>
            </View>
            <T style={{ fontFamily: fonts.medium, lineHeight: 24 }}>{question.prompt}</T>
            <View
              style={{ padding: 15, borderRadius: 12, backgroundColor: colors.amberLight, gap: 6 }}
            >
              <T style={{ color: colors.amber, fontSize: 10, fontFamily: fonts.semibold }}>
                POSSÍVEL CAUSA DO ERRO
              </T>
              <T style={{ fontSize: 13 }}>{mistake.probableCause}</T>
            </View>
            <T style={{ fontSize: 12, color: colors.red }}>
              Sua resposta: {mistake.selectedOptionId} ·{' '}
              {question.options.find((o) => o.id === mistake.selectedOptionId)?.text}
            </T>
            <T style={{ fontSize: 12, color: colors.primary }}>
              Correta: {mistake.correctOptionId} ·{' '}
              {question.options.find((o) => o.id === mistake.correctOptionId)?.text}
            </T>
            <Button
              title="Revisar assunto"
              variant="secondary"
              small
              icon="book-open"
              onPress={() =>
                router.push({ pathname: '/session', params: { topicId: mistake.topicId } })
              }
            />
            <Button
              title="Resolver questão semelhante"
              variant="secondary"
              small
              onPress={() =>
                router.push({
                  pathname: '/questions',
                  params: { topicId: mistake.topicId, questionId: mistake.questionId },
                })
              }
            />
            <Button
              title={
                data.flashcards.some((f) => f.sourceQuestionId === question.id)
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
      {!mistakes.length ? (
        <Empty
          icon="check-circle"
          title="Um novo começo"
          message="Seus próximos erros aparecerão aqui, com caminhos para revisar cada conceito."
        />
      ) : null}
    </Screen>
  );
}
