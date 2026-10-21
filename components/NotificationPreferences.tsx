import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { Badge, Button, Card, Icon, Notice, T, s } from './ui';
import { Choice, Choices } from './Choice';
import { useStudy } from '@/hooks/useStudy';
import { colors, fonts } from '@/constants/theme';

export function NotificationPreferences({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { data, repository } = useStudy();
  const [daily, setDaily] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [time, setTime] = useState('19:00');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (visible) {
      setDaily(data.preferences.dailyReminder);
      setNotifications(data.preferences.notifications);
      setTime(data.preferences.reminderTime ?? '19:00');
      setMessage('');
    }
  }, [
    visible,
    data.preferences.dailyReminder,
    data.preferences.notifications,
    data.preferences.reminderTime,
  ]);
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Lembretes de estudo">
      <View style={{ alignItems: 'center', gap: 12 }}>
        <View style={{ backgroundColor: colors.mint, padding: 20, borderRadius: 24 }}>
          <Icon name="bell" size={30} />
        </View>
        <T muted style={{ textAlign: 'center' }}>
          Um convite gentil para voltar ao seu estudo.
        </T>
      </View>
      <Card style={{ backgroundColor: colors.lavender, padding: 18 }}>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <T style={{ fontSize: 11, fontFamily: fonts.semibold }}>CORTEXA</T>
          <Badge label="PRÉVIA" tone="neutral" />
        </View>
        <T style={{ fontFamily: fonts.semibold }}>Um momento para aprender?</T>
        <T muted style={{ fontSize: 12 }}>
          Suas anotações esperam por você. Um pequeno passo já conta.
        </T>
        <T muted style={{ fontSize: 11 }}>
          {time} · exemplo de lembrete
        </T>
      </Card>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <View style={{ flex: 1 }}>
          <T>Lembrete diário</T>
          <T muted style={{ fontSize: 11 }}>
            Preferência para a futura integração
          </T>
        </View>
        <Switch
          accessibilityLabel="Lembrete diário"
          value={daily}
          onValueChange={setDaily}
          trackColor={{ true: colors.primary }}
        />
      </View>
      <Choices>
        {['08:00', '14:00', '19:00', '21:00'].map((item) => (
          <Choice key={item} label={item} selected={time === item} onPress={() => setTime(item)} />
        ))}
      </Choices>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <T style={{ flex: 1 }}>Novidades do seu estudo</T>
        <Switch
          accessibilityLabel="Novidades do seu estudo"
          value={notifications}
          onValueChange={setNotifications}
          trackColor={{ true: colors.primary }}
        />
      </View>
      <Notice text="O envio de notificações ainda não está disponível. Estas escolhas ficam salvas neste dispositivo; nenhum alerta será agendado e nenhuma permissão do sistema será solicitada." />
      {message ? <Notice text={message} /> : null}
      <Button
        title={busy ? 'Salvando...' : 'Salvar preferências'}
        disabled={busy}
        onPress={async () => {
          setBusy(true);
          repository.update((current) => ({
            ...current,
            preferences: {
              ...current.preferences,
              dailyReminder: daily,
              notifications,
              reminderTime: time,
            },
          }));
          await repository.flush();
          setBusy(false);
          if (repository.storageError)
            setMessage(
              'Não foi possível gravar no dispositivo. As escolhas estão disponíveis apenas nesta sessão.',
            );
          else onClose();
        }}
      />
    </BottomSheet>
  );
}
