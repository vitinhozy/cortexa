import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Screen, Card, T, Button, Badge, Progress, Icon, s } from '@/components/ui';
import { tutorSteps } from '@/mocks/tutor';
import { colors } from '@/constants/theme';
export default function TutorScreen() {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<number>();
  const [score, setScore] = useState(0);
  const current = tutorSteps[step];
  return (
    <Screen
      title="Vamos pensar juntos."
      subtitle="Uma aula guiada sobre equilíbrio ácido-base."
      eyebrow="MODO TUTOR"
      back
    >
      <Badge label="CONVERSA SOCRÁTICA · ROTEIRO SIMULADO" />
      <Progress value={(step / tutorSteps.length) * 100} />
      {current ? (
        <>
          <Card>
            <View style={s.row}>
              <Icon name="zap" />
              <T style={s.sectionTitle}>Antes de seguir...</T>
            </View>
            <T style={{ fontSize: 18, lineHeight: 29 }}>{current.question}</T>
          </Card>
          {current.options.map((option, i) => (
            <Button
              key={option}
              title={option}
              variant={answer === i ? 'primary' : 'secondary'}
              disabled={answer !== undefined}
              onPress={() => {
                setAnswer(i);
                if (i === current.correct) setScore((s) => s + 1);
              }}
            />
          ))}
          {answer !== undefined ? (
            <>
              <Card
                style={{
                  backgroundColor: answer === current.correct ? colors.mint : colors.amberLight,
                }}
              >
                <T>{answer === current.correct ? current.success : current.retry}</T>
              </Card>
              <Button
                title={step === tutorSteps.length - 1 ? 'Concluir aula' : 'Continuar raciocínio'}
                icon="arrow-right"
                onPress={() => {
                  setStep((s) => s + 1);
                  setAnswer(undefined);
                }}
              />
            </>
          ) : null}
        </>
      ) : (
        <>
          <Card>
            <Icon name="check-circle" size={34} />
            <T style={s.sectionTitle}>Você conectou as peças.</T>
            <T>
              Foram {score} acertos em {tutorSteps.length} perguntas. Lembre: identifique o
              componente primário e depois avalie a compensação.
            </T>
          </Card>
          <Button
            title="Aplicar em uma questão"
            onPress={() => router.replace({ pathname: '/questions', params: { topicId: 'acid' } })}
          />
          <Button
            title="Recomeçar aula"
            variant="ghost"
            onPress={() => {
              setStep(0);
              setScore(0);
            }}
          />
        </>
      )}
    </Screen>
  );
}
