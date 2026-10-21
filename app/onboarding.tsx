import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfileForm } from '@/components/ProfileForm';
import { Button, Card, Icon, Screen, T, s, type IconName } from '@/components/ui';
import { Reveal } from '@/components/Motion';
import { colors, fonts, themeTint } from '@/constants/theme';
import { router } from 'expo-router';
import { hasSeenIntroduction, markIntroductionSeen } from '@/services/introductions';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { useAuth } from '@/hooks/useAuth';

const steps: { title: string; subtitle: string; icon: IconName; label: string; detail: string }[] =
  [
    {
      title: 'Menos dispersão.\nMais clareza.',
      subtitle: 'Seu universo de estudo, em um lugar só.',
      icon: 'layers',
      label: 'Uma base que é sua',
      detail:
        'Organize anotações por disciplina, assunto e pasta. Encontre o que precisa sem perder o fio.',
    },
    {
      title: 'Um pouco hoje.\nUm passo à frente.',
      subtitle: 'Crie uma rotina que cabe na sua vida.',
      icon: 'sun',
      label: 'No seu ritmo',
      detail:
        'Escolha uma meta diária, planeje suas provas e acompanhe o tempo que você dedicou a aprender.',
    },
    {
      title: 'Seu próximo capítulo\ncomeça aqui.',
      subtitle: 'Um espaço pessoal, pronto para receber suas ideias.',
      icon: 'compass',
      label: 'Comece com o essencial',
      detail:
        'Seu progresso começa do zero. Os dados ficam neste dispositivo e você pode usar o app sem criar uma conta.',
    },
  ];
export default function OnboardingScreen() {
  const auth = useAuth();
  const [step, setStep] = useState(0);
  const [configure, setConfigure] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    void hasSeenIntroduction('welcome').then((seen) => {
      if (active) {
        setConfigure(seen);
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  if (!ready)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  if (configure) return <ProfileForm onboarding />;
  const current = steps[step];
  async function skip() {
    await markIntroductionSeen('welcome');
    router.replace('/overview');
  }
  async function personalize() {
    await markIntroductionSeen('welcome');
    setConfigure(true);
  }
  async function openAccount(choice: 'email' | 'signup' | 'google') {
    await markIntroductionSeen('welcome');
    router.push({
      pathname: '/account',
      params: {
        next: '/overview',
        ...(choice === 'signup' ? { mode: 'signup' } : {}),
        ...(choice === 'google' ? { provider: 'google' } : {}),
      },
    });
  }
  return (
    <Screen
      title={current.title}
      subtitle={current.subtitle}
      back
      onBack={() => void skip()}
      searchable={false}
      eyebrow="BEM-VINDO AO CORTEXA"
    >
      {step === 0 && auth.configured && !auth.user ? (
        <Card style={{ gap: 10 }}>
          <T style={s.sectionTitle}>Como você quer começar?</T>
          <GoogleSignInButton onPress={() => void openAccount('google')} />
          <Button title="Criar conta" icon="user-plus" onPress={() => void openAccount('signup')} />
          <Button
            title="Já tenho uma conta"
            variant="ghost"
            onPress={() => void openAccount('email')}
          />
          <Button title="Continuar sem conta" variant="ghost" onPress={() => void skip()} />
        </Card>
      ) : null}
      <Reveal key={step}>
        <LinearGradient
          colors={[
            themeTint('#E8DEFA', '#17113A'),
            themeTint('#FFF1DC', '#211832'),
            themeTint('#F9E8F2', '#101A35'),
          ]}
          style={{
            borderRadius: 32,
            borderCurve: 'continuous',
            padding: 28,
            minHeight: 270,
            justifyContent: 'center',
            gap: 28,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 104,
              height: 104,
              borderRadius: 32,
              backgroundColor: 'rgba(255,255,255,0.8)',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ rotate: step === 1 ? '5deg' : '-5deg' }],
            }}
          >
            <Icon name={current.icon} size={42} />
          </View>
          <Card style={{ padding: 18, gap: 8, backgroundColor: themeTint('#FFFFFFE8', '#17151D') }}>
            <T style={s.sectionTitle}>{current.label}</T>
            <T muted style={{ lineHeight: 23 }}>
              {current.detail}
            </T>
          </Card>
        </LinearGradient>
      </Reveal>
      <View
        accessible
        accessibilityLabel={`Etapa ${step + 1} de 3`}
        style={{ alignItems: 'center', gap: 12 }}
      >
        <View style={[s.row, { gap: 6 }]}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={{
                height: 6,
                width: step === index ? 24 : 6,
                borderRadius: 6,
                backgroundColor: step === index ? colors.primary : '#D1DCD5',
              }}
            />
          ))}
        </View>
        <T muted style={{ fontSize: 11, fontFamily: fonts.medium }}>
          {step + 1} de 3
        </T>
      </View>
      <View style={{ gap: 6 }}>
        <Button
          title={step === 2 ? 'Personalizar meu estudo' : 'Continuar'}
          icon="arrow-right"
          onPress={() => (step === 2 ? void personalize() : setStep(step + 1))}
        />
        {step > 0 ? (
          <Button title="Etapa anterior" variant="ghost" onPress={() => setStep(step - 1)} />
        ) : null}
        <Button title="Pular introdução" variant="ghost" onPress={() => void skip()} />
      </View>
    </Screen>
  );
}
