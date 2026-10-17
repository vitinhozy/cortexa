import { useState } from 'react';
import { View, Switch } from 'react-native';
import {
  Screen,
  Card,
  T,
  Badge,
  Section,
  Progress,
  Button,
  Notice,
  Icon,
  s,
} from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { useStudy } from '@/hooks/useStudy';
export default function ProfileScreen() {
  const { data, repository } = useStudy();
  const [panel, setPanel] = useState('');
  const [confirm, setConfirm] = useState(false);
  const user = data.user;
  const level = Math.floor(user.xp / 500) + 1;
  return (
    <Screen
      title="Seu caminho na Medicina"
      subtitle="Cada sessão constrói o profissional que você quer ser."
      eyebrow="PERFIL"
    >
      <Card>
        <View style={s.row}>
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 23,
              backgroundColor: colors.mint,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <T style={{ fontSize: 28, color: colors.primary, fontFamily: fonts.semibold }}>
              {user.name[0]}
            </T>
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            <T style={{ fontSize: 23, fontFamily: fonts.semibold }}>{user.name}</T>
            <T muted>
              {user.course} · {user.semester}º semestre
            </T>
            <T muted style={{ fontSize: 11 }}>
              {user.university}
            </T>
          </View>
        </View>
        <Badge label="CONTA DE DEMONSTRAÇÃO" />
        <View style={s.divider} />
        <T muted style={{ fontSize: 11 }}>
          OBJETIVO ATUAL
        </T>
        <T style={{ fontFamily: fonts.medium }}>{user.goal}</T>
      </Card>
      <View style={s.grid}>
        {[
          { value: `${user.streak} dias`, label: 'Sequência' },
          { value: `${user.minutes} min`, label: 'Tempo estudado' },
          { value: `${user.answered}`, label: 'Questões' },
          {
            value: `${Math.round((user.correct / Math.max(1, user.answered)) * 100)}%`,
            label: 'Taxa de acerto',
          },
        ].map((item) => (
          <Card key={item.label} style={{ flexBasis: '45%', flexGrow: 1 }}>
            <T style={{ fontSize: 24, fontFamily: fonts.semibold }}>{item.value}</T>
            <T muted style={{ fontSize: 11 }}>
              {item.label}
            </T>
          </Card>
        ))}
      </View>
      <Card>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <T style={s.sectionTitle}>Nível {level} · Aprendizado contínuo</T>
          <Icon name="trending-up" />
        </View>
        <T muted>
          {user.xp} XP · {500 - (user.xp % 500)} XP até o próximo nível
        </T>
        <Progress value={(user.xp % 500) / 5} />
        <T style={{ fontSize: 12 }}>
          Meta semanal: {user.weeklyMinutes}/{user.weeklyGoal} minutos
        </T>
      </Card>
      <Section title="Do seu jeito" />
      <Card>
        <T style={s.sectionTitle}>Preferências</T>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <View style={{ flex: 1 }}>
            <T>Lembrete diário</T>
            <T muted style={{ fontSize: 11 }}>
              Preferência salva neste dispositivo
            </T>
          </View>
          <Switch
            accessibilityLabel="Lembrete diário"
            value={data.preferences.dailyReminder}
            trackColor={{ true: colors.primary }}
            onValueChange={(value) =>
              repository.update((d) => ({
                ...d,
                preferences: { ...d.preferences, dailyReminder: value },
              }))
            }
          />
        </View>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <T>Notificações</T>
          <Switch
            accessibilityLabel="Notificações"
            value={data.preferences.notifications}
            trackColor={{ true: colors.primary }}
            onValueChange={(value) =>
              repository.update((d) => ({
                ...d,
                preferences: { ...d.preferences, notifications: value },
              }))
            }
          />
        </View>
        <T muted style={{ fontSize: 11 }}>
          O envio de notificações será conectado em uma próxima versão.
        </T>
      </Card>
      <View style={{ gap: 10 }}>
        {['Plano', 'Privacidade', 'Sobre'].map((item) => (
          <Card
            key={item}
            onPress={() => setPanel(panel === item ? '' : item)}
            label={item}
            style={{ padding: 18 }}
          >
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <T>{item}</T>
              <Icon name={panel === item ? 'chevron-up' : 'chevron-down'} size={16} />
            </View>
            {panel === item ? (
              <T muted style={{ fontSize: 12, lineHeight: 20 }}>
                {item === 'Plano'
                  ? 'Plano demonstração gratuito. Todas as experiências deste MVP estão disponíveis, sem cobrança.'
                  : item === 'Privacidade'
                    ? 'Os dados ficam neste dispositivo. Nenhum material é enviado a servidores. Use apenas conteúdo fictício nesta demonstração. Você pode restaurar os dados abaixo.'
                    : 'Cortexa 0.1.0 · Um estudo mais consciente. Aplicativo educacional com casos fictícios e respostas de IA simuladas.'}
              </T>
            ) : null}
          </Card>
        ))}
      </View>
      {repository.storageError ? (
        <Notice text="Não foi possível acessar o armazenamento local. O progresso pode ser perdido ao fechar." />
      ) : null}
      {confirm ? (
        <Card>
          <T>Restaurar os exemplos e apagar o progresso local?</T>
          <Button
            title="Confirmar restauração"
            onPress={() => {
              repository.reset();
              setConfirm(false);
            }}
          />
          <Button title="Cancelar" variant="ghost" onPress={() => setConfirm(false)} />
        </Card>
      ) : (
        <Button title="Restaurar demonstração" variant="ghost" onPress={() => setConfirm(true)} />
      )}
    </Screen>
  );
}
