import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, Card, T, Icon, Button, Field, Badge, Notice, s } from '@/components/ui';
import { useStudy } from '@/hooks/useStudy';
import { colors, fonts } from '@/constants/theme';
import { aiSuggestions } from '@/mocks/navigation';
import type { AIMode } from '@/types/domain';
export default function AIScreen() {
  const { materialId, topicId, prompt } = useLocalSearchParams<{
    materialId?: string;
    topicId?: string;
    prompt?: string;
  }>();
  const { data, services } = useStudy();
  const [mode, setMode] = useState<AIMode>('class');
  const [draft, setDraft] = useState(prompt ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  useEffect(() => {
    if (prompt) setDraft(prompt);
  }, [prompt, materialId, topicId]);
  const conversationId = `demo-${mode}-${materialId ?? 'general'}-${topicId ?? 'general'}`;
  const conversation = data.conversations.find((c) => c.id === conversationId);
  const material = data.materials.find((m) => m.id === materialId);
  async function send(text: string) {
    if (!text.trim() || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    setDraft('');
    try {
      await services.aiService.send({
        conversationId,
        text: text.trim(),
        mode,
        materialId,
        topicId,
      });
    } catch {
      setError('Não foi possível responder. Tente novamente.');
      setDraft(text);
    } finally {
      setBusy(false);
      pending.current = false;
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen
        title="Tutor IA"
        subtitle="Mais clareza para pensar. Mais espaço para aprender."
        eyebrow="APRENDA COM CONTEXTO"
      >
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#E9EEEB',
            borderRadius: 14,
            padding: 4,
            gap: 5,
          }}
        >
          {(
            [
              { id: 'class', label: 'Modo aula', icon: 'book-open' },
              { id: 'medicine', label: 'Modo medicina', icon: 'activity' },
            ] as const
          ).map((item) => (
            <Pressable
              key={item.id}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: mode === item.id, disabled: busy }}
              onPress={() => setMode(item.id)}
              style={{
                flex: 1,
                flexDirection: 'row',
                gap: 8,
                paddingVertical: 13,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 11,
                backgroundColor: mode === item.id ? 'white' : 'transparent',
              }}
            >
              <Icon
                name={item.icon}
                size={15}
                color={mode === item.id ? colors.primary : colors.muted}
              />
              <T
                style={{
                  fontSize: 12,
                  color: mode === item.id ? colors.primary : colors.muted,
                  fontFamily: fonts.medium,
                }}
              >
                {item.label}
              </T>
            </Pressable>
          ))}
        </View>
        <Badge
          label={`${mode === 'class' ? 'Baseado nos seus materiais' : 'Baseado em referências médicas'} · SIMULADO`}
        />
        {material ? (
          <Notice
            text={`Contexto selecionado: ${material.title}. A leitura e recuperação do conteúdo são simuladas.`}
          />
        ) : null}
        <Notice text="Demonstração com respostas prontas. Nenhuma API de IA é chamada e nenhuma fonte médica externa é consultada." />
        {!conversation?.messages.length ? (
          <>
            <View style={{ alignItems: 'center', paddingVertical: 20, gap: 14 }}>
              <View style={{ padding: 20, borderRadius: 24, backgroundColor: colors.mint }}>
                <Icon name="zap" size={30} />
              </View>
              <T
                style={{
                  fontSize: 23,
                  lineHeight: 31,
                  fontFamily: fonts.semibold,
                  textAlign: 'center',
                  letterSpacing: -0.5,
                }}
              >
                Como posso ajudar nos seus estudos?
              </T>
              <T muted style={{ fontSize: 12, textAlign: 'center' }}>
                Uma dúvida pode abrir um novo jeito de entender.
              </T>
            </View>
            <View style={{ gap: 9 }}>
              {aiSuggestions.map((suggestion) => (
                <Card key={suggestion} onPress={() => send(suggestion)} style={{ padding: 16 }}>
                  <View style={s.row}>
                    <T style={{ flex: 1, fontSize: 13 }}>{suggestion}</T>
                    <Icon name="arrow-up-right" size={16} color={colors.muted} />
                  </View>
                </Card>
              ))}
            </View>
          </>
        ) : (
          <View style={{ gap: 16 }}>
            {conversation.messages.map((message) => (
              <Card
                key={message.id}
                style={{
                  marginLeft: message.role === 'user' ? 28 : 0,
                  marginRight: message.role === 'assistant' ? 15 : 0,
                  backgroundColor: message.role === 'user' ? colors.mint : 'white',
                }}
              >
                <T
                  style={{
                    fontSize: 10,
                    letterSpacing: 1,
                    fontFamily: fonts.semibold,
                    color: colors.primary,
                  }}
                >
                  {message.role === 'user' ? 'VOCÊ' : 'TUTOR IA · DEMONSTRAÇÃO'}
                </T>
                <T style={{ lineHeight: 25 }}>{message.content}</T>
                {message.sources?.map((source) => (
                  <View
                    key={source.id}
                    style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }}
                  >
                    <T muted style={{ fontSize: 10 }}>
                      {source.title}
                      {source.page ? ` · p. ${source.page}` : ''}
                    </T>
                  </View>
                ))}
              </Card>
            ))}
          </View>
        )}
        {busy ? (
          <T accessibilityLiveRegion="polite" muted>
            Preparando uma explicação demonstrativa...
          </T>
        ) : null}
        {error ? <Notice text={error} /> : null}
        <Card>
          <Field
            label="Sua pergunta"
            placeholder="O que você quer entender melhor?"
            multiline
            value={draft}
            onChangeText={setDraft}
            maxLength={2000}
          />
          <Button
            title={busy ? 'Preparando resposta...' : 'Enviar pergunta'}
            icon="arrow-up"
            disabled={busy || !draft.trim()}
            onPress={() => send(draft)}
          />
        </Card>
        <View style={{ gap: 8 }}>
          <Button
            title="Me ensine · aula guiada"
            icon="message-circle"
            variant="secondary"
            onPress={() => router.push('/tutor')}
          />
          <Button
            title="Praticar questões"
            variant="ghost"
            onPress={() =>
              router.push({
                pathname: '/questions',
                params: { topicId: topicId ?? material?.topicId ?? 'acid' },
              })
            }
          />
          <Button
            title="Criar plano de revisão"
            variant="ghost"
            onPress={() => router.push('/planner')}
          />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
