import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Badge, Button, Card, Field, Icon, Notice, Screen, T, s } from '@/components/ui';
import { Touch } from '@/components/Motion';
import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import { authEmailRedirect } from '@/services/authRedirect';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { AccountFeedback } from '@/components/AccountFeedback';
import { PasswordStrength } from '@/components/PasswordStrength';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import {
  exchangeAccountCode,
  googleAuthErrorMessage,
  signInWithGoogle,
} from '@/services/accountAuth';

type AccountStage = 'sign-in' | 'sign-up' | 'forgot' | 'checking-link' | 'new-password';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function internalRoute(value: string | undefined): Href | undefined {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\'))
    return undefined;
  return value as Href;
}

function authErrorMessage(error: { code?: string }) {
  switch (error.code) {
    case 'invalid_credentials':
      return 'E-mail ou senha incorretos. Confira os dados e tente novamente.';
    case 'email_not_confirmed':
      return 'Confirme seu e-mail para entrar. Você pode pedir um novo link abaixo.';
    case 'user_already_exists':
      return 'Este e-mail já tem uma conta. Entre ou recupere sua senha.';
    case 'weak_password':
      return 'Escolha uma senha com pelo menos 8 caracteres.';
    case 'over_email_send_rate_limit':
      return 'Muitos e-mails foram solicitados. Aguarde um pouco antes de tentar de novo.';
    default:
      return 'Não foi possível concluir agora. Confira sua conexão e tente novamente.';
  }
}

