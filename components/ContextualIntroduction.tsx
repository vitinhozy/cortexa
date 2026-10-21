import { useEffect, useState } from 'react';
import { usePathname } from 'expo-router';
import { BottomSheet } from './BottomSheet';
import { Button, Card, Icon, Notice, T } from './ui';
import { colors, fonts } from '@/constants/theme';
import { hasSeenIntroduction, markIntroductionSeen } from '@/services/introductions';

export interface IntroductionStep {
  title: string;
  description: string;
  icon: 'shield' | 'message-circle' | 'book-open' | 'layers';
  detail: string;
}
export function ContextualIntroduction({ id, steps }: { id: string; steps: IntroductionStep[] }) {
  const focused = usePathname() === '/ai';
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  useEffect(() => {
    let active = true;
    if (focused) {
      hasSeenIntroduction(id).then((seen) => {
        if (active) setVisible(!seen);
      });
    }
    return () => {
      active = false;
    };
  }, [focused, id]);
  const current = steps[step];
  async function finish() {
    await markIntroductionSeen(id);
    setStep(0);
    setVisible(false);
  }
  if (!current) return null;
  return (
    <BottomSheet
      visible={focused && visible}
      onClose={() => setVisible(false)}
      title={current.title}
    >
      <Card style={{ alignItems: 'center', paddingVertical: 22 }}>
        <ViewIcon icon={current.icon} />
        <T style={{ fontSize: 15, lineHeight: 23, textAlign: 'center' }}>{current.description}</T>
        <Notice text={current.detail} />
      </Card>
      <T muted style={{ fontSize: 11, fontFamily: fonts.medium, textAlign: 'center' }}>
        {step + 1} de {steps.length}
      </T>
      <Button
        title={step === steps.length - 1 ? 'Entendi' : 'Continuar'}
        onPress={() => (step === steps.length - 1 ? void finish() : setStep((value) => value + 1))}
      />
      <Button title="Pular introdução" variant="ghost" onPress={() => void finish()} />
    </BottomSheet>
  );
}

function ViewIcon({ icon }: { icon: IntroductionStep['icon'] }) {
  return <Icon name={icon} size={27} color={colors.primary} />;
}
