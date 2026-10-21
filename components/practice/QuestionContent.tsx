import { View } from 'react-native';
import { Touch } from '@/components/Motion';
import { Card, Icon, T, Notice, s } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import type { Question, QuestionAttempt } from '@/types/domain';

export function QuestionOptions({
  question,
  selected,
  attempt,
  locked,
  onSelect,
}: {
  question: Question;
  selected?: string;
  attempt?: QuestionAttempt;
  locked?: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Alternativas" style={{ gap: 10 }}>
      {question.options.map((option) => {
        const correct = !!attempt && option.id === question.correctOptionId;
        const wrong = !!attempt && !attempt.correct && option.id === selected;
        const checked = selected === option.id;
        return (
          <Touch
            key={option.id}
            accessibilityRole="radio"
            accessibilityLabel={`${option.id}. ${option.text}`}
            accessibilityState={{ checked, disabled: !!locked }}
            aria-checked={checked}
            disabled={locked}
            disabledOpacity={1}
            onPress={() => onSelect(option.id)}
            style={{
              padding: 17,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: correct
                ? colors.primary
                : wrong
                  ? colors.red
                  : checked
                    ? colors.primary
                    : colors.line,
              backgroundColor: correct ? colors.mint : wrong ? colors.redLight : colors.surface,
            }}
          >
            <View style={s.row}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: checked ? colors.primary : colors.neutral,
                }}
              >
                <T
                  style={{
                    color: checked ? 'white' : colors.muted,
                    fontFamily: fonts.semibold,
                    fontSize: 12,
                  }}
                >
                  {option.id}
                </T>
              </View>
              <T style={{ flex: 1, fontSize: 14, lineHeight: 23 }}>{option.text}</T>
              {correct ? (
                <Icon name="check-circle" size={18} />
              ) : wrong ? (
                <Icon name="x-circle" size={18} color={colors.red} />
              ) : null}
            </View>
          </Touch>
        );
      })}
    </View>
  );
}

export function QuestionFeedback({
  question,
  attempt,
}: {
  question: Question;
  attempt: QuestionAttempt;
}) {
  return (
    <View style={{ gap: 16 }}>
      <Card
        style={{
          backgroundColor: attempt.correct ? colors.mint : colors.amberLight,
          borderColor: attempt.correct ? colors.mint : colors.amberLight,
        }}
      >
        <View style={s.row}>
          <Icon
            name={attempt.correct ? 'check-circle' : 'refresh-cw'}
            color={attempt.correct ? colors.teal : colors.amber}
          />
          <T style={s.sectionTitle}>
            {attempt.correct ? 'Você acertou.' : 'Vamos reconstruir o raciocínio.'}
          </T>
        </View>
        <T style={{ fontFamily: fonts.semibold }}>
          Alternativa correta: {question.correctOptionId}
        </T>
        <T style={{ lineHeight: 25 }}>{question.explanation}</T>
        {attempt.confidence === 'certain' && !attempt.correct ? (
          <Notice text="Você respondeu com bastante confiança, mas esse conceito merece revisão. Uma nova situação ajudará a conferir o entendimento." />
        ) : null}
        {attempt.correct && attempt.confidence === 'guess' ? (
          <T style={{ lineHeight: 22, fontSize: 13 }}>
            Você acertou e informou que chutou. Vamos revisitar o conceito antes de considerá-lo bem
            sustentado.
          </T>
        ) : null}
        <T style={{ fontFamily: fonts.semibold, fontSize: 13 }}>Conceito principal</T>
        <T style={{ fontSize: 13 }}>{question.conceptName ?? 'Mecanismo do assunto selecionado'}</T>
        {!attempt.correct ? (
          <>
            <T style={{ fontFamily: fonts.semibold, fontSize: 13 }}>Possível ponto de confusão</T>
            <T style={{ fontSize: 13, lineHeight: 22 }}>{question.probableCause}</T>
            <T muted style={{ fontSize: 10 }}>
              Hipótese didática do banco; não é uma análise individual feita por IA.
            </T>
          </>
        ) : null}
      </Card>
      <Card>
        <T style={s.sectionTitle}>Compare as alternativas</T>
        {question.options.map((option) => (
          <View key={option.id} style={{ gap: 5 }}>
            <T style={{ fontFamily: fonts.medium, fontSize: 13 }}>
              {option.id}. {option.text}
            </T>
            <T muted style={{ fontSize: 12, lineHeight: 21 }}>
              {option.explanation}
            </T>
          </View>
        ))}
      </Card>
      <Card>
        <T style={{ fontFamily: fonts.semibold }}>Baseado em</T>
        {(
          question.citations ?? [
            { title: question.source, kind: question.authored ? 'authored' : 'demo' },
          ]
        ).map((citation, index) => (
          <View key={`${citation.title}-${index}`} style={{ gap: 4 }}>
            <T style={{ fontSize: 12 }}>
              {citation.kind === 'material'
                ? 'Do seu material'
                : citation.kind === 'authored'
                  ? 'Conteúdo cadastrado por você'
                  : 'Complemento de demonstração'}
            </T>
            <T muted style={{ fontSize: 12, lineHeight: 20 }}>
              {citation.title}
              {citation.page !== undefined ? ` · página ${citation.page}` : ''}
            </T>
          </View>
        ))}
      </Card>
    </View>
  );
}
