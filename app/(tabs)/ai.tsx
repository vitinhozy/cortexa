import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Thinking } from '@/components/AssistantMark';
import { Reveal, ScreenMotion, Touch } from '@/components/Motion';
import { Button, Icon, Notice, T } from '@/components/ui';
import { ChatComposer } from '@/components/ChatComposer';
import { useStudy } from '@/hooks/useStudy';
import { useAuth } from '@/hooks/useAuth';
import { colors, fonts } from '@/constants/theme';
import { aiSuggestions } from '@/mocks/navigation';
import type { AIMode } from '@/types/domain';
import { uid } from '@/utils/date';
import { BrandLogo } from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useNavigationLayout } from '@/hooks/useNavigationLayout';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useAvailableWidth } from '@/hooks/useAvailableWidth';
import { setStringAsync } from 'expo-clipboard';
import { ContextualIntroduction } from '@/components/ContextualIntroduction';
import { aiTutorErrorMessage } from '@/services/aiTutor';

export default function AIScreen() {
  const { mode } = useStudy();
  const personal = mode !== 'demo';
  return (
    <>
      <ChatHome personal={personal} />
      {personal ? (
        <ContextualIntroduction
          id="chat"
          steps={[
            {
              title: 'Converse para estudar',
              description: 'Peça uma explicação, compare ideias ou tire dúvidas sobre um assunto.',
              icon: 'message-circle',
              detail:
                'A resposta será gerada pelo Gemini e pode conter erros. Confira pontos importantes nas suas fontes.',
            },
            {
              title: 'Privacidade na conversa',
              description:
                'O texto da pergunta e, se você escolher, uma anotação selecionada seguem para o Gemini.',
              icon: 'shield',
              detail:
                'Não envie nomes, prontuários ou dados que identifiquem pacientes. As conversas ficam guardadas neste dispositivo.',
            },
          ]}
        />
      ) : null}
    </>
  );
}

