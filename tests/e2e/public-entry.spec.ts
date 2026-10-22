import {
  test,
  expect,
  authStorageKey,
  createSeededAccount,
  personalStorageKey,
  simulatedOrigin,
} from './fixtures';
import { createSimulatedAuthSession } from '../../mocks/auth';
import { createSeed } from '../../mocks/seed';
import { createPersonalWorkspace } from '../../services/personalWorkspace';

test.use({ workspace: 'public' });

test('landing pública apresenta a proposta e exige conta para começar', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL('http://localhost:8081/');
  await expect(
    page.getByRole('heading', { name: /Aprenda Medicina.*Conecte o que importa/s }),
  ).toBeVisible();
  await expect(page.getByRole('tab')).toHaveCount(0);
  await expect(page.getByTestId('desktop-sidebar')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Sua pergunta', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continuar sem conta', exact: true })).toHaveCount(
    0,
  );
  await page.getByRole('button', { name: 'Começar no Cortexa', exact: true }).click();
  await expect(page).toHaveURL(/\/account(?:\?|$)/);
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toBeVisible();
});

test('landing explica o produto e oferece cadastro com movimento reduzido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Conhecer o Cortexa', exact: true }).click();
  await expect(page).toHaveURL('http://localhost:8081/');
  await expect(page.getByRole('tab')).toHaveCount(0);
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await expect(
    page.getByRole('button', { name: /Ativar tema escuro|Ativar tema claro/ }),
  ).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Aprenda Medicina/ })).toBeVisible();
  await page.getByRole('button', { name: 'Criar minha conta', exact: true }).click();
  await expect(page).toHaveURL(/\/account\?.*mode=signup/);
  await expect(page.getByRole('heading', { name: 'Crie sua conta', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

for (const width of [390, 768, 1440]) {
  test(`landing mantém capítulos legíveis e cards associados em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => localStorage.setItem('cortexa:appearance:v1', 'dark'));
    await page.goto('/');
    await expect(page.getByText('Seu conhecimento', { exact: true })).toHaveCount(0);
    for (let index = 0; index < 5; index++) {
      const title = page.getByTestId(`chapter-title-${index}`);
      await title.scrollIntoViewIfNeeded();
      await expect(title).toBeVisible();
      const heading = await title.boundingBox();
      const description = await page.getByTestId(`chapter-description-${index}`).boundingBox();
      expect(heading).not.toBeNull();
      expect(description!.y).toBeGreaterThanOrEqual(heading!.y + heading!.height + 10);
      await expect(
        page.getByTestId(`story-chapter-${index}`).getByTestId('product-demo'),
      ).toHaveCount(1);
      const lineHeight = await title.evaluate((node) =>
        parseFloat(getComputedStyle(node).lineHeight),
      );
      expect(lineHeight).toBeGreaterThanOrEqual(40);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}

test('landing liga movimento dos cards e fios à rolagem e respeita movimento reduzido', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Aprenda Medicina/ })).toBeVisible();
  const card = page.getByTestId('chapter-card-1');
  const band = page.getByTestId('neural-band-10-0');
  const beforeCard = await card.evaluate((node) => getComputedStyle(node).transform);
  const beforeBand = await band.evaluate((node) => getComputedStyle(node).opacity);
  await page.getByTestId('chapter-title-1').scrollIntoViewIfNeeded();
  await expect
    .poll(() => card.evaluate((node) => getComputedStyle(node).transform))
    .not.toBe(beforeCard);
  await expect
    .poll(() => band.evaluate((node) => getComputedStyle(node).opacity))
    .not.toBe(beforeBand);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => card.evaluate((node) => getComputedStyle(node).transform)).toBe('none');
  await expect.poll(() => card.evaluate((node) => getComputedStyle(node).opacity)).toBe('1');
});

const privatePaths = [
  '/overview',
  '/study',
  '/library',
  '/ai?topicId=acid&prompt=Revisar',
  '/profile',
  '/onboarding',
  '/account-inexistente',
  '/compose?kind=assessment',
  '/exams',
  '/flashcards',
  '/history',
  '/knowledge',
  '/learning',
  '/material/add',
  '/material/renal-pdf',
  '/membership',
  '/mistakes',
  '/planner?urgent=true',
  '/practice/sessao-inexistente',
  '/profile-edit',
  '/questions?topicId=acid&questionId=q-acid-1',
  '/search',
  '/session?topicId=acid',
  '/studio?kind=mindmap',
  '/studio/edit?kind=slides',
  '/studio/documento-inexistente',
  '/topic/acid',
  '/tutor',
];
for (const path of privatePaths) {
  test(`link privado sem sessão exige acesso: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/account\?.*next=/);
    const next = new URL(new URL(page.url()).searchParams.get('next')!, 'http://localhost:8081');
    const requested = new URL(path, 'http://localhost:8081');
    expect(next.origin).toBe(requested.origin);
    expect(next.pathname).toBe(path === '/account-inexistente' ? '/overview' : requested.pathname);
    for (const [key, value] of requested.searchParams)
      expect(next.searchParams.get(key)).toBe(value);
    await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(0);
    await expect(page.getByTestId('study-calendar')).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'Sua pergunta', exact: true })).toHaveCount(0);
  });
}

