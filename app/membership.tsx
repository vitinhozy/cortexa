import { useState } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AssistantMark } from '@/components/AssistantMark';
import { Badge, Button, Card, Icon, Notice, Screen, T, s } from '@/components/ui';
import { Choice, Choices } from '@/components/Choice';
import { Reveal } from '@/components/Motion';
import { colors, fonts, themeTint } from '@/constants/theme';
import { useAppNavigation } from '@/hooks/useAppNavigation';

export default function MembershipScreen() {
  const { goBack } = useAppNavigation();
  const [period, setPeriod] = useState('Anual');
  return (
    <Screen
      title="Espaço para ir além."
      subtitle="Conheça o que estamos preparando para o Cortexa Plus."
      eyebrow="CORTEXA PLUS"
      back
      searchable={false}
    >
      <Reveal>
        <LinearGradient
          colors={[
            themeTint('#EDE1FF', '#17113A'),
            themeTint('#E4EDFF', '#101A35'),
            themeTint('#FFEAF2', '#211832'),
          ]}
          style={{
            borderRadius: 30,
            borderCurve: 'continuous',
            padding: 26,
            gap: 18,
            alignItems: 'center',
          }}
        >
          <AssistantMark size={112} brand />
          <View style={{ alignSelf: 'center' }}>
            <Badge label="EM PREPARAÇÃO" />
          </View>
          <T
            style={{
              fontSize: 26,
              lineHeight: 33,
              fontFamily: fonts.semibold,
              textAlign: 'center',
              letterSpacing: -0.8,
            }}
          >
            {'Mais contexto.\nNovas possibilidades.'}
          </T>
          <T muted style={{ textAlign: 'center' }}>
            Uma prévia do plano que queremos construir com você.
          </T>
        </LinearGradient>
      </Reveal>
      <Card>
        {[
          {
            icon: 'zap',
            title: 'IA com seus materiais',
            detail: 'Explicações e revisões com contexto.',
          },
          {
            icon: 'cloud',
            title: 'Seu estudo em mais lugares',
            detail: 'Sincronização entre dispositivos.',
          },
          {
            icon: 'trending-up',
            title: 'Uma visão mais completa',
            detail: 'Acompanhamento de aprendizagem ampliado.',
          },
        ].map(({ icon, title, detail }) => (
          <View key={title} style={[s.row, { alignItems: 'flex-start' }]}>
            <View style={{ backgroundColor: colors.mint, padding: 10, borderRadius: 13 }}>
              <Icon name={icon as 'zap' | 'cloud' | 'trending-up'} size={18} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <T>{title}</T>
              <T muted style={{ fontSize: 12 }}>
                {detail}
              </T>
              <T muted style={{ fontSize: 10 }}>
                RECURSO PLANEJADO
              </T>
            </View>
          </View>
        ))}
      </Card>
      <Card>
        <T style={s.sectionTitle}>Explore os formatos</T>
        <Choices>
          {['Mensal', 'Anual'].map((item) => (
            <Choice
              key={item}
              label={item}
              selected={period === item}
              onPress={() => setPeriod(item)}
            />
          ))}
        </Choices>
        <T accessibilityLiveRegion="polite">
          Plano {period.toLocaleLowerCase('pt-BR')} · valores ainda não definidos
        </T>
        <T muted style={{ fontSize: 12 }}>
          Esta seleção é apenas uma prévia. Não cria assinatura nem salva dados de pagamento.
        </T>
      </Card>
      <Notice text="Assinaturas ainda indisponíveis. Os recursos acima estão planejados e não fazem parte desta versão. Nenhuma cobrança está habilitada." />
      <Button title="Assinatura em breve" disabled onPress={() => {}} />
      <Button
        title="Continuar com o acesso gratuito"
        variant="secondary"
        onPress={() => goBack('/profile')}
      />
      <T muted style={{ fontSize: 11, textAlign: 'center' }}>
        O estudo local continua disponível, sem assinatura.
      </T>
    </Screen>
  );
}
