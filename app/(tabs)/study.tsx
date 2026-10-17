import { View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Screen, Card, T, Icon, Badge, Button, s } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { studyTools } from '@/mocks/navigation';
export default function StudyScreen() {
  const wide = useWindowDimensions().width > 650;
  return (
    <Screen
      title="Seu espaço de estudo"
      subtitle="Entender. Praticar. Lembrar. Escolha seu próximo passo."
      eyebrow="APRENDER COM INTENÇÃO"
    >
      <Card style={{ backgroundColor: colors.mint, borderColor: '#D5E8DC' }}>
        <View style={s.row}>
          <Icon name="sunrise" size={25} />
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: fonts.semibold, fontSize: 18 }}>Tenho prova amanhã</T>
            <T muted style={{ fontSize: 12, marginTop: 5 }}>
              Organize o tempo que você tem. Foque no que precisa.
            </T>
          </View>
        </View>
        <Button
          title="Montar revisão de véspera"
          small
          variant="primary"
          icon="arrow-right"
          onPress={() => router.push({ pathname: '/planner', params: { urgent: 'true' } })}
        />
      </Card>
      <View style={s.grid}>
        {studyTools.map((tool) => (
          <Card
            key={tool.title}
            label={tool.title}
            onPress={() => router.push({ pathname: tool.route, params: tool.params })}
            style={{ width: wide ? '48%' : '100%', flexGrow: 1 }}
          >
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <View style={{ backgroundColor: tool.color, padding: 12, borderRadius: 13 }}>
                <Icon name={tool.icon} />
              </View>
              <Icon name="arrow-up-right" color={colors.muted} size={18} />
            </View>
            <T style={{ fontFamily: fonts.semibold, fontSize: 17 }}>{tool.title}</T>
            <T muted style={{ fontSize: 12 }}>
              {tool.detail}
            </T>
            {tool.badge ? <Badge label={tool.badge} tone="neutral" /> : null}
          </Card>
        ))}
      </View>
    </Screen>
  );
}