function ChatHome({ personal }: { personal: boolean }) {
  const { width } = useWindowDimensions();
  const availableWidth = useAvailableWidth();
  const { layout } = useNavigationLayout();
  const { replace } = useAppNavigation();
  const hasLeftNavigation = width >= 900 && layout === 'left';
  const chatMaxWidth = availableWidth >= 1080 ? 1120 : 860;
  const composerMaxWidth = availableWidth >= 1080 ? 1040 : 770;
  const insets = useSafeAreaInsets();
  const {
    materialId,
    topicId,
    prompt,
    conversationId: paramsConversationId,
  } = useLocalSearchParams<{
    materialId?: string;
    topicId?: string;
    prompt?: string;
    conversationId?: string;
  }>();
  const { data, services, switchWorkspace } = useStudy();
  const auth = useAuth();
  const suggestions = personal
    ? data.topics.slice(0, 4).map((topic) => `Revisar ${topic.name}`)
    : aiSuggestions;
  const [mode, setMode] = useState<AIMode>('class');
  const [conversationId, setConversationId] = useState(() => uid('chat'));
  const [draft, setDraft] = useState(prompt ?? '');
  const [busy, setBusy] = useState(false);
  const [switchingWorkspace, setSwitchingWorkspace] = useState(false);
  const [error, setError] = useState('');
  const [retryText, setRetryText] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const pending = useRef(false);
  const conversationScroll = useRef<ScrollView>(null);

  useEffect(() => {
    if (prompt) setDraft(prompt);
  }, [prompt, materialId, topicId]);
  useEffect(() => {
    if (typeof paramsConversationId === 'string') {
      setConversationId(paramsConversationId);
      setDraft(prompt ?? '');
      setError('');
    }
  }, [paramsConversationId, prompt]);

  const conversation = data.conversations.find((item) => item.id === conversationId);
  useEffect(() => {
    setMode(conversation?.mode ?? 'class');
  }, [conversationId, conversation?.mode]);
  const contextMaterialId = materialId ?? conversation?.materialId;
  const contextTopicId = topicId ?? conversation?.topicId;
  const chatReturnParams = [
    contextMaterialId && `materialId=${encodeURIComponent(contextMaterialId)}`,
    contextTopicId && `topicId=${encodeURIComponent(contextTopicId)}`,
    conversationId && `conversationId=${encodeURIComponent(conversationId)}`,
  ].filter(Boolean);
  const chatReturnPath = `/ai${chatReturnParams.length ? `?${chatReturnParams.join('&')}` : ''}`;
  const firstQuestion = conversation?.messages.find((message) => message.role === 'user')?.content;
  const hasMessages = Boolean(conversation?.messages.length);
  const greeting =
    new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  function startNewChat() {
    setConversationId(uid('chat'));
    setDraft('');
    setError('');
    setRetryText('');
    setMode('class');
    replace('/ai');
  }

  async function send(text: string) {
    if (!text.trim() || pending.current) return;
    if (personal && !auth.user) {
      setError('Entre na sua conta para enviar a pergunta ao tutor.');
      return;
    }
    pending.current = true;
    setBusy(true);
    setError('');
    setDraft('');
    try {
      await services.aiService.send({
        conversationId,
        text: text.trim(),
        mode,
        materialId: contextMaterialId,
        topicId: contextTopicId,
      });
      setRetryText('');
    } catch (failure) {
      setError(
        personal ? aiTutorErrorMessage(failure) : 'Não foi possível responder. Tente novamente.',
      );
      setRetryText(personal ? text : '');
      setDraft(text);
    } finally {
      setBusy(false);
      pending.current = false;
    }
  }

  async function startAsNewUser() {
    if (switchingWorkspace) return;
    setSwitchingWorkspace(true);
    setError('');
    try {
      await switchWorkspace('personal');
      replace('/overview');
    } catch {
      setSwitchingWorkspace(false);
      setError('Não foi possível abrir seu espaço pessoal. Tente novamente.');
    }
  }

  return (
    <ScreenMotion>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView
          edges={['top', 'left', 'right']}
          style={{ flex: 1, backgroundColor: colors.background }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                paddingHorizontal: width < 600 ? 16 : 28,
                paddingTop: 6,
                paddingBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {hasLeftNavigation ? (
                <View />
              ) : (
                <Touch
                  accessibilityRole="button"
                  accessibilityLabel="Ir para uma nova conversa"
                  onPress={startNewChat}
                >
                  <BrandLogo size={29} />
                </Touch>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {!personal ? (
                  <Button
                    title={switchingWorkspace ? 'Abrindo...' : 'Testar como novo usuário'}
                    icon="user"
                    variant="ghost"
                    small
                    disabled={switchingWorkspace}
                    onPress={startAsNewUser}
                  />
                ) : null}
                <ThemeToggle />
              </View>
            </View>

            <View style={{ flex: 1, width: '100%', maxWidth: chatMaxWidth, alignSelf: 'center' }}>
              {hasMessages ? (
                <ScrollView
                  ref={conversationScroll}
                  onContentSizeChange={() =>
                    conversationScroll.current?.scrollToEnd({ animated: true })
                  }
                  style={{ flex: 1 }}
                  contentContainerStyle={{
                    paddingHorizontal: width < 600 ? 20 : 36,
                    paddingTop: 28,
                    paddingBottom: 22,
                    gap: 16,
                  }}
                  keyboardShouldPersistTaps="handled"
                >
                  <T style={{ fontSize: 20, lineHeight: 27, fontFamily: fonts.semibold }}>
                    {firstQuestion ?? 'Conversa'}
                  </T>
                  <T muted style={{ fontSize: 12 }}>
                    {personal
                      ? 'CONVERSA PESSOAL · HISTÓRICO LOCAL'
                      : 'DEMONSTRAÇÃO LOCAL · RESPOSTAS SIMULADAS'}
                  </T>
                  {conversation?.messages.map((message) => (
                    <Reveal key={message.id}>
                      <View
                        style={{
                          alignSelf: message.role === 'user' ? 'flex-end' : 'stretch',
                          maxWidth: message.role === 'user' ? '90%' : '100%',
                          borderRadius: 20,
                          padding: 16,
                          backgroundColor:
                            message.role === 'user' ? colors.lavender : colors.surface,
                          borderWidth: 1,
                          borderColor: colors.line,
                          gap: 8,
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
                          {message.role === 'user'
                            ? 'VOCÊ'
                            : personal && message.provider === 'gemini'
                              ? 'CORTEXA · GEMINI ' + (message.model ?? '')
                              : 'CORTEXA · DEMONSTRAÇÃO'}
                        </T>
                        <T style={{ lineHeight: 24 }}>{message.content}</T>
                        {message.sources?.map((source) => (
                          <T key={source.id} muted style={{ fontSize: 10 }}>
                            {source.title}
                            {source.page ? ` · p. ${source.page}` : ''}
                          </T>
                        ))}
                        {message.role === 'assistant' ? (
                          <Touch
                            accessibilityRole="button"
                            accessibilityLabel="Copiar resposta"
                            onPress={() => {
                              void setStringAsync(message.content)
                                .then(() => setCopiedId(message.id))
                                .catch(() => setCopiedId(''));
                            }}
                            style={{
                              alignSelf: 'flex-start',
                              minHeight: 36,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 7,
                            }}
                          >
                            <Icon
                              name={copiedId === message.id ? 'check' : 'copy'}
                              size={14}
                              color={colors.muted}
                            />
                            <T muted style={{ fontSize: 11 }}>
                              {copiedId === message.id ? 'Copiada' : 'Copiar resposta'}
                            </T>
                          </Touch>
                        ) : null}
                      </View>
                    </Reveal>
                  ))}
                  {busy ? <Thinking /> : null}
                </ScrollView>
              ) : (
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    paddingHorizontal: width < 600 ? 20 : 32,
                    paddingBottom: 18,
                  }}
                >
                  <View style={{ alignItems: 'center', marginBottom: 26, gap: 6 }}>
                    <T
                      style={{
                        fontSize: 23,
                        lineHeight: 31,
                        fontFamily: fonts.semibold,
                        textAlign: 'center',
                        letterSpacing: -0.5,
                      }}
                    >
                      {greeting}, {data.user.name}
                    </T>
                    <T
                      muted
                      style={{
                        fontSize: width < 430 ? 20 : 24,
                        lineHeight: 32,
                        textAlign: 'center',
                        letterSpacing: -0.3,
                      }}
                    >
                      Por onde começamos?
                    </T>
                  </View>
                  {error ? (
                    <T
                      style={{
                        color: colors.red,
                        fontSize: 12,
                        textAlign: 'center',
                        marginBottom: 8,
                      }}
                    >
                      {error}
                    </T>
                  ) : null}
                  <View style={{ maxWidth: composerMaxWidth, width: '100%', alignSelf: 'center' }}>
                    {personal ? (
                      <View style={{ gap: 10, marginBottom: 10 }}>
                        <Notice
                          text={
                            auth.user
                              ? 'Sua pergunta e o contexto enviado serão processados pelo Gemini. Evite dados identificáveis de pacientes.'
                              : 'Entre para enviar perguntas ao Gemini. Evite dados identificáveis de pacientes.'
                          }
                        />
                        {!auth.user && auth.configured ? (
                          <Button
                            title="Entrar ou criar conta"
                            icon="user"
                            variant="secondary"
                            onPress={() =>
                              router.push({
                                pathname: '/account',
                                params: { next: chatReturnPath },
                              })
                            }
                          />
                        ) : null}
                      </View>
                    ) : null}
                    <ChatComposer
                      compact
                      value={draft}
                      onChange={(value) => {
                        setDraft(value);
                        if (error) setError('');
                      }}
                      onSend={() => send(draft)}
                      busy={busy}
                      note={
                        personal
                          ? auth.user
                            ? 'Gemini · não envie dados identificáveis de pacientes'
                            : 'Entre na conta para conversar com o Gemini'
                          : 'Demonstração local · respostas simuladas'
                      }
                    />
                    <View style={{ marginTop: 10, marginLeft: 10, gap: 2 }}>
                      {suggestions.slice(0, 4).map((suggestion, index) => (
                        <Touch
                          key={suggestion}
                          accessibilityRole="button"
                          accessibilityLabel={`Usar sugestão: ${suggestion}`}
                          onPress={() => {
                            setDraft(suggestion);
                            setError('');
                          }}
                          style={{
                            minHeight: 42,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 13,
                            paddingHorizontal: 9,
                            borderRadius: 12,
                          }}
                        >
                          <Icon
                            name={
                              (
                                [
                                  'message-circle',
                                  'file-text',
                                  'check-square',
                                  'book-open',
                                ] as const
                              )[index]
                            }
                            size={17}
                            color={colors.muted}
                          />
                          <T style={{ fontSize: 13, fontFamily: fonts.medium }}>{suggestion}</T>
                        </Touch>
                      ))}
                    </View>
                  </View>
                </View>
              )}
              {hasMessages ? (
                <View
                  style={{
                    paddingHorizontal: width < 600 ? 16 : 36,
                    paddingTop: 8,
                    paddingBottom: Math.max(insets.bottom, 10),
                  }}
                >
                  <ChatComposer
                    value={draft}
                    onChange={setDraft}
                    onSend={() => send(draft)}
                    busy={busy}
                    note={
                      personal
                        ? auth.user
                          ? 'Gemini · evite dados identificáveis de pacientes'
                          : 'Entre na conta para conversar com o Gemini'
                        : 'Demonstração local · respostas simuladas'
                    }
                  />
                  {error ? (
                    <View style={{ alignItems: 'center', gap: 5, marginTop: 6 }}>
                      <T style={{ color: colors.red, fontSize: 11, textAlign: 'center' }}>
                        {error}
                      </T>
                      {retryText ? (
                        <Button
                          title="Tentar novamente"
                          variant="secondary"
                          small
                          onPress={() => void send(retryText)}
                        />
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={{ height: Math.max(insets.bottom, 10) }} />
              )}
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ScreenMotion>
  );
}
