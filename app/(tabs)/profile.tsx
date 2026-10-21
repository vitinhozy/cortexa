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
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { SettingsRow } from '@/components/SettingsRow';
import { StudyRhythm } from '@/components/StudyRhythm';
import { NotificationPreferences } from '@/components/NotificationPreferences';
import { BottomSheet } from '@/components/BottomSheet';
import { useAppearance } from '@/hooks/useAppearance';
import { useAppNavigation } from '@/hooks/useAppNavigation';
export default function ProfileScreen() {
  const { replace } = useAppNavigation();
  const { data, repository, mode, switchWorkspace } = useStudy();
  const auth = useAuth();
  const appearance = useAppearance();
  const [error, setError] = useState('');
  const [switching, setSwitching] = useState(false);
  const [panel, setPanel] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [reminders, setReminders] = useState(false);
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
        <Badge
          label={mode === 'demo' ? 'CONTA DE DEMONSTRAÇÃO' : 'DADOS LOCAIS · SEM SINCRONIZAÇÃO'}
        />
        <Button
          title="Editar perfil acadêmico"
          variant="secondary"
          onPress={() => router.push('/profile-edit')}
        />
        <View style={[s.divider, { backgroundColor: colors.line }]} />
        <T muted style={{ fontSize: 11 }}>
          OBJETIVO ATUAL
        </T>
        <T style={{ fontFamily: fonts.medium }}>{user.goal}</T>
      </Card>
      <StudyRhythm />
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
        <T style={s.sectionTitle}>Seu espaço</T>
        <T muted>
          {mode === 'demo'
            ? 'Explore os exemplos ou comece com seus próprios dados, sem progresso fictício.'
            : 'Seu progresso pessoal e os exemplos da demonstração são armazenados separadamente.'}
        </T>
        {!auth.user ? (
          <Button
            title={
              switching
                ? 'Abrindo...'
                : mode === 'demo'
                  ? 'Abrir meu espaço pessoal'
                  : 'Explorar demonstração'
            }
            disabled={switching}
            onPress={async () => {
              setSwitching(true);
              setError('');
              try {
                await switchWorkspace(mode === 'demo' ? 'personal' : 'demo');
                replace('/overview');
              } catch {
                setError(
                  'Não foi possível trocar de espaço. Confira o armazenamento do dispositivo.',
                );
              } finally {
                setSwitching(false);
              }
            }}
          />
        ) : null}
        <Button
          title={auth.user ? 'Gerenciar conta' : 'Conta e acesso'}
          variant="ghost"
          onPress={() => router.push('/account')}
        />
        <Button title="Minhas provas" variant="ghost" onPress={() => router.push('/exams')} />
        <Button
          title="Minha jornada e memória"
          variant="ghost"
          onPress={() => router.push('/learning')}
        />
        {error ? <Notice text={error} /> : null}
      </Card>
      <Card>
        <T style={s.sectionTitle}>Preferências</T>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <View style={{ flex: 1 }}>
            <T>{appearance.scheme === 'dark' ? 'Modo escuro' : 'Modo claro'}</T>
            <T muted style={{ fontSize: 11 }}>
              Aparência salva neste dispositivo
            </T>
          </View>
          <Switch
            accessibilityLabel="Modo escuro"
            value={appearance.scheme === 'dark'}
            trackColor={{ false: colors.line, true: colors.primary }}
            thumbColor={colors.surface}
            onValueChange={(value) => appearance.setScheme(value ? 'dark' : 'light')}
          />
        </View>
        <View style={[s.divider, { backgroundColor: colors.line }]} />
        <SettingsRow
          title="Lembretes e notificações"
          detail="Personalize sua futura rotina de lembretes"
          icon="bell"
          onPress={() => setReminders(true)}
        />
        <View style={[s.divider, { backgroundColor: colors.line }]} />
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <View style={{ flex: 1 }}>
            <T>Reduzir movimento</T>
            <T muted style={{ fontSize: 11 }}>
              O ajuste do sistema também é respeitado
            </T>
          </View>
          <Switch
            accessibilityLabel="Reduzir movimento"
            value={Boolean(data.preferences.reduceMotion)}
            trackColor={{ true: colors.primary }}
            onValueChange={(value) =>
              repository.update((d) => ({
                ...d,
                preferences: { ...d.preferences, reduceMotion: value },
              }))
            }
          />
        </View>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <View style={{ flex: 1 }}>
            <T>Resposta ao toque</T>
            <T muted style={{ fontSize: 11 }}>
              Vibração sutil em dispositivos compatíveis
            </T>
          </View>
          <Switch
            accessibilityLabel="Resposta ao toque"
            value={data.preferences.haptics !== false}
            trackColor={{ true: colors.primary }}
            onValueChange={(value) =>
              repository.update((d) => ({
                ...d,
                preferences: { ...d.preferences, haptics: value },
              }))
            }
          />
        </View>
      </Card>
      <Card style={{ gap: 2 }}>
        <SettingsRow
          title="Conhecer Cortexa Plus"
          detail="Uma prévia do que vem por aí"
          icon="star"
          onPress={() => router.push('/membership')}
        />
        <View style={[s.divider, { backgroundColor: colors.line }]} />
        <SettingsRow title="Privacidade" icon="shield" onPress={() => setPanel('Privacidade')} />
        <View style={[s.divider, { backgroundColor: colors.line }]} />
        <SettingsRow
          title="Sobre o Cortexa"
          icon="info"
          onPress={() => setPanel('Sobre o Cortexa')}
        />
      </Card>
      <NotificationPreferences visible={reminders} onClose={() => setReminders(false)} />
      <BottomSheet
        visible={Boolean(panel)}
        title={panel || 'Informações'}
        onClose={() => setPanel('')}
      >
        <T muted style={{ lineHeight: 24 }}>
          {panel === 'Privacidade'
            ? 'Os dados de estudo ficam neste dispositivo. Não adicione prontuários nem dados pessoais de pacientes. Não há backup remoto dos materiais nesta etapa.'
            : 'Cortexa 0.1.0 · Um estudo mais consciente. Aplicativo educacional com casos fictícios e respostas de IA simuladas na demonstração.'}
        </T>
        <Button title="Entendi" onPress={() => setPanel('')} />
      </BottomSheet>
      {repository.storageError ? (
        <Card>
          <Notice text="Não foi possível acessar o armazenamento local. O progresso pode ser perdido ao fechar." />
          <Button
            title="Tentar gravar novamente"
            onPress={async () => {
              const saved = await repository.retryPersistence();
              setError(
                saved
                  ? ''
                  : 'Não foi possível gravar. Snapshots inválidos continuam preservados, sem sobrescrita.',
              );
            }}
          />
        </Card>
      ) : null}
      {mode === 'demo' &&
        (confirm ? (
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
        ))}
    </Screen>
  );
}