export default function AccountScreen() {
  const { goBack, replace } = useAppNavigation();
  const { user, ready, configured } = useAuth();
  const params = useLocalSearchParams<{
    code?: string | string[];
    authFlow?: string | string[];
    next?: string | string[];
    mode?: string | string[];
    provider?: string | string[];
    error?: string | string[];
    error_code?: string | string[];
  }>();
  const code = firstParam(params.code);
  const authFlow = firstParam(params.authFlow);
  const nextPath = firstParam(params.next);
  const nextRoute = internalRoute(nextPath);
  const returnPath = String(nextRoute ?? '/overview');
  const [stage, setStage] = useState<AccountStage>(
    code
      ? 'checking-link'
      : authFlow === 'recovery' && user
        ? 'new-password'
        : firstParam(params.mode) === 'signup'
          ? 'sign-up'
          : 'sign-in',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [destination, setDestination] = useState<Href>();
  const processedCode = useRef('');
  const processedGoogle = useRef(false);
  const googlePending = useRef(false);
  const googleRequest = useRef<AbortController | null>(null);
  useEffect(() => () => googleRequest.current?.abort(), []);
  const oauthError = firstParam(params.error) ?? firstParam(params.error_code);

  const startGoogle = useCallback(async () => {
    if (!supabase || googlePending.current) return;
    googlePending.current = true;
    const controller = new AbortController();
    googleRequest.current = controller;
    setBusy(true);
    setGoogleBusy(true);
    setError('');
    setMessage('');
    router.setParams({ provider: undefined, authFlow: 'oauth', next: returnPath });
    try {
      const result = await signInWithGoogle(returnPath, controller.signal);
      if (controller.signal.aborted) return;
      if (result === 'completed') setDestination(returnPath as Href);
      else if (result === 'cancelled')
        setMessage('Você cancelou o acesso pelo Google. Pode tentar novamente ou usar seu e-mail.');
    } catch (failure) {
      if (controller.signal.aborted) return;
      setErrorCode('');
      setError(googleAuthErrorMessage(failure));
    } finally {
      googlePending.current = false;
      if (!controller.signal.aborted) {
        setBusy(false);
        setGoogleBusy(false);
      }
    }
  }, [returnPath]);

  useEffect(() => {
    if (user && destination) replace(destination);
  }, [destination, replace, user]);

  useEffect(() => {
    if (user && !code && !oauthError && (authFlow === 'oauth' || authFlow === 'signin'))
      replace(returnPath as Href);
  }, [authFlow, code, oauthError, replace, returnPath, user]);

  useEffect(() => {
    if (!oauthError) return;
    setMessage('');
    setErrorCode('');
    setError(
      oauthError === 'access_denied'
        ? 'O acesso pelo Google foi cancelado. Tente novamente ou use seu e-mail.'
        : 'Não foi possível concluir o acesso pelo Google. Tente novamente ou use seu e-mail.',
    );
    router.setParams({ error: undefined, error_code: undefined });
  }, [oauthError]);

  const googleRequested = firstParam(params.provider) === 'google';
  useEffect(() => {
    if (!googleRequested || !ready || user || processedGoogle.current) return;
    processedGoogle.current = true;
    void startGoogle();
  }, [googleRequested, ready, startGoogle, user]);

  useEffect(() => {
    if (!code || !supabase || processedCode.current === code) return;
    processedCode.current = code;
    let active = true;
    setStage('checking-link');
    setBusy(true);
    setError('');
    void exchangeAccountCode(code)
      .then(({ error: exchangeError }) => {
        if (!active) return;
        if (exchangeError) {
          setStage('sign-in');
          setBusy(false);
          setError('Este link expirou ou já foi usado. Solicite um novo e-mail para continuar.');
          router.setParams({ code: undefined });
          return;
        }
        if (authFlow === 'recovery') {
          setStage('new-password');
          setMessage('Link confirmado. Escolha uma nova senha para sua conta.');
        } else if (authFlow === 'oauth') {
          setStage('sign-in');
          setDestination(returnPath as Href);
        } else {
          setStage('sign-in');
          setMessage('E-mail confirmado. Sua conta está pronta para continuar.');
        }
        setBusy(false);
        router.setParams({ code: undefined });
      })
      .catch(() => {
        if (active) {
          setStage('sign-in');
          setBusy(false);
          setError('Não foi possível validar este link. Solicite outro e-mail e tente novamente.');
          router.setParams({ code: undefined });
        }
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [authFlow, code, returnPath]);

  const title =
    stage === 'sign-up'
      ? 'Crie sua conta'
      : stage === 'forgot'
        ? 'Recupere seu acesso'
        : stage === 'new-password'
          ? 'Escolha uma nova senha'
          : 'Entre na Cortexa';
  const subtitle =
    stage === 'sign-up'
      ? 'Comece seu espaço pessoal de estudo.'
      : stage === 'forgot'
        ? 'Enviaremos um link seguro para o e-mail da sua conta.'
        : stage === 'new-password'
          ? 'Use pelo menos 8 caracteres para proteger sua conta.'
          : 'Acesse seu espaço pessoal para continuar de onde parou.';

  async function submit() {
    if (!supabase || busy) return;
    setErrorCode('');
    const normalizedEmail = email.trim().toLowerCase();
    if (stage !== 'new-password' && !emailPattern.test(normalizedEmail)) {
      setError('Informe um endereço de e-mail válido.');
      setMessage('');
      return;
    }
    if (stage === 'forgot') {
      setBusy(true);
      setError('');
      setMessage('');
      try {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: authEmailRedirect('recovery', nextRoute ? String(nextRoute) : undefined),
        });
        if (resetError) throw resetError;
        setMessage(
          'Se houver uma conta com esse e-mail, enviaremos um link para redefinir a senha.',
        );
      } catch (reason) {
        setError(authErrorMessage((reason ?? {}) as { code?: string }));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (stage === 'sign-in' ? !password : password.length < 8) {
      setError(
        stage === 'sign-in'
          ? 'Digite sua senha para entrar.'
          : 'Sua senha precisa ter pelo menos 8 caracteres.',
      );
      setMessage('');
      return;
    }
    if ((stage === 'sign-up' || stage === 'new-password') && password !== confirmPassword) {
      setError('As senhas não são iguais. Confira os dois campos.');
      setMessage('');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (stage === 'new-password') {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setPassword('');
        setConfirmPassword('');
        setMessage('Senha atualizada. Sua conta está pronta para usar.');
        setDestination(nextRoute ?? '/overview');
        return;
      }

      if (stage === 'sign-up') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: authEmailRedirect('signup', nextRoute ? String(nextRoute) : undefined),
          },
        });
        if (signUpError) throw signUpError;
        setPassword('');
        setConfirmPassword('');
        if (data.session) {
          setMessage('Conta criada. Seu espaço pessoal está conectado.');
          setDestination(nextRoute ?? '/overview');
          router.setParams({ mode: undefined, authFlow: 'signin', next: returnPath });
        } else {
          setConfirmationPending(true);
          setStage('sign-in');
          router.setParams({ mode: undefined });
          setMessage(
            'Confira seu e-mail para confirmar um novo cadastro. Se você já tinha conta com esse endereço, entre com sua senha anterior ou use “Esqueci minha senha”.',
          );
        }
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (signInError) throw signInError;
      setPassword('');
      if (data.session) {
        setDestination(nextRoute ?? '/overview');
        router.setParams({ authFlow: 'signin', next: returnPath, code: undefined });
      }
    } catch (reason) {
      const authError = reason as { code?: string };
      setErrorCode(authError.code ?? '');
      setError(authErrorMessage(authError));
      if (authError.code === 'email_not_confirmed') setConfirmationPending(true);
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    if (!supabase || busy || !emailPattern.test(email.trim())) {
      setError('Informe o e-mail usado no cadastro para reenviar a confirmação.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: authEmailRedirect('signup', nextRoute ? String(nextRoute) : undefined),
        },
      });
      if (resendError) throw resendError;
      setMessage('Se o cadastro estiver pendente, um novo link de confirmação foi enviado.');
    } catch (reason) {
      setError(authErrorMessage((reason ?? {}) as { code?: string }));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase || busy) return;
    setBusy(true);
    setError('');
    try {
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
      if (signOutError) throw signOutError;
      setMessage('Você saiu da conta. Seus dados locais continuam separados neste dispositivo.');
    } catch {
      setError('Não foi possível sair agora. Confira sua conexão e tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      title={title}
      subtitle={subtitle}
      back
      contentMaxWidth={560}
      scrollResetKey={stage}
      overlay={
        <AccountFeedback
          notice={
            error || message
              ? {
                  id: error || message,
                  kind: error ? 'error' : message.includes('cancelou') ? 'info' : 'success',
                  title: error
                    ? 'Não foi possível continuar'
                    : message.includes('cancelou')
                      ? 'Acesso cancelado'
                      : message.includes('e-mail')
                        ? 'Confira seu e-mail'
                        : 'Tudo certo',
                  text: error || message,
                  action:
                    error && errorCode === 'invalid_credentials'
                      ? 'recover'
                      : error && errorCode === 'email_not_confirmed'
                        ? 'resend'
                        : undefined,
                }
              : null
          }
          onClose={() => {
            setError('');
            setMessage('');
          }}
          onAction={(action) => {
            if (action === 'resend') void resendConfirmation();
            else {
              setStage('forgot');
              setPassword('');
              setConfirmPassword('');
              setError('');
              setMessage('');
            }
          }}
        />
      }
    >
      {!configured ? (
        <Card>
          <View style={[s.row, { alignItems: 'flex-start' }]}>
            <Icon name="shield" />
            <View style={{ flex: 1, gap: 6 }}>
              <T style={s.sectionTitle}>Acesso por conta indisponível</T>
              <T muted>
                A autenticação ainda não está configurada neste ambiente. Você pode continuar
                estudando no espaço local deste dispositivo.
              </T>
            </View>
          </View>
        </Card>
      ) : !ready || stage === 'checking-link' || (stage === 'new-password' && !user) ? (
        <Card style={{ alignItems: 'center', gap: 14, paddingVertical: 30 }}>
          <ActivityIndicator color={colors.primary} />
          <T muted>
            {stage === 'checking-link'
              ? 'Validando seu link seguro...'
              : 'Verificando sua conta...'}
          </T>
        </Card>
      ) : user && stage !== 'new-password' ? (
        <Card style={{ gap: 18 }}>
          <View style={{ alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 62,
                height: 62,
                borderRadius: 21,
                backgroundColor: colors.mint,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="user-check" size={27} />
            </View>
            <Badge label="CONTA CONECTADA" tone="green" />
            <T style={s.sectionTitle}>{user.email}</T>
          </View>
          <Notice text="Seu estudo está separado por conta neste dispositivo. A sincronização geral entre dispositivos ainda não está disponível." />
          <Button
            title="Continuar no Cortexa"
            icon="arrow-right"
            onPress={() => replace(nextRoute ?? '/overview')}
          />
          <Button
            title={busy ? 'Saindo...' : 'Sair da conta'}
            variant="ghost"
            disabled={busy}
            onPress={() => void signOut()}
          />
        </Card>
      ) : (
        <>
          <Card style={{ gap: 17, paddingVertical: 22 }}>
            <View style={[s.row, { alignItems: 'flex-start' }]}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 15,
                  backgroundColor: colors.lavender,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="user" size={21} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <T style={s.sectionTitle}>Seu espaço. Seu ritmo.</T>
                <T muted style={{ fontSize: 12 }}>
                  {stage === 'sign-up'
                    ? 'Crie sua conta com Google ou e-mail.'
                    : 'Escolha como quer continuar.'}
                </T>
              </View>
            </View>

            {stage === 'sign-in' || stage === 'sign-up' ? (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    padding: 4,
                    borderRadius: 14,
                    backgroundColor: colors.neutral,
                    gap: 4,
                  }}
                >
                  {(['sign-in', 'sign-up'] as const).map((option) => (
                    <Touch
                      key={option}
                      accessibilityRole="button"
                      accessibilityLabel={
                        option === 'sign-in' ? 'Já tenho conta' : 'Quero criar uma conta'
                      }
                      accessibilityState={{ selected: stage === option, disabled: busy }}
                      disabled={busy}
                      onPress={() => {
                        setStage(option);
                        router.setParams({ mode: option === 'sign-up' ? 'signup' : undefined });
                        setPassword('');
                        setConfirmPassword('');
                        setShowPassword(false);
                        setMessage('');
                        setError('');
                      }}
                      style={{
                        flex: 1,
                        minHeight: 44,
                        borderRadius: 11,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: stage === option ? colors.surface : 'transparent',
                      }}
                    >
                      <T
                        style={{
                          fontSize: 13,
                          fontFamily: fonts.semibold,
                          color: stage === option ? colors.primaryDark : colors.muted,
                        }}
                      >
                        {option === 'sign-in' ? 'Entrar' : 'Criar conta'}
                      </T>
                    </Touch>
                  ))}
                </View>
                <GoogleSignInButton
                  busy={googleBusy}
                  disabled={busy}
                  onPress={() => void startGoogle()}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
                  <T muted style={{ fontSize: 11 }}>
                    ou use seu e-mail
                  </T>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
                </View>
              </>
            ) : null}

            {stage !== 'new-password' ? (
              <Field
                label="E-mail"
                placeholder="voce@exemplo.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                value={email}
                editable={!busy}
                onChangeText={(value) => {
                  setEmail(value);
                  setError('');
                }}
                maxLength={254}
              />
            ) : null}

            {stage === 'forgot' ? (
              <>
                <Button
                  title={busy ? 'Enviando link...' : 'Enviar link de recuperação'}
                  icon="mail"
                  disabled={busy}
                  onPress={() => void submit()}
                />
                <Button
                  title="Voltar para entrar"
                  variant="ghost"
                  disabled={busy}
                  onPress={() => {
                    setStage('sign-in');
                    setMessage('');
                    setError('');
                  }}
                />
              </>
            ) : (
              <>
                <Field
                  label={stage === 'new-password' ? 'Nova senha' : 'Senha'}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete={
                    stage === 'sign-up' || stage === 'new-password'
                      ? 'new-password'
                      : 'current-password'
                  }
                  textContentType={
                    stage === 'sign-up' || stage === 'new-password' ? 'newPassword' : 'password'
                  }
                  value={password}
                  editable={!busy}
                  onChangeText={(value) => {
                    setPassword(value);
                    setError('');
                  }}
                  maxLength={128}
                  placeholder={stage === 'sign-in' ? 'Sua senha' : 'Pelo menos 8 caracteres'}
                  returnKeyType={stage === 'sign-in' ? 'go' : 'next'}
                  onSubmitEditing={stage === 'sign-in' ? () => void submit() : undefined}
                />
                {stage === 'sign-up' || stage === 'new-password' ? (
                  <PasswordStrength password={password} />
                ) : null}
                {stage === 'sign-up' || stage === 'new-password' ? (
                  <Field
                    label="Confirme a senha"
                    placeholder="Digite a senha novamente"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    textContentType="newPassword"
                    value={confirmPassword}
                    editable={!busy}
                    onChangeText={(value) => {
                      setConfirmPassword(value);
                      setError('');
                    }}
                    maxLength={128}
                    returnKeyType="go"
                    onSubmitEditing={() => void submit()}
                  />
                ) : null}
                {(stage === 'sign-up' || stage === 'new-password') && confirmPassword ? (
                  <T
                    accessibilityLiveRegion="polite"
                    style={{
                      fontSize: 12,
                      color: password === confirmPassword ? colors.teal : colors.muted,
                    }}
                  >
                    {password === confirmPassword
                      ? 'As senhas coincidem.'
                      : 'As senhas ainda não coincidem.'}
                  </T>
                ) : null}
                <Touch
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onPress={() => setShowPassword((shown) => !shown)}
                  style={{
                    alignSelf: 'flex-end',
                    minHeight: 36,
                    justifyContent: 'center',
                    paddingHorizontal: 8,
                  }}
                >
                  <T style={{ color: colors.primary, fontFamily: fonts.medium, fontSize: 12 }}>
                    {showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  </T>
                </Touch>
                <Button
                  title={
                    busy
                      ? 'Aguarde...'
                      : stage === 'sign-up'
                        ? 'Criar minha conta'
                        : stage === 'new-password'
                          ? 'Salvar nova senha'
                          : 'Entrar'
                  }
                  icon={
                    stage === 'sign-up'
                      ? 'user-plus'
                      : stage === 'new-password'
                        ? 'check'
                        : 'log-in'
                  }
                  disabled={busy}
                  onPress={() => void submit()}
                />
                {stage === 'sign-in' ? (
                  <>
                    <Button
                      title="Esqueci minha senha"
                      variant="ghost"
                      disabled={busy}
                      onPress={() => {
                        setStage('forgot');
                        setPassword('');
                        setMessage('');
                        setError('');
                      }}
                    />
                  </>
                ) : stage === 'new-password' ? (
                  <Button
                    title="Voltar para entrar"
                    variant="ghost"
                    disabled={busy}
                    onPress={() => {
                      setStage('sign-in');
                      setPassword('');
                      setConfirmPassword('');
                      setMessage('');
                      setError('');
                    }}
                  />
                ) : null}
              </>
            )}

            {confirmationPending ? (
              <Button
                title={busy ? 'Enviando...' : 'Reenviar confirmação de e-mail'}
                variant="secondary"
                disabled={busy}
                onPress={() => void resendConfirmation()}
              />
            ) : null}
          </Card>
          <Notice text="Os dados do espaço pessoal ficam separados da demonstração. A sincronização entre dispositivos não está disponível nesta etapa." />
          {stage !== 'new-password' ? (
            <Button
              title="Continuar sem conta"
              variant="ghost"
              disabled={busy}
              onPress={() => goBack('/profile')}
            />
          ) : null}
        </>
      )}
    </Screen>
  );
}
