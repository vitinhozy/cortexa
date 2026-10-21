import { View } from 'react-native';
import type { PropsWithChildren } from 'react';
import { Screen, Card, T, Icon, Badge, Empty, s } from '@/components/ui';
import { useStudy } from '@/hooks/useStudy';
import { colors } from '@/constants/theme';
import { useAppNavigation } from '@/hooks/useAppNavigation';

export default function ChatHistoryScreen() {
  const { replace } = useAppNavigation();
  const { data, mode } = useStudy();
  const conversations = [...data.conversations]
    .filter((conversation) => conversation.messages.length > 0)
    .sort((a, b) => {
      const latestA = a.messages.at(-1)?.createdAt ?? '';
      const latestB = b.messages.at(-1)?.createdAt ?? '';
      return latestB.localeCompare(latestA);
    });

  return (
    <Screen
      title="Histórico de conversas"
      subtitle="Seus chats ficam guardados neste dispositivo."
      back
      searchable={false}
      action={<Badge label={mode === 'demo' ? 'SIMULADAS' : 'LOCAL'} tone="neutral" />}
    >
      {conversations.length ? (
        <ViewList>
          {conversations.map((conversation) => {
            const firstQuestion = conversation.messages.find((message) => message.role === 'user');
            const latest = conversation.messages.at(-1);
            const title = firstQuestion?.content ?? 'Nova conversa';
            const date = latest
              ? new Date(latest.createdAt).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';
            return (
              <Card
                key={conversation.id}
                onPress={() =>
                  replace({ pathname: '/ai', params: { conversationId: conversation.id } })
                }
              >
                <View style={s.row}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 15,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.lavender,
                    }}
                  >
                    <Icon name="message-circle" />
                  </View>
                  <View style={{ flex: 1, gap: 5 }}>
                    <T numberOfLines={2} style={{ fontSize: 14 }}>
                      {title}
                    </T>
                    <T muted style={{ fontSize: 11 }}>
                      {date} · {conversation.messages.length} mensagens
                    </T>
                  </View>
                  <Icon name="chevron-right" color={colors.muted} size={18} />
                </View>
              </Card>
            );
          })}
        </ViewList>
      ) : (
        <Empty
          title="Ainda não há conversas"
          message={
            mode === 'demo'
              ? 'Quando você fizer uma pergunta no chat de demonstração, ela aparecerá aqui.'
              : 'Quando você conversar com o tutor, as mensagens ficarão guardadas neste dispositivo.'
          }
          icon="message-circle"
        />
      )}
    </Screen>
  );
}

function ViewList({ children }: PropsWithChildren) {
  return <View style={{ gap: 12 }}>{children}</View>;
}
