import { expect, test, personalStorageKey, authStorageKey } from './fixtures';
import { createSimulatedAuthSession, simulatedAuthUser } from '../../mocks/auth';

test.use({ workspace: 'public' });

test('email account screen supports sign-up, password visibility and forgot-password validation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/account');

  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Senha', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar com Google' })).toBeVisible();

  await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveJSProperty('type', 'text');
  await page.getByRole('button', { name: 'Ocultar senha', exact: true }).click();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveJSProperty('type', 'password');

  await page.getByRole('button', { name: 'Quero criar uma conta', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Crie sua conta', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Confirme a senha', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('ana@example.com');
  const password = page.getByRole('textbox', { name: 'Senha', exact: true });
  await password.fill('curta');
  await expect(page.getByText('Senha fraca', { exact: true })).toBeVisible();
  await password.fill('aulas-2026');
  await expect(page.getByText('Senha média', { exact: true })).toBeVisible();
  await password.fill('Valvulas!2026');
  await expect(page.getByRole('progressbar', { name: 'Força da senha' })).toHaveAttribute(
    'aria-valuenow',
    '3',
  );
  await page
    .getByRole('textbox', { name: 'Confirme a senha', exact: true })
    .fill('senha-diferente');
  await page.getByRole('button', { name: 'Criar minha conta', exact: true }).click();
  await expect(
    page.getByText('As senhas não são iguais. Confira os dois campos.', { exact: true }),
  ).toBeVisible();
  const errorBox = await page.getByTestId('account-feedback').boundingBox();
  expect(errorBox?.y).toBeLessThan(90);
  await page.getByRole('button', { name: 'Fechar aviso' }).click();

  await page.getByRole('button', { name: 'Já tenho conta', exact: true }).click();
  await page.getByRole('button', { name: 'Esqueci minha senha', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Recupere seu acesso', exact: true }),
  ).toBeVisible();
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('email-inválido');
  await page.getByRole('button', { name: 'Enviar link de recuperação', exact: true }).click();
  await expect(
    page.getByText('Informe um endereço de e-mail válido.', { exact: true }),
  ).toBeVisible();
});

test('sign-up confirmation remains visible above a scrolled mobile form', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/auth/v1/signup**', (route) => route.fulfill({ json: simulatedAuthUser }));
  await page.goto('/account?mode=signup&next=%2Fai');
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(simulatedAuthUser.email);
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('Valvulas!2026');
  await page.getByRole('textbox', { name: 'Confirme a senha', exact: true }).fill('Valvulas!2026');
  await expect(page.getByText('As senhas coincidem.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Criar minha conta', exact: true }).click();
  await expect(page.getByTestId('account-feedback')).toContainText('Confira seu e-mail');
  await expect(page.getByTestId('account-feedback')).toContainText('Se você já tinha conta');
  await page.getByRole('button', { name: 'Já tenho conta', exact: true }).scrollIntoViewIfNeeded();
  const feedback = await page.getByTestId('account-feedback').boundingBox();
  expect(feedback?.y).toBeLessThan(90);
  expect((feedback?.y ?? 999) + (feedback?.height ?? 999)).toBeLessThan(360);
  await page.screenshot({ path: 'docs/screenshots/account-signup-feedback-360.png' });
  await page.getByRole('button', { name: 'Fechar aviso', exact: true }).click();
  await expect(page.getByTestId('account-feedback')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Senha', exact: true })).toHaveValue('');
});

test('Google unavailable keeps the learner in the app with an honest top notice', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/auth/v1/settings', (route) =>
    route.fulfill({ json: { external: { google: false } } }),
  );
  await page.goto('/account?next=%2Fai');
  await page.getByRole('button', { name: 'Continuar com Google' }).click();
  await expect(page.getByTestId('account-feedback')).toContainText(
    'O login com Google ainda não está disponível.',
  );
  await expect(page).toHaveURL(/localhost:8081\/account/);
  await expect(page.getByText('CONTA CONECTADA', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Fechar aviso' }).click();
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toBeEnabled();
});

test('public account can open sign-up without entering the study workspace', async ({ page }) => {
  await page.goto('/account?mode=signup');
  await expect(page.getByRole('heading', { name: 'Crie sua conta' })).toBeVisible();
  await expect(page.getByRole('tab')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continuar sem conta', exact: true })).toHaveCount(
    0,
  );
});

test('controlled Google PKCE callback exchanges once and returns to the requested chat', async ({
  page,
}) => {
  let exchanges = 0;
  await page.route('**/auth/v1/settings', (route) =>
    route.fulfill({ json: { external: { google: true } } }),
  );
  await page.route('**/auth/v1/authorize?**', async (route) => {
    const request = new URL(route.request().url());
    expect(request.searchParams.get('provider')).toBe('google');
    const callback = new URL(request.searchParams.get('redirect_to')!);
    expect(callback.origin).toBe('http://localhost:8081');
    expect(callback.searchParams.get('next')).toBe('/ai');
    expect(request.searchParams.get('code_challenge')).toBeTruthy();
    callback.searchParams.set('code', 'simulated-oauth-code');
    await route.fulfill({ status: 302, headers: { location: callback.toString() } });
  });
  await page.route('**/auth/v1/token?grant_type=pkce', async (route) => {
    exchanges++;
    expect(route.request().postDataJSON().code_verifier).toBeTruthy();
    await route.fulfill({ json: createSimulatedAuthSession() });
  });
  await page.route('**/auth/v1/user', (route) => route.fulfill({ json: simulatedAuthUser }));
  await page.goto('/account?next=%2Fai');
  await page.getByRole('button', { name: 'Continuar com Google' }).click();
  await expect(page).toHaveURL(/\/ai$/);
  expect(exchanges).toBe(1);
  await expect(
    page.getByText('Entre para enviar perguntas ao Gemini.', { exact: false }),
  ).toHaveCount(0);
});

test('password recovery validates the session across workspace remount and returns after saving', async ({
  page,
}) => {
  let exchanges = 0;
  let updated = false;
  let callback = '';
  await page.route('**/auth/v1/recover**', async (route) => {
    callback = new URL(route.request().url()).searchParams.get('redirect_to')!;
    await route.fulfill({ json: {} });
  });
  await page.route('**/auth/v1/token?grant_type=pkce', async (route) => {
    exchanges++;
    await route.fulfill({ json: createSimulatedAuthSession() });
  });
  await page.route('**/auth/v1/user', (route) => {
    if (route.request().method() === 'PUT') updated = true;
    return route.fulfill({ json: simulatedAuthUser });
  });
  await page.goto('/account?next=%2Fai');
  await page.getByRole('button', { name: 'Esqueci minha senha', exact: true }).click();
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(simulatedAuthUser.email);
  await page.getByRole('button', { name: 'Enviar link de recuperação', exact: true }).click();
  await expect(page.getByTestId('account-feedback')).toContainText('Se houver uma conta');
  const url = new URL(callback);
  expect(url.searchParams.get('next')).toBe('/ai');
  url.searchParams.set('code', 'simulated-recovery-code');
  await page.goto(url.toString());
  await expect(
    page.getByRole('heading', { name: 'Escolha uma nova senha', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Nova senha', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Nova senha', exact: true }).fill('Valvulas!2026');
  await page.getByRole('textbox', { name: 'Confirme a senha', exact: true }).fill('Valvulas!2026');
  await page.getByRole('button', { name: 'Salvar nova senha', exact: true }).click();
  await expect(page).toHaveURL(/\/ai$/);
  expect(exchanges).toBe(1);
  expect(updated).toBe(true);
});

test('email login returns to the requested route and logout blocks drafts and preserves account data', async ({
  page,
}) => {
  await page.route('**/auth/v1/token?grant_type=password', (route) =>
    route.fulfill({ json: createSimulatedAuthSession() }),
  );
  await page.route('**/auth/v1/user', (route) => route.fulfill({ json: simulatedAuthUser }));
  await page.route('**/auth/v1/logout**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/ai');
  await expect(page).toHaveURL(/\/account\?.*next=/);
  expect(new URL(page.url()).searchParams.get('next')).toBe('/ai');
  await page.evaluate(() => localStorage.setItem('cortexa:introduction:v1:chat', 'seen'));
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(simulatedAuthUser.email);
  // Older accounts can have a valid password shorter than today's sign-up minimum.
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('old123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/\/ai(?:\?|$)/);
  await expect(page.getByRole('textbox', { name: 'Sua pergunta', exact: true })).toHaveValue('');
  await page.goto('/profile-edit');
  await page
    .getByRole('textbox', { name: 'Como você quer ser chamado?', exact: true })
    .fill('Conta de teste');
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) ?? '{}').user?.name,
        personalStorageKey,
      ),
    )
    .toBe('Conta de teste');
  await page.goto('/ai');
  await page
    .getByRole('textbox', { name: 'Sua pergunta', exact: true })
    .fill('Rascunho privado da conta');
  await page.getByRole('tab', { name: 'Perfil', exact: true }).click();
  await page.getByRole('button', { name: 'Gerenciar conta', exact: true }).click();
  await page.getByRole('button', { name: 'Sair da conta', exact: true }).click();
  await page.goto('/ai');
  await expect(page).toHaveURL(/\/account\?.*next=/);
  await expect(page.getByRole('textbox', { name: 'Sua pergunta', exact: true })).toHaveCount(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), authStorageKey)).toBeNull();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? '{}').user?.name,
      personalStorageKey,
    ),
  ).toBe('Conta de teste');
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(simulatedAuthUser.email);
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('old123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/\/ai$/);
  await expect(page.getByRole('textbox', { name: 'Sua pergunta', exact: true })).toHaveValue('');
});