test('sessão no armazenamento não libera estudo antes de getUser validar e permanece bloqueada se recusada', async ({
  page,
}) => {
  const session = createSimulatedAuthSession();
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
    key: authStorageKey,
    value: JSON.stringify(session),
  });
  let releaseValidation!: () => void;
  let observedValidation!: () => void;
  const held = new Promise<void>((resolve) => {
    releaseValidation = resolve;
  });
  const observed = new Promise<void>((resolve) => {
    observedValidation = resolve;
  });
  await page.route(`${simulatedOrigin}/auth/v1/user`, async (route) => {
    expect(route.request().headers().authorization).toBe(`Bearer ${session.access_token}`);
    observedValidation();
    await held;
    await route.fulfill({
      status: 401,
      json: { code: 'bad_jwt', msg: 'Sessão SIMULADA recusada' },
    });
  });
  try {
    await page.goto('/library', { waitUntil: 'domcontentloaded' });
    await observed;
    await expect(page.getByRole('button', { name: 'Adicionar material', exact: true })).toHaveCount(
      0,
    );
    await expect(page.getByRole('tab')).toHaveCount(0);
  } finally {
    releaseValidation();
  }
  await expect(page).toHaveURL(/\/account\?.*next=/);
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toBeVisible();
});

test('snapshots históricos ficam preservados e inacessíveis sem sessão', async ({ page }) => {
  const snapshots = {
    'cortexa:demo:v1': JSON.stringify(createSeed()),
    'cortexa:personal:local:v1': JSON.stringify(createPersonalWorkspace()),
    [personalStorageKey]: JSON.stringify(createSeededAccount()),
  };
  await page.goto('/');
  await page.evaluate((values) => {
    localStorage.setItem('cortexa:workspace', 'demo');
    for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
  }, snapshots);
  await page.goto('/library');
  await expect(page).toHaveURL(/\/account\?.*next=/);
  await expect(page.getByRole('button', { name: 'Fisiologia Renal.pdf', exact: true })).toHaveCount(
    0,
  );
  for (const [key, value] of Object.entries(snapshots))
    expect(await page.evaluate((storageKey) => localStorage.getItem(storageKey), key)).toBe(value);
  await page.goto('/');
  await expect(page).toHaveURL('http://localhost:8081/');
});

for (const destination of [
  'https://example.invalid/roubo',
  '//example.invalid/roubo',
  '/account',
  '/%2f%2fexample.invalid',
  '/ai\\invalido',
]) {
  test(`login ignora next inseguro: ${destination}`, async ({ page }) => {
    const session = createSimulatedAuthSession();
    await page.route(`${simulatedOrigin}/auth/v1/token?grant_type=password`, (route) =>
      route.fulfill({ json: session }),
    );
    await page.route(`${simulatedOrigin}/auth/v1/user`, (route) =>
      route.fulfill({ json: session.user }),
    );
    await page.goto(`/account?next=${encodeURIComponent(destination)}`);
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(session.user.email);
    await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('old123');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page).toHaveURL('http://localhost:8081/onboarding');
    await expect(
      page.getByRole('button', { name: 'Continuar sem conta', exact: true }),
    ).toHaveCount(0);
  });
}
