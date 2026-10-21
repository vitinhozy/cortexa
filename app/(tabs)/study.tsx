import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Card, T, Icon, Badge, Button, s } from '@/components/ui';
import { colors, fonts, themeTint } from '@/constants/theme';
import { studyTools } from '@/constants/studyTools';
import { useStudy } from '@/hooks/useStudy';
import { useAvailableWidth } from '@/hooks/useAvailableWidth';
export default function StudyScreen() {
  const { mode } = useStudy();
  const wide = useAvailableWidth() > 650;
  return (
    <Screen
      title="Seu espaço de estudo"
      subtitle="Entender. Praticar. Lembrar. Escolha seu próximo passo."
      eyebrow="APRENDER COM INTENÇÃO"
    >
      <Card style={{ backgroundColor: colors.lavender, borderColor: colors.lavenderLine }}>
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
      <T style={s.sectionTitle}>Prática e revisão</T>
      <View style={s.grid}>
        {studyTools.map((tool) => (
          <Card
            key={tool.title}
            label={tool.title}
            onPress={() =>
              router.push({
                pathname: tool.route,
                params: mode === 'personal' && tool.route === '/session' ? {} : tool.params,
              })
            }
            style={{ width: wide ? '48%' : '100%', flexGrow: 1 }}
          >
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <View
                style={{ backgroundColor: themeTint(tool.color), padding: 12, borderRadius: 13 }}
              >
                <Icon name={tool.icon} color={themeTint(colors.primary, '#B69AFF')} />
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