test('an invalid callback can recover with email login without reusing the failed code', async ({
  page,
}) => {
  let codeRequests = 0;
  await page.route('**/auth/v1/token?grant_type=pkce', async (route) => {
    codeRequests++;
    await route.fulfill({
      status: 400,
      json: { error_code: 'bad_code_verifier', msg: 'Simulated invalid code' },
    });
  });
  await page.route('**/auth/v1/token?grant_type=password', (route) =>
    route.fulfill({ json: createSimulatedAuthSession() }),
  );
  await page.route('**/auth/v1/user', (route) => route.fulfill({ json: simulatedAuthUser }));
  await page.goto('/account?authFlow=oauth&code=invalid-simulated-code&next=%2Fai');
  await expect(page.getByTestId('account-feedback')).toContainText('Este link expirou');
  await expect(page).not.toHaveURL(/code=/);
  await page.getByRole('button', { name: 'Fechar aviso' }).click();
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(simulatedAuthUser.email);
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('Valvulas!2026');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/\/ai$/);
  expect(codeRequests).toBeLessThanOrEqual(1);
});

test('personal chat routes an unauthenticated learner to account access and preserves its return route', async ({
  page,
}) => {
  await page.goto('/ai?topicId=acid&prompt=Revisar');
  await expect(page).toHaveURL(/\/account\?.*next=/);
  const next = new URL(new URL(page.url()).searchParams.get('next')!, 'http://localhost:8081');
  expect(next.pathname).toBe('/ai');
  expect(next.searchParams.get('topicId')).toBe('acid');
  expect(next.searchParams.get('prompt')).toBe('Revisar');
  await expect(page.getByRole('textbox', { name: 'Sua pergunta', exact: true })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toBeVisible();
});
